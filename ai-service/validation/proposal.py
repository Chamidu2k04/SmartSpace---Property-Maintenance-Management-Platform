from datetime import datetime, timezone
from decimal import Decimal

import asyncpg

from schemas.contracts import MaintenanceWorkflowState


async def validate_proposal(connection: asyncpg.Connection, state: MaintenanceWorkflowState) -> list[str]:
    errors: list[str] = []
    if not state.triage:
        return ["The workflow proposal is incomplete."]
    exists = await connection.fetchval(
        '''SELECT EXISTS(SELECT 1 FROM "MaintenanceTickets" WHERE "Id"=$1 AND NOT "IsDeleted")''', state.ticket_id)
    if not exists:
        errors.append("Ticket does not exist.")

    if state.workflow_outcome == "NoActionReview":
        if state.triage.issue_relevance != "Irrelevant":
            errors.append("A no-action outcome requires an irrelevant triage classification.")
        if state.policy or state.inventory or state.scheduling:
            errors.append("A no-action outcome must not contain policy, inventory, or scheduling proposals.")
        return errors

    if state.workflow_outcome == "TenantResponsibilityReview":
        if not state.policy or state.policy.liability != "Tenant Responsibility (Negligence)":
            errors.append("A tenant-responsibility outcome requires the canonical tenant classification.")
        if state.inventory or state.scheduling:
            errors.append("A tenant-responsibility outcome must not contain inventory or scheduling proposals.")
        return errors

    if not state.policy or not state.inventory or not state.scheduling:
        return errors + ["The maintenance-plan workflow proposal is incomplete."]
    if state.triage.issue_relevance != "Maintenance" or state.policy.liability != "Landlord Responsibility (Wear & Tear)":
        errors.append("A maintenance plan requires a relevant landlord-responsibility classification.")

    item_ids = [item.item_id for item in state.inventory.inventory_items]
    if len(set(item_ids)) != len(item_ids):
        errors.append("A proposed inventory item is duplicated.")
    rows = await connection.fetch(
        '''
        SELECT i."Id", i."StockQuantity", i."UnitCost",
               COALESCE(SUM(r."QuantityReserved") FILTER (WHERE r."Status" <> 'Consumed'), 0) AS reserved
        FROM "InventoryItems" i LEFT JOIN "PartsReservations" r ON r."ItemId"=i."Id"
        WHERE i."Id" = ANY($1::uuid[]) GROUP BY i."Id", i."StockQuantity", i."UnitCost"
        ''', item_ids,
    ) if item_ids else []
    trusted_items = {row["Id"]: row for row in rows}
    parts_total = Decimal("0")
    for proposed in state.inventory.inventory_items:
        trusted = trusted_items.get(proposed.item_id)
        if not trusted:
            errors.append(f"Inventory item {proposed.item_id} does not exist.")
            continue
        available = trusted["StockQuantity"] - trusted["reserved"]
        if proposed.quantity <= 0 or available < proposed.quantity:
            errors.append(f"Inventory item {proposed.item_id} has insufficient unreserved stock.")
        parts_total += trusted["UnitCost"] * proposed.quantity
    parts_total = parts_total.quantize(Decimal("0.01"))
    if parts_total != state.inventory.estimated_parts_cost.quantize(Decimal("0.01")):
        errors.append("The trusted parts total does not match the proposal.")

    schedule = state.scheduling
    if state.preferred_date and schedule.proposed_date != state.preferred_date:
        errors.append("The proposed appointment date does not match the requested date.")
    technician = await connection.fetchrow(
        '''SELECT "Id", "TradeSpecialty", "HourlyRate" FROM "TechnicianProfiles" WHERE "Id"=$1''',
        schedule.technician_id,
    )
    if not technician:
        errors.append("Technician does not exist.")
    else:
        if technician["TradeSpecialty"] != state.triage.trade_required:
            errors.append("Technician specialty is incompatible.")
        overlaps = await connection.fetchval(
            '''SELECT EXISTS(SELECT 1 FROM "Appointments" WHERE "TechnicianId"=$1 AND "ScheduledDate"=$2
               AND "Status" <> 'Cancelled' AND "StartTime" < $3 AND $4 < "EndTime")''',
            schedule.technician_id, schedule.proposed_date, schedule.proposed_end_time, schedule.proposed_start_time,
        )
        if overlaps:
            errors.append("The proposed appointment overlaps an existing appointment.")
        start_seconds = schedule.proposed_start_time.hour * 3600 + schedule.proposed_start_time.minute * 60
        end_seconds = schedule.proposed_end_time.hour * 3600 + schedule.proposed_end_time.minute * 60
        hours = Decimal(end_seconds - start_seconds) / Decimal(3600)
        labor = (hours * technician["HourlyRate"]).quantize(Decimal("0.01"))
        if labor != schedule.estimated_labor_cost or (labor + parts_total).quantize(Decimal("0.01")) != schedule.total_estimated_cost:
            errors.append("The trusted quotation total does not match the proposal.")
    return errors
