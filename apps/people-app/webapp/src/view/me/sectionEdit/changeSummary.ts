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

import { UpdateEmployeeJobInfoPayload } from "@slices/employeeSlice/employee";
import { OrganizationState } from "@slices/organizationSlice/organization";

/** A single field's before/after, ready to render in the confirmation dialog. */
export interface ChangeRow {
  label: string;
  from: string;
  to: string;
}

/** Human-readable labels for the payload keys an admin can change. */
const FIELD_LABELS: Partial<Record<keyof UpdateEmployeeJobInfoPayload, string>> =
  {
    epf: "EPF",
    workEmail: "Work Email",
    workLocation: "Work Location",
    startDate: "Start Date",
    secondaryJobTitle: "Secondary Job Title",
    jobRole: "Job Role",
    externalDesignation: "External Designation",
    managerEmail: "Lead",
    additionalManagerEmails: "Additional Leads",
    probationEndDate: "Probation End Date",
    agreementEndDate: "Agreement End Date",
    employmentTypeId: "Employment Type",
    designationId: "Designation",
    companyId: "Company",
    officeId: "Office",
    teamId: "Team",
    subTeamId: "Sub Team",
    businessUnitId: "Business Unit",
    unitId: "Unit",
    houseId: "House",
    employeeStatus: "Employee Status",
    finalDayInOffice: "Last Day in Office",
    finalDayOfEmployment: "Final Day of Employment",
    resignationReason: "Resignation Reason",
  };

/** Shown in place of an empty value, matching the read-only view's dash. */
const EMPTY = "—";

/**
 * Renders a payload value as display text, resolving the id-carrying fields against
 * the loaded org data so the dialog shows "Choreo" rather than "42".
 *
 * An id whose name is not in the store falls back to the raw id — better an opaque
 * number than a silently blank row implying the field was cleared.
 */
const displayValue = (
  field: keyof UpdateEmployeeJobInfoPayload,
  value: unknown,
  org: Pick<
    OrganizationState,
    | "businessUnits"
    | "teams"
    | "subTeams"
    | "units"
    | "designations"
    | "companies"
    | "offices"
    | "employmentTypes"
    | "houses"
  >,
): string => {
  if (value === null || value === undefined || value === "") return EMPTY;

  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : EMPTY;
  }

  const byId = (
    list: { id: number }[],
    nameOf: (item: never) => string,
  ): string => {
    const match = list.find((item) => item.id === value);
    return match ? nameOf(match as never) : String(value);
  };

  switch (field) {
    case "businessUnitId":
      return byId(org.businessUnits, (b: { name: string }) => b.name);
    case "teamId":
      return byId(org.teams, (t: { name: string }) => t.name);
    case "subTeamId":
      return byId(org.subTeams, (s: { name: string }) => s.name);
    case "unitId":
      // The cascade writes a negative sentinel to mean "explicitly no unit".
      return typeof value === "number" && value < 0
        ? EMPTY
        : byId(org.units, (u: { name: string }) => u.name);
    case "designationId":
      return byId(
        org.designations,
        (d: { designation: string }) => d.designation,
      );
    case "companyId":
      return byId(org.companies, (c: { name: string }) => c.name);
    case "officeId":
      return typeof value === "number" && value < 0
        ? EMPTY
        : byId(org.offices, (o: { name: string }) => o.name);
    case "employmentTypeId":
      return byId(org.employmentTypes, (e: { name: string }) => e.name);
    case "houseId":
      return byId(org.houses, (h: { name: string }) => h.name);
    default:
      return String(value);
  }
};

/**
 * Turns the PATCH payload into the rows shown in the update confirmation dialog.
 *
 * Only fields actually being written appear, so the dialog is a faithful preview of
 * the request rather than a re-derived guess at what changed. A field whose before and
 * after read identically is dropped — an id that changed but resolves to the same name
 * would otherwise show "Choreo → Choreo".
 */
export const buildChangeSummary = (
  payload: Partial<UpdateEmployeeJobInfoPayload>,
  before: UpdateEmployeeJobInfoPayload,
  org: Parameters<typeof displayValue>[2],
): ChangeRow[] =>
  (Object.keys(payload) as (keyof UpdateEmployeeJobInfoPayload)[])
    .map((field) => ({
      label: FIELD_LABELS[field] ?? field,
      from: displayValue(field, before[field], org),
      to: displayValue(field, payload[field], org),
    }))
    .filter((row) => row.from !== row.to);
