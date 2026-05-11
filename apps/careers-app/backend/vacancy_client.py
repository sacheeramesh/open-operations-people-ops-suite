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

import time

import httpx

from config import Settings

_cached_token: str | None = None
_token_expiry: float = 0.0

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    )
}


async def get_vacancy_token(settings: Settings) -> str:
    global _cached_token, _token_expiry
    if _cached_token and time.time() < _token_expiry:
        return _cached_token

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            settings.vacancy_token_url,
            data={"grant_type": "client_credentials"},
            auth=(settings.vacancy_client_id, settings.vacancy_client_secret),
        )
        resp.raise_for_status()

    data = resp.json()
    _cached_token = data["access_token"]
    _token_expiry = time.time() + max(0, data["expires_in"] - 60)
    return _cached_token
