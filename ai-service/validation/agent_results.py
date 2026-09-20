from decimal import Decimal

from core.errors import AiServiceError
from schemas.contracts import (
    InventoryCandidate, InventorySearchResult, PolicyEvaluationResult,
    SchedulingQuotationRequest, SchedulingQuotationResult, TriagePlanningResult,
)


def invalid(message: str) -> AiServiceError:
    return AiServiceError(message, code="STRUCTURED_OUTPUT_INVALID", status_code=502)


def validate_triage(result: TriagePlanningResult, submitted_urgency: str | None) -> None:
    if result.issue_relevance == "Irrelevant" and result.planned_steps:
        raise invalid("Irrelevant reports must not contain repair steps.")
    if result.issue_relevance == "Maintenance" and not 1 <= len(result.planned_steps) <= 5:
        raise invalid("Maintenance reports must contain between one and five repair steps.")
    if submitted_urgency and result.urgency_level != submitted_urgency and not result.urgency_adjustment_reason:
        raise invalid("An urgency adjustment reason is required when changing submitted urgency.")


def validate_policy(result: PolicyEvaluationResult, policy: dict) -> None:
    if len(result.reasoning.split()) > 80:
        raise invalid("Policy reasoning must not exceed 80 words.")
    classification = next((item for item in policy["classifications"] if item["liability"] == result.liability), None)
    if not classification or classification["policy_clause"] != result.policy_clause:
        raise invalid("The liability or policy clause is not canonical.")
    if result.requires_deposit_deduction != (result.liability == "Tenant Responsibility (Negligence)"):
        raise invalid("The deposit-review flag does not match the liability classification.")


def validate_inventory(result: InventorySearchResult, candidates: list[InventoryCandidate]) -> None:
    trusted = {item.item_id: item for item in candidates}
    if len({item.item_id for item in result.inventory_items}) != len(result.inventory_items):
        raise invalid("The same inventory item cannot be proposed more than once.")
    total = Decimal("0")
    for item in result.inventory_items:
        candidate = trusted.get(item.item_id)
        if not candidate:
            raise invalid("An inventory ID was not allow-listed.")
        if item.quantity > candidate.available_stock:
            raise invalid("An inventory quantity is invalid.")
        if item.item_name != candidate.item_name or item.unit_cost != candidate.unit_cost:
            raise invalid("Inventory details do not match trusted data.")
        expected_subtotal = candidate.unit_cost * item.quantity
        if item.subtotal.quantize(Decimal("0.01")) != expected_subtotal.quantize(Decimal("0.01")):
            raise invalid("An inventory subtotal is invalid.")
        total += expected_subtotal
    if result.estimated_parts_cost.quantize(Decimal("0.01")) != total.quantize(Decimal("0.01")):
        raise invalid("Parts total is invalid.")


def validate_scheduling(result: SchedulingQuotationResult, request: SchedulingQuotationRequest) -> None:
    candidate = next((item for item in request.candidates if item.technician_id == result.technician_id), None)
    if not candidate:
        raise invalid("The technician ID was not allow-listed.")
    if candidate.trade_specialty != request.trade_required or result.technician_name != candidate.technician_name:
        raise invalid("Technician identity or specialty does not match trusted data.")
    if result.proposed_date != request.preferred_date:
        raise invalid("Proposed date does not match the requested candidate date.")
    if not (candidate.available_start_time <= result.proposed_start_time < result.proposed_end_time <= candidate.available_end_time):
        raise invalid("The proposed time is outside the available window.")
    seconds = (
        result.proposed_end_time.hour * 3600 + result.proposed_end_time.minute * 60
        - result.proposed_start_time.hour * 3600 - result.proposed_start_time.minute * 60
    )
    hours = Decimal(seconds) / Decimal(3600)
    labor = (hours * candidate.hourly_rate).quantize(Decimal("0.01"))
    total = (labor + request.estimated_parts_cost).quantize(Decimal("0.01"))
    if result.estimated_hours != hours or result.estimated_labor_cost != labor or result.total_estimated_cost != total:
        raise invalid("Scheduling costs are invalid.")
