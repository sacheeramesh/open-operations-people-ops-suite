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

import {
  Autocomplete,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { getIn, useFormikContext } from "formik";
import { useMemo } from "react";

import { CreateEmployeeFormValues, EmployeeStatus } from "@/types/types";
import { ResignationReasons } from "@config/constant";
import { UNIT_CLEAR_SENTINEL } from "@slices/careerFunctionSlice/careerFunction";
import { useAppSelector } from "@slices/store";

import { canonicalizeReason } from "@view/employees/onboarding/singleOnboarding/steps/resignationReason.utils";
import { useEmploymentRules } from "@view/me/sectionEdit/useEmploymentRules";
import { useOrgCascade } from "@view/me/sectionEdit/useOrgCascade";

/** A labelled cell matching the read-only grid's proportions. */
const Cell = ({ children }: { children: React.ReactNode }) => (
  <Grid item xs={12} sm={6} md={3}>
    {children}
  </Grid>
);

/**
 * The editable form fields for the profile's General Information section.
 *
 * Mirrors the onboarding wizard's Job Info step: the same dependent dropdowns, the
 * same employment-type rules, and the same validation schema, so an admin editing
 * here is held to exactly the rules they would be in the wizard.
 */
const GeneralInfoFields = ({ isSaving }: { isSaving: boolean }) => {
  const { values, errors, touched, handleChange, handleBlur, setFieldValue } =
    useFormikContext<CreateEmployeeFormValues>();

  const {
    businessUnits,
    teams,
    subTeams,
    units,
    careerFunctions,
    designations,
    companies,
    offices,
    houses,
  } = useAppSelector((state) => state.organization);
  const { employeesBasicInfo } = useAppSelector((s) => s.employee);

  const {
    handleBusinessUnitChange,
    handleTeamChange,
    handleSubTeamChange,
    handleCareerFunctionChange,
    handleCompanyChange,
  } = useOrgCascade();

  const {
    showAgreementEndDate,
    selectableEmploymentTypes,
    handleEmploymentTypeChange,
  } = useEmploymentRules();

  const leadOptions = useMemo(
    () => employeesBasicInfo.map((e) => e.workEmail).filter(Boolean),
    [employeesBasicInfo],
  );

  // Work locations come from the selected company's offices, so an admin cannot pick a
  // location the company does not operate in.
  const workLocationOptions = useMemo(() => {
    const all = offices.flatMap((o) => o.workingLocations ?? []);
    return Array.from(new Set(all));
  }, [offices]);

  const isLeaver =
    values.employeeStatus === EmployeeStatus.MarkedLeaver ||
    values.employeeStatus === EmployeeStatus.Left;

  const err = (field: string) =>
    getIn(touched, field) && Boolean(getIn(errors, field));
  const errText = (field: string) =>
    getIn(touched, field) && getIn(errors, field)
      ? String(getIn(errors, field))
      : undefined;

  const text = (field: keyof CreateEmployeeFormValues, label: string) => (
    <TextField
      fullWidth
      size="small"
      label={label}
      name={field}
      value={(values[field] as string) ?? ""}
      onChange={handleChange}
      onBlur={handleBlur}
      disabled={isSaving}
      error={err(field)}
      helperText={errText(field)}
    />
  );

  const select = (
    field: keyof CreateEmployeeFormValues,
    label: string,
    options: { id: number; label: string }[],
    onPick: (id: number) => void,
    opts?: { disabled?: boolean; includeNone?: boolean },
  ) => (
    <TextField
      select
      fullWidth
      size="small"
      label={label}
      value={(values[field] as number) > 0 ? (values[field] as number) : ""}
      onBlur={handleBlur}
      name={field}
      disabled={isSaving || opts?.disabled}
      error={err(field)}
      helperText={errText(field)}
      onChange={(e) =>
        onPick(e.target.value === "" ? 0 : Number(e.target.value))
      }
    >
      {opts?.includeNone && (
        <MenuItem value="">
          <em>None</em>
        </MenuItem>
      )}
      {options.map((o) => (
        <MenuItem key={o.id} value={o.id}>
          {o.label}
        </MenuItem>
      ))}
    </TextField>
  );

  const date = (
    field: keyof CreateEmployeeFormValues,
    label: string,
    disabled?: boolean,
  ) => (
    <DatePicker
      label={label}
      format="YYYY-MM-DD"
      value={values[field] ? dayjs(values[field] as string) : null}
      disabled={isSaving || disabled}
      onChange={(v: dayjs.Dayjs | null) =>
        setFieldValue(field, v ? v.format("YYYY-MM-DD") : null)
      }
      slotProps={{
        textField: {
          size: "small",
          fullWidth: true,
          error: err(field),
          helperText: errText(field),
        },
      }}
    />
  );

  return (
    <Grid container rowSpacing={2} columnSpacing={3}>
      <Cell>{text("workEmail", "Work Email")}</Cell>
      <Cell>{text("epf", "EPF")}</Cell>
      <Cell>
        {select(
          "employmentTypeId",
          "Employment Type",
          selectableEmploymentTypes.map((t) => ({ id: t.id, label: t.name })),
          handleEmploymentTypeChange,
        )}
      </Cell>
      <Cell>{date("startDate", "Start Date")}</Cell>

      <Cell>
        {select(
          "companyId",
          "Company",
          companies.map((c) => ({ id: c.id, label: c.name })),
          handleCompanyChange,
        )}
      </Cell>
      <Cell>
        {select(
          "officeId",
          "Office",
          offices.map((o) => ({ id: o.id, label: o.name })),
          (id) => setFieldValue("officeId", id),
          { disabled: !values.companyId, includeNone: true },
        )}
      </Cell>
      <Cell>
        <Autocomplete
          options={workLocationOptions}
          value={values.workLocation || null}
          disabled={isSaving || !values.companyId}
          onChange={(_, v) => setFieldValue("workLocation", v ?? "")}
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              label="Work Location"
              error={err("workLocation")}
              helperText={errText("workLocation")}
            />
          )}
        />
      </Cell>
      <Cell>
        {select(
          "houseId",
          "House",
          houses.map((h) => ({ id: h.id, label: h.name })),
          (id) => setFieldValue("houseId", id),
          { includeNone: true },
        )}
      </Cell>

      <Cell>
        {select(
          "businessUnitId",
          "Business Unit",
          businessUnits.map((b) => ({ id: b.id, label: b.name })),
          handleBusinessUnitChange,
        )}
      </Cell>
      <Cell>
        {select(
          "teamId",
          "Team",
          teams.map((t) => ({ id: t.id, label: t.name })),
          handleTeamChange,
          { disabled: !values.businessUnitId },
        )}
      </Cell>
      <Cell>
        {select(
          "subTeamId",
          "Sub Team",
          subTeams.map((s) => ({ id: s.id, label: s.name })),
          handleSubTeamChange,
          { disabled: !values.teamId, includeNone: true },
        )}
      </Cell>
      <Cell>
        {select(
          "unitId",
          "Unit",
          units.map((u) => ({ id: u.id, label: u.name })),
          (id) => setFieldValue("unitId", id || UNIT_CLEAR_SENTINEL),
          { disabled: !values.subTeamId, includeNone: true },
        )}
      </Cell>

      <Cell>
        {select(
          "careerFunctionId",
          "Career Function",
          careerFunctions.map((c) => ({ id: c.id, label: c.careerFunction })),
          handleCareerFunctionChange,
        )}
      </Cell>
      <Cell>
        {select(
          "designationId",
          "Designation",
          designations.map((d) => ({ id: d.id, label: d.designation })),
          (id) => setFieldValue("designationId", id),
          { disabled: !values.careerFunctionId },
        )}
      </Cell>
      <Cell>{text("secondaryJobTitle", "Secondary Job Title")}</Cell>
      <Cell>{text("jobRole", "Job Role")}</Cell>

      <Cell>{text("externalDesignation", "External Designation")}</Cell>
      <Cell>{date("probationEndDate", "Probation End Date")}</Cell>
      {showAgreementEndDate && (
        <Cell>{date("agreementEndDate", "Agreement End Date")}</Cell>
      )}

      <Cell>
        <Autocomplete
          options={leadOptions}
          value={values.managerEmail || null}
          disabled={isSaving}
          onChange={(_, v) => setFieldValue("managerEmail", v ?? "")}
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              label="Lead"
              error={err("managerEmail")}
              helperText={errText("managerEmail")}
            />
          )}
        />
      </Cell>
      <Grid item xs={12} sm={6} md={6}>
        <Autocomplete
          multiple
          options={leadOptions}
          value={values.additionalManagerEmail ?? []}
          disabled={isSaving}
          onChange={(_, v) => setFieldValue("additionalManagerEmail", v)}
          renderInput={(params) => (
            <TextField {...params} size="small" label="Additional Leads" />
          )}
        />
      </Grid>

      <Grid item xs={12}>
        <Typography
          color="text.secondary"
          sx={{ fontWeight: 500, mb: 1, mt: 1 }}
        >
          Employment Status
        </Typography>
        <Grid container rowSpacing={2} columnSpacing={3}>
          <Cell>
            <TextField
              select
              fullWidth
              size="small"
              label="Employee Status"
              name="employeeStatus"
              value={values.employeeStatus ?? ""}
              disabled={isSaving}
              onChange={(e) => {
                const newStatus = e.target.value;
                setFieldValue("employeeStatus", newStatus);
                // Clear the leaver details whenever the status isn't Left, and also
                // when entering Marked leaver — even switching directly from Left
                // starts a fresh leave event, so a prior event's details must not
                // carry over. Matches the onboarding wizard's behaviour.
                if (newStatus !== EmployeeStatus.Left) {
                  setFieldValue("finalDayInOffice", null);
                  setFieldValue("finalDayOfEmployment", null);
                  setFieldValue("resignationReason", null);
                }
              }}
            >
              {Object.values(EmployeeStatus).map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </TextField>
          </Cell>

          {/* Status and its leaver details are validated together and written in one
              PATCH, so the fields are revealed here rather than in the Resignation
              Details section — saving a leaver status without them would fail
              validation against fields that were not on screen. */}
          {isLeaver && (
            <>
              <Cell>{date("finalDayInOffice", "Last Day in Office")}</Cell>
              <Cell>
                {date("finalDayOfEmployment", "Final Day of Employment")}
              </Cell>
              <Grid item xs={12} sm={6} md={3}>
                <Autocomplete
                  freeSolo
                  options={ResignationReasons}
                  value={values.resignationReason ?? ""}
                  disabled={isSaving}
                  onChange={(_, v) =>
                    setFieldValue("resignationReason", canonicalizeReason(v))
                  }
                  onInputChange={(_, v) =>
                    setFieldValue("resignationReason", v || null)
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      label="Resignation Reason"
                      error={err("resignationReason")}
                      helperText={errText("resignationReason")}
                    />
                  )}
                />
              </Grid>
            </>
          )}
        </Grid>
      </Grid>
    </Grid>
  );
};

export default GeneralInfoFields;
