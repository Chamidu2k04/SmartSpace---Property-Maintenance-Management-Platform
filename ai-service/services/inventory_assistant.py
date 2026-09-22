"""
SmartSpace - Conversational Inventory Assistant Service
Designed for high efficiency on free-tier LLM quotas:
1. Fast-Path execution for Confirmations and Cancellations (Zero LLM tokens used).
2. Targeted micro-database lookups (only relevant rows injected into prompt).
3. Sliding message window (last 4-6 messages) to prevent token bloat.
4. Structured conversational slot-filling for adding Suppliers and Inventory Items.
"""

from decimal import Decimal
import json
import logging
import re
from typing import Any, Literal
from uuid import UUID, uuid4

import asyncpg
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel, Field

from core.config import get_settings
from core.database import database

logger = logging.getLogger(__name__)

# Action types supported by the conversational assistant
ActionType = Literal[
    "create_supplier",
    "create_item",
    "update_item",
    "update_supplier",
    "delete_item",
    "delete_supplier",
]


class PendingAction(BaseModel):
    action_type: ActionType
    data: dict[str, Any]


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class AssistantResponsePayload(BaseModel):
    reply: str = Field(description="Markdown-formatted response to display to the user.")
    pending_action_type: ActionType | None = Field(
        default=None,
        description="Set only when all required details for an action are collected and user confirmation is needed.",
    )
    action_data: dict[str, Any] | None = Field(
        default=None,
        description="Structured key-value payload for the pending action.",
    )


# ---------------------------------------------------------------------------
# Database Helper Functions (AsyncPG)
# ---------------------------------------------------------------------------

async def _fetch_inventory_stats(connection: asyncpg.Connection) -> dict[str, Any]:
    """Retrieves high-level counts for quick reporting."""
    suppliers_count = await connection.fetchval('SELECT COUNT(*) FROM "Suppliers"')
    items_count = await connection.fetchval('SELECT COUNT(*) FROM "InventoryItems"')
    low_stock_count = await connection.fetchval(
        'SELECT COUNT(*) FROM "InventoryItems" WHERE "StockQuantity" < 5'
    )
    categories = await connection.fetch(
        '''SELECT "Category", COUNT(*) as cnt, SUM("StockQuantity") as total_qty
           FROM "InventoryItems" GROUP BY "Category"'''
    )
    cat_summary = ", ".join(f"{r['Category']}: {r['cnt']} items ({r['total_qty']} units)" for r in categories)

    return {
        "suppliers_count": suppliers_count,
        "items_count": items_count,
        "low_stock_count": low_stock_count,
        "categories_summary": cat_summary or "None",
    }


async def _fetch_suppliers(connection: asyncpg.Connection, limit: int = 15) -> list[dict[str, Any]]:
    """Returns a list of registered suppliers."""
    rows = await connection.fetch(
        'SELECT "Id", "Name", "ContactEmail", "Phone" FROM "Suppliers" ORDER BY "Name" LIMIT $1',
        limit,
    )
    return [
        {"id": str(r["Id"]), "name": r["Name"], "email": r["ContactEmail"], "phone": r["Phone"] or "N/A"}
        for r in rows
    ]


SEARCH_STOP_WORDS = {
    "what", "which", "where", "when", "have", "with", "from", "that", "this",
    "many", "much", "stock", "items", "parts", "spare", "does", "check", "show",
    "find", "tell", "need", "want", "some", "there", "please", "give", "look",
    "about", "available", "price", "cost", "total", "category", "categories",
    "any", "how", "we", "are", "is", "a", "an", "do", "can", "you", "me", "our",
}


def extract_search_terms(query_text: str) -> list[str]:
    """Extracts phrases and singular/plural normalized word stems for high-precision matching."""
    clean = re.sub(r'[^a-zA-Z0-9\s]', ' ', query_text).lower()
    raw_words = clean.split()

    phrases = []
    for i in range(len(raw_words) - 1):
        w1, w2 = raw_words[i], raw_words[i + 1]
        if w1 not in SEARCH_STOP_WORDS or w1 == 'l':
            w2_stem = w2[:-1] if w2.endswith('s') and len(w2) > 3 else w2
            phrases.append(f"{w1} {w2_stem}")
            phrases.append(f"{w1} {w2}")

    single_stems = []
    for w in raw_words:
        if w in SEARCH_STOP_WORDS:
            continue
        single_stems.append(w)
        if w.endswith('s') and len(w) > 3:
            single_stems.append(w[:-1])

    ordered = []
    for p in phrases + single_stems:
        if p not in ordered and len(p) >= 3:
            ordered.append(p)
    return ordered


def extract_part_query_term(text: str) -> str:
    """Extracts the intended part name from natural user queries."""
    clean = re.sub(r'[^a-zA-Z0-9\s]', ' ', text).lower()
    clean = re.sub(r'^(how\s+many|do\s+we\s+have|are\s+there\s+any|check\s+stock\s+for|check|find|is\s+there\s+any|search\s+for)\s+', '', clean).strip()
    clean = re.sub(r'\s+(do\s+we\s+have|we\s+have|in\s+stock|available|in\s+inventory|left)\b', '', clean).strip()
    clean = re.sub(r'^(any|the|a|an)\s+', '', clean).strip()
    return clean or "item"


