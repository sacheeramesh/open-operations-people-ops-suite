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

# Check permissions.
#
# + requiredRoles - Required Role list
# + userRoles - Roles list, The user has
# + return - Allow or not
public isolated function checkPermissions(string[] requiredRoles, string[] userRoles) returns boolean {
    if userRoles.length() == 0 && requiredRoles.length() > 0 {
        return false;
    }

    // Every role name is required config, but Ballerina enforces only that the key exists,
    // not that it holds a value. A role left blank in Config.toml would otherwise match a
    // blank entry in the caller's group list and grant access to everyone carrying one.
    if requiredRoles.some(role => role.trim() == "") {
        return false;
    }

    final string[] & readonly userRolesReadOnly = userRoles.cloneReadOnly();
    return requiredRoles.every(role => userRolesReadOnly.indexOf(role) !is ());
}

# Check whether the caller may read employee records beyond their own — the employee list,
# any individual profile, employment history and the manager filter.
#
# Held by ADMIN, the delegated EMPLOYEE_VIEW role, and the RESIGNATION role, which needs to
# find an employee before it can record their resignation.
#
# Grouped into one predicate because these reads are always granted together: the screens
# that use them each call several, and gating them individually is how a role ends up
# admitted on one endpoint and rejected on the next.
#
# + userRoles - Groups the caller carries
# + return - True if the caller may read employee records
public isolated function hasEmployeeReadAccess(string[] userRoles) returns boolean =>
    checkPermissions([authorizedRoles.ADMIN_ROLE], userRoles)
    || checkPermissions([authorizedRoles.EMPLOYEE_VIEW_ROLE], userRoles)
    || checkPermissions([authorizedRoles.RESIGNATION_ROLE], userRoles);
