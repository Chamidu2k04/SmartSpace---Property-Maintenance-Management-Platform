from functools import lru_cache
from urllib.parse import quote

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str
    jwt_secret_key: str = "SmartSpaceSuperSecretKeyForJWTTokenSigning2026!"
    jwt_issuer: str = "SmartSpaceAPI"
    jwt_audience: str = "SmartSpaceApps"

    triage_agent_api_key: str = ""
    triage_agent_model: str = "gemini-3.6-flash"
    policy_agent_api_key: str = ""
    policy_agent_model: str = "gemini-3.6-flash"
    inventory_agent_api_key: str = ""
    inventory_agent_model: str = "gemini-3.6-flash"
    scheduling_agent_api_key: str = ""
    scheduling_agent_model: str = "gemini-3.6-flash"

    ai_max_output_tokens: int = Field(default=250, ge=1, le=250)
    ai_max_retries: int = Field(default=2, ge=0, le=2)
    ai_request_timeout_seconds: int = Field(default=30, ge=5, le=120)
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_enable_tls: bool = True
    smtp_sender_email: str = ""
    smtp_sender_name: str = "SmartSpace Property Management"

    @field_validator("database_url", mode="before")
    @classmethod
    def accept_aspnet_connection_string(cls, value: str) -> str:
        value = value.strip()
        if value.startswith(("postgres://", "postgresql://")):
            return value
        parts = {}
        for item in value.split(";"):
            if "=" in item:
                key, raw = item.split("=", 1)
                parts[key.strip().lower()] = raw.strip()
        host = parts.get("host")
        if not host:
            raise ValueError("DATABASE_URL must be a PostgreSQL URL or ASP.NET/Npgsql connection string.")
        port = parts.get("port", "5432")
        database = parts.get("database", "postgres")
        username = quote(parts.get("username", "postgres"), safe="")
        password = quote(parts.get("password", ""), safe="")
        ssl_mode = parts.get("ssl mode", "require").lower().replace(" ", "-")
        return f"postgresql://{username}:{password}@{host}:{port}/{database}?ssl={ssl_mode}"

    @property
    def cors_origin_list(self) -> list[str]:
        return [value.strip() for value in self.cors_origins.split(",") if value.strip()]

    def agent_credentials(self, key: str) -> tuple[str, str]:
        api_key = getattr(self, f"{key.lower()}_agent_api_key", "").strip()
        model = getattr(self, f"{key.lower()}_agent_model", "").strip()
        if not api_key or not model:
            from core.errors import AiConfigurationError
            raise AiConfigurationError(f"Configuration for the {key} agent is incomplete.")
        return api_key, model


@lru_cache
def get_settings() -> Settings:
    return Settings()
