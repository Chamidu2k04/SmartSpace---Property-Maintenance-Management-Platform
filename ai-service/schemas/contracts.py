from datetime import date, datetime, time
from decimal import Decimal
from typing import Annotated, Literal
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field, WithJsonSchema, field_validator

Trade = Literal["Plumber", "Electrician", "Handyman"]
Urgency = Literal["Low", "Medium", "High", "Emergency"]
Relevance = Literal["Maintenance", "Irrelevant"]
Liability = Literal["Landlord Responsibility (Wear & Tear)", "Tenant Responsibility (Negligence)"]
Outcome = Literal["MaintenancePlan", "TenantResponsibilityReview", "NoActionReview"]
Confidence = Annotated[
    Decimal,
    Field(ge=0, le=1),
    WithJsonSchema({"type": "number", "minimum": 0, "maximum": 1}),
]
NonNegativeDecimal = Annotated[
    Decimal,
    Field(ge=0),
    WithJsonSchema({"type": "number", "minimum": 0}),
]
PositiveHours = Annotated[
    Decimal,
    Field(ge=Decimal("0.5")),
    WithJsonSchema({"type": "number", "minimum": 0.5}),
]


class Contract(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class MaintenanceWorkflowRequest(Contract):
    ticket_id: UUID
    preferred_date: date | None = None
    run_id: UUID | None = None


class TriagePlanningRequest(Contract):
    ticket_id: UUID
    raw_issue_description: str = Field(min_length=1, max_length=2000)
    submitted_urgency: Urgency | None = None
    preferred_date: date | None = None


class TriagePlanningResult(Contract):
    normalized_description: str = Field(min_length=1)
    urgency_level: Urgency
    trade_required: Trade
    triage_summary: str = Field(min_length=1, max_length=600)
    planned_steps: list[str] = Field(max_length=5)
    confidence_score: Confidence
    issue_relevance: Relevance = "Maintenance"
    relevance_reason: str = Field(default="", max_length=500)
    urgency_adjustment_reason: str | None = Field(default=None, max_length=500)

    @field_validator("planned_steps")
    @classmethod
    def non_blank_steps(cls, value: list[str]) -> list[str]:
        if any(not step.strip() for step in value):
            raise ValueError("Repair steps must not be blank.")
        return value


class PolicyEvaluationRequest(Contract):
    ticket_id: UUID
    issue_description: str = Field(min_length=1, max_length=2000)
    trade_required: Trade | None = None


class PolicyEvaluationResult(Contract):
    liability: Liability
    confidence_score: Confidence
    policy_clause: str = Field(min_length=1)
    reasoning: str = Field(min_length=1)
    requires_deposit_deduction: bool


class InventoryCandidate(Contract):
    item_id: UUID
    item_name: str
    category: str
    available_stock: int = Field(ge=1)
    unit_cost: NonNegativeDecimal


class ProposedInventoryItem(Contract):
    item_id: UUID
    item_name: str
    quantity: int = Field(ge=1)
    unit_cost: NonNegativeDecimal
    subtotal: NonNegativeDecimal


class InventorySearchRequest(Contract):
    ticket_id: UUID
    normalized_description: str
    trade_required: Trade
    planned_steps: list[str]
    candidates: list[InventoryCandidate] = Field(max_length=5)


class InventorySearchResult(Contract):
    inventory_items: list[ProposedInventoryItem] = Field(max_length=5)
    estimated_parts_cost: NonNegativeDecimal
    confidence_score: Confidence


class TechnicianCandidate(Contract):
    technician_id: UUID
    technician_name: str
    trade_specialty: Trade
    hourly_rate: NonNegativeDecimal
    available_start_time: time
    available_end_time: time


class SchedulingQuotationRequest(Contract):
    ticket_id: UUID
    trade_required: Trade
    urgency_level: Urgency
    preferred_date: date
    estimated_parts_cost: NonNegativeDecimal
    candidates: list[TechnicianCandidate] = Field(min_length=1, max_length=5)


class SchedulingQuotationResult(Contract):
    technician_id: UUID
    technician_name: str
    proposed_date: date
    proposed_start_time: time
    proposed_end_time: time
    estimated_hours: PositiveHours
    estimated_labor_cost: NonNegativeDecimal
    total_estimated_cost: NonNegativeDecimal
    confidence_score: Confidence

    @field_validator("proposed_start_time", "proposed_end_time")
    @classmethod
    def normalize_local_wall_clock_time(cls, value: time) -> time:
        # ASP.NET TimeOnly/PostgreSQL `time without time zone` values represent
        # property-local wall-clock time. Gemini may append `Z` even when copying
        # an allow-listed time; strip that accidental timezone marker so Python
        # can safely compare it with the trusted database window.
        return value.replace(tzinfo=None)


class AgentStepExecution(Contract):
    step: str
    agent_role: str
    status: Literal["Completed", "Skipped", "Failed"]
    started_at: datetime
    completed_at: datetime
    duration_ms: int = Field(ge=0)
    summary: str
    error_code: str | None = None


class MaintenanceWorkflowState(Contract):
    schema_version: str = "1.0"
    run_id: UUID = Field(default_factory=uuid4)
    ticket_id: UUID
    raw_issue_description: str
    submitted_urgency: Urgency | None = None
    preferred_date: date | None = None
    triage: TriagePlanningResult | None = None
    policy: PolicyEvaluationResult | None = None
    inventory: InventorySearchResult | None = None
    scheduling: SchedulingQuotationResult | None = None
    validation_passed: bool = False
    validation_errors: list[str] = Field(default_factory=list)
    current_step: str = "start"
    failed_step: str | None = None
    workflow_outcome: Outcome = "MaintenancePlan"
    approval_status: str = "NotRequested"
    final_outcome: str | None = None
    appointment_id: UUID | None = None
    quotation_id: UUID | None = None
    reservation_ids: list[UUID] = Field(default_factory=list)
    execution_history: list[AgentStepExecution] = Field(default_factory=list)


class MaintenanceWorkflowStatus(Contract):
    run_id: UUID
    ticket_id: UUID
    ticket_status: str
    current_step: str
    failed_step: str | None
    validation_passed: bool
    approval_status: str
    final_outcome: str | None
    execution_history: list[AgentStepExecution]


class MaintenanceApprovalResult(Contract):
    ticket_id: UUID
    run_id: UUID
    appointment_id: UUID | None
    quotation_id: UUID | None
    reservation_ids: list[UUID]
    status: str


class RejectMaintenanceProposalRequest(Contract):
    reason: str | None = Field(default=None, max_length=500)


class InventoryStandaloneRequest(Contract):
    ticket_id: UUID
    normalized_description: str
    trade_required: Trade
    planned_steps: list[str]


class SchedulingStandaloneRequest(Contract):
    ticket_id: UUID
    trade_required: Trade
    urgency_level: Urgency
    preferred_date: date | None = None
    estimated_parts_cost: NonNegativeDecimal


class AiAuditLogEntry(Contract):
    id: UUID
    ticket_id: UUID
    run_id: UUID | None = None
    agent_role: str
    action_taken: str
    created_at: datetime
    step: str | None = None
    step_status: str | None = None
    duration_ms: int | None = None
    error_code: str | None = None
    workflow_outcome: str | None = None
    validation_passed: bool | None = None
    approval_status: str | None = None
    final_outcome: str | None = None
    appointment_id: UUID | None = None
    quotation_id: UUID | None = None
    reservation_ids: list[UUID] = Field(default_factory=list)
    inventory_items: list[ProposedInventoryItem] = Field(default_factory=list)
    technician_name: str | None = None
    proposed_date: date | None = None
    proposed_start_time: time | None = None
    proposed_end_time: time | None = None
    parts_cost: Decimal | None = None
    labor_cost: Decimal | None = None
    total_cost: Decimal | None = None
