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

import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import {
  Box,
  Button,
  Grid,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { FieldArray, getIn, useFormikContext } from "formik";

import { CreateEmployeeFormValues } from "@/types/types";
import {
  Countries,
  EmployeeGenders,
  EmployeeTitle,
} from "@config/constant";
import { sortAndFormatOptions } from "@utils/utils";

type PersonalInfoValues = CreateEmployeeFormValues["personalInfo"];

/** A titled group of related fields, matching General Information's clusters. */
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

const Cell = ({ children }: { children: React.ReactNode }) => (
  <Grid item xs={12} sm={6} md={3}>
    {children}
  </Grid>
);

/** An empty contact row, matching the shape the schema validates. */
const EMPTY_CONTACT = {
  name: "",
  relationship: "",
  telephone: "",
  mobile: "",
};

/**
 * The editable personal-information fields for an admin editing another employee.
 *
 * Mirrors the onboarding wizard's Personal Info step field for field, including the
 * identity fields (title, names, NIC, date of birth, gender, nationality) the wizard
 * lets an admin change, and its controlled Country list — free text here would let
 * country values drift apart from the ones the wizard writes.
 */
const PersonalInfoFields = ({ isSaving }: { isSaving: boolean }) => {
  const { values, errors, touched, handleChange, handleBlur, setFieldValue } =
    useFormikContext<CreateEmployeeFormValues>();

  const path = (field: keyof PersonalInfoValues) => `personalInfo.${field}`;

  const err = (field: string) =>
    getIn(touched, field) && Boolean(getIn(errors, field));
  const errText = (field: string) =>
    getIn(touched, field) && getIn(errors, field)
      ? String(getIn(errors, field))
      : undefined;

  const text = (
    field: keyof PersonalInfoValues,
    label: string,
    required = false,
  ) => {
    const name = path(field);
    return (
      <TextField
        fullWidth
        size="small"
        label={required ? `${label} *` : label}
        name={name}
        value={(values.personalInfo[field] as string) ?? ""}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={isSaving}
        error={err(name)}
        helperText={errText(name)}
      />
    );
  };

  const select = (
    field: keyof PersonalInfoValues,
    label: string,
    options: string[],
    required = false,
  ) => {
    const name = path(field);
    return (
      <TextField
        select
        fullWidth
        size="small"
        label={required ? `${label} *` : label}
        name={name}
        value={(values.personalInfo[field] as string) ?? ""}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={isSaving}
        error={err(name)}
        helperText={errText(name)}
      >
        {options.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </TextField>
    );
  };

  return (
    <Box>
      <Cluster title="Identity">
        <Cell>{select("title", "Title", EmployeeTitle, true)}</Cell>
        <Cell>{text("firstName", "First Name", true)}</Cell>
        <Cell>{text("lastName", "Last Name", true)}</Cell>
        <Cell>{text("nicOrPassport", "NIC/Passport", true)}</Cell>
        <Grid item xs={12} sm={6} md={6}>
          {text("fullName", "Full Name", true)}
        </Grid>
      </Cluster>

      <Cluster title="Birth & Nationality">
        <Cell>
          <DatePicker
            label="Date of Birth *"
            format="YYYY-MM-DD"
            value={
              values.personalInfo.dob ? dayjs(values.personalInfo.dob) : null
            }
            disabled={isSaving}
            onChange={(v: dayjs.Dayjs | null) =>
              setFieldValue(
                path("dob"),
                v ? v.format("YYYY-MM-DD") : null,
              )
            }
            slotProps={{
              textField: {
                size: "small",
                fullWidth: true,
                error: err(path("dob")),
                helperText: errText(path("dob")),
              },
            }}
          />
        </Cell>
        <Cell>{select("gender", "Gender", EmployeeGenders, true)}</Cell>
        <Cell>{text("nationality", "Nationality", true)}</Cell>
      </Cluster>

      <Cluster title="Contact">
        <Cell>{text("personalEmail", "Personal Email")}</Cell>
        <Cell>{text("personalPhone", "Personal Phone")}</Cell>
        <Cell>{text("residentNumber", "Resident Number")}</Cell>
      </Cluster>

      <Cluster title="Address">
        <Cell>{text("addressLine1", "Address Line 1")}</Cell>
        <Cell>{text("addressLine2", "Address Line 2")}</Cell>
        <Cell>{text("city", "City")}</Cell>
        <Cell>{text("stateOrProvince", "State/Province")}</Cell>
        <Cell>{text("postalCode", "Postal Code")}</Cell>
        <Cell>
          {/* A controlled list, as the wizard has: free text here would let country
              values drift apart from the ones onboarding writes. */}
          {select(
            "country",
            "Country",
            sortAndFormatOptions([...Countries], (c) => c),
          )}
        </Cell>
      </Cluster>

      <Cluster title="Emergency Contacts">
        <Grid item xs={12}>
          <FieldArray name="personalInfo.emergencyContacts">
            {({ push, remove }) => (
              <>
                {(values.personalInfo.emergencyContacts ?? []).map(
                  (_contact, index) => (
                    <Box
                      key={index}
                      sx={{
                        mb: 2,
                        p: 2,
                        borderRadius: 2,
                        border: 1,
                        borderColor: "divider",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          mb: 1.5,
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "text.secondary",
                          }}
                        >
                          Contact {index + 1}
                        </Typography>
                        <IconButton
                          size="small"
                          disabled={isSaving}
                          onClick={() => remove(index)}
                          aria-label={`Remove contact ${index + 1}`}
                        >
                          <RemoveCircleOutlineIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      <Grid container rowSpacing={2} columnSpacing={3}>
                        {[
                          { field: "name", label: "Name", required: true },
                          {
                            field: "relationship",
                            label: "Relationship",
                            required: true,
                          },
                          {
                            field: "telephone",
                            label: "Telephone",
                            required: false,
                          },
                          { field: "mobile", label: "Mobile", required: true },
                        ].map(({ field, label, required }) => {
                          const name = `personalInfo.emergencyContacts.${index}.${field}`;
                          return (
                            <Grid item xs={12} sm={6} md={3} key={field}>
                              <TextField
                                fullWidth
                                size="small"
                                label={required ? `${label} *` : label}
                                name={name}
                                value={getIn(values, name) ?? ""}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                disabled={isSaving}
                                error={err(name)}
                                helperText={errText(name)}
                              />
                            </Grid>
                          );
                        })}
                      </Grid>
                    </Box>
                  ),
                )}
                <Button
                  size="small"
                  startIcon={<AddCircleOutlineIcon />}
                  disabled={isSaving}
                  onClick={() => push({ ...EMPTY_CONTACT })}
                  sx={{ textTransform: "none" }}
                >
                  Add contact
                </Button>
              </>
            )}
          </FieldArray>
        </Grid>
      </Cluster>
    </Box>
  );
};

export default PersonalInfoFields;
