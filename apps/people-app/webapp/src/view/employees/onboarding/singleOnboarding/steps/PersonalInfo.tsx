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

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  ChangeEvent,
} from "react";
import {
  Box,
  Grid,
  TextField,
  MenuItem,
  Typography,
  useTheme,
  alpha,
  IconButton,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { useFormikContext, FieldArray, Field, getIn } from "formik";
import * as Yup from "yup";
import {
  PersonOutline,
  CakeOutlined,
  ContactPhoneOutlined,
  HomeOutlined,
  ContactEmergencyOutlined,
  AddCircleOutline,
  RemoveCircleOutline,
} from "@mui/icons-material";
import {
  EmployeeTitle,
  Countries,
  EmployeeGenders,
} from "@root/src/config/constant";
import { CreateEmployeeFormValues } from "@root/src/types/types";
import { normalizeEmail, sortAndFormatOptions } from "@utils/utils";
import {
  EMAIL_PATTERN,
  PHONE_PATTERN,
  withoutInvisibleCharacters,
} from "@utils/inputRules";
import dayjs from "dayjs";

const PERSONAL_INFO_ICONS = {
  person: <PersonOutline />,
  cake: <CakeOutlined />,
  contact: <ContactPhoneOutlined />,
  home: <HomeOutlined />,
  emergency: <ContactEmergencyOutlined />,
};

export const personalInfoValidationSchema = Yup.object().shape({
  personalInfo: Yup.object().shape({
    nicOrPassport: Yup.string()
      .required("NIC/Passport is required")
      .matches(
        /^[A-Za-z0-9\- ]{5,20}$/,
        "NIC/Passport must contain only letters, numbers, hyphens, or spaces (5-20 characters)",
      )
      .max(20, "NIC/Passport must be at most 20 characters"),
    firstName: Yup.string()
      .required("First name is required")
      .max(100, "First name must be at most 100 characters"),
    lastName: Yup.string()
      .required("Last name is required")
      .max(100, "Last name must be at most 100 characters"),
    fullName: Yup.string()
      .required("Full name is required")
      .max(255, "Full name must be at most 255 characters"),
    title: Yup.string().required("Title is required"),
    gender: Yup.string()
      .required("Gender is required")
      .oneOf(EmployeeGenders, "Invalid gender selected"),
    dob: Yup.string()
      .transform((value, originalValue) =>
        originalValue === null ? "" : value,
      )
      .required("Date of birth is required"),
    // Email and phone use the backend's own patterns, checked against the value with any
    // invisible characters removed — which is what is sent — so the form and the backend
    // never disagree about a value that looks fine.
    personalEmail: Yup.string()
      .matches(EMAIL_PATTERN, "Invalid email format")
      .max(254, "Email must be at most 254 characters")
      .transform(withoutInvisibleCharacters)
      .transform((value) => (value === "" ? null : value))
      .nullable(),
    personalPhone: Yup.string()
      .matches(PHONE_PATTERN, "Invalid personal phone number format")
      .transform(withoutInvisibleCharacters)
      .transform((value) => (value === "" ? null : value))
      .nullable(),
    residentNumber: Yup.string()
      .matches(PHONE_PATTERN, "Invalid resident number format")
      .transform(withoutInvisibleCharacters)
      .transform((value) => (value === "" ? null : value))
      .nullable(),
    addressLine1: Yup.string()
      .max(255, "Address Line 1 must be at most 255 characters")
      .transform((value) => (value === "" ? null : value))
      .nullable(),
    addressLine2: Yup.string()
      .max(255, "Address Line 2 must be at most 255 characters")
      .transform((value) => (value === "" ? null : value))
      .nullable(),
    city: Yup.string()
      .max(100, "City must be at most 100 characters")
      .transform((value) => (value === "" ? null : value))
      .nullable(),
    stateOrProvince: Yup.string()
      .max(100, "State/Province must be at most 100 characters")
      .transform((value) => (value === "" ? null : value))
      .nullable(),
    postalCode: Yup.string()
      .max(20, "Postal code must be at most 20 characters")
      .transform((value) => (value === "" ? null : value))
      .nullable(),
    country: Yup.string()
      .max(100, "Country must be at most 100 characters")
      .transform((value) => (value === "" ? null : value))
      .nullable(),
    nationality: Yup.string()
      .required("Nationality is required")
      .max(100, "Nationality must be at most 100 characters"),
    emergencyContacts: Yup.array()
      .of(
        Yup.object().shape({
          name: Yup.string()
            .required("Name is required")
            .max(255, "Name must be at most 255 characters"),
          relationship: Yup.string()
            .required("Relationship is required")
            .max(100, "Relationship must be at most 100 characters"),
          telephone: Yup.string()
            .transform((value) => (value === "" ? null : value))
            .nullable()
            .matches(
              /^[0-9+\-()\s]*[0-9][0-9+\-()\s]*$/,
              "Invalid telephone number format",
            ),
          mobile: Yup.string()
            .matches(
              /^[0-9+\-()\s]*[0-9][0-9+\-()\s]*$/,
              "Invalid mobile number format",
            )
            .required("Mobile is required"),
        }),
      )
      .max(4, "Maximum 4 emergency contacts allowed")
      .nullable(),
  }),
});

const MemoizedTextField = React.memo(
  ({
    name,
    label,
    required,
    value,
    onChange,
    onBlur,
    error,
    helperText,
    textFieldSx,
  }: any) => (
    <TextField
      fullWidth
      required={required}
      label={label}
      name={name}
      value={value ?? ""}
      onChange={onChange}
      onBlur={onBlur}
      error={error}
      helperText={helperText}
      sx={textFieldSx}
    />
  ),
);

const SectionHeader = React.memo(({ icon, title }: { icon: React.ReactNode; title: string }) => {
  const theme = useTheme();
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 40,
          height: 40,
          borderRadius: 2,
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.secondary.contrastText,
            0.2,
          )}, ${alpha(theme.palette.secondary.contrastText, 0.1)})`,
          color: theme.palette.secondary.contrastText,
        }}
      >
        {icon}
      </Box>
      <Typography variant="h6" fontWeight={600}>
        {title}
      </Typography>
    </Box>
  );
});

export default function PersonalInfoStep() {
  const theme = useTheme();
  const { values, handleChange, handleBlur, touched, errors, setFieldValue } =
    useFormikContext<CreateEmployeeFormValues>();
  const valuesRef = useRef(values);
  valuesRef.current = values;
  const isFullNameManuallyEdited = useRef<boolean>(false);

  useEffect(() => {
    const derived =
      `${values.personalInfo.firstName ?? ""} ${values.personalInfo.lastName ?? ""}`.trim();
    isFullNameManuallyEdited.current =
      (values.personalInfo.fullName ?? "").trim() !== derived &&
      (values.personalInfo.fullName ?? "").trim() !== "";
  }, [
    values.personalInfo.firstName,
    values.personalInfo.lastName,
    values.personalInfo.fullName,
  ]);

  const handleFirstNameChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const newFirst = e.target.value;
      handleChange(e);
      if (!isFullNameManuallyEdited.current) {
        setFieldValue(
          "personalInfo.fullName",
          `${newFirst} ${valuesRef.current.personalInfo.lastName ?? ""}`.trim(),
        );
      }
    },
    [handleChange, setFieldValue],
  );

  const handleLastNameChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const newLast = e.target.value;
      handleChange(e);
      if (!isFullNameManuallyEdited.current) {
        setFieldValue(
          "personalInfo.fullName",
          `${valuesRef.current.personalInfo.firstName ?? ""} ${newLast}`.trim(),
        );
      }
    },
    [handleChange, setFieldValue],
  );

  const handleFullNameChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const newFullName = e.target.value;
      const derived =
        `${valuesRef.current.personalInfo.firstName ?? ""} ${valuesRef.current.personalInfo.lastName ?? ""}`.trim();
      isFullNameManuallyEdited.current =
        newFullName.trim() !== derived && newFullName.trim() !== "";
      handleChange(e);
    },
    [handleChange],
  );

  const textFieldSx = useMemo(
    () => ({
      "& .MuiOutlinedInput-root": {
        "&:hover fieldset": {
          borderColor: alpha(theme.palette.secondary.contrastText, 0.5),
        },
        "&.Mui-focused fieldset": {
          borderColor: theme.palette.secondary.contrastText,
        },
      },
      "& .MuiInputLabel-root.Mui-focused": {
        color: theme.palette.secondary.contrastText,
      },
    }),
    [theme],
  );

  const renderField = useCallback(
    (
      field: keyof CreateEmployeeFormValues["personalInfo"],
      label: string,
      required = false,
    ) => (
      <MemoizedTextField
        name={`personalInfo.${field}`}
        label={label}
        required={required}
        value={values.personalInfo[field] ?? ""}
        onChange={handleChange}
        onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
          handleBlur(e);
          // Email is stored lowercase so the same address is never recorded in two
          // different casings. Normalising on blur leaves typing untouched.
          if (field === "personalEmail") {
            const normalized = normalizeEmail(e.target.value ?? "");
            if (normalized !== (values.personalInfo[field] ?? "")) {
              setFieldValue(`personalInfo.${field}`, normalized);
            }
          }
        }}
        error={Boolean(
          touched.personalInfo?.[field] && errors.personalInfo?.[field],
        )}
        helperText={
          touched.personalInfo?.[field] && errors.personalInfo?.[field]
        }
        textFieldSx={textFieldSx}
      />
    ),
    [values, errors, touched, handleChange, handleBlur, setFieldValue, textFieldSx],
  );

  const nameFields = useMemo(
    () => [
      { field: "firstName", label: "First Name", sm: 3, md: 2, required: true },
      { field: "lastName", label: "Last Name", sm: 3, md: 2, required: true },
      {
        field: "nicOrPassport",
        label: "NIC/Passport",
        sm: 2,
        md: 3,
        required: true,
      },
    ],
    [],
  );

  const contactFields = useMemo(
    () => [
      { field: "personalEmail", label: "Personal Email" },
      { field: "personalPhone", label: "Personal Phone" },
      { field: "residentNumber", label: "Resident Number" },
    ],
    [],
  );

  return (
    <Box sx={{ width: "100%", px: 0 }}>
      <Box sx={{ mt: 1 }}>
        <SectionHeader icon={PERSONAL_INFO_ICONS.person} title="Identity" />
        <Grid container spacing={3}>
          <Grid item xs={12} sm={2} md={1}>
            <TextField
              select
              fullWidth
              required
              label="Title"
              name="personalInfo.title"
              value={values.personalInfo.title}
              onChange={handleChange}
              onBlur={handleBlur}
              error={Boolean(
                touched.personalInfo?.title && errors.personalInfo?.title,
              )}
              helperText={
                touched.personalInfo?.title && errors.personalInfo?.title
              }
              sx={textFieldSx}
            >
              {EmployeeTitle.map((title) => (
                <MenuItem key={title} value={title}>
                  {title}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {nameFields.map(({ field, label, sm, md, required }) => (
            <Grid item xs={12} sm={sm} md={md} key={field}>
              {field === "firstName" ? (
                <MemoizedTextField
                  name="personalInfo.firstName"
                  label="First Name"
                  required
                  value={values.personalInfo.firstName ?? ""}
                  onChange={handleFirstNameChange}
                  onBlur={handleBlur}
                  error={Boolean(
                    touched.personalInfo?.firstName &&
                    errors.personalInfo?.firstName,
                  )}
                  helperText={
                    touched.personalInfo?.firstName &&
                    errors.personalInfo?.firstName
                  }
                  textFieldSx={textFieldSx}
                />
              ) : field === "lastName" ? (
                <MemoizedTextField
                  name="personalInfo.lastName"
                  label="Last Name"
                  required
                  value={values.personalInfo.lastName ?? ""}
                  onChange={handleLastNameChange}
                  onBlur={handleBlur}
                  error={Boolean(
                    touched.personalInfo?.lastName &&
                    errors.personalInfo?.lastName,
                  )}
                  helperText={
                    touched.personalInfo?.lastName &&
                    errors.personalInfo?.lastName
                  }
                  textFieldSx={textFieldSx}
                />
              ) : (
                renderField(
                  field as keyof CreateEmployeeFormValues["personalInfo"],
                  label,
                  required,
                )
              )}
            </Grid>
          ))}

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              required
              label="Full Name"
              name="personalInfo.fullName"
              value={values.personalInfo.fullName ?? ""}
              onChange={handleFullNameChange}
              onBlur={handleBlur}
              error={Boolean(
                touched.personalInfo?.fullName && errors.personalInfo?.fullName,
              )}
              helperText={
                touched.personalInfo?.fullName && errors.personalInfo?.fullName
              }
              sx={textFieldSx}
            />
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ mt: 5 }}>
        <SectionHeader
          icon={PERSONAL_INFO_ICONS.cake}
          title="Birth & Nationality"
        />
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <DatePicker
              label="Date of Birth"
              value={
                values.personalInfo.dob ? dayjs(values.personalInfo.dob) : null
              }
              onChange={(val) =>
                setFieldValue(
                  "personalInfo.dob",
                  val ? val.format("YYYY-MM-DD") : null,
                )
              }
              format="YYYY-MM-DD"
              slotProps={{
                textField: {
                  fullWidth: true,
                  sx: textFieldSx,
                  required: true,
                  error: Boolean(
                    touched.personalInfo?.dob && errors.personalInfo?.dob,
                  ),
                  helperText:
                    touched.personalInfo?.dob && errors.personalInfo?.dob,
                },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              select
              fullWidth
              required
              label="Gender"
              name="personalInfo.gender"
              value={values.personalInfo.gender}
              onChange={handleChange}
              onBlur={handleBlur}
              error={Boolean(
                touched.personalInfo?.gender && errors.personalInfo?.gender,
              )}
              helperText={
                touched.personalInfo?.gender && errors.personalInfo?.gender
              }
              sx={textFieldSx}
            >
              {EmployeeGenders.map((gender) => (
                <MenuItem key={gender} value={gender}>
                  {gender}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            {renderField("nationality", "Nationality", true)}
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ mt: 5 }}>
        <SectionHeader icon={PERSONAL_INFO_ICONS.contact} title="Contact" />
        <Grid container spacing={3}>
          {contactFields.map(({ field, label }) => (
            <Grid item xs={12} sm={6} md={4} key={field}>
              {renderField(
                field as keyof CreateEmployeeFormValues["personalInfo"],
                label,
              )}
            </Grid>
          ))}
        </Grid>
      </Box>

      <Box sx={{ mt: 5 }}>
        <SectionHeader icon={PERSONAL_INFO_ICONS.home} title="Address" />
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            {renderField("addressLine1", "Address Line 1")}
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            {renderField("addressLine2", "Address Line 2")}
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            {renderField("city", "City")}
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            {renderField("stateOrProvince", "State/Province")}
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            {renderField("postalCode", "Postal Code")}
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              select
              fullWidth
              label="Country"
              name="personalInfo.country"
              value={values.personalInfo.country || ""}
              onChange={handleChange}
              onBlur={handleBlur}
              error={Boolean(
                touched.personalInfo?.country && errors.personalInfo?.country,
              )}
              helperText={
                touched.personalInfo?.country && errors.personalInfo?.country
              }
              sx={textFieldSx}
            >
              {sortAndFormatOptions(Countries, (c) => c).map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Box>
      <Box sx={{ mt: 5 }}>
        <SectionHeader
          icon={PERSONAL_INFO_ICONS.emergency}
          title="Emergency Contacts"
        />
        <FieldArray name="personalInfo.emergencyContacts">
          {({ push, remove }) => (
            <>
              {values.personalInfo.emergencyContacts?.length > 0 &&
                values.personalInfo.emergencyContacts.map((_, index) => (
                  <Box
                    key={index}
                    sx={{
                      mb: 3,
                      p: 3,
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      background: alpha(theme.palette.background.paper, 0.5),
                    }}
                  >
                    <Grid container spacing={3}>
                      {["name", "relationship", "telephone", "mobile"].map(
                        (field) => {
                          const fieldName = `personalInfo.emergencyContacts.${index}.${field}`;
                          const fieldError = getIn(errors, fieldName);
                          const fieldTouched = getIn(touched, fieldName);
                          return (
                            <Grid item xs={12} sm={6} md={3} key={field}>
                              <Field
                                as={TextField}
                                fullWidth
                                required={field !== "telephone"}
                                name={fieldName}
                                label={
                                  field.charAt(0).toUpperCase() + field.slice(1)
                                }
                                sx={textFieldSx}
                                error={fieldTouched && Boolean(fieldError)}
                                helperText={fieldTouched && fieldError}
                              />
                            </Grid>
                          );
                        },
                      )}
                    </Grid>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        mt: 2,
                      }}
                    >
                      <IconButton onClick={() => remove(index)} color="error">
                        <RemoveCircleOutline />
                      </IconButton>
                    </Box>
                  </Box>
                ))}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-start",
                  mt: values.personalInfo.emergencyContacts?.length > 0 ? 0 : 2,
                  ml: 0,
                }}
              >
                <IconButton
                  onClick={() =>
                    push({
                      name: "",
                      relationship: "",
                      telephone: "",
                      mobile: "",
                    })
                  }
                  disabled={
                    (values.personalInfo.emergencyContacts?.length ?? 0) >= 4
                  }
                  sx={{
                    color: theme.palette.secondary.contrastText,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    px: 3,
                    py: 1.5,
                    borderRadius: 2,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      backgroundColor: alpha(
                        theme.palette.secondary.contrastText,
                        0.1,
                      ),
                    },
                  }}
                >
                  <AddCircleOutline />
                  <Typography fontWeight={500}>
                    Add Emergency Contact
                  </Typography>
                </IconButton>
              </Box>
              {touched.personalInfo?.emergencyContacts &&
                typeof errors.personalInfo?.emergencyContacts === "string" && (
                  <Typography
                    color="error"
                    variant="body2"
                    sx={{ mt: 1, ml: 2 }}
                  >
                    {errors.personalInfo?.emergencyContacts}
                  </Typography>
                )}
            </>
          )}
        </FieldArray>
      </Box>
    </Box>
  );
}
