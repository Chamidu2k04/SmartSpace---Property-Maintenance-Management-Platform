"""
SmartSpace AI Service
=====================
FastAPI application that exposes AI-powered endpoints for:
  - Maintenance triage (classify issue severity)
  - Lease clause checking
  - Repair cost estimation

Start with: uvicorn main:app --reload
Docs at:    http://localhost:8000/docs
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="SmartSpace AI Service",
    description="Agentic AI backend for the SmartSpace Property & Maintenance Management Platform",
    version="0.1.0",
)

# ─────────────────────────────────────────────────────────────────────────────
# CORS — allow all origins during development; restrict in production
# ─────────────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────────────────────────────────────
# Health Check
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/health", tags=["System"])
async def health_check():
    """
    Returns a simple OK status.
    Used by load-balancers and CI pipelines to verify the service is running.
    """
    return {"status": "ok", "service": "SmartSpace AI Service", "version": "0.1.0"}


# ─────────────────────────────────────────────────────────────────────────────
# TODO: Register routers for each AI feature here, e.g.
#   from routers import triage, lease_check, cost_estimate
#   app.include_router(triage.router,       prefix="/ai/triage",     tags=["AI Triage"])
#   app.include_router(lease_check.router,  prefix="/ai/lease",      tags=["AI Lease"])
#   app.include_router(cost_estimate.router,prefix="/ai/cost",       tags=["AI Cost"])
# ─────────────────────────────────────────────────────────────────────────────
