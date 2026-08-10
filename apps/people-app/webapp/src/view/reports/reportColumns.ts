// Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com).
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

/** A single exportable column definition for the employee CSV report. */
export interface ColumnDef {
  /** Canonical key sent to the backend — must match EMPLOYEE_CSV_COLUMNS / RESIGNATION_CSV_COLUMNS in utils.bal */
  key: string;
  /** Human-readable label shown in the column selector dialog. */
  label: string;
  /** Display group — aligned to the Onboard page section names. */
  group: string;
}

/** 26 columns available for all employee report types. Groups mirror the Onboard page sections. */
export const EMPLOYEE_COLUMNS: ColumnDef[] = [
  // Identity — mirrors "Identity" section of Onboard JobInfo
  { key: "employeeId",            label: "Employee Id",             group: "Identity" },
  { key: "firstName",             label: "First Name",              group: "Identity" },
  { key: "lastName",              label: "Last Name",               group: "Identity" },
  { key: "gender",                label: "Gender",                  group: "Identity" },
  { key: "workEmail",             label: "Work Email",              group: "Identity" },
  { key: "epfNumber",             label: "EPF Number",              group: "Identity" },
  // Job & Career — mirrors "Job & Team" section of Onboard JobInfo
  { key: "company",               label: "Company",                 group: "Job & Career" },
  { key: "location",              label: "Location",                group: "Job & Career" },
  { key: "employmentType",        label: "Employment Type",         group: "Job & Career" },
  { key: "jobRole",               label: "Job Role",                group: "Job & Career" },
  { key: "externalDesignation",   label: "External Designation",    group: "Job & Career" },
  { key: "jobBand",               label: "Job Band",                group: "Job & Career" },
  { key: "employeeStatus",        label: "Employee Status",         group: "Job & Career" },
  { key: "office",                label: "Office",                  group: "Job & Career" },
  // Organisation — mirrors org hierarchy fields in Onboard JobInfo
  { key: "businessUnit",          label: "Business Unit",           group: "Organisation" },
  { key: "team",                  label: "Team",                    group: "Organisation" },
  { key: "subTeam",               label: "Sub Team",                group: "Organisation" },
  { key: "unit",                  label: "Unit",                    group: "Organisation" },
  { key: "house",                 label: "House",                   group: "Organisation" },
  // Dates & Service — mirrors date fields in Onboard JobInfo
  { key: "startDate",             label: "Start Date",              group: "Dates & Service" },
  { key: "continuousServiceDate", label: "Continuous Service Date", group: "Dates & Service" },
  { key: "lengthOfService",       label: "Length Of Service",       group: "Dates & Service" },
  { key: "probationEndDate",      label: "Probation End Date",      group: "Dates & Service" },
  { key: "agreementEndDate",      label: "Agreement End Date",      group: "Dates & Service" },
  // Management — mirrors management fields in Onboard JobInfo
  { key: "reportsTo",             label: "Reports To",              group: "Management" },
  { key: "leadEmail",             label: "Lead Email",              group: "Management" },
  { key: "additionalManager",     label: "Additional Manager",      group: "Management" },
];

/** 4 extra columns available only on the Resignations report. */
export const RESIGNATION_EXTRA_COLUMNS: ColumnDef[] = [
  { key: "resignationDate",       label: "Resignation Date",        group: "Resignation" },
  { key: "finalDayInOffice",      label: "Final Day in Office",     group: "Resignation" },
  { key: "finalDayOfEmployment",  label: "Final Day of Employment", group: "Resignation" },
  { key: "resignationReason",     label: "Resignation Reason",      group: "Resignation" },
];

/** Returns the full ordered column list for a given report type. */
export function getColumnsForStatus(isResignation: boolean): ColumnDef[] {
  return isResignation
    ? [...EMPLOYEE_COLUMNS, ...RESIGNATION_EXTRA_COLUMNS]
    : EMPLOYEE_COLUMNS;
}

/** Returns all canonical keys in default order — used as the "all selected" initial state. */
export function getAllKeys(isResignation: boolean): string[] {
  return getColumnsForStatus(isResignation).map((c) => c.key);
}
