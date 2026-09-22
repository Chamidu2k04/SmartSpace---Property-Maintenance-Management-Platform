from types import SimpleNamespace

import pytest
from langchain_google_genai.chat_models import GoogleModelNotFoundError, GoogleRateLimitError

from agents import base
from core.errors import AiServiceError
from schemas.contracts import TriagePlanningResult


class FailingModel:
    def __init__(self, error):
        self.error = error

    def bind(self, **_):
        return self

    def __or__(self, _):
        return self

    async def ainvoke(self, _):
        raise self.error


def settings():
    return SimpleNamespace(
        ai_max_output_tokens=250,
        ai_max_retries=2,
        ai_request_timeout_seconds=30,
        agent_credentials=lambda _: ("test-key", "retired-model"),
    )


@pytest.mark.asyncio
async def test_retired_model_is_reported_as_configuration_error(monkeypatch):
    monkeypatch.setattr(base, "get_settings", settings)
    monkeypatch.setattr(
        base, "ChatGoogleGenerativeAI",
        lambda **_: FailingModel(GoogleModelNotFoundError("model was not found")),
    )

    with pytest.raises(AiServiceError) as caught:
        await base.structured_completion("INVENTORY", TriagePlanningResult, "system", "payload")

    assert caught.value.code == "AI_MODEL_UNAVAILABLE"
    assert caught.value.status_code == 503
    assert "invalid structured result" not in str(caught.value).lower()


@pytest.mark.asyncio
async def test_quota_error_is_reported_as_retryable_rate_limit(monkeypatch):
    monkeypatch.setattr(base, "get_settings", settings)
    monkeypatch.setattr(
        base, "ChatGoogleGenerativeAI",
        lambda **_: FailingModel(GoogleRateLimitError("quota exceeded")),
    )

    with pytest.raises(AiServiceError) as caught:
        await base.structured_completion("TRIAGE", TriagePlanningResult, "system", "payload")

    assert caught.value.code == "AI_PROVIDER_RATE_LIMITED"
    assert caught.value.status_code == 429
    assert caught.value.retryable is True
