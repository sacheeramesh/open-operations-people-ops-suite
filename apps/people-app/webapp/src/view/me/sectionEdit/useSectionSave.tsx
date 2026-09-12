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

import { useCallback, useState } from "react";

import { Box, Typography } from "@mui/material";

import {
  ConfirmationType,
  CreateEmployeeFormValues,
  EmployeeStatus,
} from "@/types/types";
import { useConfirmationModalContext } from "@context/DialogContext";
import {
  UpdateEmployeeJobInfoPayload,
  fetchEmployee,
  updateEmployeeJobInfo,
} from "@slices/employeeSlice/employee";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { useAppDispatch, useAppSelector } from "@slices/store";
import {
  diffObject,
  toJobUpdatePayload,
} from "@view/employees/onboarding/EmployeeForm";
import { buildChangeSummary } from "@view/me/sectionEdit/changeSummary";

/** Job-info fields belonging to each editable profile section. */
const SECTION_FIELDS: Record<string, (keyof UpdateEmployeeJobInfoPayload)[]> = {
  general: [
    "epf",
    "workEmail",
    "workLocation",
    "startDate",
    "secondaryJobTitle",
    "jobRole",
    "externalDesignation",
    "managerEmail",
    "additionalManagerEmails",
    "probationEndDate",
    "agreementEndDate",
    "employmentTypeId",
    "designationId",
    "companyId",
    "officeId",
    "teamId",
    "subTeamId",
    "businessUnitId",
    "unitId",
    "houseId",
    "continuousServiceRecord",
    "employeeStatus",
  ],
  resignation: [
    "finalDayInOffice",
    "finalDayOfEmployment",
    "resignationReason",
  ],
};

/** Section names as they read in the confirmation dialog. */
const SECTION_TITLES: Record<string, string> = {
  general: "General Information",
  resignation: "Resignation Details",
  personal: "Personal Information",
};

/**
 * Saves a single profile section.
 *
 * The section's fields are diffed against the values the form was seeded with, so the
 * PATCH carries only what the admin actually changed and leaves every other section's
 * data untouched. Fields outside the section are dropped even if something else nudged
 * them, which keeps one section's save from writing another's.
 */
export const useSectionSave = (employeeId: string | undefined) => {
  const dispatch = useAppDispatch();
  const { showConfirmation } = useConfirmationModalContext();
  const org = useAppSelector((state) => state.organization);
  const [isSaving, setIsSaving] = useState(false);

  const save = useCallback(
    async (
      section: keyof typeof SECTION_FIELDS,
      initialValues: CreateEmployeeFormValues,
      currentValues: CreateEmployeeFormValues,
    ): Promise<boolean> => {
      if (!employeeId) return false;

      const fields = SECTION_FIELDS[section];
      const fullDiff = diffObject(
        toJobUpdatePayload(initialValues),
        toJobUpdatePayload(currentValues),
      );

      const payload: Partial<UpdateEmployeeJobInfoPayload> = {};
      fields.forEach((field) => {
        if (field in fullDiff) {
          (payload as Record<string, unknown>)[field] = fullDiff[field];
        }
      });

      // Entering a leaver status resets the resignation fields to null, so a diff
      // against the pre-edit values can come back empty even though the record needs
      // them written. Send them whenever the resulting status is a leaver status.
      const current = toJobUpdatePayload(currentValues);
      const isLeaver =
        current.employeeStatus === EmployeeStatus.MarkedLeaver ||
        current.employeeStatus === EmployeeStatus.Left;

      if (isLeaver && (section === "general" || section === "resignation")) {
        payload.finalDayInOffice = current.finalDayInOffice;
        payload.finalDayOfEmployment = current.finalDayOfEmployment;
        payload.resignationReason = current.resignationReason;
      }

      if (Object.keys(payload).length === 0) {
        dispatch(
          enqueueSnackbarMessage({
            message: "No changes to save.",
            type: "warning",
          }),
        );
        return true;
      }

      const changes = buildChangeSummary(
        payload,
        toJobUpdatePayload(initialValues),
        org,
      );

      const applyUpdate = async (): Promise<boolean> => {
        setIsSaving(true);
        try {
          const result = await dispatch(
            updateEmployeeJobInfo({
              employeeId,
              payload: payload as UpdateEmployeeJobInfoPayload,
            }),
          );

          if (updateEmployeeJobInfo.rejected.match(result)) {
            // updateEmployeeJobInfo already surfaces the failure via snackbar.
            return false;
          }

          // Re-read so the section renders what was actually persisted rather than
          // the values that were sent — the backend derives some fields on write.
          await dispatch(fetchEmployee(employeeId));
          return true;
        } finally {
          setIsSaving(false);
        }
      };

      // The dialog is driven by a callback rather than a promise, so bridge it into
      // one: the caller needs to know whether the section may leave edit mode, and
      // dismissing the dialog has to leave the editor open with the changes intact.
      return await new Promise<boolean>((resolve) => {
        showConfirmation(
          "Confirm Update",
          <Box>
            <Typography variant="body1" sx={{ mb: changes.length ? 1.5 : 0 }}>
              Update {SECTION_TITLES[section]}?
            </Typography>
            {changes.map((change) => (
              <Box key={change.label} sx={{ mb: 1 }}>
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "text.secondary",
                  }}
                >
                  {change.label}
                </Typography>
                <Typography sx={{ fontSize: 14, overflowWrap: "anywhere" }}>
                  <Box component="span" sx={{ color: "text.secondary" }}>
                    {change.from}
                  </Box>
                  {"  \u2192  "}
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    {change.to}
                  </Box>
                </Typography>
              </Box>
            ))}
          </Box>,
          ConfirmationType.accept,
          () => {
            void applyUpdate().then(resolve);
          },
          "Update",
          "Cancel",
        );

        // showConfirmation gives no dismissal callback, so a cancelled dialog simply
        // never resolves this promise. Edit mode is left open either way, which is
        // the correct outcome for a cancel.
      });
    },
    [dispatch, employeeId, org, showConfirmation],
  );

  return { save, isSaving };
};