def extract_supplier_slots(text: str) -> dict[str, Any]:
    """Extracts structured supplier details from natural text."""
    data = {}
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    if email_match:
        data['contactEmail'] = email_match.group(0).lower()

    phone_match = re.search(r'(?:phone|tel|mobile|contact)?[:\s]*([0-9\+\-\s]{9,15})', text, re.IGNORECASE)
    if phone_match and (not email_match or phone_match.group(1).strip() != email_match.group(0)):
        digits = re.sub(r'[^0-9+]', '', phone_match.group(1))
        if len(digits) >= 9:
            data['phone'] = digits

    name_match = re.search(r'(?:add\s+supplier|named|supplier\s+name|supplier)\s+([A-Za-z0-9\s&]+?)(?:\s+with|\s+email|\s+phone|\s*,|\s*$)', text, re.IGNORECASE)
    if name_match:
        cand = name_match.group(1).strip()
        cand = re.sub(r'^(called|named|a\s+new\s+supplier|a\s+supplier|new\s+supplier)\s+', '', cand, flags=re.IGNORECASE).strip()
        if cand and len(cand) >= 2 and cand.lower() not in {'new', 'a', 'the', 'supplier'}:
            data['name'] = cand
    return data


def extract_item_slots(text: str) -> dict[str, Any]:
    """Extracts structured inventory item details from natural text."""
    data = {}
    for cat in ["Plumbing", "Electrical", "HVAC", "General"]:
        if re.search(rf'\b{cat}\b', text, re.IGNORECASE):
            data['category'] = cat
            break

    explicit_qty = re.search(r'(\d+)\s*(?:units?|pcs?|pieces?|items?)', text, re.IGNORECASE) or re.search(r'(?:quantity|qty|stock)[:\s]*(\d+)', text, re.IGNORECASE)
    if explicit_qty:
        data['stockQuantity'] = int(explicit_qty.group(1))

    explicit_cost = re.search(r'(?:rs\.?|lkr)\s*(\d+(?:\.\d{1,2})?)', text, re.IGNORECASE) or re.search(r'(\d+(?:\.\d{1,2})?)\s*(?:each|per\s+unit)', text, re.IGNORECASE) or re.search(r'(?:cost|price|unit\s+cost)[:\s]*(\d+(?:\.\d{1,2})?)', text, re.IGNORECASE)
    if explicit_cost:
        data['unitCost'] = float(explicit_cost.group(1))

    sup_match = re.search(r'(?:from|by|supplier)[:\s]+([A-Za-z0-9\s&]+?)(?:\s+at|\s+cost|\s*,|\s*$)', text, re.IGNORECASE)
    if sup_match:
        data['supplierName'] = sup_match.group(1).strip()

    name_match = re.search(r'(?:units?\s+of|add\s+|item\s+name[:\s]+|part[:\s]+)([A-Za-z0-9\s\-\/\.]+?)(?:\s+in\s+category|\s+in\s+Plumbing|\s+in\s+Electrical|\s+in\s+HVAC|\s+in\s+General|\s+from|\s+at|\s*,|\s*$)', text, re.IGNORECASE)
    if name_match:
        cand = name_match.group(1).strip()
        cand = re.sub(r'^(a\s+new\s+inventory\s+item|new\s+item|new\s+part|a\s+part|a\s+new\s+part)\s*', '', cand, flags=re.IGNORECASE).strip()
        cand = re.sub(r'^\d+\s*(?:units?|pcs?|pieces?)?\s*(?:of)?\s*', '', cand, flags=re.IGNORECASE).strip()
        if cand and len(cand) >= 2 and cand.lower() not in {'a', 'new', 'item', 'inventory', 'part'}:
            data['itemName'] = cand

    return data


async def _search_items(connection: asyncpg.Connection, query_text: str, limit: int = 6) -> list[dict[str, Any]]:
    """Searches inventory items by keyword with available stock computation."""
    terms = extract_search_terms(query_text)
    if not terms:
        terms = ["%"]

    for term in terms:
        rows = await connection.fetch(
            '''
            SELECT i."Id", i."ItemName", i."Category", i."StockQuantity", i."UnitCost", s."Name" as supplier_name,
                   COALESCE(SUM(r."QuantityReserved") FILTER (WHERE r."Status" <> 'Consumed'), 0) AS reserved
            FROM "InventoryItems" i
            LEFT JOIN "Suppliers" s ON s."Id" = i."SupplierId"
            LEFT JOIN "PartsReservations" r ON r."ItemId" = i."Id"
            WHERE i."ItemName" ILIKE $1 OR i."Category" ILIKE $1
            GROUP BY i."Id", i."ItemName", i."Category", i."StockQuantity", i."UnitCost", s."Name"
            ORDER BY i."StockQuantity" DESC
            LIMIT $2
            ''',
            f"%{term}%",
            limit,
        )
        if rows:
            return [
                {
                    "id": str(r["Id"]),
                    "name": r["ItemName"],
                    "category": r["Category"],
                    "physical_stock": r["StockQuantity"],
                    "available_stock": r["StockQuantity"] - r["reserved"],
                    "reserved": r["reserved"],
                    "unit_cost": float(r["UnitCost"]),
                    "supplier": r["supplier_name"] or "Unknown",
                }
                for r in rows
            ]
    return []


async def _fetch_low_stock_items(connection: asyncpg.Connection, threshold: int = 5) -> list[dict[str, Any]]:
    """Retrieves items below the safety threshold."""
    rows = await connection.fetch(
        '''
        SELECT "ItemName", "Category", "StockQuantity", "UnitCost"
        FROM "InventoryItems"
        WHERE "StockQuantity" < $1
        ORDER BY "StockQuantity" ASC
        LIMIT 10
        ''',
        threshold,
    )
    return [
        {"name": r["ItemName"], "category": r["Category"], "stock": r["StockQuantity"], "cost": float(r["UnitCost"])}
        for r in rows
    ]


