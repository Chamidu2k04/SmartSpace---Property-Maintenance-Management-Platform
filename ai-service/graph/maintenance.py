from datetime import date, datetime, timedelta, timezone
from time import perf_counter
from typing import TypedDict
from uuid import uuid4

import asyncpg
from langgraph.graph import END, START, StateGraph

from agents import inventory as inventory_agent
from agents import policy as policy_agent
from agents import scheduling as scheduling_agent
from agents import triage as triage_agent
from core.errors import AiServiceError, ValidationError
from schemas.contracts import (
    AgentStepExecution, InventorySearchRequest, MaintenanceWorkflowState, PolicyEvaluationRequest,
    SchedulingQuotationRequest, TriagePlanningRequest,
)
from tools.lookups import available_technicians, search_inventory
from validation.proposal import validate_proposal


class GraphState(TypedDict):
    workflow: MaintenanceWorkflowState


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


async def persist(connection: asyncpg.Connection, state: MaintenanceWorkflowState, role: str, action: str) -> None:
    await connection.execute(
        '''INSERT INTO "AgentExecutionLogs" ("Id", "TicketId", "AgentRole", "ActionTaken", "WorkflowState", "CreatedAt")
           VALUES ($1, $2, $3, $4, $5::jsonb, $6)''',
        uuid4(), state.ticket_id, role, action, state.model_dump_json(), _utcnow(),
    )


def _execution(state: MaintenanceWorkflowState, step: str, role: str, started: datetime,
               timer: float, summary: str, status: str = "Completed", error_code: str | None = None) -> None:
    state.execution_history.append(AgentStepExecution(
        step=step, agent_role=role, status=status, started_at=started, completed_at=_utcnow(),
        duration_ms=max(0, round((perf_counter() - timer) * 1000)), summary=summary, error_code=error_code,
    ))


def _skipped(state: MaintenanceWorkflowState, step: str, role: str, summary: str) -> None:
    now = _utcnow()
    state.execution_history.append(AgentStepExecution(
        step=step, agent_role=role, status="Skipped", started_at=now, completed_at=now,
        duration_ms=0, summary=summary,
    ))


