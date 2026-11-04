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

import { ConfirmationType, EmployeeStatus, State } from "@/types/types";
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
  useTheme,
} from "@mui/material";
import IconButton from "@mui/material/IconButton";
import type { Theme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import {
  Employee,
  fetchEmployee,
  fetchEmployeeQrCode,
  resetEmployee,
  resetQrCode,
} from "@root/src/slices/employeeSlice/employee";
import {
  fetchEmployeeHistory,
  resetEmployeeHistory,
} from "@root/src/slices/employeeSlice/employeeHistory";
import {
  fetchScheduledChanges,
  resetScheduledChanges,
} from "@root/src/slices/employeeSlice/scheduledChanges";
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
  formatDaysUntil,
  isPresentOrFuture,
} from "@root/src/utils/utils";
import {
  EMAIL_PATTERN,
  PHONE_PATTERN,
  stripInvisibleCharacters,
  withoutInvisibleCharacters,
} from "@utils/inputRules";
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
import { useLocation } from "react-router-dom";
import { array, object, string } from "yup";
import { Role, selectRoles } from "@slices/authSlice/auth";
import { useAppDispatch, useAppSelector } from "@slices/store";
import EmployeeHistory from "@component/employeeHistory/EmployeeHistory";
import FieldValue, { FieldLabel } from "@view/me/fieldHistory/FieldValue";
import PendingChangesBanner from "@view/me/sectionEdit/PendingChangesBanner";
import { AUDIT_FIELDS } from "@view/me/fieldHistory/fields";
import PeopleChip, { PeopleChipList } from "@component/PeopleChip/PeopleChip";
import EditableSection from "@view/me/sectionEdit/EditableSection";
import GeneralInfoFields from "@view/me/sectionEdit/GeneralInfoFields";
import PersonalInfoFields from "@view/me/sectionEdit/PersonalInfoFields";
import ResignEmployeeDialog from "@view/me/sectionEdit/ResignEmployeeDialog";
import ResignationFields from "@view/me/sectionEdit/ResignationFields";
import { SectionEditProvider } from "@view/me/sectionEdit/SectionEditProvider";

