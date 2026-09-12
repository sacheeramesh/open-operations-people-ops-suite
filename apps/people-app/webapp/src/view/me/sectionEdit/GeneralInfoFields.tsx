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
  Box,
  Checkbox,
  FormControlLabel,
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
import {
  fetchContinuousServiceRecord,
  resetContinuousService,
} from "@slices/employeeSlice/employee";
import { useAppDispatch } from "@slices/store";
import { UNIT_CLEAR_SENTINEL } from "@slices/careerFunctionSlice/careerFunction";
import { useAppSelector } from "@slices/store";
import { sortAndFormatOptions } from "@utils/utils";

import ResignationReasonField from "@view/me/sectionEdit/ResignationReasonField";
import { useEmploymentRules } from "@view/me/sectionEdit/useEmploymentRules";
import { useOrgCascade } from "@view/me/sectionEdit/useOrgCascade";

/** A labelled cell matching the read-only grid's proportions. */
const Cell = ({ children }: { children: React.ReactNode }) => (
  <Grid item xs={12} sm={6} md={3}>
    {children}
  </Grid>
);

/**
 * A titled group of related fields.
 *
 * Twenty bordered inputs in one grid read as a single wall with no indication of where
 * one kind of information ends and the next begins. Naming the groups lets an admin
 * jump to the part they came to change instead of scanning every field.
 */
const Cluster = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <Box sx={{ "& + &": { mt: 3.5 } }}>
    <Typography
      sx={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "text.secondary",
        mb: 1.25,
        pb: 0.75,
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      {title}
    </Typography>
    <Grid container rowSpacing={2} columnSpacing={3}>
      {children}
    </Grid>
  </Box>
);

/**
 * The editable form fields for the profile's General Information section.
 *
 * Mirrors the onboarding wizard's Job Info step: the same dependent dropdowns, the
 * same employment-type rules, and the same validation schema, so an admin editing
 * here is held to exactly the rules they would be in the wizard.
 */
