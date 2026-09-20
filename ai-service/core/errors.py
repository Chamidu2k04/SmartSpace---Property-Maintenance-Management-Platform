from uuid import UUID
import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


class AiServiceError(Exception):
    def __init__(self, message: str, *, code: str = "WORKFLOW_FAILED", status_code: int = 409,
                 retryable: bool = False, failed_step: str | None = None, run_id: UUID | None = None):
        super().__init__(message)
        self.code = code
        self.status_code = status_code
        self.retryable = retryable
        self.failed_step = failed_step
        self.run_id = run_id


class AiConfigurationError(AiServiceError):
    def __init__(self, message: str):
        super().__init__(message, code="MISSING_CONFIGURATION", status_code=503)


class NotFoundError(AiServiceError):
    def __init__(self, message: str):
        super().__init__(message, code="INVALID_INPUT", status_code=404)


class ValidationError(AiServiceError):
    def __init__(self, errors: list[str], *, run_id: UUID | None = None):
        super().__init__(" ".join(errors), code="DETERMINISTIC_VALIDATION_FAILED", status_code=422,
                         failed_step="validation", run_id=run_id)
        self.errors = errors


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AiServiceError)
    async def handle_ai_error(_: Request, exc: AiServiceError) -> JSONResponse:
        return JSONResponse(status_code=exc.status_code, content={"error": {
            "code": exc.code,
            "message": str(exc),
            "retryable": exc.retryable,
            "failed_step": exc.failed_step,
            "run_id": str(exc.run_id or UUID(int=0)),
        }})

    @app.exception_handler(Exception)
    async def handle_unexpected(_: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled AI service error", exc_info=exc)
        return JSONResponse(status_code=500, content={"error": {
            "code": "INTERNAL_ERROR",
            "message": "The AI service encountered an unexpected error.",
            "retryable": False,
            "failed_step": None,
            "run_id": str(UUID(int=0)),
        }})