const ReadOnly = ({
  label,
  value,
  historyField,
  onViewAll,
}: {
  label: string;
  value?: string | number | null;
  /** Audit column name; omitted for values the backend does not track. */
  historyField?: string;
  onViewAll?: () => void;
}) => (
  <>
    <FieldLabel
      label={label}
      historyField={historyField}
      onViewAll={onViewAll}
    />
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

/**
 * The read-only rendering of an employee's personal information, shown when the
 * admin-facing section is not in edit mode.
 */
const PersonalInfoReadOnly = ({
  personalInfo,
  age,
  canViewFieldHistory,
  onViewAll,
}: {
  personalInfo: EmployeePersonalInfo | null;
  age: number | null;
  canViewFieldHistory: boolean;
  onViewAll: () => void;
}) => {
  if (!personalInfo) {
    return (
      <Typography color="text.secondary">
        Personal information not found.
      </Typography>
    );
  }

  // `historyField` is omitted where the backend does not track the column: Full Name is
  // generated from first and last name, and Age is computed from the date of birth, so
  // neither is a stored value that could have changed on its own.
  const rows: {
    label: string;
    value: string | number | null;
    historyField?: string;
  }[] = [
    {
      label: "Title",
      value: personalInfo.title,
      historyField: AUDIT_FIELDS.title,
    },
    {
      label: "First Name",
      value: personalInfo.firstName,
      historyField: AUDIT_FIELDS.firstName,
    },
    {
      label: "Last Name",
      value: personalInfo.lastName,
      historyField: AUDIT_FIELDS.lastName,
    },
    { label: "Full Name", value: personalInfo.fullName },
    {
      label: "NIC/Passport",
      value: personalInfo.nicOrPassport,
      historyField: AUDIT_FIELDS.nicOrPassport,
    },
    {
      label: "Date of Birth",
      value: formatDate(personalInfo.dob, "-"),
      historyField: AUDIT_FIELDS.dob,
    },
    { label: "Age", value: age },
    {
      label: "Gender",
      value: personalInfo.gender,
      historyField: AUDIT_FIELDS.gender,
    },
    {
      label: "Nationality",
      value: personalInfo.nationality,
      historyField: AUDIT_FIELDS.nationality,
    },
    {
      label: "Personal Email",
      value: personalInfo.personalEmail,
      historyField: AUDIT_FIELDS.personalEmail,
    },
    {
      label: "Personal Phone",
      value: personalInfo.personalPhone,
      historyField: AUDIT_FIELDS.personalPhone,
    },
    {
      label: "Resident Number",
      value: personalInfo.residentNumber,
      historyField: AUDIT_FIELDS.residentNumber,
    },
    {
      label: "Address Line 1",
      value: personalInfo.addressLine1,
      historyField: AUDIT_FIELDS.addressLine1,
    },
    {
      label: "Address Line 2",
      value: personalInfo.addressLine2,
      historyField: AUDIT_FIELDS.addressLine2,
    },
    {
      label: "City",
      value: personalInfo.city,
      historyField: AUDIT_FIELDS.city,
    },
    {
      label: "State/Province",
      value: personalInfo.stateOrProvince,
      historyField: AUDIT_FIELDS.stateOrProvince,
    },
    {
      label: "Postal Code",
      value: personalInfo.postalCode,
      historyField: AUDIT_FIELDS.postalCode,
    },
    {
      label: "Country",
      value: personalInfo.country,
      historyField: AUDIT_FIELDS.country,
    },
  ];

  return (
    <Box>
      <Grid container rowSpacing={1.5} columnSpacing={3}>
        {rows.map((row) => (
          <Grid item xs={12} sm={6} md={3} key={row.label}>
            <ReadOnly
              label={row.label}
              value={row.value}
              historyField={canViewFieldHistory ? row.historyField : undefined}
              onViewAll={onViewAll}
            />
          </Grid>
        ))}
      </Grid>
      {(personalInfo.emergencyContacts?.length ?? 0) > 0 && (
        <Box sx={{ mt: 3 }}>
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
            Emergency Contacts
          </Typography>
          <Grid container rowSpacing={1.5} columnSpacing={3}>
            {(personalInfo.emergencyContacts ?? []).map((contact, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <ReadOnly
                  label={contact.relationship || `Contact ${index + 1}`}
                  value={[contact.name, contact.mobile, contact.telephone]
                    .filter(Boolean)
                    .join(" · ")}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

/**
 * The "Resignation Details" section: last day in office, final day of employment and
 * reason — the three leaver fields an admin actually sets.
 *
 * A top-level collapsible section sitting between General and Personal Information,
 * mirroring the grouping and title of the edit form's Resignation Details section so
 * the fields that are edited together are also read together.
 *
 * Renders only for Left and Marked leaver, and only once at least one field is set —
 * an active employee has no resignation record, so the section's presence is itself
 * the signal. A missing individual field within a shown section is rendered as a dash.
 */
const ResignationDetails = ({
  employee,
  personalInfo,
  employeeId,
  canEdit,
  canViewFieldHistory,
  onViewAll,
}: {
  employee: Employee | null;
  personalInfo: EmployeePersonalInfo | null;
  employeeId: string | undefined;
  canEdit: boolean;
  canViewFieldHistory: boolean;
  onViewAll: () => void;
}) => {
  const theme = useTheme();
  const status = employee?.employeeStatus;

  if (
    !employee ||
    (status !== EmployeeStatus.Left && status !== EmployeeStatus.MarkedLeaver)
  ) {
    return null;
  }

  const hasAnyDetail = Boolean(
    employee.finalDayInOffice ||
    employee.finalDayOfEmployment ||
    employee.resignationReason,
  );

  // An admin who can edit keeps the section even when every field is empty: it is the
  // only place to re-enter details that were cleared. A read-only viewer sees nothing.
  if (!hasAnyDetail && !canEdit) return null;

  // resignationDate is deliberately not shown: it is an auto-set, write-once timestamp
  // recording when the leaver record was created, not a date anyone chose. Displaying it
  // beside these dates invites reading it as the date the employee resigned.
  const dates = [
    {
      label: "Last Day in Office",
      value: employee.finalDayInOffice,
      historyField: AUDIT_FIELDS.finalDayInOffice,
    },
    {
      label: "Final Day of Employment",
      value: employee.finalDayOfEmployment,
      historyField: AUDIT_FIELDS.finalDayOfEmployment,
    },
  ];

  return (
    <EditableSection
      title="Resignation Details"
      section="resignation"
      employee={employee}
      personalInfo={personalInfo}
      employeeId={employeeId}
      canEdit={canEdit}
      defaultExpanded
      renderFields={(isSaving) => <ResignationFields isSaving={isSaving} />}
      renderReadOnly={() => (
        <Grid container rowSpacing={1.5} columnSpacing={3}>
          {dates.map((date) => {
            const daysUntil = formatDaysUntil(date.value);
            return (
              <Grid item xs={12} sm={6} md={3} key={date.label}>
                <FieldLabel
                  label={date.label}
                  historyField={
                    canViewFieldHistory ? date.historyField : undefined
                  }
                  onViewAll={onViewAll}
                />
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}
                >
                  {formatDate(date.value, "-")}
                  {daysUntil && (
                    <Box
                      component="span"
                      sx={{
                        ml: 0.75,
                        fontSize: 12.5,
                        fontWeight: 400,
                        color: theme.palette.text.secondary,
                      }}
                    >
                      {daysUntil}
                    </Box>
                  )}
                </Typography>
              </Grid>
            );
          })}
          <Grid item xs={12} sm={6} md={3}>
            <FieldLabel
              label="Resignation Reason"
              historyField={
                canViewFieldHistory ? AUDIT_FIELDS.resignationReason : undefined
              }
              onViewAll={onViewAll}
            />
            {/* A reason may be free text rather than one of the predefined options,
              so it wraps instead of being clipped to one line. */}
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, overflowWrap: "anywhere" }}
            >
              {employee.resignationReason || "-"}
            </Typography>
          </Grid>
        </Grid>
      )}
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
          : normalized === "new joiner"
            ? theme.palette.info.main
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

/**
 * Employee profile page: the signed-in user's own profile at `/`, or another employee's at
 * `/employees/:employeeId`.
 *
 * @param employeeId Employee to show; defaults to the signed-in user
 * @param readOnly Set when an admin views someone else's profile, which renders the
 * personal-info form read-only and offers inline section editing instead
 */
export default function Me({
  employeeId,
  readOnly = false,
}: { employeeId?: string; readOnly?: boolean } = {}) {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { showConfirmation } = useConfirmationModalContext();
  const roles = useAppSelector(selectRoles);
  const {
    userInfo,
    state: userState,
    isProfileMissing,
  } = useAppSelector((state) => state.user);
  const targetEmployeeId = employeeId ?? userInfo?.employeeId;
  // Personal information (NIC/passport, date of birth, gender, home address, personal contact
  // details, emergency contacts) is admin-or-self only, matching the backend. A lead viewing a
  // team member sees their work details but not this, so the section is not rendered and never
  // requested — the request would 403 and surface an error snackbar.
  // Self means the same person, not merely the absence of a route param: /employees/:employeeId
  // is open to LEAD, so a lead reaching their own detail page directly is still self and keeps
  // the section the backend would serve them.
  const isSelfView = !employeeId || employeeId === userInfo?.employeeId;
  const canViewPersonalInfo =
    isSelfView ||
    roles.includes(Role.ADMIN) ||
    roles.includes(Role.EMPLOYEE_VIEW) ||
    roles.includes(Role.RESIGNATION);
  // Inline section editing is offered wherever the wizard's Edit button is: an admin
  // viewing another employee's profile. `readOnly` marks that admin-viewing-someone-else
  // case (it gates the read-only rendering of the personal-info form), and the My Team
  // route is excluded because a lead reaching a report's profile is not an admin edit.
  const canEditSections =
    readOnly &&
    !!targetEmployeeId &&
    roles.includes(Role.ADMIN) &&
    !location.state?.fromMyTeam;
  // The resignation role edits that one section and nothing else, so it is a separate
  // flag rather than a widening of canEditSections — which also gates General and
  // Personal Information.
  const canEditResignation =
    canEditSections ||
    (readOnly &&
      !!targetEmployeeId &&
      roles.includes(Role.RESIGNATION) &&
      !location.state?.fromMyTeam);
  // Per-field history is offered on someone else's profile, not on a person's own.
  // The backend strips attribution from a self-view, so the popover would report when
  // a field changed but never by whom — a half-answer beside every field.
  const canViewFieldHistory = !isSelfView && !!targetEmployeeId;
  // Mirrors canReadAnyEmployee on the backend. A lead is not in it: lead status is
  // resolved from the database rather than an IAM group, so GET /scheduled-changes
  // refuses them. Fetching anyway would 403 on every team member's profile and raise an
  // error snackbar over a page that is otherwise working — the same reason the personal
  // information section above is never requested when it would be refused.
  //
  // The history fetch below keeps the wider gate: that endpoint does serve leads, with a
  // reduced projection, so their per-field history icons are unaffected.
  const canViewScheduledChanges =
    canViewFieldHistory &&
    (roles.includes(Role.ADMIN) ||
      roles.includes(Role.EMPLOYEE_VIEW) ||
      roles.includes(Role.RESIGNATION));
  const historyRef = useRef<HTMLDivElement | null>(null);
  // Opens the timeline and brings it into view, so "View full history" in a field
  // popover lands the reader on the section rather than expanding it offscreen.
  const openFullHistory = () => {
    setHistoryExpanded(true);
    setHasExpandedHistory(true);
    window.setTimeout(
      () =>
        historyRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      0,
    );
  };

  const pendingChanges = useAppSelector(
    (state) => state.scheduledChanges.changes,
  );
  const { employee, state: employeeState } = useAppSelector(
    (state) => state.employee,
  );
  // Resigning an active employee is a different action from correcting an existing
  // departure: it asks only for the three details, and the backend derives the status.
  // The Resignation Details section stays as it is — there is nothing to correct until
  // someone has actually left.
  const canResignEmployee =
    canEditResignation && employee?.employeeStatus === EmployeeStatus.Active;
  const [isResignDialogOpen, setResignDialogOpen] = useState(false);
  const { personalInfo, state: personalInfoState } = useAppSelector(
    (state) => state.employeePersonalInfo,
  );
  const [isSavingChanges, setSavingChanges] = useState(false);
  // Two pieces of state, deliberately: `historyExpanded` toggles with the
  // accordion, while `hasExpandedHistory` latches on first open so the
  // timeline stays mounted (and is not re-fetched) across collapse/expand.
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [hasExpandedHistory, setHasExpandedHistory] = useState(false);
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
    ? calculateServiceLength(
        serviceStartDate,
        employee?.finalDayOfEmployment ?? null,
      )
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

  // Email and phone use the backend's own patterns, checked against the value with any
  // invisible characters removed — which is what savePersonalInfo sends.
  const personalInfoSchema = object().shape({
    personalEmail: string()
      .nullable()
      .matches(EMAIL_PATTERN, "Invalid email format")
      .max(254, "Email must be at most 254 characters")
      .transform(withoutInvisibleCharacters)
      .transform((value) => (value === "" ? null : value)),
    personalPhone: string()
      .nullable()
      .matches(PHONE_PATTERN, "Invalid personal phone number format")
      .transform(withoutInvisibleCharacters)
      .transform((value) => (value === "" ? null : value)),
    residentNumber: string()
      .nullable()
      .matches(PHONE_PATTERN, "Invalid resident number format")
      .transform(withoutInvisibleCharacters)
      .transform((value) => (value === "" ? null : value)),
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
    if (canViewPersonalInfo) {
      dispatch(fetchEmployeePersonalInfo(targetEmployeeId));
    }
    // Fetched with the record rather than when the History section is first opened,
    // because the per-field controls need it too and one response covers every field:
    // twenty controls cost this single request. Cleared on unmount so the next
    // employee's profile never shows a previous timeline while its own fetch is in
    // flight.
    if (canViewFieldHistory) {
      dispatch(fetchEmployeeHistory(targetEmployeeId));
    }
    // Read with the record so the profile can say what is queued against it. A
    // change scheduled months ahead is invisible otherwise, and the record reads as
    // settled when it is not.
    if (canViewScheduledChanges) {
      dispatch(fetchScheduledChanges(targetEmployeeId));
    }
  }, [
    targetEmployeeId,
    canViewPersonalInfo,
    canViewFieldHistory,
    canViewScheduledChanges,
    dispatch,
  ]);

  // Keyed on the employee, not just on unmount: when the profile switches without
  // remounting, the previous employee's rows would otherwise stay on screen until the
  // new fetch resolves.
  useEffect(() => {
    return () => {
      dispatch(resetEmployeeHistory());
      dispatch(resetScheduledChanges());
    };
  }, [dispatch, targetEmployeeId]);

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
        // An emptied field goes out as "", which the backend reads as "clear it"; an
        // untouched empty one stays null, meaning "leave it". Invisible characters a paste
        // brought along are removed, since the backend refuses them.
        const withoutInvisible = (value: string | null) =>
          value === null ? null : stripInvisibleCharacters(value);
        const dataToSave = {
          personalEmail: withoutInvisible(values.personalEmail),
          personalPhone: withoutInvisible(values.personalPhone),
          residentNumber: withoutInvisible(values.residentNumber),
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
      // The same 16px each section below carries, so the header spaces from whatever
      // follows it the way the sections space from each other.
      mb: 2,
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

  // Sits in the header beside the chips, so it borrows their surface, radius and
  // shadow rather than arriving as a default outlined button. Slightly taller than
  // a chip (38 vs 34) so it still reads as the actionable element in the row.
  const resignButtonSx = (theme: Theme) => {
    const isDark = theme.palette.mode === "dark";
    const orange = theme.palette.secondary.contrastText;

    return {
      textTransform: "none",
      whiteSpace: "nowrap",
      borderRadius: 999,
      height: 38,
      px: 2,
      fontWeight: 600,
      fontSize: 13,
      color: orange,
      backgroundColor: isDark
        ? alpha(theme.palette.background.paper, 0.6)
        : theme.palette.common.white,
      border: `1px solid ${alpha(orange, isDark ? 0.45 : 0.35)}`,
      boxShadow: isDark ? "none" : `0 6px 18px ${alpha("#000", 0.06)}`,
      "&:hover": {
        backgroundColor: alpha(orange, isDark ? 0.16 : 0.08),
        borderColor: alpha(orange, isDark ? 0.7 : 0.55),
        boxShadow: isDark ? "none" : `0 6px 18px ${alpha("#000", 0.08)}`,
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
    <SectionEditProvider>
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
                      <Skeleton
                        width={90}
                        height={32}
                        sx={{ borderRadius: 4 }}
                      />
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
                      {employee?.employeeStatus && (
                        <Chip
                          size="medium"
                          variant="outlined"
                          label={employee.employeeStatus}
                          sx={(theme) => ({
                            ...getEmployeeStatusChipStyles(
                              employee.employeeStatus,
                            )(theme),
                            height: 34,
                            "& .MuiChip-label": {
                              px: 1,
                              fontSize: 13,
                              fontWeight: 700,
                              lineHeight: 1,
                              textTransform: "capitalize",
                            },
                          })}
                        />
                      )}

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
              {canResignEmployee && (
                <Button
                  variant="outlined"
                  startIcon={<PersonOffIcon />}
                  onClick={() => setResignDialogOpen(true)}
                  sx={(theme) => resignButtonSx(theme)}
                >
                  Resign
                </Button>
              )}
              {employee && (
                <Tooltip
                  title={
                    employee.house
                      ? "View QR Code"
                      : "QR code unavailable: no house assigned"
                  }
                >
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
            </Stack>
          </Stack>
        </Paper>
        {targetEmployeeId && (
          <PendingChangesBanner
            employeeId={targetEmployeeId}
            changes={pendingChanges}
            canCancel={canEditSections}
          />
        )}
        <EditableSection
          title="General Information"
          section="general"
          employee={employee}
          personalInfo={personalInfo}
          employeeId={targetEmployeeId}
          canEdit={canEditSections}
          defaultExpanded
          renderFields={(isSaving) => <GeneralInfoFields isSaving={isSaving} />}
          renderReadOnly={() => (
            <>
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
                      <FieldValue
                        label="Employee ID"
                        value={employee.employeeId || "-"}
                        historyField={
                          canViewFieldHistory
                            ? AUDIT_FIELDS.employeeId
                            : undefined
                        }
                        onViewAll={openFullHistory}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography
                        color="text.secondary"
                        sx={{ fontWeight: 500 }}
                      >
                        Name
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {employee.firstName} {employee.lastName}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <FieldValue
                        label="Work Email"
                        value={employee.workEmail}
                        historyField={
                          canViewFieldHistory
                            ? AUDIT_FIELDS.workEmail
                            : undefined
                        }
                        onViewAll={openFullHistory}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <FieldValue
                        label="EPF"
                        value={employee.epf || "-"}
                        historyField={
                          canViewFieldHistory ? AUDIT_FIELDS.epf : undefined
                        }
                        onViewAll={openFullHistory}
                      />
                    </Grid>
                  </Grid>
                  <Grid container rowSpacing={1.5} columnSpacing={3} mt={0.5}>
                    <Grid item xs={12} sm={6} md={3}>
                      <FieldValue
                        label="Designation"
                        value={designationText}
                        // The backend composes this value from the designation, the
                        // secondary job title and the job role, so its history covers all
                        // three. Filtering to the designation alone would show nothing
                        // when one of the other two is what changed on screen.
                        historyField={
                          canViewFieldHistory
                            ? [
                                AUDIT_FIELDS.designation,
                                AUDIT_FIELDS.secondaryJobTitle,
                                AUDIT_FIELDS.jobRole,
                              ]
                            : undefined
                        }
                        onViewAll={openFullHistory}
                      />
                    </Grid>
                    {employee?.externalDesignation && (
                      <Grid item xs={12} sm={6} md={3}>
                        <FieldValue
                          label="External Designation"
                          value={employee.externalDesignation}
                          historyField={
                            canViewFieldHistory
                              ? AUDIT_FIELDS.externalDesignation
                              : undefined
                          }
                          onViewAll={openFullHistory}
                        />
                      </Grid>
                    )}
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography
                        color="text.secondary"
                        sx={{ fontWeight: 500 }}
                      >
                        Job Band
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {employee.jobBand ?? "-"}
                      </Typography>
                    </Grid>
                  </Grid>
                  <Grid container rowSpacing={1.5} columnSpacing={3} mt={0.5}>
                    <Grid item xs={12} sm={6} md={3}>
                      <FieldValue
                        label="Business Unit"
                        value={employee.businessUnit || "-"}
                        historyField={
                          canViewFieldHistory
                            ? AUDIT_FIELDS.businessUnit
                            : undefined
                        }
                        onViewAll={openFullHistory}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <FieldValue
                        label="Team"
                        value={employee.team}
                        historyField={
                          canViewFieldHistory ? AUDIT_FIELDS.team : undefined
                        }
                        onViewAll={openFullHistory}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <FieldValue
                        label="Sub Team"
                        value={employee.subTeam || "-"}
                        historyField={
                          canViewFieldHistory ? AUDIT_FIELDS.subTeam : undefined
                        }
                        onViewAll={openFullHistory}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <FieldValue
                        label="Unit"
                        value={employee.unit || "N/A"}
                        historyField={
                          canViewFieldHistory ? AUDIT_FIELDS.unit : undefined
                        }
                        onViewAll={openFullHistory}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={6}>
                      <FieldLabel
                        label="Leadership Attributes"
                        historyField={
                          canViewFieldHistory
                            ? AUDIT_FIELDS.leadershipGroup
                            : undefined
                        }
                        onViewAll={openFullHistory}
                      />
                      {(() => {
                        // Comma-joined by the backend's GROUP_CONCAT, not a real
                        // array — split before rendering, matching how
                        // additionalManagerEmails is handled elsewhere in this file.
                        const leadershipGroupNames = (
                          employee.leadershipGroups ?? ""
                        )
                          .split(",")
                          .map((name) => name.trim())
                          .filter((name) => name);
                        return leadershipGroupNames.length > 0 ? (
                          <Box
                            sx={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 0.875,
                              mt: 1,
                            }}
                          >
                            {leadershipGroupNames.map((name) => (
                              <Chip key={name} label={name} size="small" />
                            ))}
                          </Box>
                        ) : (
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            -
                          </Typography>
                        );
                      })()}
                    </Grid>
                  </Grid>
                  <Grid container rowSpacing={1.5} columnSpacing={3} mt={0.5}>
                    <Grid item xs={12} sm={6} md={3}>
                      <FieldValue
                        label="Company"
                        value={employee.company || "-"}
                        historyField={
                          canViewFieldHistory ? AUDIT_FIELDS.company : undefined
                        }
                        onViewAll={openFullHistory}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <FieldValue
                        label="Office"
                        value={employee.office || "-"}
                        historyField={
                          canViewFieldHistory ? AUDIT_FIELDS.office : undefined
                        }
                        onViewAll={openFullHistory}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <FieldValue
                        label="Work Location"
                        value={employee.workLocation || "-"}
                        historyField={
                          canViewFieldHistory
                            ? AUDIT_FIELDS.workLocation
                            : undefined
                        }
                        onViewAll={openFullHistory}
                      />
                    </Grid>
                  </Grid>
                  <Grid container rowSpacing={1.5} columnSpacing={3} mt={0.5}>
                    <Grid item xs={12} sm={6} md={3}>
                      <FieldLabel
                        label="Employment Type"
                        historyField={
                          canViewFieldHistory
                            ? AUDIT_FIELDS.employmentType
                            : undefined
                        }
                        onViewAll={openFullHistory}
                      />

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
                      <FieldLabel
                        label="House"
                        historyField={
                          canViewFieldHistory ? AUDIT_FIELDS.house : undefined
                        }
                        onViewAll={openFullHistory}
                      />
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
                      <FieldLabel
                        label="Employee Status"
                        historyField={
                          canViewFieldHistory
                            ? AUDIT_FIELDS.employeeStatus
                            : undefined
                        }
                        onViewAll={openFullHistory}
                      />

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
                      <FieldLabel
                        label="Start Date"
                        historyField={
                          canViewFieldHistory
                            ? AUDIT_FIELDS.startDate
                            : undefined
                        }
                        onViewAll={openFullHistory}
                      />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {formatDate(employee.startDate, "-")}
                      </Typography>
                    </Grid>
                    {employee.continuousServiceDate && (
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography
                          color="text.secondary"
                          sx={{ fontWeight: 500 }}
                        >
                          Continuous Service Date
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {formatDate(employee.continuousServiceDate, "-")}
                        </Typography>
                      </Grid>
                    )}
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography
                        color="text.secondary"
                        sx={{ fontWeight: 500 }}
                      >
                        Length of Service
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {serviceText}
                      </Typography>
                    </Grid>
                    {isPresentOrFuture(employee?.probationEndDate) && (
                      <Grid item xs={12} sm={6} md={3}>
                        <FieldLabel
                          label="Probation End Date"
                          historyField={
                            canViewFieldHistory
                              ? AUDIT_FIELDS.probationEndDate
                              : undefined
                          }
                          onViewAll={openFullHistory}
                        />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {formatDate(employee.probationEndDate, "N/A")}
                        </Typography>
                      </Grid>
                    )}
                    {employee.agreementEndDate ? (
                      <Grid item xs={12} sm={6} md={3}>
                        <FieldLabel
                          label="Agreement End Date"
                          historyField={
                            canViewFieldHistory
                              ? AUDIT_FIELDS.agreementEndDate
                              : undefined
                          }
                          onViewAll={openFullHistory}
                        />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {formatDate(employee.agreementEndDate, "-")}
                        </Typography>
                      </Grid>
                    ) : null}
                  </Grid>
                  <Grid container rowSpacing={1.5} columnSpacing={3} mt={0.5}>
                    <Grid item xs={12} sm={6} md={3}>
                      <FieldLabel
                        label="Lead"
                        mb={0.75}
                        historyField={
                          canViewFieldHistory ? AUDIT_FIELDS.manager : undefined
                        }
                        onViewAll={openFullHistory}
                      />
                      {employee.managerEmail ? (
                        <PeopleChip email={employee.managerEmail} size="lg" />
                      ) : (
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          -
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <FieldLabel
                        label="Additional Leads"
                        mb={0.75}
                        historyField={
                          canViewFieldHistory
                            ? AUDIT_FIELDS.additionalManager
                            : undefined
                        }
                        onViewAll={openFullHistory}
                      />

                      {employee.additionalManagerEmails ? (
                        <PeopleChipList
                          emails={employee.additionalManagerEmails}
                        />
                      ) : (
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          -
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography
                        color="text.secondary"
                        sx={{ fontWeight: 500 }}
                      >
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
            </>
          )}
        />
        <ResignationDetails
          canViewFieldHistory={canViewFieldHistory}
          onViewAll={openFullHistory}
          employee={employee}
          personalInfo={personalInfo}
          employeeId={targetEmployeeId}
          canEdit={canEditResignation}
        />
        {/* An admin editing another employee gets the full personal-information editor,
            matching what the onboarding wizard lets them change. The existing form below
            stays for every other viewer: it is the self-service one, where the identity
            fields are deliberately not editable. */}
        {canViewPersonalInfo && canEditSections && (
          <EditableSection
            title="Personal Information"
            section="personal"
            employee={employee}
            personalInfo={personalInfo}
            employeeId={targetEmployeeId}
            canEdit
            renderFields={(isSaving) => (
              <PersonalInfoFields isSaving={isSaving} />
            )}
            renderReadOnly={() => (
              <PersonalInfoReadOnly
                personalInfo={personalInfo}
                age={age}
                canViewFieldHistory={canViewFieldHistory}
                onViewAll={openFullHistory}
              />
            )}
          />
        )}
        {canViewPersonalInfo && !canEditSections && (
          <Accordion
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
                          <ReadOnly
                            label="First Name"
                            value={values.firstName}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <ReadOnly label="Last Name" value={values.lastName} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <ReadOnly label="Full Name" value={values.fullName} />
                        </Grid>
                      </Grid>
                      <Grid
                        container
                        rowSpacing={1.5}
                        columnSpacing={3}
                        mt={0.5}
                      >
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
                      <Grid
                        container
                        rowSpacing={1.5}
                        columnSpacing={3}
                        mt={0.5}
                      >
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
                      <Grid
                        container
                        rowSpacing={1.5}
                        columnSpacing={3}
                        mt={0.5}
                      >
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
                      <Grid
                        container
                        rowSpacing={1.5}
                        columnSpacing={3}
                        mt={0.5}
                      >
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
                                      <ReadOnly
                                        label="Mobile"
                                        value={c?.mobile}
                                      />
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
                                                (values.emergencyContacts
                                                  ?.length ?? 0) <= 1
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
                                        (values.emergencyContacts?.length ??
                                          0) >= 4
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
        )}

        <Accordion
          ref={historyRef}
          expanded={historyExpanded}
          onChange={(_, expanded) => {
            setHistoryExpanded(expanded);
            if (expanded) setHasExpandedHistory(true);
          }}
          sx={{
            borderRadius: 2,
            mt: 2,
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
              History
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {hasExpandedHistory && targetEmployeeId && (
              <EmployeeHistory employeeId={targetEmployeeId} />
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
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
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
        {targetEmployeeId && employee && (
          <ResignEmployeeDialog
            open={isResignDialogOpen}
            employeeId={targetEmployeeId}
            employeeName={`${employee.firstName} ${employee.lastName}`.trim()}
            onClose={() => setResignDialogOpen(false)}
          />
        )}
      </Box>
    </SectionEditProvider>
  );
}
