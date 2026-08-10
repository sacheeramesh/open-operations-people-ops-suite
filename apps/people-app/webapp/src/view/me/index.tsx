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

import { ConfirmationType, State } from "@/types/types";
import { useConfirmationModalContext } from "@context/DialogContext";
import {
  BadgeOutlined,
  BusinessOutlined,
  EmailOutlined,
  WorkOutline,
} from "@mui/icons-material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import SaveIcon from "@mui/icons-material/Save";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import IconButton from "@mui/material/IconButton";
import type { Theme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import {
  fetchEmployee,
  fetchEmployeeQrCode,
  resetEmployee,
  resetQrCode,
} from "@root/src/slices/employeeSlice/employee";
import {
  EmployeePersonalInfo,
  fetchEmployeePersonalInfo,
  resetPersonalInfo,
  updateEmployeePersonalInfo,
} from "@root/src/slices/employeeSlice/employeePersonalInfo";
import {
  calculateAge,
  calculateServiceLength,
  formatServiceLength,
  formatDate,
  isPresentOrFuture,
} from "@root/src/utils/utils";
import {
  FieldArray,
  Form,
  Formik,
  FormikErrors,
  FormikHandlers,
  FormikValues,
  getIn,
} from "formik";
import { useEffect, useRef, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { array, object, string } from "yup";
import { Role, selectRoles } from "@slices/authSlice/auth";
import { useAppDispatch, useAppSelector } from "@slices/store";

const ReadOnly = ({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) => (
  <>
    <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
      {label}
    </Typography>
    <Typography variant="h6" sx={{ fontWeight: 600 }}>
      {value || "-"}
    </Typography>
  </>
);

const FieldInput = ({
  name,
  label,
  type = "text",
  values,
  handleChange,
  handleBlur,
  errors,
  touched,
  isSavingChanges,
  isRequired = false,
}: {
  name: string;
  label: string;
  type?: string;
  values: FormikValues;
  handleChange: FormikHandlers["handleChange"];
  handleBlur: FormikHandlers["handleBlur"];
  errors: FormikErrors<any>;
  touched: { [field: string]: boolean };
  isSavingChanges: boolean;
  isRequired?: boolean;
}) => {
  const labelWithAsterisk = isRequired ? `${label} *` : label;
  return (
    <TextField
      sx={{
        mt: 1,
        "& .MuiFormHelperText-root": {
          fontSize: 14,
        },
      }}
      label={labelWithAsterisk}
      name={name}
      type={type}
      value={getIn(values, name) || ""}
      onChange={handleChange}
      onBlur={handleBlur}
      disabled={isSavingChanges}
      error={getIn(touched, name) && Boolean(getIn(errors, name))}
      helperText={
        getIn(touched, name) && getIn(errors, name)
          ? String(getIn(errors, name))
          : undefined
      }
      variant="outlined"
      InputProps={{ style: { fontSize: 15 } }}
      InputLabelProps={{ style: { fontSize: 15 } }}
      fullWidth
    />
  );
};

export const getEmployeeStatusChipStyles =
  (status?: string) => (theme: Theme) => {
    const normalized = (status ?? "").trim().toLowerCase();
    const mainColor =
      normalized === "active"
        ? theme.palette.success.main
        : normalized === "marked leaver"
          ? theme.palette.warning.main
          : theme.palette.error.main;

    return {
      borderRadius: 999,
      height: 24,
      fontWeight: 600,
      px: 0,
      color: mainColor,
      borderColor: alpha(mainColor, 0.45),
      backgroundColor: alpha(
        mainColor,
        theme.palette.mode === "dark" ? 0.14 : 0.1,
      ),
      "& .MuiChip-label": {
        px: 0.75,
        py: 0,
        fontSize: 12,
        lineHeight: 1,
        textTransform: "capitalize",
      },
    };
  };

const emergencyContactItemSchema = object().shape({
  name: string()
    .required("Name is required")
    .max(100, "Name must be at most 100 characters"),
  relationship: string()
    .required("Relationship is required")
    .max(50, "Relationship must be at most 50 characters"),
  telephone: string()
    .nullable()
    .matches(
      /^[0-9+\-()\s]*[0-9][0-9+\-()\s]*$/,
      "Invalid telephone number format",
    ),
  mobile: string()
    .required("Mobile is required")
    .matches(
      /^[0-9+\-()\s]*[0-9][0-9+\-()\s]*$/,
      "Invalid mobile number format",
    ),
});

export default function Me({
  employeeId,
  readOnly = false,
}: { employeeId?: string; readOnly?: boolean } = {}) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { showConfirmation } = useConfirmationModalContext();
  const roles = useAppSelector(selectRoles);
  const {
    userInfo,
    state: userState,
    isProfileMissing,
  } = useAppSelector((state) => state.user);
  const targetEmployeeId = employeeId ?? userInfo?.employeeId;
  const { employee, state: employeeState } = useAppSelector(
    (state) => state.employee,
  );
  const { personalInfo, state: personalInfoState } = useAppSelector(
    (state) => state.employeePersonalInfo,
  );
  const [isSavingChanges, setSavingChanges] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrImageNaturalSize, setQrImageNaturalSize] = useState<number | null>(
    null,
  );
  const { qrCodeUrl, qrCodeState } = useAppSelector((state) => state.employee);
  const initialHasEmergencyContactsRef = useRef<boolean>(
    !!personalInfo?.emergencyContacts?.length,
  );

  const [shouldRequireEmergencyContacts, setShouldRequireEmergencyContacts] =
    useState<boolean>(initialHasEmergencyContactsRef.current);

  const serviceStartDate =
    employee?.continuousServiceDate ?? employee?.startDate ?? null;

  const serviceLength = serviceStartDate
    ? calculateServiceLength(serviceStartDate)
    : null;

  const serviceText = formatServiceLength(serviceLength);

  const age = personalInfo?.dob ? calculateAge(personalInfo.dob) : null;

  const designationText = useMemo(
    () => employee?.designation || "-",
    [employee],
  );

  useEffect(() => {
    const has = (personalInfo?.emergencyContacts?.length ?? 0) > 0;
    initialHasEmergencyContactsRef.current = has;
    setShouldRequireEmergencyContacts(has);
  }, [personalInfo]);

  const personalInfoSchema = object().shape({
    personalEmail: string()
      .nullable()
      .email("Invalid email format")
      .max(254, "Email must be at most 254 characters"),
    personalPhone: string()
      .nullable()
      .matches(
        /^[0-9+\-()\s]*[0-9][0-9+\-()\s]*$/,
        "Invalid personal phone number format",
      ),
    residentNumber: string()
      .nullable()
      .matches(
        /^[0-9+\-()\s]*[0-9][0-9+\-()\s]*$/,
        "Invalid resident number format",
      ),
    addressLine1: string()
      .nullable()
      .max(255, "Address Line 1 must be at most 255 characters"),
    addressLine2: string()
      .nullable()
      .max(255, "Address Line 2 must be at most 255 characters"),
    city: string().nullable().max(100, "City must be at most 100 characters"),
    country: string()
      .nullable()
      .max(100, "Country must be at most 100 characters"),
    stateOrProvince: string()
      .nullable()
      .max(100, "State/Province must be at most 100 characters"),
    postalCode: string()
      .nullable()
      .max(20, "Postal code must be at most 20 characters"),
    emergencyContacts: shouldRequireEmergencyContacts
      ? array()
          .required("At least one emergency contact is required")
          .min(1, "At least one emergency contact is required")
          .max(4, "Maximum 4 emergency contacts allowed")
          .of(emergencyContactItemSchema)
      : array()
          .nullable()
          .max(4, "Maximum 4 emergency contacts allowed")
          .of(emergencyContactItemSchema),
  });

  useEffect(() => {
    if (!targetEmployeeId) return;

    dispatch(resetEmployee());
    dispatch(resetPersonalInfo());
    dispatch(fetchEmployee(targetEmployeeId));
    dispatch(fetchEmployeePersonalInfo(targetEmployeeId));
  }, [targetEmployeeId, dispatch]);

  useEffect(() => {
    return () => {
      dispatch(resetQrCode());
    };
  }, [dispatch]);

  const handleSaveChanges = async (values: EmployeePersonalInfo) => {
    showConfirmation(
      "Confirm Save",
      "Are you sure you want to save these changes?",
      ConfirmationType.update,
      () => savePersonalInfo(values),
      "Save",
      "Cancel",
    );
  };

  const handleDiscardChanges = (resetForm: () => void) => {
    showConfirmation(
      "Discard Changes",
      "Are you sure you want to discard all unsaved changes? This action cannot be undone.",
      ConfirmationType.discard,
      () => {
        resetForm();
        setShouldRequireEmergencyContacts(
          initialHasEmergencyContactsRef.current,
        );
      },
      "Discard",
      "Keep Changes",
    );
  };

  const savePersonalInfo = (values: EmployeePersonalInfo) => {
    try {
      if (employee?.employeeId) {
        const dataToSave = {
          personalEmail: values.personalEmail,
          personalPhone: values.personalPhone,
          residentNumber: values.residentNumber,
          addressLine1: values.addressLine1,
          addressLine2: values.addressLine2,
          city: values.city,
          stateOrProvince: values.stateOrProvince,
          postalCode: values.postalCode,
          country: values.country,
          emergencyContacts: (values.emergencyContacts || []).map(
            (contact) => ({
              name: contact.name,
              relationship: contact.relationship,
              telephone: contact.telephone,
              mobile: contact.mobile,
            }),
          ),
        };
        setSavingChanges(true);
        dispatch(
          updateEmployeePersonalInfo({
            employeeId: employee.employeeId,
            data: dataToSave,
          }),
        ).finally(() => {
          setSavingChanges(false);
        });
      }
    } catch (err) {
      console.error(err);
      setSavingChanges(false);
    }
  };

  const headerSx = (theme: Theme) => {
    const orange = theme.palette.secondary.contrastText;
    const isDark = theme.palette.mode === "dark";

    return {
      p: { xs: 2.25, sm: 3.25 },
      borderRadius: 3,
      position: "relative",
      overflow: "hidden",
      minHeight: { xs: 120, sm: 100 },

      border: `1px solid ${alpha(theme.palette.divider, isDark ? 0.18 : 0.14)}`,

      background: isDark
        ? `linear-gradient(135deg,
          ${alpha(theme.palette.background.paper, 0.6)} 0%,
          ${alpha(theme.palette.background.default, 0.35)} 100%)`
        : `linear-gradient(135deg,
          ${alpha(orange, 0.18)} 0%,
          ${alpha(orange, 0.1)} 28%,
          ${alpha("#ffffff", 0.92)} 62%,
          ${alpha("#ffffff", 0.96)} 100%)`,

      "&:after": {
        content: '""',
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        background: isDark
          ? `radial-gradient(520px circle at 32% 38%, ${alpha(orange, 0.22)}, transparent 62%)`
          : `radial-gradient(520px circle at 32% 38%, ${alpha(orange, 0.3)}, transparent 62%)`,
      },
    };
  };

  const avatarSx = (theme: Theme) => {
    const orange = theme.palette.secondary.contrastText;
    const isDark = theme.palette.mode === "dark";

    return {
      width: 72,
      height: 72,
      border: `2px solid ${alpha(orange, isDark ? 0.55 : 0.35)}`,
      backgroundColor: alpha(orange, isDark ? 0.16 : 0.12),
      color: isDark ? theme.palette.common.white : theme.palette.primary.main,
      fontWeight: 800,
      fontSize: 20,
      boxShadow: `0 10px 30px ${alpha(orange, isDark ? 0.12 : 0.1)}`,
      flexShrink: 0,
    };
  };

  const chipSx = (theme: Theme) => {
    const isDark = theme.palette.mode === "dark";
    const orange = theme.palette.secondary.contrastText;

    return {
      borderRadius: 999,
      height: 34,
      fontWeight: 600,
      px: 0.25,
      backgroundColor: isDark
        ? alpha(theme.palette.background.paper, 0.6)
        : theme.palette.common.white,
      border: `1px solid ${alpha(theme.palette.divider, isDark ? 0.22 : 0.16)}`,
      boxShadow: isDark ? "none" : `0 6px 18px ${alpha("#000", 0.06)}`,
      "& .MuiChip-icon": {
        color: alpha(orange, isDark ? 0.9 : 0.85),
      },
      "& .MuiChip-label": {
        px: 1,
        fontSize: 13,
      },
    };
  };

  const handleQrOpen = () => {
    setQrDialogOpen(true);
    if (targetEmployeeId) dispatch(fetchEmployeeQrCode(targetEmployeeId));
  };

  const handleQrClose = () => {
    setQrDialogOpen(false);
    dispatch(resetQrCode());
  };

  const handleQrDownload = () => {
    if (!qrCodeUrl || !targetEmployeeId) return;
    const a = document.createElement("a");
    a.href = qrCodeUrl;
    a.download = `qr-${targetEmployeeId}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!employeeId && userState === State.success && isProfileMissing) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "80vh",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            p: { xs: 4, sm: 6 },
            border: 1,
            borderColor: "divider",
            maxWidth: 480,
            width: "100%",
            textAlign: "center",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2.5,
            }}
          >
            <Box
              sx={{
                width: 88,
                height: 88,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: (theme) =>
                  alpha(theme.palette.secondary.contrastText, 0.1),
                border: (theme) =>
                  `2px dashed ${alpha(theme.palette.secondary.contrastText, 0.35)}`,
              }}
            >
              <PersonOffIcon
                sx={{
                  fontSize: 40,
                  color: (theme) => theme.palette.secondary.contrastText,
                }}
              />
            </Box>

            <Box>
              <Typography variant="h5" fontWeight={700} gutterBottom>
                Profile Not Found
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ lineHeight: 1.7 }}
              >
                We couldn't find your employee profile yet. Please contact the{" "}
                <Typography
                  component="span"
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: (theme) => theme.palette.secondary.contrastText,
                  }}
                >
                  People Operations
                </Typography>{" "}
                team to set up your profile, then try signing in again.
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 1, pb: 5 }}>
      <Paper elevation={0} sx={(theme) => headerSx(theme)}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2.5}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
        >
          <Stack
            direction="row"
            spacing={2.5}
            alignItems="center"
            sx={{ minWidth: 0, flex: 1 }}
          >
            {employeeState === "loading" ? (
              <>
                <Skeleton
                  variant="circular"
                  width={72}
                  height={72}
                  sx={{ flexShrink: 0 }}
                />
                <Box sx={{ minWidth: 0 }}>
                  <Skeleton width={220} height={44} />
                  <Stack direction="row" spacing={1} sx={{ mt: 1.25 }}>
                    <Skeleton width={90} height={32} sx={{ borderRadius: 4 }} />
                    <Skeleton
                      width={150}
                      height={32}
                      sx={{ borderRadius: 4 }}
                    />
                    <Skeleton
                      width={200}
                      height={32}
                      sx={{ borderRadius: 4 }}
                    />
                    <Skeleton
                      width={130}
                      height={32}
                      sx={{ borderRadius: 4 }}
                    />
                  </Stack>
                </Box>
              </>
            ) : (
              <>
                <Avatar
                  src={employee?.employeeThumbnail ?? undefined}
                  imgProps={{ referrerPolicy: "no-referrer" }}
                  sx={(theme) => avatarSx(theme)}
                >
                  {employee?.firstName?.[0]?.toUpperCase() ?? ""}
                </Avatar>

                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h4" fontWeight={850} noWrap>
                    {employee
                      ? `${employee.firstName} ${employee.lastName}`
                      : ""}
                  </Typography>

                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ mt: 1.25, flexWrap: "wrap", rowGap: 1 }}
                  >
                    {employee?.employeeId && (
                      <Chip
                        size="medium"
                        icon={<BadgeOutlined />}
                        label={`ID: ${employee.employeeId}`}
                        sx={(theme) => chipSx(theme)}
                      />
                    )}

                    {employee?.designation && (
                      <Chip
                        size="medium"
                        icon={<WorkOutline />}
                        label={designationText}
                        sx={(theme) => chipSx(theme)}
                      />
                    )}

                    {employee?.workEmail && (
                      <Chip
                        size="medium"
                        icon={<EmailOutlined />}
                        label={employee.workEmail}
                        sx={(theme) => chipSx(theme)}
                      />
                    )}

                    {employee?.businessUnit && (
                      <Chip
                        size="medium"
                        icon={<BusinessOutlined />}
                        label={employee.businessUnit}
                        sx={(theme) => chipSx(theme)}
                      />
                    )}
                  </Stack>
                </Box>
              </>
            )}
          </Stack>
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            sx={{ alignSelf: "center" }}
          >
            {employee && (
              <Tooltip title={employee.house ? "View QR Code" : "QR code unavailable: no house assigned"}>
                <span>
                  <IconButton
                    color="secondary"
                    onClick={handleQrOpen}
                    disabled={!employee.house}
                    sx={{ p: 0.5 }}
                  >
                    <QrCode2Icon sx={{ fontSize: 32 }} />
                  </IconButton>
                </span>
              </Tooltip>
            )}
            {readOnly &&
              targetEmployeeId &&
              roles.includes(Role.ADMIN) &&
              !location.state?.fromMyTeam && (
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<EditOutlinedIcon />}
                  sx={{ textTransform: "none", whiteSpace: "nowrap" }}
                  onClick={() =>
                    navigate(`/employees/${targetEmployeeId}/edit`)
                  }
                >
                  Edit
                </Button>
              )}
          </Stack>
        </Stack>
      </Paper>
      <Accordion
        defaultExpanded
        sx={{
          borderRadius: 2,
          mt: 2,
          mb: 2,
          boxShadow: 0,
          border: 1,
          borderColor: "divider",
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            borderRadius: 2,
            backgroundColor: "background.paper",
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            General Information
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {employeeState === "loading" ? (
            <Box>
              <Grid container spacing={1.5}>
                {[...Array(20)].map((_, i) => (
                  <Grid item xs={12} sm={6} md={4} key={i}>
                    <Skeleton width={120} height={32} />
                    <Skeleton width={80} height={28} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          ) : employee ? (
            <Box>
              <Grid container rowSpacing={1.5} columnSpacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Employee ID
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.employeeId || "-"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Name
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.firstName} {employee.lastName}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Work Email
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.workEmail}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    EPF
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.epf || "-"}
                  </Typography>
                </Grid>
              </Grid>
              <Grid container rowSpacing={1.5} columnSpacing={3} mt={0.5}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Designation
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {designationText}
                  </Typography>
                </Grid>
                {employee?.externalDesignation && (
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                      External Designation
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {employee.externalDesignation}
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Job Band
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.jobBand ?? "-"}
                  </Typography>
                </Grid>
              </Grid>
              <Grid container rowSpacing={1.5} columnSpacing={3} mt={0.5}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Business Unit
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.businessUnit || "-"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Team
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.team}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Sub Team
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.subTeam || "-"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Unit
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.unit || "N/A"}
                  </Typography>
                </Grid>
              </Grid>
              <Grid container rowSpacing={1.5} columnSpacing={3} mt={0.5}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Company
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.company || "-"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Office
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.office || "-"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Work Location
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.workLocation || "-"}
                  </Typography>
                </Grid>
              </Grid>
              <Grid container rowSpacing={1.5} columnSpacing={3} mt={0.5}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Employment Type
                  </Typography>

                  <Box sx={{ mt: 1 }}>
                    {employee.employmentType ? (
                      <Chip
                        label={employee.employmentType}
                        size="small"
                        variant="outlined"
                        sx={(theme) => ({
                          borderRadius: 999,
                          height: 24,
                          fontWeight: 600,
                          px: 0,
                          color: theme.palette.secondary.contrastText,
                          borderColor: alpha(
                            theme.palette.secondary.contrastText,
                            0.45,
                          ),
                          backgroundColor: alpha(
                            theme.palette.secondary.contrastText,
                            theme.palette.mode === "dark" ? 0.14 : 0.1,
                          ),
                          "& .MuiChip-label": {
                            px: 0.75,
                            py: 0,
                            fontSize: 12,
                            lineHeight: 1,
                          },
                        })}
                      />
                    ) : (
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        -
                      </Typography>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    House
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    {employee.house ? (
                      <Chip
                        label={employee.house}
                        size="small"
                        variant="outlined"
                        sx={(theme) => ({
                          borderRadius: 999,
                          height: 24,
                          fontWeight: 600,
                          px: 0,
                          color: theme.palette.secondary.contrastText,
                          borderColor: alpha(
                            theme.palette.secondary.contrastText,
                            0.45,
                          ),
                          backgroundColor: alpha(
                            theme.palette.secondary.contrastText,
                            theme.palette.mode === "dark" ? 0.14 : 0.1,
                          ),
                          "& .MuiChip-label": {
                            px: 0.75,
                            py: 0,
                            fontSize: 12,
                            lineHeight: 1,
                          },
                        })}
                      />
                    ) : (
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        -
                      </Typography>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Employee Status
                  </Typography>

                  <Box sx={{ mt: 1 }}>
                    {employee.employeeStatus ? (
                      <Chip
                        label={employee.employeeStatus}
                        size="small"
                        variant="outlined"
                        sx={getEmployeeStatusChipStyles(
                          employee.employeeStatus,
                        )}
                      />
                    ) : (
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        -
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
              <Grid container rowSpacing={1.5} columnSpacing={3} mt={0.5}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Start Date
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {formatDate(employee.startDate, "-")}
                  </Typography>
                </Grid>
                {employee.continuousServiceDate && (
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                      Continuous Service Date
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {formatDate(employee.continuousServiceDate, "-")}
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Length of Service
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {serviceText}
                  </Typography>
                </Grid>
                {isPresentOrFuture(employee?.probationEndDate) && (
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                      Probation End Date
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {formatDate(employee.probationEndDate, "N/A")}
                    </Typography>
                  </Grid>
                )}
                {employee.agreementEndDate ? (
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                      Agreement End Date
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {formatDate(employee.agreementEndDate, "-")}
                    </Typography>
                  </Grid>
                ) : null}
              </Grid>
              <Grid container rowSpacing={1.5} columnSpacing={3} mt={0.5}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Lead Email
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.managerEmail || "-"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography
                    color="text.secondary"
                    sx={{ fontWeight: 500, mb: 0.75 }}
                  >
                    Additional Lead Emails
                  </Typography>

                  {employee.additionalManagerEmails ? (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.25,
                      }}
                    >
                      {employee.additionalManagerEmails
                        .split(",")
                        .map((e) => e.trim())
                        .filter(Boolean)
                        .map((email) => (
                          <Typography
                            key={email}
                            variant="h6"
                            sx={{ fontWeight: 600 }}
                          >
                            {email}
                          </Typography>
                        ))}
                    </Box>
                  ) : (
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      -
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Subordinate Count
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {employee.subordinateCount ?? "-"}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Typography color="text.secondary">
              General information not found.
            </Typography>
          )}
        </AccordionDetails>
      </Accordion>
      <Accordion
        defaultExpanded
        sx={{
          borderRadius: 2,
          boxShadow: 0,
          border: 1,
          borderColor: "divider",
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{ borderRadius: 2, backgroundColor: "background.paper" }}
        >
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Personal Information
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {personalInfoState === "loading" && !isSavingChanges ? (
            <Grid container spacing={1.5}>
              {[...Array(15)].map((_, i) => (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  <Skeleton width={120} height={32} />
                  <Skeleton width={80} height={28} />
                </Grid>
              ))}
            </Grid>
          ) : personalInfo ? (
            <Formik
              initialValues={personalInfo}
              validationSchema={readOnly ? undefined : personalInfoSchema}
              enableReinitialize
              onSubmit={async (values) => {
                if (readOnly) return;
                await handleSaveChanges(values);
              }}
            >
              {({
                values,
                handleChange,
                handleBlur,
                errors,
                touched,
                dirty,
                resetForm,
              }) => (
                <Form>
                  <Grid container rowSpacing={1.5} columnSpacing={3} pt={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <ReadOnly label="Title" value={values.title} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <ReadOnly label="First Name" value={values.firstName} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <ReadOnly label="Last Name" value={values.lastName} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <ReadOnly label="Full Name" value={values.fullName} />
                    </Grid>
                  </Grid>
                  <Grid container rowSpacing={1.5} columnSpacing={3} mt={0.5}>
                    <Grid item xs={12} sm={6} md={3}>
                      <ReadOnly label="NIC" value={values.nicOrPassport} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <ReadOnly
                        label="Date of Birth"
                        value={formatDate(values.dob)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <ReadOnly label="Age" value={age} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <ReadOnly label="Gender" value={values.gender} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <ReadOnly
                        label="Nationality"
                        value={values.nationality}
                      />
                    </Grid>
                  </Grid>
                  <Grid container rowSpacing={1.5} columnSpacing={3} mt={0.5}>
                    <Grid item xs={12} sm={6} md={3}>
                      {readOnly ? (
                        <ReadOnly
                          label="Personal Email"
                          value={values.personalEmail}
                        />
                      ) : (
                        <FieldInput
                          name="personalEmail"
                          label="Personal Email"
                          type="email"
                          values={values}
                          handleChange={handleChange}
                          handleBlur={handleBlur}
                          errors={errors}
                          touched={touched}
                          isSavingChanges={isSavingChanges}
                        />
                      )}
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      {readOnly ? (
                        <ReadOnly
                          label="Personal Phone"
                          value={values.personalPhone}
                        />
                      ) : (
                        <FieldInput
                          name="personalPhone"
                          label="Personal Phone"
                          type="tel"
                          values={values}
                          handleChange={handleChange}
                          handleBlur={handleBlur}
                          errors={errors}
                          touched={touched}
                          isSavingChanges={isSavingChanges}
                        />
                      )}
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      {readOnly ? (
                        <ReadOnly
                          label="Resident Number"
                          value={values.residentNumber}
                        />
                      ) : (
                        <FieldInput
                          name="residentNumber"
                          label="Resident Number"
                          type="tel"
                          values={values}
                          handleChange={handleChange}
                          handleBlur={handleBlur}
                          errors={errors}
                          touched={touched}
                          isSavingChanges={isSavingChanges}
                        />
                      )}
                    </Grid>
                  </Grid>
                  <Grid container rowSpacing={1.5} columnSpacing={3} mt={0.5}>
                    <Grid item xs={12} sm={6} md={3}>
                      {readOnly ? (
                        <ReadOnly
                          label="Address Line 1"
                          value={values.addressLine1}
                        />
                      ) : (
                        <FieldInput
                          name="addressLine1"
                          label="Address Line 1"
                          values={values}
                          handleChange={handleChange}
                          handleBlur={handleBlur}
                          errors={errors}
                          touched={touched}
                          isSavingChanges={isSavingChanges}
                        />
                      )}
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      {readOnly ? (
                        <ReadOnly
                          label="Address Line 2"
                          value={values.addressLine2}
                        />
                      ) : (
                        <FieldInput
                          name="addressLine2"
                          label="Address Line 2"
                          values={values}
                          handleChange={handleChange}
                          handleBlur={handleBlur}
                          errors={errors}
                          touched={touched}
                          isSavingChanges={isSavingChanges}
                        />
                      )}
                    </Grid>
                  </Grid>
                  <Grid container rowSpacing={1.5} columnSpacing={3} mt={0.5}>
                    <Grid item xs={12} sm={6} md={3}>
                      {readOnly ? (
                        <ReadOnly label="City" value={values.city} />
                      ) : (
                        <FieldInput
                          name="city"
                          label="City"
                          values={values}
                          handleChange={handleChange}
                          handleBlur={handleBlur}
                          errors={errors}
                          touched={touched}
                          isSavingChanges={isSavingChanges}
                        />
                      )}
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      {readOnly ? (
                        <ReadOnly
                          label="State/Province"
                          value={values.stateOrProvince}
                        />
                      ) : (
                        <FieldInput
                          name="stateOrProvince"
                          label="State/Province"
                          values={values}
                          handleChange={handleChange}
                          handleBlur={handleBlur}
                          errors={errors}
                          touched={touched}
                          isSavingChanges={isSavingChanges}
                        />
                      )}
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      {readOnly ? (
                        <ReadOnly label="Country" value={values.country} />
                      ) : (
                        <FieldInput
                          name="country"
                          label="Country"
                          values={values}
                          handleChange={handleChange}
                          handleBlur={handleBlur}
                          errors={errors}
                          touched={touched}
                          isSavingChanges={isSavingChanges}
                        />
                      )}
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      {readOnly ? (
                        <ReadOnly
                          label="Postal Code"
                          value={values.postalCode}
                        />
                      ) : (
                        <FieldInput
                          name="postalCode"
                          label="Postal Code"
                          values={values}
                          handleChange={handleChange}
                          handleBlur={handleBlur}
                          errors={errors}
                          touched={touched}
                          isSavingChanges={isSavingChanges}
                        />
                      )}
                    </Grid>
                    <Grid item xs={12}>
                      {readOnly ? (
                        <Box sx={{ pt: 2 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              mb: 2,
                            }}
                          >
                            <Typography sx={{ fontWeight: 600 }}>
                              Emergency Contacts (
                              {values.emergencyContacts?.length ?? 0}/4)
                            </Typography>
                          </Box>

                          {!values.emergencyContacts ||
                          values.emergencyContacts.length === 0 ? (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ textAlign: "center", py: 3 }}
                            >
                              No emergency contacts added yet.
                            </Typography>
                          ) : (
                            values.emergencyContacts.map((c, index) => (
                              <Grid
                                container
                                rowSpacing={1.5}
                                columnSpacing={3}
                                key={index}
                                sx={{ mb: 2 }}
                              >
                                <Grid item xs={12} sm={6} md={3}>
                                  <ReadOnly label="Name" value={c?.name} />
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                  <ReadOnly
                                    label="Relationship"
                                    value={c?.relationship}
                                  />
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                  <ReadOnly
                                    label="Telephone"
                                    value={c?.telephone}
                                  />
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                  <ReadOnly label="Mobile" value={c?.mobile} />
                                </Grid>
                              </Grid>
                            ))
                          )}
                        </Box>
                      ) : (
                        <FieldArray name="emergencyContacts">
                          {({ push, remove }) => (
                            <Box sx={{ pt: 2 }}>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  mb: 2,
                                }}
                              >
                                <Typography sx={{ fontWeight: 600 }}>
                                  Emergency Contacts (
                                  {values.emergencyContacts?.length ?? 0}/4)
                                </Typography>
                              </Box>

                              {touched.emergencyContacts &&
                                typeof errors.emergencyContacts ===
                                  "string" && (
                                  <Typography
                                    color="error"
                                    variant="body2"
                                    sx={{ mt: 1, mb: 2 }}
                                  >
                                    {errors.emergencyContacts}
                                  </Typography>
                                )}

                              {!values.emergencyContacts ||
                              values.emergencyContacts.length === 0 ? (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ textAlign: "center", py: 3 }}
                                >
                                  No emergency contacts added yet.
                                </Typography>
                              ) : (
                                values.emergencyContacts.map((_, index) => (
                                  <Grid
                                    container
                                    rowSpacing={1.5}
                                    columnSpacing={3}
                                    key={index}
                                    sx={{ mb: 2 }}
                                  >
                                    <Grid item xs={12} sm={6} md={3}>
                                      <FieldInput
                                        name={`emergencyContacts.${index}.name`}
                                        label="Name"
                                        values={values}
                                        handleChange={handleChange}
                                        handleBlur={handleBlur}
                                        errors={errors}
                                        touched={touched}
                                        isSavingChanges={isSavingChanges}
                                        isRequired
                                      />
                                    </Grid>

                                    <Grid item xs={12} sm={6} md={3}>
                                      <FieldInput
                                        name={`emergencyContacts.${index}.relationship`}
                                        label="Relationship"
                                        values={values}
                                        handleChange={handleChange}
                                        handleBlur={handleBlur}
                                        errors={errors}
                                        touched={touched}
                                        isSavingChanges={isSavingChanges}
                                        isRequired
                                      />
                                    </Grid>

                                    <Grid item xs={12} sm={6} md={3}>
                                      <FieldInput
                                        name={`emergencyContacts.${index}.telephone`}
                                        label="Telephone"
                                        type="tel"
                                        values={values}
                                        handleChange={handleChange}
                                        handleBlur={handleBlur}
                                        errors={errors}
                                        touched={touched}
                                        isSavingChanges={isSavingChanges}
                                      />
                                    </Grid>

                                    <Grid item xs={12} sm={6} md={3}>
                                      <Box
                                        sx={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 1,
                                        }}
                                      >
                                        <FieldInput
                                          name={`emergencyContacts.${index}.mobile`}
                                          label="Mobile"
                                          type="tel"
                                          values={values}
                                          handleChange={handleChange}
                                          handleBlur={handleBlur}
                                          errors={errors}
                                          touched={touched}
                                          isSavingChanges={isSavingChanges}
                                          isRequired
                                        />

                                        <Tooltip
                                          title={
                                            (values.emergencyContacts?.length ??
                                              0) <= 1
                                              ? "At least one emergency contact is required"
                                              : "Remove contact"
                                          }
                                        >
                                          <span>
                                            <IconButton
                                              color="error"
                                              size="small"
                                              onClick={() =>
                                                (values.emergencyContacts
                                                  ?.length ?? 0) > 1 &&
                                                remove(index)
                                              }
                                              disabled={
                                                isSavingChanges ||
                                                (values.emergencyContacts
                                                  ?.length ?? 0) === 1
                                              }
                                              sx={{ flexShrink: 0 }}
                                            >
                                              <RemoveCircleOutlineIcon fontSize="small" />
                                            </IconButton>
                                          </span>
                                        </Tooltip>
                                      </Box>
                                    </Grid>
                                  </Grid>
                                ))
                              )}

                              <>
                                <Button
                                  variant="outlined"
                                  color="secondary"
                                  startIcon={<AddCircleOutlineIcon />}
                                  sx={{ textTransform: "none" }}
                                  onClick={() => {
                                    push({
                                      name: "",
                                      relationship: "",
                                      telephone: "",
                                      mobile: "",
                                    });
                                    setShouldRequireEmergencyContacts(true);
                                  }}
                                  disabled={
                                    isSavingChanges ||
                                    (values.emergencyContacts?.length ?? 0) >= 4
                                  }
                                >
                                  Add Contact
                                </Button>

                                {(values.emergencyContacts?.length ?? 0) >=
                                  4 && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                      display: "block",
                                      textAlign: "center",
                                      mt: 1,
                                    }}
                                  >
                                    Maximum 4 emergency contacts reached.
                                  </Typography>
                                )}
                              </>
                            </Box>
                          )}
                        </FieldArray>
                      )}
                    </Grid>

                    {!readOnly && (
                      <Grid item xs={12}>
                        {/* --- Action Buttons --- */}
                        <Box
                          sx={{
                            mt: 3,
                            width: "100%",
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 2,
                          }}
                        >
                          <Button
                            startIcon={<RestartAltIcon />}
                            sx={{ textTransform: "none" }}
                            variant="outlined"
                            color="primary"
                            onClick={() => {
                              handleDiscardChanges(resetForm);
                            }}
                            disabled={isSavingChanges || !dirty}
                          >
                            Discard Changes
                          </Button>
                          <Button
                            startIcon={<SaveIcon />}
                            sx={{ textTransform: "none" }}
                            variant="contained"
                            color="secondary"
                            type="submit"
                            disabled={isSavingChanges || !dirty}
                          >
                            {isSavingChanges ? "Saving..." : "Save Changes"}
                          </Button>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </Form>
              )}
            </Formik>
          ) : (
            <Typography color="text.secondary">
              Personal Information not found.
            </Typography>
          )}
        </AccordionDetails>
      </Accordion>

      <Dialog
        open={qrDialogOpen}
        onClose={handleQrClose}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Employee QR Code
          {employee?.workEmail && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {employee.workEmail}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {qrCodeState === State.loading && (
            <Skeleton
              variant="rectangular"
              width={qrImageNaturalSize ?? 256}
              height={qrImageNaturalSize ?? 256}
            />
          )}
          {qrCodeState === State.success && qrCodeUrl && (
            <img
              src={qrCodeUrl}
              alt="Employee QR Code"
              style={{ maxWidth: "100%", display: "block", borderRadius: 12 }}
              onLoad={(e) => {
                const img = e.target as HTMLImageElement;
                if (img.naturalWidth) setQrImageNaturalSize(img.naturalWidth);
              }}
            />
          )}
          {qrCodeState === State.failed && (
            <Typography color="error">Failed to load QR code.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          {qrCodeState === State.success && qrCodeUrl && (
            <Button
              startIcon={<FileDownloadOutlinedIcon />}
              onClick={handleQrDownload}
              sx={{ textTransform: "none" }}
            >
              Download
            </Button>
          )}
          <Button onClick={handleQrClose} sx={{ textTransform: "none" }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
