"""
SmartSpace - Inventory Assistant Router
Dedicated API endpoint for the interactive conversational chat assistant.
Completely separate from the core maintenance workflow (/api/ai/*).
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt
from pydantic import BaseModel

from core.config import get_settings
from services.inventory_assistant import (
    ChatMessage,
    PendingAction,
    handle_inventory_chat,
)

router = APIRouter()
bearer = HTTPBearer(auto_error=False)
ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"

ALLOWED_ROLES = {"InventoryOfficer", "InventoryManager", "PropertyManager", "Admin", "Technician"}


async def require_inventory_access(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
) -> dict:
    """Validates JWT or development/demo token and verifies user has inventory permissions."""
    if not credentials or not credentials.credentials:
        # Development fallback when called internally or in test environments
        return {"role": "InventoryOfficer", "sub": "dev-user"}

    token = credentials.credentials
    if token == "demo_jwt_token_for_smartspace_mobile" or token.startswith("demo_"):
        return {"role": "InventoryOfficer", "sub": "demo-user"}

    settings = get_settings()
    try:
        claims = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=["HS256"],
            issuer=settings.jwt_issuer,
            audience=settings.jwt_audience,
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired access token.") from exc

    role = claims.get(ROLE_CLAIM) or claims.get("role")
    if role not in ALLOWED_ROLES:
        raise HTTPException(
            status_code=403,
            detail=f"Access denied: {role} role cannot access the Inventory Assistant.",
        )
    return claims


class InventoryChatRequest(BaseModel):
    messages: list[ChatMessage]
    pending_action: PendingAction | None = None


class InventoryChatResponse(BaseModel):
    reply: str
    pending_action: PendingAction | None = None
    action_executed: bool = False


@router.post("/chat", response_model=InventoryChatResponse)
async def chat_with_inventory_assistant(
    request: InventoryChatRequest,
    _: Annotated[dict, Depends(require_inventory_access)],
) -> InventoryChatResponse:
    """
    Dedicated endpoint for the Inventory Assistant Chat.
    Supports Q&A, stock inquiries, and conversational creation of suppliers/parts.
    """
    reply, next_pending, executed = await handle_inventory_chat(
        messages=request.messages,
        pending_action=request.pending_action,
    )

    return InventoryChatResponse(
        reply=reply,
        pending_action=next_pending,
        action_executed=executed,
    )
