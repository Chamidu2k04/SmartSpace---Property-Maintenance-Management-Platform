from datetime import datetime, timezone
import logging
from uuid import uuid4

from core.database import database
from core.errors import AiServiceError, NotFoundError
from graph.maintenance import create_graph, persist
from schemas.contracts import AgentStepExecution, MaintenanceWorkflowRequest, MaintenanceWorkflowState


logger = logging.getLogger(__name__)


async def run_workflow(request: MaintenanceWorkflowRequest) -> MaintenanceWorkflowState:
    async with database.connection() as connection:
        ticket = await connection.fetchrow(
            '''SELECT "Id", "Description", "UrgencyLevel", "Status" FROM "MaintenanceTickets"
               WHERE "Id"=$1 AND NOT "IsDeleted"''', request.ticket_id,
        )
        if not ticket:
            raise NotFoundError("Maintenance ticket was not found.")
        if ticket["Status"] not in ("Submitted", "Analyzing"):
            raise AiServiceError("Only Submitted or Analyzing tickets can be planned.")
        state = MaintenanceWorkflowState(
            run_id=request.run_id or uuid4(), ticket_id=request.ticket_id,
            raw_issue_description=ticket["Description"], submitted_urgency=ticket["UrgencyLevel"],
            preferred_date=request.preferred_date,
        )
        await connection.execute(
            '''UPDATE "MaintenanceTickets" SET "Status"='Analyzing', "UpdatedAt"=$2 WHERE "Id"=$1''',
            request.ticket_id, datetime.now(timezone.utc),
        )
        try:
            result = await create_graph(connection).ainvoke({"workflow": state})
            return result["workflow"]
        except Exception as exc:
            logger.exception(
                "Maintenance workflow %s failed at %s (%s)",
                state.run_id, state.current_step, type(exc).__name__,
            )
            state.failed_step = state.failed_step or state.current_step or "triage"
            await connection.execute(
                '''UPDATE "MaintenanceTickets" SET "Status"='Submitted', "UpdatedAt"=$2 WHERE "Id"=$1''',
                request.ticket_id, datetime.now(timezone.utc),
            )
            if not any(item.status == "Failed" for item in state.execution_history):
                now = datetime.now(timezone.utc)
                code = exc.code if isinstance(exc, AiServiceError) else "WORKFLOW_FAILED"
                state.execution_history.append(AgentStepExecution(
                    step=state.failed_step, agent_role="WorkflowOrchestrator", status="Failed",
                    started_at=now, completed_at=now, duration_ms=0,
                    summary="Workflow stopped safely before operational writes", error_code=code,
                ))
            try:
                await persist(connection, state, "WorkflowOrchestrator", f"Workflow failed safely at {state.failed_step}")
            except Exception:
                pass
            if isinstance(exc, AiServiceError):
                exc.failed_step = exc.failed_step or state.failed_step
                exc.run_id = exc.run_id or state.run_id
                raise
            raise AiServiceError(
                "The workflow encountered an internal error and stopped safely before operational changes were made.",
                code="INTERNAL_WORKFLOW_ERROR", status_code=500,
                failed_step=state.failed_step, run_id=state.run_id,
            ) from exc
