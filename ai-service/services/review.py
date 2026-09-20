import json
from datetime import datetime, timezone
from uuid import UUID, uuid4

import asyncpg

from core.database import database
from core.errors import AiServiceError, NotFoundError, ValidationError
from schemas.contracts import (
    AiAuditLogEntry, MaintenanceApprovalResult, MaintenanceWorkflowState, MaintenanceWorkflowStatus,
)
from services.notifications import send_booking_confirmation
from validation.proposal import validate_proposal


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _parse_state(value) -> MaintenanceWorkflowState:
    try:
        return MaintenanceWorkflowState.model_validate(value if isinstance(value, dict) else json.loads(value))
    except Exception as exc:
        raise AiServiceError("The stored AI proposal is invalid.") from exc


async def latest_state(connection: asyncpg.Connection, ticket_id: UUID) -> MaintenanceWorkflowState:
    value = await connection.fetchval(
        '''SELECT "WorkflowState" FROM "AgentExecutionLogs"
           WHERE "TicketId"=$1 AND "AgentRole"='DeterministicValidator'
           ORDER BY "CreatedAt" DESC LIMIT 1''', ticket_id,
    )
    if value is None:
        raise NotFoundError("No completed AI proposal was found for this ticket.")
    return _parse_state(value)


async def get_latest(ticket_id: UUID) -> MaintenanceWorkflowState:
    async with database.connection() as connection:
        return await latest_state(connection, ticket_id)


async def get_status(ticket_id: UUID, run_id: UUID) -> MaintenanceWorkflowStatus:
    async with database.connection() as connection:
        status = await connection.fetchval(
            '''SELECT "Status" FROM "MaintenanceTickets" WHERE "Id"=$1 AND NOT "IsDeleted"''', ticket_id)
        if status is None:
            raise NotFoundError("Maintenance ticket was not found.")
        values = await connection.fetch(
            '''SELECT "WorkflowState" FROM "AgentExecutionLogs" WHERE "TicketId"=$1 ORDER BY "CreatedAt" DESC''',
            ticket_id,
        )
        state = None
        for row in values:
            try:
                candidate = _parse_state(row["WorkflowState"])
                if candidate.run_id == run_id:
                    state = candidate
                    break
            except AiServiceError:
                continue
        if state is None:
            return MaintenanceWorkflowStatus(
                run_id=run_id, ticket_id=ticket_id, ticket_status=status, current_step="triage",
                failed_step=None, validation_passed=False, approval_status="NotRequested",
                final_outcome=None, execution_history=[],
            )
        return MaintenanceWorkflowStatus(
            run_id=run_id, ticket_id=ticket_id, ticket_status=status, current_step=state.current_step,
            failed_step=state.failed_step, validation_passed=state.validation_passed,
            approval_status=state.approval_status, final_outcome=state.final_outcome,
            execution_history=state.execution_history,
        )


def _audit_entry(row: asyncpg.Record) -> AiAuditLogEntry:
    try:
        state = _parse_state(row["WorkflowState"])
    except AiServiceError:
        state = None
    execution = None
    if state:
        execution = next((item for item in reversed(state.execution_history) if item.agent_role == row["AgentRole"]), None)
        if not execution and row["AgentRole"] == "WorkflowOrchestrator":
            execution = next((item for item in reversed(state.execution_history) if item.status == "Failed"), None)
    schedule = state.scheduling if state else None
    inventory = state.inventory if state else None
    return AiAuditLogEntry(
        id=row["Id"], ticket_id=row["TicketId"], run_id=state.run_id if state else None,
        agent_role=row["AgentRole"], action_taken=row["ActionTaken"], created_at=row["CreatedAt"],
        step=execution.step if execution else None, step_status=execution.status if execution else None,
        duration_ms=execution.duration_ms if execution else None, error_code=execution.error_code if execution else None,
        workflow_outcome=state.workflow_outcome if state else None,
        validation_passed=state.validation_passed if state else None,
        approval_status=state.approval_status if state else None, final_outcome=state.final_outcome if state else None,
        appointment_id=state.appointment_id if state else None, quotation_id=state.quotation_id if state else None,
        reservation_ids=state.reservation_ids if state else [],
        inventory_items=inventory.inventory_items if inventory else [],
        technician_name=schedule.technician_name if schedule else None,
        proposed_date=schedule.proposed_date if schedule else None,
        proposed_start_time=schedule.proposed_start_time if schedule else None,
        proposed_end_time=schedule.proposed_end_time if schedule else None,
        parts_cost=inventory.estimated_parts_cost if inventory else None,
        labor_cost=schedule.estimated_labor_cost if schedule else None,
        total_cost=schedule.total_estimated_cost if schedule else None,
    )


