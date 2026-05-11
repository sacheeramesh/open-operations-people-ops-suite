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

from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    vacancy_service_base_url: str
    vacancy_token_url: str
    vacancy_client_id: str
    vacancy_client_secret: str
    asgardeo_jwks_url: str
    asgardeo_introspect_url: str
    asgardeo_client_id: str
    asgardeo_client_secret: str
    allowed_origins: str = "http://localhost:3000"

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
