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
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { EmployeeStatus } from "@/types/types";
import { ResignationReasons } from "@config/constant";
import { canonicalizeReason } from "@view/employees/onboarding/singleOnboarding/steps/resignationReason.utils";

interface ResignationDialogProps {
  open: boolean;
  employeeName: string;
  /** Current values, so an existing resignation can be corrected rather than re-entered. */
  initial: {
    employeeStatus: EmployeeStatus;
    finalDayInOffice: string | null;
    finalDayOfEmployment: string | null;
    resignationReason: string | null;
  };
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: {
    employeeStatus: EmployeeStatus;
    finalDayInOffice: string;
    finalDayOfEmployment: string;
    resignationReason: string;
  }) => void;
}

/** The two statuses the resignation endpoint accepts. */
const LEAVER_STATUSES = [
  EmployeeStatus.MarkedLeaver,
  EmployeeStatus.Left,
] as const;

/**
 * Records or corrects an employee's resignation details.
 *
 * Deliberately narrow — the four fields the resignation endpoint accepts and nothing else,
 * so the dialog matches the permission rather than hiding parts of the full edit form.
 *
 * The backend requires all three details whenever the status is a leaver status, so the
 * form enforces the same rule client-side to avoid a round-trip that can only fail.
 */
export default function ResignationDialog({
  open,
  employeeName,
  initial,
  saving,
  onClose,
  onSubmit,
}: ResignationDialogProps) {
  const [status, setStatus] = useState<EmployeeStatus>(
    LEAVER_STATUSES.includes(initial.employeeStatus as never)
      ? initial.employeeStatus
      : EmployeeStatus.MarkedLeaver,
  );
  const [finalDayInOffice, setFinalDayInOffice] = useState(
    initial.finalDayInOffice ?? "",
  );
  const [finalDayOfEmployment, setFinalDayOfEmployment] = useState(
    initial.finalDayOfEmployment ?? "",
  );
  const [reason, setReason] = useState(initial.resignationReason ?? "");

  // Reset to the employee's current values each time the dialog opens, so a cancelled edit
  // is not carried into the next one.
  useEffect(() => {
    if (!open) return;
    setStatus(
      LEAVER_STATUSES.includes(initial.employeeStatus as never)
        ? initial.employeeStatus
        : EmployeeStatus.MarkedLeaver,
    );
    setFinalDayInOffice(initial.finalDayInOffice ?? "");
    setFinalDayOfEmployment(initial.finalDayOfEmployment ?? "");
    setReason(initial.resignationReason ?? "");
  }, [
    open,
    initial.employeeStatus,
    initial.finalDayInOffice,
    initial.finalDayOfEmployment,
    initial.resignationReason,
  ]);

  const datesOutOfOrder = useMemo(
    () =>
      finalDayInOffice !== "" &&
      finalDayOfEmployment !== "" &&
      finalDayOfEmployment < finalDayInOffice,
    [finalDayInOffice, finalDayOfEmployment],
  );

  const canSave =
    finalDayInOffice !== "" &&
    finalDayOfEmployment !== "" &&
    reason.trim() !== "" &&
    !datesOutOfOrder &&
    !saving;

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        Resignation details
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {employeeName}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
          <TextField
            select
            label="Employee status"
            value={status}
            onChange={(e) => setStatus(e.target.value as EmployeeStatus)}
            size="small"
            fullWidth
          >
            {LEAVER_STATUSES.map((value) => (
              <MenuItem key={value} value={value}>
                {value}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Last day in office"
            type="date"
            value={finalDayInOffice}
            onChange={(e) => setFinalDayInOffice(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
            fullWidth
          />

          <TextField
            label="Final day of employment"
            type="date"
            value={finalDayOfEmployment}
            onChange={(e) => setFinalDayOfEmployment(e.target.value)}
            InputLabelProps={{ shrink: true }}
            error={datesOutOfOrder}
            helperText={
              datesOutOfOrder
                ? "Final day of employment cannot be before the last day in office"
                : undefined
            }
            size="small"
            fullWidth
          />

          <Autocomplete
            freeSolo
            options={ResignationReasons as unknown as string[]}
            value={reason}
            onChange={(_, value) => setReason(value ?? "")}
            onInputChange={(_, value) => setReason(value)}
            renderInput={(params) => (
              <TextField {...params} label="Resignation reason" size="small" />
            )}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving} sx={{ textTransform: "none" }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="secondary"
          disabled={!canSave}
          sx={{ textTransform: "none" }}
          onClick={() =>
            onSubmit({
              employeeStatus: status,
              finalDayInOffice,
              finalDayOfEmployment,
              // Canonicalized so the resignation report does not accumulate casing
              // variants, matching how the onboarding form stores it.
              resignationReason: canonicalizeReason(reason) ?? "",
            })
          }
        >
          {saving ? "Saving…" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
