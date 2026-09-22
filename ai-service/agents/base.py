import asyncio
import logging
from typing import TypeVar

import httpx
from langchain_core.exceptions import OutputParserException
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.output_parsers import PydanticOutputParser
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_google_genai.chat_models import (
    GoogleAPIError,
    GoogleAuthenticationError,
    GoogleInvalidRequestError,
    GoogleModelNotFoundError,
    GooglePermissionDeniedError,
    GoogleRateLimitError,
)
from pydantic import BaseModel, ValidationError as PydanticValidationError

from core.config import get_settings
from core.errors import AiServiceError

T = TypeVar("T", bound=BaseModel)
logger = logging.getLogger(__name__)


async def structured_completion(agent_key: str, schema: type[T], system_prompt: str, payload: str) -> T:
    settings = get_settings()
    api_key, model_name = settings.agent_credentials(agent_key)
    llm = ChatGoogleGenerativeAI(
        model=model_name,
        api_key=api_key,
        max_tokens=settings.ai_max_output_tokens,
        thinking_level="minimal",
        retries=settings.ai_max_retries,
        request_timeout=settings.ai_request_timeout_seconds,
    )
    # Use Gemini's native JSON-schema response mode. AFC is intentionally disabled:
    # these agents return typed decisions and do not execute provider-side functions.
    model = (
        llm.bind(
            response_mime_type="application/json",
            response_json_schema=schema.model_json_schema(),
            automatic_function_calling={"disable": True},
        )
        | PydanticOutputParser(pydantic_object=schema)
    )

    # request_timeout applies to each provider attempt. The previous outer timeout
    # used that same value for the entire operation, cancelling configured retries
    # before they could finish.
    operation_timeout = (
        settings.ai_request_timeout_seconds * (settings.ai_max_retries + 1)
    ) + 5
    try:
        result = await asyncio.wait_for(
            model.ainvoke([SystemMessage(content=system_prompt), HumanMessage(content=payload)]),
            timeout=operation_timeout,
        )
        return result if isinstance(result, schema) else schema.model_validate(result)
    except asyncio.TimeoutError as exc:
        raise AiServiceError("The Gemini API request timed out.", code="AI_PROVIDER_TIMEOUT",
                             status_code=503, retryable=True) from exc
    except (PydanticValidationError, OutputParserException) as exc:
        logger.warning("Gemini structured output failed Pydantic validation for %s: %s", agent_key, exc)
        raise AiServiceError("Gemini returned an invalid structured result.", code="STRUCTURED_OUTPUT_INVALID",
                             status_code=502) from exc
    except GoogleModelNotFoundError as exc:
        logger.error("Configured Gemini model is unavailable for %s: %s", agent_key, model_name)
        raise AiServiceError(
            f"The configured Gemini model '{model_name}' is unavailable. Check the agent model configuration.",
            code="AI_MODEL_UNAVAILABLE", status_code=503,
        ) from exc
    except GoogleAuthenticationError as exc:
        logger.error("Gemini rejected the API key for %s", agent_key)
        raise AiServiceError(
            f"Gemini authentication failed for the {agent_key.lower()} agent. Check its API key.",
            code="AI_PROVIDER_AUTHENTICATION_FAILED", status_code=503,
        ) from exc
    except GooglePermissionDeniedError as exc:
        logger.error("Gemini denied access for %s using model %s", agent_key, model_name)
        raise AiServiceError(
            f"The {agent_key.lower()} agent does not have permission to use Gemini model '{model_name}'.",
            code="AI_PROVIDER_PERMISSION_DENIED", status_code=503,
        ) from exc
    except GoogleRateLimitError as exc:
        logger.warning("Gemini rate limit reached for %s", agent_key)
        raise AiServiceError(
            "The Gemini API quota or rate limit was reached. Please retry shortly.",
            code="AI_PROVIDER_RATE_LIMITED", status_code=429, retryable=True,
        ) from exc
    except GoogleInvalidRequestError as exc:
        logger.error("Gemini rejected the %s agent request: %s", agent_key, str(exc)[:500])
        raise AiServiceError(
            "Gemini rejected the agent request configuration.",
            code="AI_PROVIDER_INVALID_REQUEST", status_code=502,
        ) from exc
    except GoogleAPIError as exc:
        logger.warning("Gemini service error for %s: %s", agent_key, str(exc)[:500])
        raise AiServiceError(
            "The Gemini API is temporarily unavailable.",
            code="AI_PROVIDER_UNAVAILABLE", status_code=503, retryable=True,
        ) from exc
    except (httpx.ConnectError, httpx.NetworkError) as exc:
        logger.warning("Gemini network connection failed for %s: %s", agent_key, type(exc).__name__)
        raise AiServiceError("The Gemini API could not be reached. Check the internet connection and proxy/firewall settings.",
                             code="AI_PROVIDER_UNAVAILABLE", status_code=503, retryable=True) from exc
    except AiServiceError:
        raise
    except Exception as exc:
        message = str(exc).lower()
        retryable = any(value in message for value in (
            "429", "quota", "timeout", "503", "unavailable", "connection", "connecterror", "network",
            "name resolution", "temporarily", "resource_exhausted",
        ))
        logger.warning("Gemini request failed for %s (%s): %s", agent_key, type(exc).__name__, str(exc)[:500])
        raise AiServiceError(
            "The Gemini API is temporarily unavailable." if retryable else "Gemini returned an invalid structured result.",
            code="AI_PROVIDER_UNAVAILABLE" if retryable else "STRUCTURED_OUTPUT_INVALID",
            status_code=503 if retryable else 502,
            retryable=retryable,
        ) from exc