const GeneralInfoFields = ({ isSaving }: { isSaving: boolean }) => {
  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    setFieldValue,
    setFieldTouched,
  } = useFormikContext<CreateEmployeeFormValues>();

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
    state: organizationState,
  } = useAppSelector((state) => state.organization);
  const { employeesBasicInfo, continuousServiceRecord } = useAppSelector(
    (s) => s.employee,
  );
  const dispatch = useAppDispatch();

  const {
    handleBusinessUnitChange,
    handleTeamChange,
    handleSubTeamChange,
    handleCareerFunctionChange,
    handleCompanyChange,
  } = useOrgCascade();

  const {
    isFixedTerm,
    isInternship,
    internshipDurationMonths,
    handleInternshipDurationChange,
    showAgreementEndDate,
    selectableEmploymentTypes,
    handleEmploymentTypeChange,
  } = useEmploymentRules();

  const leadOptions = useMemo(
    () =>
      sortAndFormatOptions(
        employeesBasicInfo.map((e) => e.workEmail).filter(Boolean),
        (email) => email,
      ),
    [employeesBasicInfo],
  );

  // Job band is not editable in its own right — it is carried by the designation. The
  // options are annotated with it and ordered by it (unbanded last), matching the
  // onboarding wizard, so an admin can see which band a designation implies before
  // choosing it rather than discovering it after the save.
  const designationOptions = useMemo(
    () =>
      [...designations]
        .sort((a, b) => {
          if (a.jobBand == null && b.jobBand == null) return 0;
          if (a.jobBand == null) return 1;
          if (b.jobBand == null) return -1;
          return a.jobBand - b.jobBand;
        })
        .map((d) => ({
          id: d.id,
          label: `${d.designation}${d.jobBand != null ? ` (JB ${d.jobBand})` : ""}`,
        })),
    [designations],
  );

  // Work locations come from the selected company's offices, so an admin cannot pick a
  // location the company does not operate in.
  const workLocationOptions = useMemo(() => {
    const all = offices.flatMap((o) => o.workingLocations ?? []);
    return sortAndFormatOptions(Array.from(new Set(all)), (loc) => loc);
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
      {opts?.includeNone && options.length > 0 && (
        <MenuItem value="">
          <em>None</em>
        </MenuItem>
      )}
      {options.length > 0 ? (
        options.map((o) => (
          <MenuItem key={o.id} value={o.id}>
            {o.label}
          </MenuItem>
        ))
      ) : (
        // An empty list is otherwise indistinguishable from a list that has not
        // loaded, leaving the admin to guess whether to wait or to pick a parent.
        <MenuItem disabled>
          {organizationState === "loading"
            ? `Loading ${label.toLowerCase()}...`
            : `No ${label.toLowerCase()} found`}
        </MenuItem>
      )}
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
    <Box>
      <Cluster title="Employment">
        <Cell>
          <TextField
            fullWidth
            size="small"
            label="Work Email"
            name="workEmail"
            value={values.workEmail ?? ""}
            onChange={handleChange}
            disabled={isSaving}
            error={err("workEmail")}
            helperText={errText("workEmail")}
            onBlur={(e) => {
              handleBlur(e);
              // Prior employment under the same address is what makes an employee a
              // relocation, so the lookup is keyed on the email as the wizard does.
              const email = e.target.value?.trim();
              if (email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
                dispatch(fetchContinuousServiceRecord(email));
              } else {
                dispatch(resetContinuousService());
              }
            }}
          />
        </Cell>
        <Cell>{text("epf", "EPF")}</Cell>
        <Cell>
          {select(
            "employmentTypeId",
            "Employment Type",
            sortAndFormatOptions(selectableEmploymentTypes, (t) => t.name).map(
              (t) => ({
                id: t.id,
                label: t.name,
              }),
            ),
            handleEmploymentTypeChange,
          )}
        </Cell>
        <Cell>{date("startDate", "Start Date")}</Cell>
        {/* Fixed-term contracts carry a manually assigned employee ID, and the shared
            validation schema requires it for them. It is shown read-only, as the
            wizard does in edit mode: without it on screen a fixed-term employee could
            fail validation against a field the admin cannot see. */}
        {isFixedTerm && (
          <Cell>
            <TextField
              fullWidth
              size="small"
              label="Employee ID"
              name="employeeId"
              value={values.employeeId ?? ""}
              InputProps={{ readOnly: true }}
              error={err("employeeId")}
              helperText={errText("employeeId")}
            />
          </Cell>
        )}
        <Cell>{date("probationEndDate", "Probation End Date")}</Cell>
        {/* Prior employment found for this address means the employee may be a
            rehire/relocation, whose continuous service date carries over from the
            earlier record rather than starting at this row's start date. */}
        {continuousServiceRecord?.length > 0 && (
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  disabled={isSaving}
                  checked={Boolean(values.isRelocation)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFieldValue("isRelocation", checked);
                    setFieldValue(
                      "continuousServiceRecord",
                      checked
                        ? (continuousServiceRecord[0]?.employeeId ?? null)
                        : null,
                    );
                  }}
                />
              }
              label={
                <Typography sx={{ fontSize: 13.5 }}>
                  Relocation — carry continuous service from{" "}
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    {continuousServiceRecord[0]?.employeeId}
                  </Box>
                  {continuousServiceRecord[0]?.startDate
                    ? ` (started ${continuousServiceRecord[0].startDate})`
                    : ""}
                </Typography>
              }
            />
          </Grid>
        )}
        {isInternship && (
          <Cell>
            <TextField
              select
              fullWidth
              size="small"
              label="Internship Duration"
              value={internshipDurationMonths || ""}
              disabled={isSaving}
              helperText={
                internshipDurationMonths
                  ? "Agreement end date is calculated from the start date"
                  : undefined
              }
              onChange={(e) =>
                handleInternshipDurationChange(Number(e.target.value))
              }
            >
              {Array.from({ length: 10 }, (_, i) => i + 3).map((m) => (
                <MenuItem key={m} value={m}>
                  {m} months
                </MenuItem>
              ))}
            </TextField>
          </Cell>
        )}
        {showAgreementEndDate && (
          <Cell>{date("agreementEndDate", "Agreement End Date")}</Cell>
        )}
      </Cluster>

      <Cluster title="Location">
        <Cell>
          {select(
            "companyId",
            "Company",
            sortAndFormatOptions(companies, (c) => c.name).map((c) => ({
              id: c.id,
              label: c.name,
            })),
            handleCompanyChange,
          )}
        </Cell>
        <Cell>
          {select(
            "officeId",
            "Office",
            sortAndFormatOptions(offices, (o) => o.name).map((o) => ({
              id: o.id,
              label: o.name,
            })),
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
            sortAndFormatOptions(houses, (h) => h.name).map((h) => ({
              id: h.id,
              label: h.name,
            })),
            (id) => setFieldValue("houseId", id),
            { includeNone: true },
          )}
        </Cell>
      </Cluster>

      <Cluster title="Organisation">
        <Cell>
          {select(
            "businessUnitId",
            "Business Unit",
            sortAndFormatOptions(businessUnits, (b) => b.name).map((b) => ({
              id: b.id,
              label: b.name,
            })),
            handleBusinessUnitChange,
          )}
        </Cell>
        <Cell>
          {select(
            "teamId",
            "Team",
            sortAndFormatOptions(teams, (t) => t.name).map((t) => ({
              id: t.id,
              label: t.name,
            })),
            handleTeamChange,
            { disabled: !values.businessUnitId },
          )}
        </Cell>
        <Cell>
          {select(
            "subTeamId",
            "Sub Team",
            sortAndFormatOptions(subTeams, (s) => s.name).map((s) => ({
              id: s.id,
              label: s.name,
            })),
            handleSubTeamChange,
            { disabled: !values.teamId, includeNone: true },
          )}
        </Cell>
        <Cell>
          {select(
            "unitId",
            "Unit",
            sortAndFormatOptions(units, (u) => u.name).map((u) => ({
              id: u.id,
              label: u.name,
            })),
            (id) => setFieldValue("unitId", id || UNIT_CLEAR_SENTINEL),
            { disabled: !values.subTeamId, includeNone: true },
          )}
        </Cell>
      </Cluster>

      <Cluster title="Role">
        <Cell>
          {select(
            "careerFunctionId",
            "Career Function",
            sortAndFormatOptions(careerFunctions, (c) => c.careerFunction).map(
              (c) => ({
                id: c.id,
                label: c.careerFunction,
              }),
            ),
            handleCareerFunctionChange,
          )}
        </Cell>
        <Cell>
          {select(
            "designationId",
            "Designation",
            designationOptions,
            (id) => setFieldValue("designationId", id),
            { disabled: !values.careerFunctionId },
          )}
        </Cell>
        <Cell>{text("secondaryJobTitle", "Secondary Job Title")}</Cell>
        <Cell>{text("jobRole", "Job Role")}</Cell>

        <Cell>{text("externalDesignation", "External Designation")}</Cell>
      </Cluster>

      <Cluster title="Reporting">
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
      </Cluster>

      <Cluster title="Employment Status">
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
              <Cell>
                <ResignationReasonField
                  value={values.resignationReason ?? null}
                  disabled={isSaving}
                  error={err("resignationReason")}
                  helperText={errText("resignationReason")}
                  onChange={(v) => setFieldValue("resignationReason", v, true)}
                  onBlur={() => setFieldTouched("resignationReason", true)}
                />
              </Cell>
          </>
        )}
      </Cluster>
    </Box>
  );
};

export default GeneralInfoFields;
