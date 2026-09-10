// Copyright (c) 2025 WSO2 LLC. (https://www.wso2.com).
//
// WSO2 LLC. licenses this file to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file except
// in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License. 

# Authorization Constants.
public const JWT_ASSERTION_HEADER = "x-jwt-assertion";
public const HEADER_USER_INFO = "user-info";

# Privileges.
public const ADMIN_PRIVILEGE = 999;
public const EMPLOYEE_PRIVILEGE = 987;
public const LEAD_PRIVILEGE = 993;
public const SERVICE_DESK_PRIVILEGE = 991;

# Narrow, additive privileges for delegated access. Numbered below EMPLOYEE_PRIVILEGE (987)
# because each grants less than a general employee holds — they scope a single capability
# rather than extending the employee baseline.
#
# Granted by IAM group membership, configured in `Config.toml` (see `AppRoles`).
public const EMPLOYEE_VIEW_PRIVILEGE = 985;
public const RESIGNATION_PRIVILEGE = 983;
public const REPORT_PRIVILEGE = 981;