async def audit_history(ticket_id: UUID | None = None) -> list[AiAuditLogEntry]:
    async with database.connection() as connection:
        if ticket_id:
            exists = await connection.fetchval(
                '''SELECT EXISTS(SELECT 1 FROM "MaintenanceTickets" WHERE "Id"=$1 AND NOT "IsDeleted")''', ticket_id)
            if not exists:
                raise NotFoundError("Maintenance ticket was not found.")
            rows = await connection.fetch(
                '''SELECT * FROM "AgentExecutionLogs" WHERE "TicketId"=$1
                   ORDER BY "CreatedAt" DESC, "Id" DESC LIMIT 200''', ticket_id)
        else:
            rows = await connection.fetch(
                '''SELECT l.* FROM "AgentExecutionLogs" l JOIN "MaintenanceTickets" t ON t."Id"=l."TicketId"
                   WHERE NOT t."IsDeleted" ORDER BY l."CreatedAt" DESC, l."Id" DESC LIMIT 500''')
        return [_audit_entry(row) for row in rows]


async def approve(ticket_id: UUID) -> MaintenanceApprovalResult:
    notification_data = None
    async with database.connection() as connection:
        async with connection.transaction(isolation="serializable"):
            ticket = await connection.fetchrow(
                '''SELECT * FROM "MaintenanceTickets" WHERE "Id"=$1 AND NOT "IsDeleted" FOR UPDATE''', ticket_id)
            if not ticket:
                raise NotFoundError("Maintenance ticket was not found.")
            state = await latest_state(connection, ticket_id)

            if ticket["Status"] == "Scheduled":
                appointment = await connection.fetchrow('''SELECT "Id" FROM "Appointments" WHERE "TicketId"=$1''', ticket_id)
                quotation = await connection.fetchrow('''SELECT "Id" FROM "Quotations" WHERE "TicketId"=$1''', ticket_id)
                reservations = await connection.fetch('''SELECT "Id" FROM "PartsReservations" WHERE "TicketId"=$1''', ticket_id)
                if not appointment or not quotation:
                    raise AiServiceError("The scheduled ticket has incomplete operational records.")
                return MaintenanceApprovalResult(ticket_id=ticket_id, run_id=state.run_id,
                    appointment_id=appointment["Id"], quotation_id=quotation["Id"],
                    reservation_ids=[row["Id"] for row in reservations], status="Scheduled")
            if ticket["Status"] == "ClosedNoAction":
                return MaintenanceApprovalResult(ticket_id=ticket_id, run_id=state.run_id,
                    appointment_id=None, quotation_id=None, reservation_ids=[], status="ClosedNoAction")
            if ticket["Status"] != "PendingApproval":
                raise AiServiceError("Only a validated PendingApproval ticket can be approved.")
            if not state.validation_passed:
                raise AiServiceError("The latest AI proposal is not valid for approval.")

            errors = await validate_proposal(connection, state)
            if errors:
                raise ValidationError(errors, run_id=state.run_id)

            if state.workflow_outcome in ("NoActionReview", "TenantResponsibilityReview"):
                state.approval_status = "Approved"
                state.final_outcome = (
                    "Property Manager confirmed that no maintenance action is required"
                    if state.workflow_outcome == "NoActionReview"
                    else "Property Manager confirmed tenant responsibility; no landlord maintenance plan was created"
                )
                await connection.execute(
                    '''UPDATE "MaintenanceTickets" SET "Status"='ClosedNoAction', "UpdatedAt"=$2 WHERE "Id"=$1''',
                    ticket_id, _utcnow())
                await _insert_log(connection, ticket_id, "HumanApproval", state.final_outcome, state)
                return MaintenanceApprovalResult(ticket_id=ticket_id, run_id=state.run_id,
                    appointment_id=None, quotation_id=None, reservation_ids=[], status="ClosedNoAction")

            if not state.inventory or not state.scheduling:
                raise AiServiceError("The validated maintenance plan is incomplete.")
            duplicates = await connection.fetchval(
                '''SELECT EXISTS(SELECT 1 FROM "Appointments" WHERE "TicketId"=$1)
                   OR EXISTS(SELECT 1 FROM "Quotations" WHERE "TicketId"=$1)
                   OR EXISTS(SELECT 1 FROM "PartsReservations" WHERE "TicketId"=$1)''', ticket_id)
            if duplicates:
                raise AiServiceError("Operational records already exist for this ticket.")

            appointment_id, quotation_id = uuid4(), uuid4()
            reservation_ids = [uuid4() for _ in state.inventory.inventory_items]
            for reservation_id, item in zip(reservation_ids, state.inventory.inventory_items):
                await connection.execute(
                    '''INSERT INTO "PartsReservations" ("Id","TicketId","ItemId","QuantityReserved","Status")
                       VALUES ($1,$2,$3,$4,'Confirmed')''',
                    reservation_id, ticket_id, item.item_id, item.quantity)
            schedule = state.scheduling
            await connection.execute(
                '''INSERT INTO "Appointments" ("Id","TicketId","TechnicianId","ScheduledDate","StartTime","EndTime","Status")
                   VALUES ($1,$2,$3,$4,$5,$6,'Scheduled')''', appointment_id, ticket_id, schedule.technician_id,
                schedule.proposed_date, schedule.proposed_start_time, schedule.proposed_end_time)
            await connection.execute(
                '''INSERT INTO "Quotations" ("Id","TicketId","LaborCost","PartsCost","TotalCost","IsApproved")
                   VALUES ($1,$2,$3,$4,$5,TRUE)''', quotation_id, ticket_id, schedule.estimated_labor_cost,
                state.inventory.estimated_parts_cost, schedule.total_estimated_cost)
            await connection.execute(
                '''UPDATE "MaintenanceTickets" SET "Status"='Scheduled', "UpdatedAt"=$2 WHERE "Id"=$1''',
                ticket_id, _utcnow())
            state.approval_status = "Approved"
            state.final_outcome = "Maintenance scheduled after Property Manager approval"
            state.appointment_id, state.quotation_id, state.reservation_ids = appointment_id, quotation_id, reservation_ids
            await _insert_log(connection, ticket_id, "HumanApproval",
                              "Property Manager approved the validated maintenance proposal", state)
            people = await connection.fetchrow(
                '''SELECT tenant."Email" tenant_email, tenant."FullName" tenant_name,
                          tech."Email" technician_email, tech."FullName" technician_name
                   FROM "MaintenanceTickets" t JOIN "Users" tenant ON tenant."Id"=t."TenantId"
                   JOIN "TechnicianProfiles" p ON p."Id"=$2 JOIN "Users" tech ON tech."Id"=p."UserId"
                   WHERE t."Id"=$1''', ticket_id, schedule.technician_id)
            notification_data = (people, schedule.total_estimated_cost)
            result = MaintenanceApprovalResult(ticket_id=ticket_id, run_id=state.run_id,
                appointment_id=appointment_id, quotation_id=quotation_id,
                reservation_ids=reservation_ids, status="Scheduled")

    if notification_data:
        people, total = notification_data
        await send_booking_confirmation(people["tenant_email"], people["tenant_name"], ticket_id, total)
        await send_booking_confirmation(people["technician_email"], people["technician_name"], ticket_id, total)
    return result


