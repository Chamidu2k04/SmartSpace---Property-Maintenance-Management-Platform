import pytest
import uuid
from decimal import Decimal
from pydantic import ValidationError
from schemas.contracts import TriagePlanningRequest, TriagePlanningResult

# VIVA PREP: This test validates the AI Triage Agent's Pydantic schema for the input.
# It ensures that a valid TriagePlanningRequest can be successfully instantiated.
def test_triage_planning_request_valid():
    ticket_id = uuid.uuid4()
    request = TriagePlanningRequest(
        ticket_id=ticket_id,
        raw_issue_description="Water is pouring from the ceiling in the living room.",
        submitted_urgency="High"
    )
    assert request.ticket_id == ticket_id
    assert request.raw_issue_description == "Water is pouring from the ceiling in the living room."
    assert request.submitted_urgency == "High"
    assert request.preferred_date is None

# VIVA PREP: This boundary test ensures that invalid inputs (like empty descriptions)
# are caught by the Pydantic validation before even reaching the AI agent.
def test_triage_planning_request_invalid_description():
    with pytest.raises(ValidationError):
        # Description is too short (min_length=1)
        TriagePlanningRequest(
            ticket_id=uuid.uuid4(),
            raw_issue_description=""
        )

# VIVA PREP: Tests the expected output schema from the AI Triage Agent.
# Ensures that the agent's structured response adheres strictly to the contract constraints.
def test_triage_planning_result_valid():
    result = TriagePlanningResult(
        normalized_description="Major water leak from ceiling",
        urgency_level="Emergency",
        trade_required="Plumber",
        triage_summary="Severe ceiling leak requiring immediate attention.",
        planned_steps=["Turn off main water", "Inspect ceiling pipes"],
        confidence_score=Decimal("0.95"),
        issue_relevance="Maintenance",
        relevance_reason="Clear plumbing issue reported."
    )
    
    assert result.urgency_level == "Emergency"
    assert result.trade_required == "Plumber"
    assert len(result.planned_steps) == 2

# VIVA PREP: Tests custom validation rules on the output schema, such as
# ensuring the AI doesn't return blank repair steps.
def test_triage_planning_result_blank_steps_invalid():
    with pytest.raises(ValidationError) as excinfo:
        TriagePlanningResult(
            normalized_description="Fix AC",
            urgency_level="Medium",
            trade_required="Electrician",
            triage_summary="AC broken",
            planned_steps=["Check fuse", "   ", "Replace if needed"], # Blank step
            confidence_score=Decimal("0.85"),
            issue_relevance="Maintenance",
            relevance_reason="AC issue"
        )
    assert "Repair steps must not be blank" in str(excinfo.value)
