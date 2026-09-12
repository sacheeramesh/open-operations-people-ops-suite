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

import { lazy } from "react";

const me = lazy(() => import("@view/me"));
const employeeOnboarding = lazy(() => import("@view/employees/onboarding/singleOnboarding/employeeOnboarding"));
const bulkOnboarding = lazy(() => import("@view/employees/onboarding/bulkOnboarding/BulkOnboardingView"));
const employeesList = lazy(() => import("@view/employees/employeesView/EmployeesView"));
const help = lazy(() => import("@view/help/help"));
const employeeDetails = lazy(() => import("@view/employees/employeeDetail/employeeDetail"));
const myTeamView = lazy(() => import("@view/employees/myTeam/MyTeamView"));
const activeEmployeesReport = lazy(() => import("@view/reports/ActiveEmployeesReportView"));
const resignationReport = lazy(() => import("@view/reports/ResignationReportView"));
const qrCodesReport = lazy(() => import("@view/reports/QrCodesReport"));
const masterDataView = lazy(() => import("@view/masterData/MasterDataView"));
const careerFunctionView = lazy(() => import("@view/masterData/careerFunction/CareerFunctionView"));

export const View = {
  me,
  employeeOnboarding,
  bulkOnboarding,
  employeesList,
  myTeamView,
  employeeDetails,
  activeEmployeesReport,
  resignationReport,
  qrCodesReport,
  masterDataView,
  careerFunctionView,
  help,
};
