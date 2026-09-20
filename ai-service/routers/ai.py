from datetime import date, timedelta
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Response, status

from agents import inventory as inventory_agent
from agents import policy as policy_agent
from agents import scheduling as scheduling_agent
from agents import triage as triage_agent
from core.database import database
from core.security import require_property_manager
from schemas.contracts import (
    AiAuditLogEntry, InventorySearchRequest, InventorySearchResult, InventoryStandaloneRequest,
    MaintenanceApprovalResult, MaintenanceWorkflowRequest, MaintenanceWorkflowState, MaintenanceWorkflowStatus,
    PolicyEvaluationRequest, PolicyEvaluationResult, RejectMaintenanceProposalRequest,
    SchedulingQuotationRequest, SchedulingQuotationResult, SchedulingStandaloneRequest,
    TriagePlanningRequest, TriagePlanningResult,
)
from services import review
from services.workflow import run_workflow
from tools.lookups import available_technicians, search_inventory

router = APIRouter(dependencies=[Depends(require_property_manager)])


@router.post("/evaluate-triage", response_model=TriagePlanningResult)
async def evaluate_triage(request: TriagePlanningRequest):
    return await triage_agent.evaluate(request)


@router.post("/evaluate-policy", response_model=PolicyEvaluationResult)
async def evaluate_policy(request: PolicyEvaluationRequest):
    return await policy_agent.evaluate(request)


@router.post("/search-inventory", response_model=InventorySearchResult)
async def search_inventory_endpoint(request: InventoryStandaloneRequest):
    async with database.connection() as connection:
        candidates = await search_inventory(connection, request.normalized_description, request.trade_required)
    return await inventory_agent.evaluate(InventorySearchRequest(
        ticket_id=request.ticket_id, normalized_description=request.normalized_description,
        trade_required=request.trade_required, planned_steps=request.planned_steps, candidates=candidates))


@router.post("/propose-schedule", response_model=SchedulingQuotationResult)
async def propose_schedule(request: SchedulingStandaloneRequest):
    requested_date = request.preferred_date or date.today() + timedelta(days=1)
    async with database.connection() as connection:
        candidates = await available_technicians(connection, request.trade_required, requested_date)
    return await scheduling_agent.evaluate(SchedulingQuotationRequest(
        ticket_id=request.ticket_id, trade_required=request.trade_required,
        urgency_level=request.urgency_level, preferred_date=requested_date,
        estimated_parts_cost=request.estimated_parts_cost, candidates=candidates))


@router.post("/workflow/plan-maintenance", response_model=MaintenanceWorkflowState)
async def plan_maintenance(request: MaintenanceWorkflowRequest):
    return await run_workflow(request)


@router.get("/tickets/{ticket_id}/proposal", response_model=MaintenanceWorkflowState)
async def get_proposal(ticket_id: UUID):
    return await review.get_latest(ticket_id)


@router.get("/tickets/{ticket_id}/runs/{run_id}/status", response_model=MaintenanceWorkflowStatus)
async def get_workflow_status(ticket_id: UUID, run_id: UUID):
    return await review.get_status(ticket_id, run_id)


@router.get("/tickets/{ticket_id}/audit-logs", response_model=list[AiAuditLogEntry])
async def get_ticket_audit_logs(ticket_id: UUID):
    return await review.audit_history(ticket_id)


@router.get("/audit-logs", response_model=list[AiAuditLogEntry])
async def get_all_audit_logs():
    return await review.audit_history()


@router.post("/tickets/{ticket_id}/approve", response_model=MaintenanceApprovalResult)
async def approve_proposal(ticket_id: UUID):
    return await review.approve(ticket_id)


@router.post("/tickets/{ticket_id}/reject", status_code=status.HTTP_204_NO_CONTENT)
async def reject_proposal(ticket_id: UUID, request: RejectMaintenanceProposalRequest):
    await review.reject(ticket_id, request.reason)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
