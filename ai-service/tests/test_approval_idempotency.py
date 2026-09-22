from contextlib import asynccontextmanager
from datetime import date, time
from decimal import Decimal
from uuid import uuid4

import pytest

from schemas.contracts import (
    InventorySearchResult, MaintenanceWorkflowState, PolicyEvaluationResult, ProposedInventoryItem,
    SchedulingQuotationResult, TriagePlanningResult,
)
from services import review


def proposal(ticket_id):
    item_id, technician_id = uuid4(), uuid4()
    return MaintenanceWorkflowState(
        ticket_id=ticket_id, raw_issue_description="Tap washer leaking", submitted_urgency="High",
        triage=TriagePlanningResult(normalized_description="Tap washer leaking", urgency_level="High",
            trade_required="Plumber", triage_summary="Plumbing leak", planned_steps=["Inspect tap"],
            confidence_score=Decimal("0.9"), issue_relevance="Maintenance",
            relevance_reason="A plumbing repair is required."),
        policy=PolicyEvaluationResult(liability="Landlord Responsibility (Wear & Tear)",
            confidence_score=Decimal("0.9"),
            policy_clause="Standard Maintenance Policy: Normal Wear, Structural Defects, and Installed-System Failure",
            reasoning="Normal wear", requires_deposit_deduction=False),
        inventory=InventorySearchResult(inventory_items=[ProposedInventoryItem(item_id=item_id,
            item_name="Tap Washer", quantity=1, unit_cost=Decimal("500"), subtotal=Decimal("500"))],
            estimated_parts_cost=Decimal("500"), confidence_score=Decimal("0.9")),
        scheduling=SchedulingQuotationResult(technician_id=technician_id, technician_name="Nimal",
            proposed_date=date(2026, 9, 21), proposed_start_time=time(9), proposed_end_time=time(11),
            estimated_hours=Decimal("2"), estimated_labor_cost=Decimal("1800"),
            total_estimated_cost=Decimal("2300"), confidence_score=Decimal("0.9")),
        validation_passed=True, approval_status="Pending",
    )


class AsyncScope:
    async def __aenter__(self):
        return self

    async def __aexit__(self, *_):
        return False


class FakeConnection:
    def __init__(self, state, status="PendingApproval"):
        self.state, self.status, self.executed = state, status, []
        self.appointment_id, self.quotation_id, self.reservation_id = uuid4(), uuid4(), uuid4()

    def transaction(self, **_):
        return AsyncScope()

    async def fetchval(self, query, *_):
        if '"WorkflowState"' in query:
            return self.state.model_dump_json()
        if 'SELECT EXISTS' in query:
            return False
        return None

    async def fetchrow(self, query, *_):
        if 'MaintenanceTickets' in query and 'FOR UPDATE' in query:
            return {"Status": self.status}
        if 'FROM "Appointments"' in query:
            return {"Id": self.appointment_id}
        if 'FROM "Quotations"' in query:
            return {"Id": self.quotation_id}
        if 'tenant_email' in query:
            return {"tenant_email": None, "tenant_name": "Tenant",
                    "technician_email": None, "technician_name": "Nimal"}
        return None

    async def fetch(self, query, *_):
        if 'PartsReservations' in query:
            return [{"Id": self.reservation_id}]
        return []

    async def execute(self, query, *args):
        self.executed.append((query, args))
        return "OK"


def use_connection(monkeypatch, connection):
    @asynccontextmanager
    async def scope():
        yield connection
    monkeypatch.setattr(review.database, "connection", scope)


@pytest.mark.asyncio
async def test_approval_creates_operational_records_once(monkeypatch):
    ticket_id = uuid4()
    state = proposal(ticket_id)
    connection = FakeConnection(state)
    use_connection(monkeypatch, connection)

    async def valid(*_):
        return []
    monkeypatch.setattr(review, "validate_proposal", valid)

    result = await review.approve(ticket_id)

    statements = "\n".join(query for query, _ in connection.executed)
    assert result.status == "Scheduled"
    assert statements.count('INSERT INTO "Appointments"') == 1
    assert statements.count('INSERT INTO "Quotations"') == 1
    assert statements.count('INSERT INTO "PartsReservations"') == 1
    assert '"Status"=\'Scheduled\'' in statements


@pytest.mark.asyncio
async def test_repeated_approval_returns_existing_records_without_writes(monkeypatch):
    ticket_id = uuid4()
    state = proposal(ticket_id)
    connection = FakeConnection(state, status="Scheduled")
    use_connection(monkeypatch, connection)

    result = await review.approve(ticket_id)

    assert result.status == "Scheduled"
    assert result.appointment_id == connection.appointment_id
    assert result.quotation_id == connection.quotation_id
    assert result.reservation_ids == [connection.reservation_id]
    assert connection.executed == []
