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

import { Grid } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { getIn, useFormikContext } from "formik";

import { CreateEmployeeFormValues } from "@/types/types";

import ResignationReasonField from "@view/me/sectionEdit/ResignationReasonField";

/**
 * The editable fields for the profile's Resignation Details section.
 *
 * These same three fields are also reachable from General Information, but for a
 * different purpose: there they accompany the status change that creates the leaver
 * record, where validation requires them on screen. Here they exist to correct an
 * already-recorded departure without touching employment status.
 *
 * The section only renders for leavers, so no status guard is needed — an active
 * employee never sees it.
 */
const ResignationFields = ({ isSaving }: { isSaving: boolean }) => {
  const { values, errors, touched, setFieldValue, setFieldTouched } =
    useFormikContext<CreateEmployeeFormValues>();

  const err = (field: string) =>
    getIn(touched, field) && Boolean(getIn(errors, field));
  const errText = (field: string) =>
    getIn(touched, field) && getIn(errors, field)
      ? String(getIn(errors, field))
      : undefined;

  const date = (field: keyof CreateEmployeeFormValues, label: string) => (
    <DatePicker
      label={label}
      format="YYYY-MM-DD"
      value={values[field] ? dayjs(values[field] as string) : null}
      disabled={isSaving}
      onChange={(v: dayjs.Dayjs | null) => {
        setFieldTouched(field, true);
        setFieldValue(field, v ? v.format("YYYY-MM-DD") : null);
      }}
      slotProps={{
        // Clearable, as the wizard has them: a date entered by mistake has to be
        // removable, not merely overwritable.
        field: { clearable: true },
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
      <Grid item xs={12} sm={6} md={4}>
        {date("finalDayInOffice", "Last Day in Office")}
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        {date("finalDayOfEmployment", "Final Day of Employment")}
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <ResignationReasonField
          value={values.resignationReason ?? null}
          disabled={isSaving}
          error={err("resignationReason")}
          helperText={errText("resignationReason")}
          onChange={(v) => setFieldValue("resignationReason", v, true)}
          onBlur={() => setFieldTouched("resignationReason", true)}
        />
      </Grid>
    </Grid>
  );
};

export default ResignationFields;
