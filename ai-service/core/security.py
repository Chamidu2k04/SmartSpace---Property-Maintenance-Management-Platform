from typing import Annotated

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from core.config import get_settings

bearer = HTTPBearer(auto_error=True)
ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"


async def require_property_manager(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer)],
) -> dict:
    settings = get_settings()
    try:
        claims = jwt.decode(
            credentials.credentials,
            settings.jwt_secret_key,
            algorithms=["HS256"],
            issuer=settings.jwt_issuer,
            audience=settings.jwt_audience,
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired access token.") from exc
    if claims.get(ROLE_CLAIM) != "PropertyManager" and claims.get("role") != "PropertyManager":
        raise HTTPException(status_code=403, detail="Property Manager access is required.")
    return claims
