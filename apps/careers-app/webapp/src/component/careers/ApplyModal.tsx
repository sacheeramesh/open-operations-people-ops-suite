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

import LoadingButton from "@mui/lab/LoadingButton";
import {
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { CheckCircle2, FileText, Send, Shield, User, X } from "lucide-react";
import { useState } from "react";

import { Application, Job } from "@/types/types";
import { ApplicationStatus } from "@config/constant";
import { SnackMessage } from "@config/constant";
import { addApplication } from "@slices/careersSlice/careers";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { RootState, useAppDispatch, useAppSelector } from "@slices/store";

interface ApplyModalProps {
  job: Job | null;
  open: boolean;
  onClose: () => void;
}

const ApplyModal = ({ job, open, onClose }: ApplyModalProps) => {
  const dispatch = useAppDispatch();
  const profile = useAppSelector((state: RootState) => state.careers.profile);
  const applications = useAppSelector((state: RootState) => state.careers.applications);
  const [selectedResumeId, setSelectedResumeId] = useState<string>(
    profile.resumes.find((r) => r.isActive)?.id ?? profile.resumes[0]?.id ?? "",
  );
  const [submitting, setSubmitting] = useState(false);

  if (!job) return null;

  const alreadyApplied = applications.some((a) => a.jobId === job.id);

  const handleSubmit = async () => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1200));

    const application: Application = {
      id: `a-${Date.now()}`,
      jobId: job.id,
      jobTitle: job.title,
      department: job.department,
      appliedDate: new Date().toISOString().split("T")[0],
      status: ApplicationStatus.Applied,
      resumeVersionId: selectedResumeId,
      notes: "Applied via Candidate Passport",
    };

    dispatch(addApplication(application));
    dispatch(
      enqueueSnackbarMessage({
        message: SnackMessage.success.applicationSubmitted,
        type: "success",
      }),
    );

    setSubmitting(false);
    onClose();
  };

  const activeResume = profile.resumes.find((r) => r.id === selectedResumeId);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: "16px" } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Stack direction="row" alignItems="center" gap={1} mb={0.5}>
              <Shield size={18} color="#FF7300" />
              <Typography fontWeight={700} fontSize="16px">
                Apply with Candidate Passport
              </Typography>
            </Stack>
            <Typography fontSize="13px" color="text.secondary">
              {job.title} · {job.department}
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5 }}>
        {alreadyApplied ? (
          <Box
            sx={{
              textAlign: "center",
              py: 3,
              px: 2,
              backgroundColor: "action.hover",
              borderRadius: "12px",
            }}
          >
            <CheckCircle2 size={40} color="#10B981" style={{ marginBottom: "12px" }} />
            <Typography fontWeight={700} mb={1}>
              Already Applied
            </Typography>
            <Typography fontSize="13px" color="text.secondary">
              You&apos;ve already applied for this position. Check your applications for status
              updates.
            </Typography>
          </Box>
        ) : (
          <Stack gap={2.5}>
            {/* Passport Summary */}
            <Box
              sx={{
                p: 2,
                borderRadius: "10px",
                border: "1px solid",
                borderColor: "divider",
                backgroundColor: "action.hover",
              }}
            >
              <Typography fontWeight={600} fontSize="13px" mb={1.5} color="text.secondary">
                YOUR CANDIDATE PASSPORT
              </Typography>
              <Stack gap={1.5}>
                <Stack direction="row" alignItems="center" gap={1.5}>
                  <User size={16} color="#FF7300" />
                  <Box>
                    <Typography fontWeight={600} fontSize="14px">
                      {profile.firstName} {profile.lastName}
                    </Typography>
                    <Typography fontSize="12px" color="text.secondary">
                      {profile.email}
                    </Typography>
                  </Box>
                </Stack>
                <Box>
                  <Typography fontSize="12px" color="text.secondary" mb={0.75}>
                    Skills
                  </Typography>
                  <Stack direction="row" gap={0.75} flexWrap="wrap">
                    {profile.skills.slice(0, 6).map((skill) => (
                      <Chip
                        key={skill}
                        label={skill}
                        size="small"
                        sx={{ fontSize: "11px", fontWeight: 500 }}
                      />
                    ))}
                  </Stack>
                </Box>
              </Stack>
            </Box>

            {/* Resume Selector */}
            {profile.resumes.length > 0 && (
              <FormControl fullWidth size="small">
                <InputLabel>Resume Version</InputLabel>
                <Select
                  value={selectedResumeId}
                  label="Resume Version"
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  sx={{ borderRadius: "8px" }}
                >
                  {profile.resumes.map((r) => (
                    <MenuItem key={r.id} value={r.id}>
                      <Stack direction="row" alignItems="center" gap={1}>
                        <FileText size={14} />
                        <Typography fontSize="13px">{r.name}</Typography>
                        {r.isActive && (
                          <Chip
                            label="Active"
                            size="small"
                            sx={{
                              fontSize: "10px",
                              height: 18,
                              backgroundColor: "#ECFDF5",
                              color: "#10B981",
                              fontWeight: 600,
                            }}
                          />
                        )}
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {activeResume && (
              <Stack direction="row" alignItems="center" gap={1} sx={{ color: "text.secondary" }}>
                <FileText size={14} />
                <Typography fontSize="12px">
                  Submitting: <strong>{activeResume.name}</strong>
                </Typography>
              </Stack>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
        <Stack direction="row" gap={1.5} width="100%">
          <LoadingButton
            variant="outlined"
            onClick={onClose}
            sx={{ borderRadius: "8px", fontWeight: 600, flex: 1 }}
          >
            Cancel
          </LoadingButton>
          {!alreadyApplied && (
            <LoadingButton
              variant="contained"
              loading={submitting}
              startIcon={<Send size={15} />}
              onClick={handleSubmit}
              sx={{ borderRadius: "8px", fontWeight: 700, flex: 2 }}
            >
              Submit Application
            </LoadingButton>
          )}
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default ApplyModal;
