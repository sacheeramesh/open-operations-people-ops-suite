# Copyright (c) 2025 WSO2 LLC. (https://www.wso2.com).
#
# WSO2 LLC. licenses this file to you under the Apache License,
# Version 2.0 (the "License"); you may not use this file except
# in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.

import logging

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwk, jwt
from jose.utils import base64url_decode

from config import Settings, get_settings

logger = logging.getLogger(__name__)
security = HTTPBearer()

_jwks_cache: dict | None = None


async def _get_jwks(settings: Settings) -> dict:
    global _jwks_cache
    if _jwks_cache is None:
        async with httpx.AsyncClient() as client:
            resp = await client.get(settings.asgardeo_jwks_url)
            resp.raise_for_status()
            _jwks_cache = resp.json()
    return _jwks_cache


def _get_key_for_token(token: str, jwks: dict):
    """Select the JWK matching the token's kid header."""
    headers = jwt.get_unverified_header(token)
    kid = headers.get("kid")
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            return jwk.construct(key)
    # Fallback: use the first key if kid not matched
    keys = jwks.get("keys", [])
    if keys:
        return jwk.construct(keys[0])
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No matching key found")


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    settings: Settings = Depends(get_settings),
) -> dict:
    token = credentials.credentials
    try:
        jwks = await _get_jwks(settings)
        key = _get_key_for_token(token, jwks)
        payload = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            options={"verify_aud": False},
        )
        sub: str | None = payload.get("sub")
        if not sub:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return {"sub": sub}
    except HTTPException:
        raise
    except JWTError as e:
        logger.warning("JWT validation failed (%s) — falling back to introspection", e)

    # Fallback: token introspection (handles opaque tokens)
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                settings.asgardeo_introspect_url,
                data={"token": token},
                auth=(settings.asgardeo_client_id, settings.asgardeo_client_secret),
            )
            resp.raise_for_status()
            data = resp.json()

        if not data.get("active"):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inactive")
        sub = data.get("sub", "")
        if not sub:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return {"sub": sub}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Introspection failed: %s", e)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
