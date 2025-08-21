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

import React, { useCallback, useState } from "react";
import {
  Container,
  Typography,
  Button,
  Box,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Grid,
  TextField,
  Card,
  CardContent,
  IconButton,
  InputAdornment,
  MenuItem,
} from "@mui/material";
import {
  Add as AddIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  Description as DescriptionIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import { Field, FieldArray, Form, Formik } from "formik";
import * as Yup from "yup";
import LoadingButton from "@mui/lab/LoadingButton";
import { DatePicker, TimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { PhoneNumberUtil } from "google-libphonenumber";
import { useConfirmationModalContext } from "@root/src/context/DialogContext";
import { ConfirmationType } from "@root/src/types/types";
import { useAppDispatch } from "@root/src/slices/store";
import FloorRoomSelector from "@view/employee/component/floorRoomSelector";
import { time } from "console";

export interface VisitorDetail {
  idPassportNumber: string;
  fullName: string;
  contactNumber: string;
  countryCode: string;
  emailAddress: string;
  passNumber: string;
  status: "Draft" | "Completed";
}
// Validation schema for visit information
const steps = ["Visit Information", "Visitor Information"];

const AVAILABLE_FLOORS_AND_ROOMS = [
  {
    floor: "Ground Floor",
    rooms: ["Lobby", "Reception", "Cafe", "Security Office", "Main Entrance"],
  },
  {
    floor: "1st Floor",
    rooms: [
      "Meeting Room A",
      "Meeting Room B",
      "Conference Hall",
      "Common Area",
      "Pantry",
    ],
  },
  {
    floor: "2nd Floor",
    rooms: [
      "Executive Office",
      "Board Room",
      "HR Department",
      "Finance Department",
      "Break Room",
    ],
  },
  {
    floor: "3rd Floor",
    rooms: [
      "IT Department",
      "Development Team",
      "Testing Lab",
      "Server Room",
      "Storage",
    ],
  },
  {
    floor: "4th Floor",
    rooms: [
      "Marketing Department",
      "Sales Team",
      "Customer Service",
      "Training Room",
      "Library",
    ],
  },
  {
    floor: "5th Floor",
    rooms: [
      "Research Lab",
      "Innovation Center",
      "Project Room",
      "Collaboration Space",
      "Quiet Zone",
    ],
  },
];

const COUNTRY_CODES = [
  { code: "+1", country: "US/CA", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+91", country: "IN", flag: "🇮🇳" },
  { code: "+86", country: "CN", flag: "🇨🇳" },
  { code: "+49", country: "DE", flag: "🇩🇪" },
  { code: "+33", country: "FR", flag: "🇫🇷" },
  { code: "+81", country: "JP", flag: "🇯🇵" },
  { code: "+82", country: "KR", flag: "🇰🇷" },
  { code: "+61", country: "AU", flag: "🇦🇺" },
  { code: "+55", country: "BR", flag: "🇧🇷" },
  { code: "+94", country: "LK", flag: "🇱🇰" },
];
const visitValidationSchema = Yup.object().shape({
  whoTheyMeet: Yup.string().required("Who they meet is required"),
  purposeOfVisit: Yup.string().required("Purpose of visit is required"),
  accessibleFloors: Yup.array().test(
    "Accessible floors are required",
    "At least one accessible floor is required",
    (value) => {
      return Array.isArray(value) && value.length > 0;
    }
  ),
  scheduledDate: Yup.string().required("Scheduled date is required"),
  timeOfEntry: Yup.string()
    .required("Time of entry is required")
    .test("is-valid-time", "Time of entry cannot be passed", (value) => {
      if (dayjs(value).isBefore(dayjs())) {
        return false;
      }
      return true;
    }),
  timeOfDeparture: Yup.string()
    .required("Time of departure is required")
    .test(
      "is-valid-time",
      "Time of departure should be after the Time of entry",
      (value, context) => {
        const { timeOfEntry } = context.parent;
        if (dayjs(value).isBefore(dayjs(timeOfEntry))) {
          return false;
        }
        return true;
      }
    ),
});
// Validation schema for visitor information
const visitorValidationSchema = Yup.object().shape({
  visitors: Yup.array().of(
    Yup.object().shape({
      idPassportNumber: Yup.string().required("ID/Passport number is required"),
      fullName: Yup.string().required("Full name is required"),
      contactNumber: Yup.string()
        .required("Contact number is required")
        .matches(/^\+?\d{10,15}$/, "Invalid contact number"),

      emailAddress: Yup.string()
        .email("Invalid email address")
        .required("Email address is required"),
      passNumber: Yup.string().required("Pass number is required"),
    })
  ),
});

function CreateVisit() {
  const dispatch = useAppDispatch();
  const dialogContext = useConfirmationModalContext();
  const phoneUtil = PhoneNumberUtil.getInstance();
  const [activeStep, setActiveStep] = useState(0);
  const isLastStep = activeStep === steps.length - 1;
  const defaultVisitor: VisitorDetail = {
    idPassportNumber: "",
    fullName: "",
    contactNumber: "",
    countryCode: "+94",
    emailAddress: "",
    passNumber: "",
    status: "Draft",
  };
  // Handle form submission for each step
  const handleNext = useCallback(
    (values: any) => {
      console.log("Submitting values:", values);
      if (isLastStep) {
        dialogContext.showConfirmation(
          "Confirm Change Request",
          "Are you sure you want to make this bank account change?",
          ConfirmationType.accept,
          async () => {
            console.log("Confirmed values:", values);
            // await dispatch(createBankAccount(values)).then(() => {
            //   onClose();
            // });
          },
          "Yes",
          "Cancel"
        );
      } else {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
      }
    },
    [isLastStep, dispatch]
  );

  // Handle going back to the previous step
  const handleBack = useCallback(() => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  }, []);

  // Render the content for each step
  const renderStepContent = (step: number, formik: any) => {
    switch (step) {
      case 0:
        return (
          <>
            {/* Basic Information */}
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}
              >
                <BusinessIcon color="primary" />
                Visit Information
              </Typography>
              <Grid container spacing={3}>
                {/* Name of the company */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="companyName"
                    label="Name of the Company"
                    value={formik.values.companyName}
                    onChange={formik.handleChange}
                    variant="outlined"
                  />
                </Grid>

                {/* Whom They Meet */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="whoTheyMeet"
                    label="Whom They Meet"
                    value={formik.values.whoTheyMeet}
                    onChange={formik.handleChange}
                    error={
                      formik.touched.whoTheyMeet &&
                      Boolean(formik.errors.whoTheyMeet)
                    }
                    helperText={
                      formik.touched.whoTheyMeet && formik.errors.whoTheyMeet
                    }
                    variant="outlined"
                  />
                </Grid>

                {/* Purpose Of Visit */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="purposeOfVisit"
                    label="Purpose Of Visit / Comment"
                    value={formik.values.purposeOfVisit}
                    onChange={formik.handleChange}
                    error={
                      formik.touched.purposeOfVisit &&
                      Boolean(formik.errors.purposeOfVisit)
                    }
                    helperText={
                      formik.touched.purposeOfVisit &&
                      formik.errors.purposeOfVisit
                    }
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* Floor and Room Selection */}
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <BusinessIcon color="primary" />
                Floors and Rooms *
              </Typography>

              <FloorRoomSelector
                availableFloorsAndRooms={AVAILABLE_FLOORS_AND_ROOMS}
                selectedFloorsAndRooms={formik.values.accessibleFloors}
                onChange={(value) => {
                  formik.setFieldValue("accessibleFloors", value);
                }}
                error={
                  formik.touched.accessibleFloors &&
                  formik.errors.accessibleFloors
                }
              />
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* Schedule Information */}
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}
              >
                <ScheduleIcon color="primary" />
                Schedule Details
              </Typography>

              <Grid container spacing={3}>
                {/* Scheduled Date */}
                <Grid item xs={12} md={4}>
                  <DatePicker
                    label="Scheduled Date *"
                    name="scheduledDate"
                    value={
                      formik.values.scheduledDate
                        ? dayjs(formik.values.scheduledDate)
                        : null
                    }
                    onChange={(value) => {
                      formik.setFieldValue(
                        "scheduledDate",
                        dayjs(value).format("YYYY-MM-DD")
                      );

                      // Reset time fields when date changes
                      formik.setFieldValue("timeOfEntry", "");
                      formik.setFieldValue("timeOfDeparture", "");
                    }}
                    minDate={dayjs()}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!formik.errors.scheduledDate,
                        helperText:
                          formik.touched.scheduledDate &&
                          formik.errors.scheduledDate,
                      },
                    }}
                  />
                </Grid>

                {/* Time Of Entry */}
                <Grid item xs={12} md={4}>
                  <TimePicker
                    label="Time Of Entry *"
                    name="timeOfEntry"
                    value={formik.values.timeOfEntry}
                    onChange={(value) => {
                      formik.setFieldValue(
                        "timeOfEntry",
                        formik.values.scheduledDate +
                          "T" +
                          dayjs(value).format(
                            "HH:mm:ss" + dayjs(value).format("Z")
                          )
                      );
                      // Reset time fields when date changes
                      formik.setFieldValue("timeOfDeparture", "");
                    }}
                    disabled={formik.values.scheduledDate === ""}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!formik.errors.timeOfEntry,
                        helperText:
                          formik.touched.timeOfEntry &&
                          formik.errors.timeOfEntry,
                      },
                    }}
                  />
                </Grid>

                {/* Time Of Departure */}
                <Grid item xs={12} md={4}>
                  <TimePicker
                    label="Time Of Departure *"
                    name="timeOfDeparture"
                    value={formik.values.timeOfDeparture}
                    onChange={(value) => {
                      formik.setFieldValue(
                        "timeOfDeparture",
                        formik.values.scheduledDate +
                          "T" +
                          dayjs(value).format(
                            "HH:mm:ss" + dayjs(value).format("Z")
                          )
                      );
                    }}
                    disabled={formik.values.timeOfEntry === ""}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!formik.errors.timeOfDeparture,
                        helperText:
                          formik.touched.timeOfDeparture &&
                          formik.errors.timeOfDeparture,
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 4 }} />
          </>
        );
      case 1:
        return (
          <>
            <FieldArray name="visitors">
              {({ remove, push }) => (
                <>
                  {formik.values.visitors.map(
                    (visitor: VisitorDetail, index: number) => (
                      <Card variant="outlined" sx={{ mb: 2 }} key={index}>
                        <CardContent>
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            mb={2}
                          >
                            <Typography
                              variant="h6"
                              component="h3"
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <PersonIcon color="primary" />
                              Visitor {index + 1}
                            </Typography>

                            {/* Only show delete button if there is more than one visitor */}
                            {formik.values.visitors.length > 1 &&
                              formik.values.visitors[index].status ===
                                "Draft" && (
                                <IconButton
                                  // onClick={() => onRemove(visitor.id)}
                                  color="error"
                                  size="small"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              )}
                          </Box>

                          <Grid container spacing={3}>
                            {/* Id/Passport Number */}
                            <Grid item xs={12} md={6}>
                              <TextField
                                fullWidth
                                label="ID/Passport Number"
                                name={`visitors.${index}.idPassportNumber`}
                                value={visitor.idPassportNumber}
                                onChange={formik.handleChange}
                                error={
                                  !!formik.errors.visitors?.[index]
                                    ?.idPassportNumber
                                }
                                helperText={
                                  formik.touched.visitors?.[index]
                                    ?.idPassportNumber &&
                                  formik.errors.visitors?.[index]
                                    ?.idPassportNumber
                                }
                                variant="outlined"
                              />
                            </Grid>

                            {/* Full Name */}
                            <Grid item xs={12} md={6}>
                              <TextField
                                fullWidth
                                label="Full Name"
                                name={`visitors.${index}.fullName`}
                                value={visitor.fullName}
                                onChange={formik.handleChange}
                                error={
                                  !!formik.errors.visitors?.[index]?.fullName
                                }
                                helperText={
                                  formik.touched.visitors?.[index]?.fullName &&
                                  formik.errors.visitors?.[index]?.fullName
                                }
                                variant="outlined"
                              />
                            </Grid>

                            {/* Contact Number */}
                            <Grid item xs={12} md={6}>
                              <TextField
                                fullWidth
                                label="Contact Number"
                                name={`visitors.${index}.contactNumber`}
                                value={visitor.contactNumber}
                                onChange={formik.handleChange}
                                error={
                                  !!formik.errors.visitors?.[index]
                                    ?.contactNumber
                                }
                                helperText={
                                  formik.touched.visitors?.[index]
                                    ?.contactNumber &&
                                  formik.errors.visitors?.[index]?.contactNumber
                                }
                                variant="outlined"
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <TextField
                                        select
                                        value={visitor.countryCode}
                                        onChange={formik.handleChange}
                                        variant="standard"
                                        sx={{ minWidth: 80 }}
                                        InputProps={{ disableUnderline: true }}
                                      >
                                        {COUNTRY_CODES.map((country) => (
                                          <MenuItem
                                            key={country.code}
                                            value={country.code}
                                          >
                                            {country.flag} {country.code}
                                          </MenuItem>
                                        ))}
                                      </TextField>
                                    </InputAdornment>
                                  ),
                                }}
                              />
                            </Grid>

                            <Grid item xs={12} md={6}>
                              <TextField
                                fullWidth
                                label="Email Address"
                                name={`visitors.${index}.emailAddress`}
                                type="email"
                                value={visitor.emailAddress}
                                onChange={formik.handleChange}
                                error={
                                  !!formik.errors.visitors?.[index]
                                    ?.emailAddress
                                }
                                helperText={
                                  formik.touched.visitors?.[index]
                                    ?.emailAddress &&
                                  formik.errors.visitors?.[index]?.emailAddress
                                }
                                variant="outlined"
                              />
                            </Grid>

                            {/* Pass Number */}
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                name={`visitors.${index}.passNumber`}
                                label="Pass Number"
                                value={visitor.passNumber}
                                onChange={formik.handleChange}
                                error={
                                  formik.touched.visitors?.[index]
                                    ?.passNumber &&
                                  Boolean(
                                    formik.errors.visitors?.[index]?.passNumber
                                  )
                                }
                                helperText={
                                  formik.touched.visitors?.[index]
                                    ?.passNumber &&
                                  formik.errors.visitors?.[index]?.passNumber
                                }
                                variant="outlined"
                              />
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    )
                  )}
                </>
              )}
            </FieldArray>
          </>
        );
      default:
        return <div>Not Found</div>;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          color="primary"
          sx={{ fontWeight: "bold" }}
        >
          Visitor Pass Registration
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Complete the form below to register your visit
        </Typography>
      </Box>
      <Box>
        <Formik
          initialValues={{
            companyName: "",
            whoTheyMeet: "",
            purposeOfVisit: "",
            accessibleFloors: [],
            scheduledDate: "",
            timeOfEntry: "",
            timeOfDeparture: "",
            visitors: [defaultVisitor],
          }}
          // validationSchema={
          //   activeStep === 0 ? visitValidationSchema : visitorValidationSchema
          // }
          validationSchema={
            activeStep === 1 ? visitorValidationSchema : undefined
          }
          onSubmit={handleNext}
        >
          {(formik) => (
            <Form>
              <Stepper activeStep={activeStep}>
                {steps.map((label, index) => (
                  <Step key={index}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
              <Box sx={{ mt: 2 }}>{renderStepContent(activeStep, formik)}</Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent:
                    activeStep === 0 ? "flex-end" : "space-between",
                  mt: 3,
                  bgcolor: "background.form",
                }}
              >
                {activeStep !== 0 && (
                  <Button
                    onClick={handleBack}
                    color="primary"
                    variant="contained"
                    sx={{ color: "white" }}
                  >
                    Back
                  </Button>
                )}

                <LoadingButton
                  type="submit"
                  color="primary"
                  sx={{ color: "white" }}
                  variant="contained"
                  // loading={submitState === "loading"}
                >
                  {isLastStep ? "Finish" : "Continue"}
                </LoadingButton>
              </Box>
            </Form>
          )}
        </Formik>
      </Box>
    </Container>
  );
}

export default CreateVisit;