async def reject(ticket_id: UUID, reason: str | None) -> None:
    safe_reason = reason.strip() if reason and reason.strip() else "No reason supplied"
    async with database.connection() as connection:
        async with connection.transaction():
            status = await connection.fetchval(
                '''SELECT "Status" FROM "MaintenanceTickets" WHERE "Id"=$1 AND NOT "IsDeleted" FOR UPDATE''', ticket_id)
            if status is None:
                raise NotFoundError("Maintenance ticket was not found.")
            if status != "PendingApproval":
                raise AiServiceError("Only a PendingApproval ticket can be rejected.")
            state = await latest_state(connection, ticket_id)
            state.approval_status = "Rejected"
            state.final_outcome = f"Proposal rejected by Property Manager: {safe_reason}"
            await connection.execute(
                '''UPDATE "MaintenanceTickets" SET "Status"='Submitted', "UpdatedAt"=$2 WHERE "Id"=$1''',
                ticket_id, _utcnow())
            await _insert_log(connection, ticket_id, "HumanApproval",
                              f"Property Manager rejected the proposal: {safe_reason}", state)


async def _insert_log(connection: asyncpg.Connection, ticket_id: UUID, role: str,
                      action: str, state: MaintenanceWorkflowState) -> None:
    await connection.execute(
        '''INSERT INTO "AgentExecutionLogs" ("Id","TicketId","AgentRole","ActionTaken","WorkflowState","CreatedAt")
           VALUES ($1,$2,$3,$4,$5::jsonb,$6)''',
        uuid4(), ticket_id, role, action, state.model_dump_json(), _utcnow())