# ---------------------------------------------------------------------------
# Direct Action Execution (Fast-Path, Zero LLM Tokens)
# ---------------------------------------------------------------------------

async def _execute_create_supplier(connection: asyncpg.Connection, data: dict[str, Any]) -> tuple[str, bool]:
    """Executes supplier creation directly in the database."""
    name = (data.get("name") or "").strip()
    email = (data.get("contactEmail") or "").strip().lower()
    phone = (data.get("phone") or "").strip() or None

    if not name or not email:
        return "❌ Missing required fields: Name and Contact Email are required.", False

    # Check for duplicate email
    existing = await connection.fetchval('SELECT 1 FROM "Suppliers" WHERE LOWER("ContactEmail") = $1', email)
    if existing:
        return f"⚠️ A supplier with contact email '{email}' already exists in the system.", False

    new_id = uuid4()
    await connection.execute(
        'INSERT INTO "Suppliers" ("Id", "Name", "ContactEmail", "Phone") VALUES ($1, $2, $3, $4)',
        new_id, name, email, phone,
    )
    return f"✅ Supplier {name} was successfully created!\n\n• ID: {new_id}\n• Email: {email}\n• Phone: {phone or 'Not provided'}", True


async def _execute_create_item(connection: asyncpg.Connection, data: dict[str, Any]) -> tuple[str, bool]:
    """Executes inventory item creation directly in the database."""
    name = (data.get("itemName") or "").strip()
    category = (data.get("category") or "").strip().capitalize()
    supplier_input = str(data.get("supplierId") or data.get("supplierName") or "").strip()
    stock = int(data.get("stockQuantity") or 0)
    cost = Decimal(str(data.get("unitCost") or "0.00"))

    if not name or not category or not supplier_input:
        return "❌ Missing required fields: Item Name, Category, and Supplier are required.", False

    valid_categories = {"Plumbing", "Electrical", "HVAC", "General"}
    if category not in valid_categories:
        return f"❌ Invalid category '{category}'. Must be one of: Plumbing, Electrical, HVAC, General.", False

    # Resolve supplier ID
    supplier_row = None
    try:
        sup_uuid = UUID(supplier_input)
        supplier_row = await connection.fetchrow('SELECT "Id", "Name" FROM "Suppliers" WHERE "Id" = $1', sup_uuid)
    except ValueError:
        supplier_row = await connection.fetchrow(
            'SELECT "Id", "Name" FROM "Suppliers" WHERE LOWER("Name") LIKE LOWER($1) LIMIT 1',
            f"%{supplier_input}%",
        )

    if not supplier_row:
        suppliers = await connection.fetch('SELECT "Name" FROM "Suppliers" LIMIT 5')
        names = ", ".join(f"'{s['Name']}'" for s in suppliers)
        return f"⚠️ Could not find a supplier matching '{supplier_input}'. Existing suppliers include: {names}.", False

    supplier_id = supplier_row["Id"]
    supplier_name = supplier_row["Name"]
    new_id = uuid4()

    await connection.execute(
        '''INSERT INTO "InventoryItems" ("Id", "SupplierId", "ItemName", "Category", "StockQuantity", "UnitCost")
           VALUES ($1, $2, $3, $4, $5, $6)''',
        new_id, supplier_id, name, category, stock, cost,
    )

    return (
        f"✅ Spare part {name} has been added to inventory!\n\n"
        f"• Category: {category}\n"
        f"• Supplier: {supplier_name}\n"
        f"• Stock Quantity: {stock} units\n"
        f"• Unit Cost: Rs. {cost:,.2f}"
    ), True


async def _execute_update_item(connection: asyncpg.Connection, data: dict[str, Any]) -> tuple[str, bool]:
    """Executes inventory item update in the database."""
    item_id = UUID(data["itemId"])
    name = data.get("itemName") or "Item"
    stock = int(data["newStock"])
    cost = Decimal(str(data["newCost"]))
    category = data.get("newCategory") or data.get("category")

    await connection.execute(
        '''UPDATE "InventoryItems"
           SET "StockQuantity" = $1, "UnitCost" = $2, "Category" = $3
           WHERE "Id" = $4''',
        stock, cost, category, item_id,
    )
    return (
        f"✅ Spare part {name} was successfully updated!\n\n"
        f"• Stock Quantity: {stock} units\n"
        f"• Unit Cost: Rs. {cost:,.2f}\n"
        f"• Category: {category}"
    ), True


async def _execute_update_supplier(connection: asyncpg.Connection, data: dict[str, Any]) -> tuple[str, bool]:
    """Executes supplier update in the database."""
    sup_id = UUID(data["supplierId"])
    name = data.get("supplierName") or "Supplier"
    email = (data.get("newEmail") or data.get("contactEmail") or "").strip().lower()
    phone = (data.get("newPhone") or data.get("phone") or "").strip() or None

    conflict = await connection.fetchval(
        'SELECT 1 FROM "Suppliers" WHERE LOWER("ContactEmail") = $1 AND "Id" <> $2',
        email, sup_id,
    )
    if conflict:
        return f"⚠️ Another supplier already uses the contact email '{email}'.", False

    await connection.execute(
        'UPDATE "Suppliers" SET "Name" = $1, "ContactEmail" = $2, "Phone" = $3 WHERE "Id" = $4',
        name, email, phone, sup_id,
    )
    return (
        f"✅ Supplier {name} was successfully updated!\n\n"
        f"• Contact Email: {email}\n"
        f"• Phone: {phone or 'Not provided'}"
    ), True


