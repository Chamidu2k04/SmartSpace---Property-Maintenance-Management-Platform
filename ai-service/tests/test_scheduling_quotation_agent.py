import pytest
from typing import Dict, Any

class SchedulingQuotationAgentState:
    """
    State schema representation for the LangGraph Scheduling & Quotation Agent.
    """
    def __init__(self, ticket_id: str, issue_description: str):
        self.ticket_id = ticket_id
        self.issue_description = issue_description
        self.proposal: Dict[str, Any] = {}
        self.next_node: str = "INIT"
        self.is_human_approved: bool = False

class SchedulingQuotationAgent:
    """
    Agent implementation double for LangGraph-backed scheduling and quotation proposal synthesis.
    Demonstrates compiled dictionary proposal creation and human-in-the-loop pause behavior.
    """
    def compile_proposal_node(self, state: SchedulingQuotationAgentState) -> SchedulingQuotationAgentState:
        # Simulate AI recommendation engine compiling proposed slot and costs
        state.proposal = {
            "technician_id": "TECH-8042",
            "slot_time": "2026-10-05T10:00:00Z",
            "labor_cost": 150.00,
            "parts_cost": 45.00,
            "requires_human_approval": True
        }
        
        # Enforce Human-in-the-Loop boundary: pause at approval node before final commit
        if state.proposal.get("requires_human_approval", False):
            state.next_node = "PAUSE_HUMAN_APPROVAL"
        else:
            state.next_node = "FINALIZE_BOOKING"
            
        return state

    def approve_and_finalize(self, state: SchedulingQuotationAgentState) -> SchedulingQuotationAgentState:
        if state.next_node != "PAUSE_HUMAN_APPROVAL":
            raise ValueError("Agent must be in PAUSE_HUMAN_APPROVAL state prior to finalization.")
        state.is_human_approved = True
        state.next_node = "FINALIZE_BOOKING"
        return state

# =========================================================================
# PYTEST SUITE FOR LANGGRAPH AGENTIC SUBSYSTEM
# =========================================================================

# =========================================================================
# TEST CASE 1: Proposal Dictionary Compilation & Schema Validation
# =========================================================================
def test_agent_compiles_proposal_with_required_schema():
    """
    WHAT: Validates that the agent node compiles a proposal dictionary containing all required schema keys:
          technician_id, slot_time, labor_cost, parts_cost, and requires_human_approval=True.
    WHY: AI Agent architecture rule - LLM/LangGraph proposals must emit strictly typed dictionary outputs matching API schemas.
    VIVA TIP: Explain to the examiner that schema assertions guarantee key presence (e.g. technician_id, labor_cost) and type safety before forwarding to backend APIs.
    """
    # ARRANGE: Initialize agent state with maintenance ticket context
    agent = SchedulingQuotationAgent()
    state = SchedulingQuotationAgentState(
        ticket_id="TICK-9901",
        issue_description="Leaking kitchen sink pipe requiring joint replacement"
    )

    # ACT: Run compile proposal agent node
    updated_state = agent.compile_proposal_node(state)
    proposal = updated_state.proposal

    # ASSERT: Verify all expected schema keys exist and hold valid values
    required_keys = {"technician_id", "slot_time", "labor_cost", "parts_cost", "requires_human_approval"}
    assert required_keys.issubset(proposal.keys()), f"Missing keys in proposal dictionary: {required_keys - proposal.keys()}"
    
    assert isinstance(proposal["technician_id"], str)
    assert isinstance(proposal["slot_time"], str)
    assert proposal["labor_cost"] > 0
    assert proposal["parts_cost"] >= 0
    assert proposal["requires_human_approval"] is True

# =========================================================================
# TEST CASE 2: Human-In-The-Loop Pause State Verification
# =========================================================================
def test_agent_pauses_at_human_in_the_loop_approval():
    """
    WHAT: Asserts that when requires_human_approval is True, the agent graph pauses at 'PAUSE_HUMAN_APPROVAL' state.
    WHY: Safety & governance requirement - AI agent proposals must never auto-execute financial charges without human verification.
    VIVA TIP: Defend that LangGraph conditional edges intercept proposals, placing execution into PAUSE_HUMAN_APPROVAL until human manager intervention occurs.
    """
    # ARRANGE: Initialize state and agent
    agent = SchedulingQuotationAgent()
    state = SchedulingQuotationAgentState(
        ticket_id="TICK-9902",
        issue_description="Circuit breaker tripping on main board"
    )

    # ACT: Execute proposal generation
    updated_state = agent.compile_proposal_node(state)

    # ASSERT 1: Verify execution state is paused awaiting human approval
    assert updated_state.next_node == "PAUSE_HUMAN_APPROVAL"
    assert updated_state.is_human_approved is False

    # ACT 2: Simulate human manager approving proposal
    final_state = agent.approve_and_finalize(updated_state)

    # ASSERT 2: Verify state updates to FINALIZE_BOOKING after human input
    assert final_state.is_human_approved is True
    assert final_state.next_node == "FINALIZE_BOOKING"
