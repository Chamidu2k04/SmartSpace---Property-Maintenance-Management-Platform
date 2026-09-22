import re
from datetime import date, time, timedelta
from uuid import UUID

import asyncpg

from schemas.contracts import InventoryCandidate, TechnicianCandidate

CATEGORY_BY_TRADE = {"Plumber": "Plumbing", "Electrician": "Electrical", "Handyman": "General"}


def _expanded_terms(description: str, trade: str) -> set[str]:
    terms = {word.lower() for word in re.findall(r"[A-Za-z]+", description) if len(word) >= 4}
    text = " ".join(terms)
    if any(word in text for word in ("leak", "water", "washroom", "bathroom")):
        terms.update(("pipe", "valve", "seal", "washer", "tap", "faucet", "hose", "connector", "drain"))
    if "toilet" in text:
        terms.update(("toilet", "cistern", "flush", "seal", "valve"))
    if any(word in text for word in ("electric", "power")) or trade == "Electrician":
        terms.update(("wire", "cable", "switch", "socket", "breaker", "fuse"))
    return terms


async def search_inventory(connection: asyncpg.Connection, description: str, trade: str) -> list[InventoryCandidate]:
    category = CATEGORY_BY_TRADE[trade]
    rows = await connection.fetch(
        '''
        SELECT i."Id", i."ItemName", i."Category", i."StockQuantity", i."UnitCost",
               COALESCE(SUM(r."QuantityReserved") FILTER (WHERE r."Status" <> 'Consumed'), 0) AS reserved
        FROM "InventoryItems" i
        LEFT JOIN "PartsReservations" r ON r."ItemId" = i."Id"
        WHERE i."StockQuantity" > 0 AND (i."Category" = $1 OR i."Category" = 'General')
        GROUP BY i."Id", i."ItemName", i."Category", i."StockQuantity", i."UnitCost"
        LIMIT 20
        ''', category,
    )
    terms = _expanded_terms(description, trade)
    candidates = []
    for row in rows:
        available = row["StockQuantity"] - row["reserved"]
        if available > 0:
            score = sum(term in row["ItemName"].lower() for term in terms)
            candidates.append((score, row["Category"] == category, row, available))
    candidates.sort(key=lambda value: (-value[0], -value[1], value[2]["ItemName"].lower()))
    return [InventoryCandidate(
        item_id=row["Id"], item_name=row["ItemName"], category=row["Category"],
        available_stock=available, unit_cost=row["UnitCost"],
    ) for _, _, row, available in candidates[:5]]


def _seconds(value: time) -> int:
    return value.hour * 3600 + value.minute * 60 + value.second


def _time_from_seconds(value: int) -> time:
    return time(value // 3600, (value % 3600) // 60, value % 60)


def _find_two_hour_slot(appointments: list[asyncpg.Record]) -> tuple[time, time] | None:
    cursor = 9 * 3600
    end_of_day = 17 * 3600
    for appointment in sorted(appointments, key=lambda row: row["StartTime"]):
        start, end = _seconds(appointment["StartTime"]), _seconds(appointment["EndTime"])
        if start - cursor >= 7200:
            return _time_from_seconds(cursor), _time_from_seconds(cursor + 7200)
        cursor = max(cursor, end)
    return (_time_from_seconds(cursor), _time_from_seconds(cursor + 7200)) if end_of_day - cursor >= 7200 else None


async def available_technicians(connection: asyncpg.Connection, trade: str, requested_date: date) -> list[TechnicianCandidate]:
    if requested_date < date.today():
        return []
    technicians = await connection.fetch(
        '''
        SELECT p."Id", p."TradeSpecialty", p."HourlyRate", u."FullName"
        FROM "TechnicianProfiles" p
        JOIN "Users" u ON u."Id" = p."UserId"
        WHERE p."TradeSpecialty" = $1
        LIMIT 10
        ''', trade,
    )
    if not technicians:
        return []
    appointments = await connection.fetch(
        '''SELECT "TechnicianId", "StartTime", "EndTime" FROM "Appointments"
           WHERE "TechnicianId" = ANY($1::uuid[]) AND "ScheduledDate" = $2 AND "Status" <> 'Cancelled'
           ORDER BY "StartTime"''', [row["Id"] for row in technicians], requested_date,
    )
    results = []
    for technician in technicians:
        slot = _find_two_hour_slot([row for row in appointments if row["TechnicianId"] == technician["Id"]])
        if slot:
            results.append(TechnicianCandidate(
                technician_id=technician["Id"], technician_name=technician["FullName"],
                trade_specialty=technician["TradeSpecialty"], hourly_rate=technician["HourlyRate"],
                available_start_time=slot[0], available_end_time=slot[1],
            ))
    return results[:5]
