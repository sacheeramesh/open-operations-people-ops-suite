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

import CloseIcon from "@mui/icons-material/Close";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SaveIcon from "@mui/icons-material/Save";
import { Box, Button, CircularProgress, Typography } from "@mui/material";

import { ConfirmationType } from "@/types/types";
import { useConfirmationModalContext } from "@context/DialogContext";

import {
  EditableSection,
  useSectionEdit,
} from "@view/me/sectionEdit/SectionEditProvider";

/**
 * The title row of an editable profile section, carrying the Edit / Save / Cancel
 * controls.
 *
 * Rendered inside an AccordionSummary, so every click target here stops propagation —
 * otherwise pressing Save would also toggle the accordion shut and hide the very
 * fields being saved.
 */
const SectionEditHeader = ({
  title,
  section,
  canEdit,
  isSaving,
  onSave,
  onCancel,
}: {
  title: string;
  section: EditableSection;
  /** Whether this viewer may edit at all — Save/Edit are hidden when false. */
  canEdit: boolean;
  isSaving: boolean;
  onSave: () => void;
  onCancel: () => void;
}) => {
  const { editingSection, isDirty, beginEdit } = useSectionEdit();
  const { showConfirmation } = useConfirmationModalContext();

  const isEditing = editingSection === section;
  const isOtherSectionEditing = editingSection !== null && !isEditing;

  const stop = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleCancel = (e: React.MouseEvent) => {
    stop(e);
    if (!isDirty) {
      onCancel();
      return;
    }
    showConfirmation(
      "Discard changes?",
      <Typography variant="body1">
        This section has unsaved changes. Discard them?
      </Typography>,
      ConfirmationType.discard,
      onCancel,
      "Discard",
      "Keep editing",
    );
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        // Leave room for the accordion's own expand icon.
        pr: 1,
        gap: 2,
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>

      {canEdit && (
        <Box sx={{ display: "flex", gap: 1 }} onClick={stop}>
          {isEditing ? (
            <>
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                startIcon={<CloseIcon />}
                disabled={isSaving}
                onClick={handleCancel}
                sx={{ textTransform: "none" }}
              >
                Cancel
              </Button>
              <Button
                size="small"
                variant="contained"
                color="secondary"
                startIcon={
                  isSaving ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <SaveIcon />
                  )
                }
                disabled={isSaving || !isDirty}
                onClick={(e) => {
                  stop(e);
                  onSave();
                }}
                sx={{ textTransform: "none" }}
              >
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </>
          ) : (
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              startIcon={<EditOutlinedIcon />}
              // Editing two sections at once could patch a stale copy of the record
              // from whichever saves second.
              disabled={isOtherSectionEditing}
              title={
                isOtherSectionEditing
                  ? "Finish editing the other section first"
                  : undefined
              }
              onClick={(e) => {
                stop(e);
                beginEdit(section);
              }}
              sx={{ textTransform: "none" }}
            >
              Edit
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
};

export default SectionEditHeader;