def create_graph(connection: asyncpg.Connection):
    async def triage_node(graph_state: GraphState) -> GraphState:
        state = graph_state["workflow"]
        state.current_step = "triage"
        started, timer = _utcnow(), perf_counter()
        state.triage = await triage_agent.evaluate(TriagePlanningRequest(
            ticket_id=state.ticket_id, raw_issue_description=state.raw_issue_description,
            submitted_urgency=state.submitted_urgency, preferred_date=state.preferred_date,
        ))
        summary = f"Classified trade as {state.triage.trade_required} with {state.triage.urgency_level} urgency"
        _execution(state, "triage", "TriagePlanningAgent", started, timer, summary)
        await persist(connection, state, "TriagePlanningAgent", summary)
        return {"workflow": state}

    def after_triage(graph_state: GraphState) -> str:
        return "no_action" if graph_state["workflow"].triage.issue_relevance == "Irrelevant" else "policy"

    async def no_action_node(graph_state: GraphState) -> GraphState:
        state = graph_state["workflow"]
        state.workflow_outcome = "NoActionReview"
        _skipped(state, "lease_policy", "LeasePolicyAgent", "Skipped because the report is unrelated to property maintenance")
        _skipped(state, "inventory", "InventorySearchAgent", "Skipped because no maintenance plan is required")
        _skipped(state, "scheduling", "SchedulingQuotationAgent", "Skipped because no maintenance plan is required")
        return {"workflow": state}

    async def policy_node(graph_state: GraphState) -> GraphState:
        state = graph_state["workflow"]
        state.current_step = "lease_policy"
        started, timer = _utcnow(), perf_counter()
        state.policy = await policy_agent.evaluate(PolicyEvaluationRequest(
            ticket_id=state.ticket_id, issue_description=state.raw_issue_description,
            trade_required=state.triage.trade_required,
        ))
        summary = f"Classified liability as {state.policy.liability}"
        _execution(state, "lease_policy", "LeasePolicyAgent", started, timer, summary)
        await persist(connection, state, "LeasePolicyAgent", summary)
        return {"workflow": state}

    def after_policy(graph_state: GraphState) -> str:
        return "tenant_review" if graph_state["workflow"].policy.liability == "Tenant Responsibility (Negligence)" else "inventory"

    async def tenant_review_node(graph_state: GraphState) -> GraphState:
        state = graph_state["workflow"]
        state.workflow_outcome = "TenantResponsibilityReview"
        _skipped(state, "inventory", "InventorySearchAgent", "Skipped pending manager review of tenant responsibility")
        _skipped(state, "scheduling", "SchedulingQuotationAgent", "Skipped pending manager review of tenant responsibility")
        return {"workflow": state}

    async def inventory_node(graph_state: GraphState) -> GraphState:
        state = graph_state["workflow"]
        state.current_step = "inventory"
        started, timer = _utcnow(), perf_counter()
        candidates = await search_inventory(connection, state.triage.normalized_description, state.triage.trade_required)
        state.inventory = await inventory_agent.evaluate(InventorySearchRequest(
            ticket_id=state.ticket_id, normalized_description=state.triage.normalized_description,
            trade_required=state.triage.trade_required, planned_steps=state.triage.planned_steps,
            candidates=candidates,
        ))
        summary = f"InventoryLookupTool returned {len(candidates)} allow-listed candidates; proposed {len(state.inventory.inventory_items)} items"
        _execution(state, "inventory", "InventorySearchAgent", started, timer, summary)
        await persist(connection, state, "InventorySearchAgent", summary)
        return {"workflow": state}

    async def scheduling_node(graph_state: GraphState) -> GraphState:
        state = graph_state["workflow"]
        state.current_step = "scheduling"
        started, timer = _utcnow(), perf_counter()
        proposed_date = state.preferred_date or date.today() + timedelta(days=1)
        candidates = await available_technicians(connection, state.triage.trade_required, proposed_date)
        if not candidates:
            raise AiServiceError("No compatible technician is available for the requested date.",
                                 code="WORKFLOW_FAILED", status_code=409, failed_step="scheduling", run_id=state.run_id)
        state.scheduling = await scheduling_agent.evaluate(SchedulingQuotationRequest(
            ticket_id=state.ticket_id, trade_required=state.triage.trade_required,
            urgency_level=state.triage.urgency_level, preferred_date=proposed_date,
            estimated_parts_cost=state.inventory.estimated_parts_cost, candidates=candidates,
        ))
        summary = f"TechnicianAvailabilityTool returned {len(candidates)} allow-listed candidates; proposed technician and appointment window"
        _execution(state, "scheduling", "SchedulingQuotationAgent", started, timer, summary)
        await persist(connection, state, "SchedulingQuotationAgent", summary)
        return {"workflow": state}

    async def validation_node(graph_state: GraphState) -> GraphState:
        state = graph_state["workflow"]
        state.current_step = "validation"
        started, timer = _utcnow(), perf_counter()
        state.validation_errors = await validate_proposal(connection, state)
        state.validation_passed = not state.validation_errors
        state.failed_step = None if state.validation_passed else "deterministic_validation"
        state.approval_status = "Pending" if state.validation_passed else "NotRequested"
        if state.validation_passed:
            state.final_outcome = {
                "NoActionReview": "No-action classification awaiting Property Manager confirmation",
                "TenantResponsibilityReview": "Tenant-responsibility classification awaiting Property Manager confirmation",
            }.get(state.workflow_outcome, "Validated proposal awaiting Property Manager approval")
        summary = "Validated stock, schedule, IDs, policy and monetary totals" if state.validation_passed else "Rejected a non-committable proposal"
        _execution(state, "validation", "DeterministicValidator", started, timer, summary,
                   error_code=None if state.validation_passed else "DETERMINISTIC_VALIDATION_FAILED")
        await persist(connection, state, "DeterministicValidator", summary)
        if not state.validation_passed:
            raise ValidationError(state.validation_errors, run_id=state.run_id)
        await connection.execute(
            '''UPDATE "MaintenanceTickets" SET "Status"='PendingApproval', "UpdatedAt"=$2 WHERE "Id"=$1''',
            state.ticket_id, _utcnow(),
        )
        return {"workflow": state}

    builder = StateGraph(GraphState)
    builder.add_node("triage", triage_node)
    builder.add_node("no_action", no_action_node)
    builder.add_node("policy", policy_node)
    builder.add_node("tenant_review", tenant_review_node)
    builder.add_node("inventory", inventory_node)
    builder.add_node("scheduling", scheduling_node)
    builder.add_node("validation", validation_node)
    builder.add_edge(START, "triage")
    builder.add_conditional_edges("triage", after_triage, {"no_action": "no_action", "policy": "policy"})
    builder.add_edge("no_action", "validation")
    builder.add_conditional_edges("policy", after_policy, {"tenant_review": "tenant_review", "inventory": "inventory"})
    builder.add_edge("tenant_review", "validation")
    builder.add_edge("inventory", "scheduling")
    builder.add_edge("scheduling", "validation")
    builder.add_edge("validation", END)
    return builder.compile()
