# SmartSpace Python Agentic AI Service

This service replaces the earlier in-process C# AI implementation while preserving the
React screens, PostgreSQL records, human approval behavior, and wire contracts. ASP.NET
continues to own authentication and all non-AI features. Python validates the same JWT and
owns `/api/ai/*`.

## Architecture

The minimum acceptance workflow is a LangGraph state graph:

```text
TriagePlanningAgent
  |-- Irrelevant ---------------------------> DeterministicValidator
  `-- Maintenance -> LeasePolicyAgent
                         |-- Tenant ---------> DeterministicValidator
                         `-- Landlord -> InventorySearchAgent
                                          -> SchedulingQuotationAgent
                                          -> DeterministicValidator
                                          -> Property Manager approval
```

LangChain structured output and Pydantic define each agent contract. Agents only propose.
Allow-listed tools obtain trusted inventory and technician candidates from PostgreSQL.
Python rechecks IDs, stock, reservations, trade, conflicts, policy labels, prices, arithmetic,
and routing. Approval uses a serializable, idempotent transaction to create reservations,
an appointment, an approved quotation, the `Scheduled` transition, and an audit event.

Triage receives the urgency submitted by the tenant. It may assess a different urgency only
when it returns an explicit adjustment reason. Both values are persisted for audit.

## Setup

Python 3.11 or newer is recommended. Start ASP.NET once first so EF migrations are applied.

```powershell
cd ai-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
Copy-Item .env.example .env
```

Configure `.env`:

- `DATABASE_URL` points to the same PostgreSQL database as ASP.NET. It accepts either a
  PostgreSQL URL or the same semicolon-separated Npgsql connection string from ASP.NET.
- JWT secret, issuer, and audience exactly match ASP.NET.
- Supply four Gemini agent keys/models. The same key can be repeated for local testing.
- The output cap is 250 tokens per model call.
- SMTP is optional; blank credentials use logged development mock notifications.

Create `frontend-web/.env` from its example, then run three terminals:

```powershell
# terminal 1
cd backend/SmartSpace.API
dotnet run

# terminal 2
cd ai-service
.\.venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8000

# terminal 3
cd frontend-web
npm install
npm run dev
```

- ASP.NET Swagger: `http://localhost:5030/swagger`
- Python AI Swagger: `http://localhost:8000/docs`
- React: `http://localhost:5173`

Authorize Python Swagger with a Property Manager bearer token obtained from ASP.NET login.

## Layout

```text
agents/       four agents and LangChain Gemini adapter
graph/        LangGraph orchestration and conditional routing
schemas/      Pydantic contracts and persisted workflow state
tools/        allow-listed lookups and synthesized policy
validation/   structured-output and deterministic proposal checks
services/     workflow, audit, approval, notifications
routers/      FastAPI `/api/ai` endpoints
policies/     versioned standard maintenance policy
tests/        contract and validation tests
```

## Team ownership and handoff

Every member needs the complete `ai-service` folder because the agents share contracts,
the LangGraph workflow, authentication, database access, validation, and approval. Exclusive
ownership applies to the domain agent files below; shared files must have one coordinated
editor and be merged through review.

| Owner | Exclusive agent files | Shared sections the owner must understand/test |
|---|---|---|
| Student 1 — Property & Lease | `agents/policy.py`, `tools/policy.py`, `policies/standard-maintenance-policy.v1.json` | Policy contracts and policy validation in `schemas/contracts.py` and `validation/agent_results.py` |
| Student 2 — Maintenance Requests | `agents/triage.py` | Triage contracts/validation and, if confirmed as integration owner, `graph/maintenance.py` and `services/workflow.py` |
| Student 3 — Inventory & Suppliers | `agents/inventory.py` | Inventory contracts/validation and the inventory lookup section of `tools/lookups.py` |
| Student 4 — Scheduling & Quotations | `agents/scheduling.py` | Scheduling contracts/validation and the technician lookup section of `tools/lookups.py` |

The following are common integration files and are not owned exclusively by any agent:

- `main.py`, `requirements.txt`, `pyproject.toml`, and `.env.example`
- `agents/base.py` and everything under `core/`
- `schemas/contracts.py`, `graph/maintenance.py`, and `routers/ai.py`
- everything under `services/`
- `validation/proposal.py` and the shared parts of `validation/agent_results.py`
- the shared test files under `tests/`

Each member supplies only their own `*_AGENT_API_KEY` in their local ignored `.env`. API
keys, database credentials, JWT secrets, SMTP credentials, `.venv`, caches, and generated
files must never be committed.

## Source-control safety

Commit `.env.example`, but never commit `.env`. The repository `.gitignore` also excludes
`.venv`, `__pycache__`, `.pytest_cache`, coverage output, frontend `node_modules`/`dist`, and
.NET `bin`/`obj`. Before committing, verify `git status` does not show a real environment
file or a settings file containing local database/provider credentials.

## Lease & Policy Agent ownership

The policy agent reads only the issue, selected trade, and versioned synthesized policy.
It returns one canonical liability, the exact canonical policy clause, confidence, concise
reasoning, and a deposit-review flag. It cannot access arbitrary leases, cite invented law,
write records, charge tenants, reserve parts, or schedule technicians. A tenant-responsibility
result stops downstream planning until an authorized manager confirms the decision.

## Tests

```powershell
cd ai-service
.\.venv\Scripts\Activate.ps1
pytest -q
python -m compileall .
```

## Security and evidence

- Provider secrets never reach browsers, prompts, logs, or responses.
- Ticket content is untrusted prompt data; embedded instructions are ignored.
- Models can select only allow-listed database candidates.
- Deterministic code validates every operational value.
- Every step persists sanitized cumulative state in `AgentExecutionLogs`.
- Failures return the ticket to `Submitted` and create a safe failure log.
- Human approval is mandatory before operational database writes.
- The existing React AI Audit History page displays persisted evidence.
