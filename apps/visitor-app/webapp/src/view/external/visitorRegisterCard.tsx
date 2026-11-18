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

import React, { useEffect, useState } from "react";
import { useSnackbar } from "notistack";
import * as Yup from "yup";
import { FieldArray, Form, Formik, FormikHelpers } from "formik";

import {
  Container,
  Typography,
  Button,
  Box,
  Grid,
  TextField,
  Card,
  CardContent,
  IconButton,
  InputAdornment,
  MenuItem,
  Divider,
  Chip,
} from "@mui/material";
import {
  Add as AddIcon,
  Person as PersonIcon,
  Check,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  Lock as LockIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";

import { DateTimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import { useConfirmationModalContext } from "@root/src/context/DialogContext";

import {
  RootState,
  useAppDispatch,
  useAppSelector,
} from "@root/src/slices/store";
import {
  getVisitInvitationAsync,
  submitVisitAsync,
} from "@slices/invitationSlice/invitation";
import { enqueueSnackbarMessage } from "@root/src/slices/commonSlice/common";

import { hash } from "@root/src/utils/utils";
import BackgroundLoader from "@root/src/component/common/BackgroundLoader";

import { ConfirmationType, State } from "@root/src/types/types";
import { VisitDetails } from "@slices/invitationSlice/invitation";
import ErrorHandler from "@root/src/component/common/ErrorHandler";

enum VisitorStatus {
  Draft = "Draft",
  Existing = "Existing",
  Completed = "Completed",
}

interface VisitorDetail {
  idPassportNumber: string;
  fullName: string;
  contactNumber: string;
  countryCode: string;
  emailAddress: string;
  status: VisitorStatus;
}

dayjs.extend(utc);

const COUNTRY_CODES = [
  { code: "+1", country: "US/CA", flag: "🇺🇸" },
  { code: "+44", country: "GB", flag: "🇬🇧" },
  { code: "+91", country: "IN", flag: "🇮🇳" },
  { code: "+86", country: "CN", flag: "🇨🇳" },
  { code: "+49", country: "DE", flag: "🇩🇪" },
  { code: "+33", country: "FR", flag: "🇫🇷" },
  { code: "+81", country: "JP", flag: "🇯🇵" },
  { code: "+82", country: "KR", flag: "🇰🇷" },
  { code: "+61", country: "AU", flag: "🇦🇺" },
  { code: "+55", country: "BR", flag: "🇧🇷" },
  { code: "+7", country: "RU/KZ", flag: "🇷🇺🇰🇿" },
  { code: "+20", country: "EG", flag: "🇪🇬" },
  { code: "+27", country: "ZA", flag: "🇿🇦" },
  { code: "+34", country: "ES", flag: "🇪🇸" },
  { code: "+39", country: "IT", flag: "🇮🇹" },
  { code: "+31", country: "NL", flag: "🇳🇱" },
  { code: "+32", country: "BE", flag: "🇧🇪" },
  { code: "+46", country: "SE", flag: "🇸🇪" },
  { code: "+47", country: "NO", flag: "🇳🇴" },
  { code: "+48", country: "PL", flag: "🇵🇱" },
  { code: "+351", country: "PT", flag: "🇵🇹" },
  { code: "+41", country: "CH", flag: "🇨🇭" },
  { code: "+43", country: "AT", flag: "🇦🇹" },
  { code: "+60", country: "MY", flag: "🇲🇾" },
  { code: "+62", country: "ID", flag: "🇮🇩" },
  { code: "+63", country: "PH", flag: "🇵🇭" },
  { code: "+64", country: "NZ", flag: "🇳🇿" },
  { code: "+66", country: "TH", flag: "🇹🇭" },
  { code: "+90", country: "TR", flag: "🇹🇷" },
  { code: "+92", country: "PK", flag: "🇵🇰" },
  { code: "+95", country: "MM", flag: "🇲🇲" },
  { code: "+971", country: "AE", flag: "🇦🇪" },
  { code: "+972", country: "IL", flag: "🇮🇱" },
  { code: "+973", country: "BH", flag: "🇧🇭" },
  { code: "+974", country: "QA", flag: "🇶🇦" },
  { code: "+975", country: "BT", flag: "🇧🇹" },
  { code: "+976", country: "MN", flag: "🇲🇳" },
  { code: "+977", country: "NP", flag: "🇳🇵" },
  { code: "+966", country: "SA", flag: "🇸🇦" },
  { code: "+886", country: "TW", flag: "🇹🇼" },
  { code: "+880", country: "BD", flag: "🇧🇩" },
  { code: "+84", country: "VN", flag: "🇻🇳" },
  { code: "+94", country: "LK", flag: "🇱🇰" },
];

const validationSchema = Yup.object().shape({
  visitDetails: Yup.object().shape({
    whomTheyMeet: Yup.string().required("Meeting person is required"),
    purposeOfVisit: Yup.string().required("Purpose of visit is required"),
    timeOfEntry: Yup.string()
      .required("Time of entry is required")
      .test("is-valid-time", "Time of entry cannot be in the past", (value) => {
        if (!value) return false;
        return dayjs.utc(value).isAfter(dayjs.utc());
      }),
    timeOfDeparture: Yup.string()
      .required("Time of departure is required")
      .test(
        "is-after-entry",
        "Time of departure must be after time of entry",
        (value, context) => {
          const { timeOfEntry } = context.parent;
          if (!value || !timeOfEntry) return false;
          return dayjs.utc(value).isAfter(dayjs.utc(timeOfEntry));
        }
      ),
  }),
  visitors: Yup.array().of(
    Yup.object().shape({
      idPassportNumber: Yup.string()
        .required("ID/Passport number is required")
        .test("duplicate", "Visitor already registered", function (value) {
          const { path, parent, options } = this;
          const visitors = options.context?.visitors || [];
          if (!value) return true;
          const firstIndex = visitors.findIndex(
            (v: any) => v.idPassportNumber === value
          );
          const currentIndex = visitors.indexOf(parent);
          return currentIndex === firstIndex;
        }),
      fullName: Yup.string().required("Full name is required"),
      contactNumber: Yup.string()
        .required("Contact number is required")
        .matches(/^\d{6,12}$/, "Invalid contact number"),
      emailAddress: Yup.string().email("Invalid email address").optional(),
    })
  ),
});

function transformVisitors(visitors: Array<any>): VisitorDetail[] {
  return visitors.map((v) => {
    const idPassportNumber = v.nicNumber.slice(0, -1);
    const parts = v.name.trim().split(/\s+/);
    const fullName = parts
      .map((p: any) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join(" ");
    const match = v.contactNumber.match(/^(\+\d{2})(\d+)$/);
    let countryCode = "";
    let contactNumber = v.contactNumber;
    if (match) {
      countryCode = match[1];
      contactNumber = match[2];
      if (contactNumber.startsWith("0")) {
        contactNumber = contactNumber.slice(1);
      }
    }
    return {
      idPassportNumber,
      fullName,
      contactNumber,
      countryCode,
      emailAddress: v.email,
      status: VisitorStatus.Completed,
    };
  });
}

function VisitorRegisterCard() {
  const token = new URLSearchParams(window.location.search).get("token");
  const dispatch = useAppDispatch();

  const visitorState = useAppSelector((state: RootState) => state.visitor);
  const visitState = useAppSelector((state: RootState) => state.visit);
  const externalState = useAppSelector((state: RootState) => state.invitation);
  const common = useAppSelector((state: RootState) => state.common);

  const dialogContext = useConfirmationModalContext();
  const { enqueueSnackbar } = useSnackbar();
  const [isVisitDetailsLocked, setIsVisitDetailsLocked] = useState(false);

  useEffect(() => {
    dispatch(getVisitInvitationAsync(token ?? ""));
  }, [dispatch, token]);

  // Lock visit details if visitInfo exists
  useEffect(() => {
    if (externalState.visitInvitation?.visitInfo) {
      setIsVisitDetailsLocked(true);
    }
  }, [externalState.visitInvitation]);

  const defaultVisitors: VisitorDetail[] = externalState.visitInvitation
    ? transformVisitors(externalState.visitInvitation.invitees)
    : [];

  const defaultVisitDetails: VisitDetails = {
    companyName: externalState.visitInvitation?.visitInfo?.companyName || "",
    whomTheyMeet: externalState.visitInvitation?.visitInfo?.whomTheyMeet || "",
    purposeOfVisit:
      externalState.visitInvitation?.visitInfo?.purposeOfVisit || "",
    timeOfEntry: externalState.visitInvitation?.visitInfo?.timeOfEntry || "",
    timeOfDeparture:
      externalState.visitInvitation?.visitInfo?.timeOfDeparture || "",
  };

  const showSnackbar = () => {
    if (common.timestamp != null) {
      enqueueSnackbar(common.message, {
        variant: common.type,
        preventDuplicate: true,
        anchorOrigin: { horizontal: "right", vertical: "bottom" },
      });
    }
  };

  useEffect(() => {
    showSnackbar();
  }, [common.timestamp, common.message, common.type]);

  const submitVisit = async (
    values: { visitDetails: VisitDetails; visitors: VisitorDetail[] },
    formikHelpers: FormikHelpers<any>
  ) => {
    const { setSubmitting, resetForm } = formikHelpers;

    try {
      const visitorsToSubmit = values.visitors.filter(
        (visitor) => visitor.status === VisitorStatus.Draft
      );

      if (visitorsToSubmit.length === 0) {
        dispatch(
          enqueueSnackbarMessage({
            message: "No new visitors to submit",
            type: "warning",
          })
        );
        setSubmitting(false);
        return;
      }

      // Validate visitDetails to prevent undefined errors
      if (!values.visitDetails) {
        dispatch(
          enqueueSnackbarMessage({
            message: "Visit details are missing",
            type: "error",
          })
        );
        setSubmitting(false);
        return;
      }

      dialogContext.showConfirmation(
        "Do you want to submit this visitor?",
        "Please note, this will add the visitor's information to the system.",
        ConfirmationType.accept,
        async () => {
          try {
            const visitors = await Promise.all(
              visitorsToSubmit.map(async (visitor) => ({
                nicHash: await hash(visitor.idPassportNumber),
                name: visitor.fullName,
                nicNumber: visitor.idPassportNumber,
                contactNumber: visitor.countryCode + visitor.contactNumber,
                email:
                  visitor.emailAddress === "" ? null : visitor.emailAddress,
              }))
            );

            const visitData = {
              visitors,
              visitDetails: {
                companyName: values.visitDetails.companyName || "",
                whomTheyMeet: values.visitDetails.whomTheyMeet || "",
                purposeOfVisit: values.visitDetails.purposeOfVisit || "",
                timeOfEntry: values.visitDetails.timeOfEntry
                  ? dayjs
                      .utc(values.visitDetails.timeOfEntry)
                      .format("YYYY-MM-DDTHH:mm:ss")
                  : "",
                timeOfDeparture: values.visitDetails.timeOfDeparture
                  ? dayjs
                      .utc(values.visitDetails.timeOfDeparture)
                      .format("YYYY-MM-DDTHH:mm:ss")
                  : "",
                accessibleLocations: [],
              },
            };

            const resultAction = await dispatch(
              submitVisitAsync({ visitData, invitationId: token ?? "" })
            );

            if (submitVisitAsync.fulfilled.match(resultAction)) {
              // Update visitors to Completed status and preserve visitDetails
              const updatedVisitors = values.visitors.map((visitor) =>
                visitor.status === VisitorStatus.Draft
                  ? { ...visitor, status: VisitorStatus.Completed }
                  : visitor
              );

              resetForm({
                values: {
                  visitDetails: { ...values.visitDetails },
                  visitors: updatedVisitors,
                },
              });
            }
          } finally {
            setSubmitting(false);
          }
        },
        "Yes",
        "Cancel"
      );
    } catch (error) {
      console.error("Unexpected error:", error);
      dispatch(
        enqueueSnackbarMessage({
          message: "An error occurred",
          type: "error",
        })
      );
      setSubmitting(false);
    }
  };

  const canAddMoreVisitors = (visitors: VisitorDetail[]) => {
    const hasMaxVisitors = externalState.visitInvitation?.noOfVisitors
      ? visitors.length >= externalState.visitInvitation.noOfVisitors
      : false;

    const hasDraftVisitor = visitors.some(
      (visitor) => visitor.status === VisitorStatus.Draft
    );

    return !hasMaxVisitors && !hasDraftVisitor;
  };

  return (
    <>
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          opacity: 0.1,
          zIndex: -1,
        }}
      ></Box>
      {(visitorState.state === State.loading ||
        visitorState.submitState === State.loading ||
        visitState.state === State.loading ||
        externalState.submitState === State.loading ||
        externalState.fetchState === State.loading ||
        visitState.submitState === State.loading) && (
        <BackgroundLoader
          open={true}
          message={
            visitorState.state === State.loading ||
            visitorState.submitState === State.loading
              ? visitorState.stateMessage
              : visitState.stateMessage
          }
        />
      )}
      {externalState.visitInvitation?.active ? (
        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Container maxWidth="md" sx={{ py: 4 }}>
            <Box
              sx={{
                mb: 6,
                textAlign: "center",
                px: { xs: 2, md: 0 },
                backgroundColor: "transparent",
              }}
            >
              <Typography
                variant="h2"
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: "bold",
                  color: "#FF7300",
                }}
              >
                Choreo Labs Visitor Registration
              </Typography>

              <Typography
                variant="subtitle1"
                color="text.secondary"
                sx={{
                  maxWidth: "600px",
                  mx: "auto",
                  fontSize: { xs: "0.95rem", md: "1.1rem" },
                  color: "#231F20",
                }}
              >
                Complete the form below to register visitors.
              </Typography>

              <Box
                sx={{
                  mt: 3,
                  width: "80px",
                  height: "4px",
                  bgcolor: "#FF7300",
                  borderRadius: "2px",
                  mx: "auto",
                }}
              />
            </Box>

            <Formik
              initialValues={{
                visitDetails: defaultVisitDetails,
                visitors:
                  defaultVisitors.length > 0
                    ? defaultVisitors
                    : [
                        {
                          idPassportNumber: "",
                          fullName: "",
                          contactNumber: "",
                          countryCode: "+94",
                          emailAddress: "",
                          status: VisitorStatus.Draft,
                        },
                      ],
              }}
              onSubmit={(values, formikHelpers) =>
                submitVisit(values, formikHelpers)
              }
              validationSchema={validationSchema}
            >
              {(formik) => (
                <Form>
                  <Card
                    variant="outlined"
                    sx={{
                      mb: 3,
                      borderRadius: 2,
                      backgroundColor: isVisitDetailsLocked
                        ? "rgba(245, 245, 245, 0.3)"
                        : "rgba(255, 255, 255, 0.25)",
                      backdropFilter: "blur(12px)",
                      WebkitBackdropFilter: "blur(12px)",
                      boxShadow: "0 6px 24px rgba(0,0,0,0.08)",
                      border: isVisitDetailsLocked
                        ? "1px solid rgba(0,0,0,0.1)"
                        : "1px solid rgba(255,255,255,0.3)",
                      "@supports not (backdrop-filter: blur(12px))": {
                        backgroundColor: "rgba(255,255,255,0.35)",
                      },
                    }}
                  >
                    <CardContent
                      sx={{ p: 3, backgroundColor: "background.paper" }}
                    >
                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{
                          fontWeight: 600,
                          color: "#222",
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 2,
                        }}
                      >
                        <BusinessIcon sx={{ color: "rgba(0,0,0,0.65)" }} />
                        Visit Information
                        {isVisitDetailsLocked && (
                          <LockIcon
                            sx={{
                              fontSize: 18,
                              color: "rgba(0,0,0,0.4)",
                              ml: 0.5,
                            }}
                          />
                        )}
                        <Chip
                          label={`ID: #${externalState.visitInvitation?.invitationId}`}
                          size="small"
                          sx={{
                            ml: "auto",
                            backgroundColor: "rgba(0,0,0,0.05)",
                            color: "#222",
                            fontWeight: 600,
                            fontSize: "0.8rem",
                          }}
                        />
                      </Typography>

                      <Divider
                        sx={{ mb: 3, borderColor: "rgba(0,0,0,0.15)" }}
                      />

                      <Grid container spacing={2.5}>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Company Name"
                            name="visitDetails.companyName"
                            value={formik.values.visitDetails.companyName}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={
                              formik.touched.visitDetails?.companyName &&
                              Boolean(formik.errors.visitDetails?.companyName)
                            }
                            helperText={
                              formik.touched.visitDetails?.companyName &&
                              formik.errors.visitDetails?.companyName
                            }
                            variant="outlined"
                            disabled={isVisitDetailsLocked}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Meeting With *"
                            name="visitDetails.whomTheyMeet"
                            value={formik.values.visitDetails.whomTheyMeet}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={
                              formik.touched.visitDetails?.whomTheyMeet &&
                              Boolean(formik.errors.visitDetails?.whomTheyMeet)
                            }
                            helperText={
                              formik.touched.visitDetails?.whomTheyMeet &&
                              formik.errors.visitDetails?.whomTheyMeet
                            }
                            variant="outlined"
                            disabled={isVisitDetailsLocked}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Purpose of Visit *"
                            name="visitDetails.purposeOfVisit"
                            value={formik.values.visitDetails.purposeOfVisit}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={
                              formik.touched.visitDetails?.purposeOfVisit &&
                              Boolean(
                                formik.errors.visitDetails?.purposeOfVisit
                              )
                            }
                            helperText={
                              formik.touched.visitDetails?.purposeOfVisit &&
                              formik.errors.visitDetails?.purposeOfVisit
                            }
                            variant="outlined"
                            multiline
                            rows={2}
                            disabled={isVisitDetailsLocked}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <DateTimePicker
                            label="Time of Entry *"
                            minDateTime={dayjs()}
                            value={
                              formik.values.visitDetails.timeOfEntry
                                ? dayjs
                                    .utc(formik.values.visitDetails.timeOfEntry)
                                    .local()
                                : null
                            }
                            onChange={(value) => {
                              formik.setFieldValue(
                                "visitDetails.timeOfEntry",
                                dayjs(value).utc().format()
                              );

                              formik.setFieldTouched(
                                "visitDetails.timeOfEntry",
                                true,
                                false
                              );
                            }}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                disabled: isVisitDetailsLocked,
                                error:
                                  formik.touched.visitDetails?.timeOfEntry &&
                                  Boolean(
                                    formik.errors.visitDetails?.timeOfEntry
                                  ),
                                helperText:
                                  formik.touched.visitDetails?.timeOfEntry &&
                                  formik.errors.visitDetails?.timeOfEntry,
                              },
                              openPickerButton: {
                                disabled: isVisitDetailsLocked,
                              },
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <DateTimePicker
                            label="Time of Departure *"
                            minDateTime={
                              formik.values.visitDetails.timeOfEntry
                                ? dayjs(
                                    formik.values.visitDetails.timeOfEntry
                                  ).local()
                                : dayjs()
                            }
                            value={
                              formik.values.visitDetails.timeOfDeparture
                                ? dayjs
                                    .utc(
                                      formik.values.visitDetails.timeOfDeparture
                                    )
                                    .local()
                                : null
                            }
                            onChange={(value) => {
                              formik.setFieldValue(
                                "visitDetails.timeOfDeparture",
                                dayjs(value).utc().format()
                              );

                              formik.setFieldTouched(
                                "visitDetails.timeOfDeparture",
                                true,
                                false
                              );
                            }}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                disabled: isVisitDetailsLocked,
                                error:
                                  formik.touched.visitDetails
                                    ?.timeOfDeparture &&
                                  Boolean(
                                    formik.errors.visitDetails?.timeOfDeparture
                                  ),
                                helperText:
                                  formik.touched.visitDetails
                                    ?.timeOfDeparture &&
                                  formik.errors.visitDetails?.timeOfDeparture,
                              },
                              openPickerButton: {
                                disabled: isVisitDetailsLocked,
                              },
                            }}
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>

                  <FieldArray name="visitors">
                    {({ remove, push }) => (
                      <Box sx={{ mt: 2, backgroundColor: "background.paper" }}>
                        {formik.values.visitors.map(
                          (visitor: VisitorDetail, index: number) => {
                            const isLocked =
                              visitor.status !== VisitorStatus.Draft;

                            return (
                              <Card
                                variant="outlined"
                                sx={{
                                  mb: 2,
                                  borderRadius: 2,
                                  backgroundColor: isLocked
                                    ? "rgba(240, 255, 244, 0.3)"
                                    : "rgba(255, 255, 255, 0.2)",
                                  backdropFilter: "blur(10px)",
                                  boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
                                  border: isLocked
                                    ? "1px solid rgba(76, 175, 80, 0.3)"
                                    : "1px solid rgba(255, 255, 255, 0.3)",
                                }}
                                key={index}
                              >
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
                                      {isLocked && (
                                        <Chip
                                          icon={<CheckCircleIcon />}
                                          label={
                                            visitor.status ===
                                            VisitorStatus.Existing
                                              ? "Primary"
                                              : "Registered"
                                          }
                                          color="success"
                                          size="small"
                                          sx={{ ml: 1 }}
                                        />
                                      )}
                                      {visitor.status ===
                                        VisitorStatus.Draft && (
                                        <Chip
                                          label="Draft"
                                          color="warning"
                                          size="small"
                                          sx={{ ml: 1 }}
                                        />
                                      )}
                                    </Typography>
                                    {visitor.status === VisitorStatus.Draft &&
                                      formik.values.visitors.length > 1 && (
                                        <IconButton
                                          onClick={() => remove(index)}
                                          color="error"
                                          size="small"
                                        >
                                          <DeleteIcon />
                                        </IconButton>
                                      )}
                                  </Box>
                                  <Grid container spacing={3}>
                                    <Grid item xs={12} md={6}>
                                      <TextField
                                        fullWidth
                                        label="ID/Passport Number *"
                                        name={`visitors.${index}.idPassportNumber`}
                                        value={visitor.idPassportNumber}
                                        onChange={(event) =>
                                          formik.setFieldValue(
                                            `visitors.${index}.idPassportNumber`,
                                            event.target.value.toUpperCase()
                                          )
                                        }
                                        onBlur={formik.handleBlur}
                                        error={
                                          formik.touched.visitors?.[index]
                                            ?.idPassportNumber &&
                                          Boolean(
                                            (
                                              formik.errors.visitors?.[
                                                index
                                              ] as import("formik").FormikErrors<VisitorDetail>
                                            )?.idPassportNumber
                                          )
                                        }
                                        helperText={
                                          formik.touched.visitors?.[index]
                                            ?.idPassportNumber &&
                                          (
                                            formik.errors.visitors?.[
                                              index
                                            ] as import("formik").FormikErrors<VisitorDetail>
                                          )?.idPassportNumber
                                        }
                                        variant="outlined"
                                        disabled={isLocked}
                                        InputProps={
                                          isLocked
                                            ? {
                                                endAdornment: (
                                                  <InputAdornment position="end">
                                                    <LockIcon
                                                      sx={{
                                                        fontSize: 18,
                                                        color:
                                                          "rgba(0,0,0,0.3)",
                                                      }}
                                                    />
                                                  </InputAdornment>
                                                ),
                                              }
                                            : undefined
                                        }
                                      />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                      <TextField
                                        fullWidth
                                        label="Full Name *"
                                        name={`visitors.${index}.fullName`}
                                        value={visitor.fullName}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        error={
                                          formik.touched.visitors?.[index]
                                            ?.fullName &&
                                          Boolean(
                                            (
                                              formik.errors.visitors?.[
                                                index
                                              ] as import("formik").FormikErrors<VisitorDetail>
                                            )?.fullName
                                          )
                                        }
                                        helperText={
                                          formik.touched.visitors?.[index]
                                            ?.fullName &&
                                          (
                                            formik.errors.visitors?.[
                                              index
                                            ] as import("formik").FormikErrors<VisitorDetail>
                                          )?.fullName
                                        }
                                        variant="outlined"
                                        disabled={isLocked}
                                        InputProps={
                                          isLocked
                                            ? {
                                                endAdornment: (
                                                  <InputAdornment position="end">
                                                    <LockIcon
                                                      sx={{
                                                        fontSize: 18,
                                                        color:
                                                          "rgba(0,0,0,0.3)",
                                                      }}
                                                    />
                                                  </InputAdornment>
                                                ),
                                              }
                                            : undefined
                                        }
                                      />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                      <TextField
                                        fullWidth
                                        label="Contact Number *"
                                        name={`visitors.${index}.contactNumber`}
                                        value={visitor.contactNumber}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        error={
                                          formik.touched.visitors?.[index]
                                            ?.contactNumber &&
                                          Boolean(
                                            (
                                              formik.errors.visitors?.[
                                                index
                                              ] as import("formik").FormikErrors<VisitorDetail>
                                            )?.contactNumber
                                          )
                                        }
                                        helperText={
                                          formik.touched.visitors?.[index]
                                            ?.contactNumber &&
                                          (
                                            formik.errors.visitors?.[
                                              index
                                            ] as import("formik").FormikErrors<VisitorDetail>
                                          )?.contactNumber
                                        }
                                        variant="outlined"
                                        InputProps={{
                                          startAdornment: (
                                            <InputAdornment position="start">
                                              <TextField
                                                select
                                                name={`visitors.${index}.countryCode`}
                                                value={visitor.countryCode}
                                                onChange={formik.handleChange}
                                                variant="standard"
                                                sx={{ minWidth: 80 }}
                                                InputProps={{
                                                  disableUnderline: true,
                                                }}
                                                disabled={isLocked}
                                              >
                                                {COUNTRY_CODES.map(
                                                  (country) => (
                                                    <MenuItem
                                                      key={country.code}
                                                      value={country.code}
                                                    >
                                                      {country.flag}{" "}
                                                      {country.code}
                                                    </MenuItem>
                                                  )
                                                )}
                                              </TextField>
                                            </InputAdornment>
                                          ),
                                          endAdornment: isLocked ? (
                                            <InputAdornment position="end">
                                              <LockIcon
                                                sx={{
                                                  fontSize: 18,
                                                  color: "rgba(0,0,0,0.3)",
                                                }}
                                              />
                                            </InputAdornment>
                                          ) : undefined,
                                        }}
                                        disabled={isLocked}
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
                                        onBlur={formik.handleBlur}
                                        error={
                                          formik.touched.visitors?.[index]
                                            ?.emailAddress &&
                                          Boolean(
                                            (
                                              formik.errors.visitors?.[
                                                index
                                              ] as import("formik").FormikErrors<VisitorDetail>
                                            )?.emailAddress
                                          )
                                        }
                                        helperText={
                                          formik.touched.visitors?.[index]
                                            ?.emailAddress &&
                                          (
                                            formik.errors.visitors?.[
                                              index
                                            ] as import("formik").FormikErrors<VisitorDetail>
                                          )?.emailAddress
                                        }
                                        variant="outlined"
                                        disabled={isLocked}
                                        InputProps={
                                          isLocked
                                            ? {
                                                endAdornment: (
                                                  <InputAdornment position="end">
                                                    <LockIcon
                                                      sx={{
                                                        fontSize: 18,
                                                        color:
                                                          "rgba(0,0,0,0.3)",
                                                      }}
                                                    />
                                                  </InputAdornment>
                                                ),
                                              }
                                            : undefined
                                        }
                                      />
                                    </Grid>
                                  </Grid>
                                </CardContent>
                              </Card>
                            );
                          }
                        )}

                        <Box
                          sx={{
                            mt: 2,
                            display: "flex",
                            flexDirection: { xs: "column", sm: "row" },
                            gap: 2,
                            justifyContent: "flex-end",
                          }}
                        >
                          {canAddMoreVisitors(formik.values.visitors) && (
                            <Button
                              variant="contained"
                              startIcon={<AddIcon />}
                              onClick={() =>
                                push({
                                  idPassportNumber: "",
                                  fullName: "",
                                  contactNumber: "",
                                  countryCode: "+94",
                                  emailAddress: "",
                                  status: VisitorStatus.Draft,
                                })
                              }
                              sx={{ minWidth: { xs: "100%", sm: "auto" } }}
                            >
                              Add Visitor
                            </Button>
                          )}

                          {formik.values.visitors.some(
                            (visitor: VisitorDetail) =>
                              visitor.status === VisitorStatus.Draft
                          ) && (
                            <Button
                              variant="contained"
                              color="success"
                              startIcon={<Check />}
                              onClick={formik.submitForm}
                              sx={{ minWidth: { xs: "100%", sm: "auto" } }}
                            >
                              {formik.isSubmitting
                                ? "Submitting..."
                                : "Submit Visitor"}
                            </Button>
                          )}
                        </Box>

                        {externalState.visitInvitation?.noOfVisitors && (
                          <Box sx={{ mt: 2, textAlign: "center" }}>
                            <Typography variant="body2" color="text.secondary">
                              {formik.values.visitors.length} of{" "}
                              {externalState.visitInvitation.noOfVisitors}{" "}
                              visitors registered
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    )}
                  </FieldArray>
                </Form>
              )}
            </Formik>
          </Container>
        </Box>
      ) : externalState.error ? (
        <Grid
          container
          justifyContent="center"
          alignItems="center"
          sx={{
            mt: { xs: 6, md: 10 },
            mb: { xs: 3, md: 5 },
            textAlign: "center",
            px: { xs: 2, md: 0 },
          }}
        >
          <Grid item xs={12} sm={10} md={8} lg={6}>
            <ErrorHandler message={`Oops! ${externalState.error}`} />
          </Grid>
        </Grid>
      ) : null}
    </>
  );
}

export default VisitorRegisterCard;