async def _execute_delete_item(connection: asyncpg.Connection, data: dict[str, Any]) -> tuple[str, bool]:
    """Executes inventory item deletion after safety checks."""
    item_id = UUID(data["itemId"])
    name = data.get("itemName") or "Item"

    active = await connection.fetchval(
        'SELECT count(*) FROM "PartsReservations" WHERE "ItemId" = $1 AND "Status" <> \'Consumed\'',
        item_id,
    )
    if active > 0:
        return f"⚠️ Cannot delete '{name}' because it has {active} active reservation(s).", False

    await connection.execute('DELETE FROM "InventoryItems" WHERE "Id" = $1', item_id)
    return f"✅ Spare part {name} was successfully deleted from inventory.", True


async def _execute_delete_supplier(connection: asyncpg.Connection, data: dict[str, Any]) -> tuple[str, bool]:
    """Executes supplier deletion after safety checks."""
    sup_id = UUID(data["supplierId"])
    name = data.get("supplierName") or "Supplier"

    linked = await connection.fetchval('SELECT count(*) FROM "InventoryItems" WHERE "SupplierId" = $1', sup_id)
    if linked > 0:
        return f"⚠️ Cannot delete supplier '{name}' because {linked} spare part(s) are still linked to them.", False

    await connection.execute('DELETE FROM "Suppliers" WHERE "Id" = $1', sup_id)
    return f"✅ Supplier {name} was successfully deleted.", True


def clean_reply_text(text: str) -> str:
    """Strips markdown asterisks (** or ****) so replies are cleanly formatted plain text."""
    if not text:
        return text
    # Strip double/quadruple asterisks around text
    cleaned = re.sub(r'\*{2,}(.*?)\*{2,}', r'\1', text)
    # Remove any remaining consecutive asterisks
    cleaned = re.sub(r'\*{2,}', '', cleaned)
    # Strip single italics asterisks like *word*
    cleaned = re.sub(r'(?<!\w)\*([^\*\n]+)\*(?!\w)', r'\1', cleaned)
    # Strip any dangling asterisks
    cleaned = cleaned.replace('**', '').replace('*', '•') if '*' in cleaned and not cleaned.startswith('•') else cleaned.replace('**', '')
    return cleaned.strip()


# ---------------------------------------------------------------------------
# Main Conversational Handler
# ---------------------------------------------------------------------------

