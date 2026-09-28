from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import get_settings
from core.database import database
from core.errors import register_exception_handlers
from routers.ai import router as ai_router
from routers.inventory_assistant import router as inventory_assistant_router


@asynccontextmanager
async def lifespan(_: FastAPI):
    await database.connect()
    yield
    await database.disconnect()


settings = get_settings()
app = FastAPI(
    title="SmartSpace Agentic AI Service",
    description="Four-agent maintenance workflow implemented with LangChain and LangGraph.",
    version="1.0.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=600,
)
register_exception_handlers(app)
app.include_router(ai_router, prefix="/api/ai", tags=["Agentic AI"])
app.include_router(inventory_assistant_router, prefix="/api/inventory-assistant", tags=["Inventory Assistant"])


@app.get("/health", tags=["System"])
async def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "SmartSpace Agentic AI Service", "version": "1.0.0"}
