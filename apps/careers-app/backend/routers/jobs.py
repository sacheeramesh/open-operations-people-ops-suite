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
from fastapi import APIRouter, Depends, HTTPException

from auth import get_current_user
from config import Settings, get_settings
from vacancy_client import _HEADERS, get_vacancy_token

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("")
async def list_jobs(
    _user: dict = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    token = await get_vacancy_token(settings)
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{settings.vacancy_service_base_url}/vacancies/basic-info",
                headers={"Authorization": f"Bearer {token}", **_HEADERS},
            )
            resp.raise_for_status()
            return resp.json()
    except httpx.HTTPStatusError as e:
        logger.error("Vacancy service error on GET /vacancies/basic-info: %s — %s", e.response.status_code, e.response.text)
        raise HTTPException(status_code=502, detail="Failed to fetch jobs from upstream service")
    except httpx.RequestError as e:
        logger.error("Network error on GET /vacancies/basic-info: %s", e)
        raise HTTPException(status_code=504, detail="Upstream service unreachable")


@router.get("/org-structure")
async def get_org_structure(
    _user: dict = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    token = await get_vacancy_token(settings)
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{settings.vacancy_service_base_url}/org-structure",
                headers={"Authorization": f"Bearer {token}", **_HEADERS},
            )
            resp.raise_for_status()
            return resp.json()
    except httpx.HTTPStatusError as e:
        logger.error("Vacancy service error on GET /org-structure: %s — %s", e.response.status_code, e.response.text)
        raise HTTPException(status_code=502, detail="Failed to fetch org structure from upstream service")
    except httpx.RequestError as e:
        logger.error("Network error on GET /org-structure: %s", e)
        raise HTTPException(status_code=504, detail="Upstream service unreachable")


@router.get("/{job_id}")
async def get_job(
    job_id: str,
    _user: dict = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    token = await get_vacancy_token(settings)
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{settings.vacancy_service_base_url}/vacancies/{job_id}",
                headers={"Authorization": f"Bearer {token}", **_HEADERS},
            )
            if resp.status_code == 404:
                raise HTTPException(status_code=404, detail="Job not found")
            resp.raise_for_status()
            return resp.json()
    except HTTPException:
        raise
    except httpx.HTTPStatusError as e:
        logger.error("Vacancy service error on GET /vacancies/%s: %s — %s", job_id, e.response.status_code, e.response.text)
        raise HTTPException(status_code=502, detail="Failed to fetch job from upstream service")
    except httpx.RequestError as e:
        logger.error("Network error on GET /vacancies/%s: %s", job_id, e)
        raise HTTPException(status_code=504, detail="Upstream service unreachable")