async def handle_inventory_chat(
    messages: list[ChatMessage],
    pending_action: PendingAction | None = None,
) -> tuple[str, PendingAction | None, bool]:
    """
    Handles a single conversational turn with the Inventory Assistant.
    Natively understands natural user inquiries, slot-filling, confirmation guardrails, and scope boundaries.
    Returns: (reply_text, next_pending_action, was_action_executed)
    """
    def _resp(reply_text: str, pending: PendingAction | None = None, executed: bool = False) -> tuple[str, PendingAction | None, bool]:
        return clean_reply_text(reply_text), pending, executed

    if not messages:
        return _resp("Hello! I am your SmartSpace Inventory Assistant. How can I assist you with spare parts or suppliers today?")

    latest_msg = messages[-1].content.strip().lower()

    async with database.connection() as connection:
        # ===================================================================
        # FAST-PATH 1: Explicit Confirmation (ZERO LLM tokens)
        # ===================================================================
        is_confirmation = latest_msg in {
            "confirm", "yes", "okay", "ok", "proceed", "create", "go ahead",
            "sure", "approve", "yep", "do it", "confirm create", "delete", "confirm delete", "update", "confirm update",
        }
        if pending_action and is_confirmation:
            if pending_action.action_type == "create_supplier":
                reply, success = await _execute_create_supplier(connection, pending_action.data)
                return _resp(reply, None, success)
            elif pending_action.action_type == "create_item":
                reply, success = await _execute_create_item(connection, pending_action.data)
                return _resp(reply, None, success)
            elif pending_action.action_type == "update_item":
                reply, success = await _execute_update_item(connection, pending_action.data)
                return _resp(reply, None, success)
            elif pending_action.action_type == "update_supplier":
                reply, success = await _execute_update_supplier(connection, pending_action.data)
                return _resp(reply, None, success)
            elif pending_action.action_type == "delete_item":
                reply, success = await _execute_delete_item(connection, pending_action.data)
                return _resp(reply, None, success)
            elif pending_action.action_type == "delete_supplier":
                reply, success = await _execute_delete_supplier(connection, pending_action.data)
                return _resp(reply, None, success)

        # ===================================================================
        # FAST-PATH 2: Explicit Cancellation (ZERO LLM tokens)
        # ===================================================================
        is_cancellation = latest_msg in {"cancel", "no", "abort", "stop", "nevermind", "don't create", "don't delete", "don't update"}
        if pending_action and is_cancellation:
            return _resp("Cancelled the action. What else can I help you with?")

        # Pre-fetch high-level facts
        stats = await _fetch_inventory_stats(connection)
        all_items = await connection.fetch('SELECT "Id", "ItemName", "StockQuantity", "UnitCost", "Category" FROM "InventoryItems"')
        all_sups = await connection.fetch('SELECT "Id", "Name", "ContactEmail", "Phone" FROM "Suppliers"')

        # ===================================================================
        # NATIVE INTENT 1: Out of Scope / Unauthorized Request Handling
        # ===================================================================
        out_of_scope_patterns = (
            "weather", "capital of", "who is the president", "joke", "poem", "song",
            "recipe", "movie", "game", "hack", "bitcoin", "crypto", "sports", "football",
            "delete all", "drop table", "delete user", "delete database", "book flight",
            "hotel", "flight", "translate"
        )
        if any(p in latest_msg for p in out_of_scope_patterns):
            return _resp(
                "I am specialized solely as the SmartSpace Inventory & Supplier Assistant.\n\n"
                "I can assist with:\n"
                "• Checking spare parts stock levels and available units\n"
                "• Low-stock alerts and safety thresholds\n"
                "• Supplier directory lookups and contacts\n"
                "• Full CRUD: Adding, updating, and removing suppliers or spare parts\n\n"
                "I am not authorized or able to assist with general or out-of-scope requests."
            )

        # ===================================================================
        # NATIVE INTENT 2: Add Inventory Item Intent (CREATE)
        # ===================================================================
        is_add_item = any(k in latest_msg for k in (
            "add item", "add inventory item", "add spare part", "add part", "add a new item",
            "add a new inventory item", "add a new spare part", "create item", "create spare part",
            "new item", "new inventory item", "new spare part", "register item", "register part"
        )) or (any(k in latest_msg for k in ("add ", "create ", "new ", "register ")) and any(k in latest_msg for k in ("part", "item", "unit", "units")))

        if is_add_item:
            slots = extract_item_slots(messages[-1].content)
            has_name = bool(slots.get("itemName"))
            has_cat = bool(slots.get("category"))
            has_sup = bool(slots.get("supplierName"))
            has_qty = "stockQuantity" in slots
            has_cost = "unitCost" in slots

            if not (has_name and has_cat and has_sup and has_qty and has_cost):
                return _resp(
                    "I can help you add a new spare part to inventory! 📦\n\n"
                    "Please provide the following details:\n"
                    "• Item Name (e.g., L Bend PVC 1-inch)\n"
                    "• Category (Plumbing, Electrical, HVAC, or General)\n"
                    "• Supplier Name (e.g., Anton Plumbing Tools, Asiri Hardware)\n"
                    "• Stock Quantity (e.g., 25)\n"
                    "• Unit Cost (e.g., Rs. 150)\n\n"
                    "Example:\n"
                    "> Add 25 units of PVC Elbow 1-inch in Plumbing from Anton Plumbing Tools at Rs. 120 each"
                )

            pending = PendingAction(action_type="create_item", data=slots)
            return _resp(
                f"Please confirm if you would like to add this spare part to inventory:\n\n"
                f"• Item Name: {slots['itemName']}\n"
                f"• Category: {slots['category']}\n"
                f"• Supplier: {slots['supplierName']}\n"
                f"• Stock Quantity: {slots['stockQuantity']} units\n"
                f"• Unit Cost: Rs. {slots['unitCost']:,.2f}\n\n"
                f"Click Confirm below or reply yes to create it.",
                pending,
            )

        # ===================================================================
        # NATIVE INTENT 3: Add Supplier Intent (CREATE)
        # ===================================================================
        is_add_supplier = any(k in latest_msg for k in (
            "add supplier", "add a supplier", "add a new supplier", "new supplier",
            "create supplier", "create a supplier", "register supplier", "register a supplier"
        )) or (any(k in latest_msg for k in ("add ", "create ", "register ")) and any(k in latest_msg for k in ("supplier", "vendor")))

        if is_add_supplier:
            slots = extract_supplier_slots(messages[-1].content)
            has_name = bool(slots.get("name"))
            has_email = bool(slots.get("contactEmail"))

            if not (has_name and has_email):
                return _resp(
                    "I can help you register a new supplier! 🏢\n\n"
                    "Please provide the following details:\n"
                    "• Supplier Name\n"
                    "• Contact Email\n"
                    "• Phone Number (optional)\n\n"
                    "Example:\n"
                    "> Add supplier Royal Electricals with email info@royalelec.lk and phone 0115551234"
                )

            pending = PendingAction(action_type="create_supplier", data=slots)
            return _resp(
                f"Please confirm if you would like to register the following supplier:\n\n"
                f"• Name: {slots['name']}\n"
                f"• Email: {slots['contactEmail']}\n"
                f"• Phone: {slots.get('phone', 'Not provided')}\n\n"
                f"Click Confirm below or reply yes to proceed.",
                pending,
            )

        # Target item / supplier matching for Update & Delete
        target_item = next((i for i in sorted(all_items, key=lambda x: len(x['ItemName']), reverse=True) if i['ItemName'].lower() in latest_msg), None)
        target_sup = next((s for s in sorted(all_sups, key=lambda x: len(x['Name']), reverse=True) if s['Name'].lower() in latest_msg), None)

        # ===================================================================
        # NATIVE INTENT 4: Update Inventory Item (UPDATE)
        # ===================================================================
        is_update_query = any(k in latest_msg for k in ("update ", "change ", "set ", "increase ", "decrease ", "modify "))
        if is_update_query and target_item and not target_sup:
            new_stock = target_item['StockQuantity']
            qty_changed = False

            rel_inc = re.search(r'increase\s+(?:stock\s+)?(?:of\s+[A-Za-z0-9\s\-]+\s+)?by\s+(\d+)', latest_msg, re.IGNORECASE)
            rel_dec = re.search(r'decrease\s+(?:stock\s+)?(?:of\s+[A-Za-z0-9\s\-]+\s+)?by\s+(\d+)', latest_msg, re.IGNORECASE)
            abs_qty = re.search(r'(?:to|stock[:\s]*to|quantity[:\s]*to|stock[:\s]+|set\s+(?:stock\s+)?to)\s*(\d+)', latest_msg, re.IGNORECASE)

            if rel_inc:
                new_stock += int(rel_inc.group(1))
                qty_changed = True
            elif rel_dec:
                new_stock = max(0, new_stock - int(rel_dec.group(1)))
                qty_changed = True
            elif abs_qty:
                new_stock = int(abs_qty.group(1))
                qty_changed = True

            new_cost = float(target_item['UnitCost'])
            cost_changed = False
            cost_match = re.search(r'(?:price|cost|unit\s+cost|rate)\s+(?:of\s+[A-Za-z0-9\s\-]+\s+)?(?:to\s+)?(?:rs\.?|lkr)?\s*(\d+(?:\.\d{1,2})?)', latest_msg, re.IGNORECASE)
            if cost_match:
                new_cost = float(cost_match.group(1))
                cost_changed = True
            elif not qty_changed and re.search(r'to\s+(?:rs\.?|lkr)?\s*(\d+(?:\.\d{1,2})?)', latest_msg, re.IGNORECASE):
                p_match = re.search(r'to\s+(?:rs\.?|lkr)?\s*(\d+(?:\.\d{1,2})?)', latest_msg, re.IGNORECASE)
                new_cost = float(p_match.group(1))
                cost_changed = True

            new_category = target_item['Category']
            cat_changed = False
            cat_match = re.search(r'category\s+(?:to\s+)?(Plumbing|Electrical|HVAC|General)', latest_msg, re.IGNORECASE)
            if cat_match:
                new_category = cat_match.group(1).capitalize()
                cat_changed = True

            if not (qty_changed or cost_changed or cat_changed):
                return _resp(
                    f"I found spare part '{target_item['ItemName']}' in inventory:\n"
                    f"• Current Stock: {target_item['StockQuantity']} units\n"
                    f"• Unit Cost: Rs. {float(target_item['UnitCost']):,.2f}\n"
                    f"• Category: {target_item['Category']}\n\n"
                    f"What would you like to update? You can say, for example:\n"
                    f"> Update stock of {target_item['ItemName']} to 70\n"
                    f"> Change price of {target_item['ItemName']} to Rs. 150"
                )

            pending = PendingAction(
                action_type="update_item",
                data={
                    "itemId": str(target_item["Id"]),
                    "itemName": target_item["ItemName"],
                    "oldStock": target_item["StockQuantity"],
                    "newStock": new_stock,
                    "oldCost": float(target_item["UnitCost"]),
                    "newCost": new_cost,
                    "oldCategory": target_item["Category"],
                    "newCategory": new_category,
                },
            )

            preview_lines = [f"• Spare Part: {target_item['ItemName']}"]
            if qty_changed:
                preview_lines.append(f"• Stock Quantity: {target_item['StockQuantity']} -> {new_stock} units")
            if cost_changed:
                preview_lines.append(f"• Unit Cost: Rs. {float(target_item['UnitCost']):,.2f} -> Rs. {new_cost:,.2f}")
            if cat_changed:
                preview_lines.append(f"• Category: {target_item['Category']} -> {new_category}")

            return _resp(
                "Please confirm if you would like to update this spare part:\n\n" +
                "\n".join(preview_lines) +
                "\n\nClick Confirm below or reply yes to apply this update.",
                pending,
            )

        # ===================================================================
        # NATIVE INTENT 5: Update Supplier (UPDATE)
        # ===================================================================
        if is_update_query and target_sup:
            new_phone = target_sup['Phone']
            phone_changed = False
            phone_match = re.search(r'(?:to|phone[:\s]*to|phone[:\s]+)\s*([0-9\+\-\s]{9,15})', latest_msg, re.IGNORECASE)
            if phone_match:
                digits = re.sub(r'[^0-9+]', '', phone_match.group(1))
                if len(digits) >= 9:
                    new_phone = digits
                    phone_changed = True

            new_email = target_sup['ContactEmail']
            email_changed = False
            email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', latest_msg)
            if email_match:
                cand_email = email_match.group(0).lower()
                conflict = await connection.fetchval(
                    'SELECT 1 FROM "Suppliers" WHERE LOWER("ContactEmail") = $1 AND "Id" <> $2',
                    cand_email, target_sup['Id'],
                )
                if conflict:
                    return _resp(f"⚠️ Contact email '{cand_email}' is already registered to another supplier.")
                new_email = cand_email
                email_changed = True

            if not (phone_changed or email_changed):
                return _resp(
                    f"I found supplier '{target_sup['Name']}':\n"
                    f"• Contact Email: {target_sup['ContactEmail']}\n"
                    f"• Phone: {target_sup['Phone'] or 'Not provided'}\n\n"
                    f"What would you like to update? You can say:\n"
                    f"> Update phone of {target_sup['Name']} to 0119876543\n"
                    f"> Change email of {target_sup['Name']} to contact@newdomain.com"
                )

            pending = PendingAction(
                action_type="update_supplier",
                data={
                    "supplierId": str(target_sup["Id"]),
                    "supplierName": target_sup["Name"],
                    "oldEmail": target_sup["ContactEmail"],
                    "newEmail": new_email,
                    "oldPhone": target_sup["Phone"],
                    "newPhone": new_phone,
                },
            )

            preview_lines = [f"• Supplier Name: {target_sup['Name']}"]
            if email_changed:
                preview_lines.append(f"• Email: {target_sup['ContactEmail']} -> {new_email}")
            if phone_changed:
                preview_lines.append(f"• Phone: {target_sup['Phone'] or 'Not provided'} -> {new_phone}")

            return _resp(
                "Please confirm if you would like to update this supplier:\n\n" +
                "\n".join(preview_lines) +
                "\n\nClick Confirm below or reply yes to apply this update.",
                pending,
            )

        # ===================================================================
        # NATIVE INTENT 6: Delete Inventory Item (DELETE)
        # ===================================================================
        is_delete_query = any(k in latest_msg for k in ("delete ", "remove ", "drop ")) and not any(k in latest_msg for k in ("all", "table", "database", "user"))
        if is_delete_query and target_item and not any(k in latest_msg for k in ("supplier", "vendor")):
            active_res = await connection.fetchval(
                'SELECT count(*) FROM "PartsReservations" WHERE "ItemId" = $1 AND "Status" <> \'Consumed\'',
                target_item['Id'],
            )
            if active_res > 0:
                return _resp(
                    f"⚠️ Cannot delete spare part '{target_item['ItemName']}' because it is linked to {active_res} active or pending maintenance reservation(s)."
                )

            pending = PendingAction(
                action_type="delete_item",
                data={
                    "itemId": str(target_item["Id"]),
                    "itemName": target_item["ItemName"],
                },
            )
            return _resp(
                f"⚠️ Are you sure you want to permanently delete this spare part from inventory?\n\n"
                f"• Spare Part: {target_item['ItemName']}\n"
                f"• Category: {target_item['Category']}\n"
                f"• Stock Quantity: {target_item['StockQuantity']} units\n"
                f"• Unit Cost: Rs. {float(target_item['UnitCost']):,.2f}\n\n"
                f"This action cannot be undone. Click Confirm below or reply yes to delete.",
                pending,
            )

        # ===================================================================
        # NATIVE INTENT 7: Delete Supplier (DELETE)
        # ===================================================================
        if is_delete_query and target_sup and any(k in latest_msg for k in ("supplier", "vendor", target_sup['Name'].lower())):
            linked_items = await connection.fetch('SELECT "ItemName" FROM "InventoryItems" WHERE "SupplierId" = $1', target_sup['Id'])
            if linked_items:
                sample_parts = ", ".join(f"'{i['ItemName']}'" for i in linked_items[:3])
                return _resp(
                    f"⚠️ Cannot delete supplier '{target_sup['Name']}' because they supply {len(linked_items)} inventory spare part(s) ({sample_parts}). "
                    f"Please reassign or remove these parts before deleting the supplier."
                )

            pending = PendingAction(
                action_type="delete_supplier",
                data={
                    "supplierId": str(target_sup["Id"]),
                    "supplierName": target_sup["Name"],
                },
            )
            return _resp(
                f"⚠️ Are you sure you want to permanently delete this supplier?\n\n"
                f"• Supplier Name: {target_sup['Name']}\n"
                f"• Contact Email: {target_sup['ContactEmail']}\n"
                f"• Phone: {target_sup['Phone'] or 'Not provided'}\n\n"
                f"This action cannot be undone. Click Confirm below or reply yes to delete.",
                pending,
            )

        # ===================================================================
        # NATIVE INTENT 4: Low Stock Inquiry
        # ===================================================================
        is_low_stock = (
            any(w in latest_msg for w in ("low stock", "running low", "below threshold", "shortage", "need reorder", "out of stock", "reorder list"))
            or ("low" in latest_msg and any(w in latest_msg for w in ("stock", "items", "parts", "spare", "inventory", "units", "shortage")))
        )
        if is_low_stock:
            low_items = await _fetch_low_stock_items(connection)
            if not low_items:
                return _resp("✅ All inventory items currently have healthy stock levels (at least 5 units available).")
            lines = [f"• {i['name']} ({i['category']}): {i['stock']} left (Cost: Rs. {i['cost']:,.2f})" for i in low_items]
            return _resp("⚠️ Low Stock Alert (<5 units):\n\n" + "\n".join(lines) + "\n\nWould you like me to check supplier details to place an order?")

        # ===================================================================
        # NATIVE INTENT 5: Supplier List or Count Inquiries
        # ===================================================================
        if any(w in latest_msg for w in ("supplier", "suppliers", "vendor", "vendors")):
            if any(w in latest_msg for w in ("list", "who", "show", "view", "all", "names", "directory")):
                sups = await _fetch_suppliers(connection)
                lines = [f"• {s['name']} — {s['email']} (Tel: {s['phone']})" for s in sups]
                return _resp(f"📋 Registered Suppliers ({len(sups)}):\n\n" + "\n".join(lines))

            if any(w in latest_msg for w in ("how many", "count", "number of", "total")):
                sups = await _fetch_suppliers(connection, limit=5)
                sample = ", ".join(s["name"] for s in sups)
                return _resp(f"We currently have {stats['suppliers_count']} registered suppliers (including {sample}).")

        # ===================================================================
        # NATIVE INTENT 6: Total Items / Inventory Overview Inquiry
        # ===================================================================
        if any(w in latest_msg for w in ("how many", "count", "number of", "total", "summary", "overview")) and any(w in latest_msg for w in ("item", "items", "part", "parts", "spare", "inventory")):
            return _resp(
                f"We currently have {stats['items_count']} distinct spare part types in stock across {stats['suppliers_count']} suppliers.\n\n"
                f"• Category Breakdown: {stats['categories_summary']}\n"
                f"• Low-stock items (<5 units): {stats['low_stock_count']}"
            )

        # ===================================================================
        # NATIVE INTENT 7: Specific Part Stock Lookup & Native "Not In Stock" Response
        # ===================================================================
        is_stock_inquiry = any(w in latest_msg for w in ("how many", "do we have", "check", "in stock", "available", "cost of", "price of", "is there", "any", "got"))
        item_matches = await _search_items(connection, messages[-1].content)

        if item_matches:
            if len(item_matches) == 1:
                m = item_matches[0]
                return _resp(
                    f"We currently have {m['available_stock']} units of {m['name']} in stock "
                    f"(Physical: {m['physical_stock']}, Reserved: {m['reserved']}) under the {m['category']} category "
                    f"at Rs. {m['unit_cost']:,.2f} each, supplied by {m['supplier']}.\n\n"
                    f"How else can I assist you with this item?"
                )
            else:
                lines = [
                    f"• {m['name']} ({m['category']}): {m['available_stock']} available "
                    f"(Physical: {m['physical_stock']}, Reserved: {m['reserved']}) — Rs. {m['unit_cost']:,.2f} "
                    f"[Supplier: {m['supplier']}]"
                    for m in item_matches
                ]
                return _resp(
                    f"Here is what I found in inventory:\n\n" + "\n".join(lines) +
                    f"\n\nWould you like me to check anything else or reserve parts?"
                )
        elif is_stock_inquiry:
            clean_term = extract_part_query_term(messages[-1].content)
            return _resp(
                f"We do not currently have any {clean_term} in our inventory.\n\n"
                f"Would you like me to help you add it as a new spare part or contact a supplier?"
            )

        # ===================================================================
        # TIER 2: Conversational LLM Path (Gemini) with Smart Fallback
        # ===================================================================
        db_context_pieces = [
            f"Overall Stats: Total Suppliers={stats['suppliers_count']}, Total Item Types={stats['items_count']}, "
            f"Low Stock Items={stats['low_stock_count']}, Categories={stats['categories_summary']}"
        ]
        db_context_str = "\n".join(f"- {p}" for p in db_context_pieces)

        system_prompt = f"""
You are the SmartSpace Inventory & Supplier Assistant.
You help inventory officers check stock, count suppliers, view low stock, and add new suppliers or items.
Be concise, friendly, and practical. Keep your answers brief (under 80 words unless listing items).
CRITICAL: Do NOT use markdown bolding or asterisks (like **text**) in any of your answers. Output clean plain text.

REAL-TIME DATABASE FACTS:
{db_context_str}

ACTION RULES:
1. Adding a Supplier requires:
   - name (string)
   - contactEmail (valid email)
   - phone (optional string)
   If fields are missing, politely ask the user for the missing fields.
   When all required fields are present, set pending_action_type="create_supplier", fill action_data, and output a clear summary asking the user to confirm!

2. Adding an Inventory Item requires:
   - itemName (string)
   - category (one of: Plumbing, Electrical, HVAC, General)
   - supplierName (must match or approximate an existing supplier)
   - stockQuantity (integer >= 0)
   - unitCost (number >= 0)
   If fields are missing, politely ask for them.
3. Updating an item or supplier:
   - Identify which item or supplier the user wants to update.
   - For items: stock quantity, unit cost, or category. Set pending_action_type="update_item".
   - For suppliers: contact email or phone. Set pending_action_type="update_supplier".
   - Ask for confirmation before changes take effect.

4. Deleting an item or supplier:
   - Identify the specific item or supplier.
   - Warn that the action is irreversible and ask for confirmation. Set pending_action_type="delete_item" or "delete_supplier".

5. If the user asks something outside inventory and maintenance, politely decline.
"""

        recent_messages = messages[-6:]
        gemini_messages = [SystemMessage(content=system_prompt)]
        for msg in recent_messages:
            if msg.role == "user":
                gemini_messages.append(HumanMessage(content=msg.content))
            else:
                gemini_messages.append(SystemMessage(content=f"Assistant: {msg.content}"))

        settings = get_settings()
        api_key, model_name = settings.agent_credentials("INVENTORY")

        llm = ChatGoogleGenerativeAI(
            model=model_name,
            api_key=api_key,
            max_tokens=250,
            thinking_level="minimal",
            retries=settings.ai_max_retries,
            request_timeout=max(settings.ai_request_timeout_seconds, 20),
        )

        try:
            structured_llm = llm.with_structured_output(AssistantResponsePayload)
            parsed = await structured_llm.ainvoke(gemini_messages)

            reply = ""
            action_type = None
            action_payload = None

            if isinstance(parsed, AssistantResponsePayload):
                reply = parsed.reply
                action_type = parsed.pending_action_type
                action_payload = parsed.action_data
            elif isinstance(parsed, dict):
                reply = parsed.get("reply", "")
                action_type = parsed.get("pending_action_type")
                action_payload = parsed.get("action_data")

            next_pending = None
            if action_type and action_payload:
                next_pending = PendingAction(
                    action_type=action_type,
                    data=action_payload,
                )

            return _resp(reply or "How else can I assist you with inventory?", next_pending, False)

        except Exception as exc:
            logger.exception("Inventory assistant LLM call failed (%s): %s", type(exc).__name__, exc)

            # Smart conversational fallback that directly addresses the query
            if any(w in latest_msg for w in ("supplier", "vendor")):
                sups = await _fetch_suppliers(connection, limit=5)
                sample = ", ".join(s["name"] for s in sups)
                return _resp(
                    f"We currently have {stats['suppliers_count']} registered suppliers (including {sample}). "
                    f"How else can I assist you with suppliers?",
                    pending_action,
                    False,
                )

            if any(w in latest_msg for w in ("low", "stock", "part", "item")):
                return _resp(
                    f"We currently have {stats['items_count']} spare part types across {stats['categories_summary']}. "
                    f"There are {stats['low_stock_count']} item(s) running low (<5 units).",
                    pending_action,
                    False,
                )

            return _resp(
                f"We currently have {stats['suppliers_count']} registered suppliers and {stats['items_count']} spare part types. "
                "You can ask me to check stock, view suppliers, or add new items!",
                pending_action,
                False,
            )

