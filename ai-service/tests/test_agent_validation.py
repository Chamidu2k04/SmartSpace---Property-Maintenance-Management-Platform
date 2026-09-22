from datetime import date, time, timezone
from decimal import Decimal
from uuid import uuid4

import pytest

from core.errors import AiServiceError
from schemas.contracts import (
    InventoryCandidate, InventorySearchResult, ProposedInventoryItem,
    PolicyEvaluationResult, SchedulingQuotationRequest, SchedulingQuotationResult, TechnicianCandidate,
    TriagePlanningResult,
)
from validation.agent_results import validate_inventory, validate_policy, validate_scheduling, validate_triage


def test_triage_requires_reason_when_ai_changes_submitted_urgency():
    result = TriagePlanningResult(
        normalized_description="Leaking tap", urgency_level="Medium", trade_required="Plumber",
        triage_summary="Tap is leaking", planned_steps=["Inspect tap"], confidence_score=Decimal("0.9"),
        issue_relevance="Maintenance", relevance_reason="A plumbing repair is required.",
    )
    with pytest.raises(AiServiceError, match="urgency adjustment reason"):
        validate_triage(result, "High")


def test_inventory_rejects_fabricated_id():
    candidate = InventoryCandidate(item_id=uuid4(), item_name="Tap Washer", category="Plumbing",
                                   available_stock=1, unit_cost=Decimal("500"))
    result = InventorySearchResult(inventory_items=[ProposedInventoryItem(
        item_id=uuid4(), item_name="Tap Washer", quantity=1,
        unit_cost=Decimal("500"), subtotal=Decimal("500"))],
        estimated_parts_cost=Decimal("500"), confidence_score=Decimal("0.9"))
    with pytest.raises(AiServiceError, match="allow-listed"):
        validate_inventory(result, [candidate])


def test_policy_accepts_canonical_landlord_classification():
    policy = {"classifications": [{
        "liability": "Landlord Responsibility (Wear & Tear)",
        "policy_clause": "Standard Maintenance Policy: Normal Wear",
    }]}
    result = PolicyEvaluationResult(
        liability="Landlord Responsibility (Wear & Tear)",
        confidence_score=Decimal("0.9"),
        policy_clause="Standard Maintenance Policy: Normal Wear",
        reasoning="The installed fixture failed through ordinary use.",
        requires_deposit_deduction=False,
    )

    validate_policy(result, policy)


def test_policy_rejects_noncanonical_clause():
    policy = {"classifications": [{
        "liability": "Landlord Responsibility (Wear & Tear)",
        "policy_clause": "Standard Maintenance Policy: Normal Wear",
    }]}
    result = PolicyEvaluationResult(
        liability="Landlord Responsibility (Wear & Tear)",
        confidence_score=Decimal("0.9"),
        policy_clause="An invented lease clause",
        reasoning="The fixture failed.",
        requires_deposit_deduction=False,
    )

    with pytest.raises(AiServiceError, match="canonical"):
        validate_policy(result, policy)


def test_scheduling_recomputes_trusted_total():
    technician = TechnicianCandidate(
        technician_id=uuid4(), technician_name="Nimal", trade_specialty="Plumber",
        hourly_rate=Decimal("900"), available_start_time=time(9), available_end_time=time(11))
    request = SchedulingQuotationRequest(
        ticket_id=uuid4(), trade_required="Plumber", urgency_level="High", preferred_date=date(2026, 9, 21),
        estimated_parts_cost=Decimal("500"), candidates=[technician])
    result = SchedulingQuotationResult(
        technician_id=technician.technician_id, technician_name="Nimal", proposed_date=request.preferred_date,
        proposed_start_time=time(9), proposed_end_time=time(11), estimated_hours=Decimal("2"),
        estimated_labor_cost=Decimal("1800"), total_estimated_cost=Decimal("2300"), confidence_score=Decimal("0.9"))
    validate_scheduling(result, request)


def test_scheduling_rejects_fabricated_total():
    technician = TechnicianCandidate(
        technician_id=uuid4(), technician_name="Nimal", trade_specialty="Plumber",
        hourly_rate=Decimal("900"), available_start_time=time(9), available_end_time=time(11))
    request = SchedulingQuotationRequest(
        ticket_id=uuid4(), trade_required="Plumber", urgency_level="High", preferred_date=date(2026, 9, 21),
        estimated_parts_cost=Decimal("500"), candidates=[technician])
    result = SchedulingQuotationResult(
        technician_id=technician.technician_id, technician_name="Nimal", proposed_date=request.preferred_date,
        proposed_start_time=time(9), proposed_end_time=time(11), estimated_hours=Decimal("2"),
        estimated_labor_cost=Decimal("1800"), total_estimated_cost=Decimal("9999"), confidence_score=Decimal("0.9"))
    with pytest.raises(AiServiceError, match="costs"):
        validate_scheduling(result, request)


def test_scheduling_normalizes_gemini_timezone_marker_to_local_time():
    technician = TechnicianCandidate(
        technician_id=uuid4(), technician_name="Nimal", trade_specialty="Plumber",
        hourly_rate=Decimal("900"), available_start_time=time(9), available_end_time=time(11))
    request = SchedulingQuotationRequest(
        ticket_id=uuid4(), trade_required="Plumber", urgency_level="Medium", preferred_date=date(2026, 9, 22),
        estimated_parts_cost=Decimal("0"), candidates=[technician])
    result = SchedulingQuotationResult(
        technician_id=technician.technician_id, technician_name="Nimal", proposed_date=request.preferred_date,
        proposed_start_time=time(9, tzinfo=timezone.utc), proposed_end_time=time(11, tzinfo=timezone.utc),
        estimated_hours=Decimal("2"), estimated_labor_cost=Decimal("1800"),
        total_estimated_cost=Decimal("1800"), confidence_score=Decimal("0.9"))

    assert result.proposed_start_time.tzinfo is None
    assert result.proposed_end_time.tzinfo is None
    validate_scheduling(result, request)
