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

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { ArrowLeft, Bookmark, BookmarkCheck, Briefcase, DollarSign, MapPin, Send, Shield, Users } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import ApplyModal from "@component/careers/ApplyModal";
import { Job } from "@/types/types";
import { toggleSaveJob } from "@slices/careersSlice/careers";
import { RootState, useAppDispatch, useAppSelector } from "@slices/store";

const deptColors: Record<string, string> = {
  Engineering: "#3B82F6",
  Cloud: "#8B5CF6",
  "Developer Relations": "#10B981",
  Product: "#F59E0B",
  Sales: "#EF4444",
  "Human Resources": "#EC4899",
  Marketing: "#06B6D4",
};

const JobDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const job = useAppSelector((state: RootState) =>
    state.careers.jobs.find((j) => j.id === id),
  );
  const savedJobIds = useAppSelector((state: RootState) => state.careers.savedJobIds);
  const profile = useAppSelector((state: RootState) => state.careers.profile);
  const applications = useAppSelector((state: RootState) => state.careers.applications);

  const [applyJob, setApplyJob] = useState<Job | null>(null);

  if (!job) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography variant="h5" mb={2} color="text.primary">
          Job not found
        </Typography>
        <Button variant="contained" onClick={() => navigate("/jobs")}>
          Back to Jobs
        </Button>
      </Box>
    );
  }

  const isSaved = savedJobIds.includes(job.id);
  const alreadyApplied = applications.some((a) => a.jobId === job.id);
  const color = deptColors[job.department] ?? "#6B7280";

  const matchingSkills = job.requiredSkills.filter((s) => profile.skills.includes(s));
  const readinessScore = Math.round((matchingSkills.length / job.requiredSkills.length) * 100);
  const missingSkills = job.requiredSkills.filter((s) => !profile.skills.includes(s));

  return (
    <Box>
      {/* Back nav */}
      <Button
        startIcon={<ArrowLeft size={16} />}
        variant="text"
        size="small"
        onClick={() => navigate("/jobs")}
        sx={{ mb: 2, color: "text.secondary", "&:hover": { color: "text.primary" } }}
      >
        Back to Jobs
      </Button>

      <Grid container spacing={3}>
        {/* Main content */}
        <Grid size={{ xs: 12, md: 8 }}>
          {/* Job Header */}
          <Card
            elevation={0}
            sx={{ border: "1px solid", borderColor: "divider", borderRadius: "12px", mb: 2 }}
          >
            <CardContent sx={{ p: 3 }}>
              <Chip
                label={job.department}
                size="small"
                sx={{
                  mb: 1.5,
                  backgroundColor: `${color}15`,
                  color,
                  fontWeight: 600,
                  fontSize: "11px",
                }}
              />
              <Typography variant="h5" fontWeight={700} mb={2} color="text.primary">
                {job.title}
              </Typography>
              <Stack direction="row" gap={3} flexWrap="wrap">
                <Stack direction="row" alignItems="center" gap={0.75}>
                  <MapPin size={14} color="#9CA3AF" />
                  <Typography fontSize="13px" color="text.secondary">
                    {job.location}
                    {job.isRemote && " · Remote"}
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" gap={0.75}>
                  <Briefcase size={14} color="#9CA3AF" />
                  <Typography fontSize="13px" color="text.secondary">
                    {job.experienceLevel}
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" gap={0.75}>
                  <DollarSign size={14} color="#9CA3AF" />
                  <Typography fontSize="13px" color="text.secondary">
                    {job.salaryRange}
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" gap={0.75}>
                  <Users size={14} color="#9CA3AF" />
                  <Typography fontSize="13px" color="text.secondary">
                    Team: {job.teamSize}
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          {/* Description */}
          <Card
            elevation={0}
            sx={{ border: "1px solid", borderColor: "divider", borderRadius: "12px", mb: 2 }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography fontWeight={700} mb={1.5}>
                About the Role
              </Typography>
              <Typography color="text.secondary" lineHeight={1.8} fontSize="14px" mb={3}>
                {job.description}
              </Typography>

              <Divider sx={{ mb: 2.5 }} />

              <Typography fontWeight={700} mb={1.5}>
                Responsibilities
              </Typography>
              <Stack component="ul" gap={1} sx={{ pl: 2, m: 0, mb: 3 }}>
                {job.responsibilities.map((item, i) => (
                  <Typography component="li" key={i} fontSize="14px" color="text.secondary" lineHeight={1.7}>
                    {item}
                  </Typography>
                ))}
              </Stack>

              <Divider sx={{ mb: 2.5 }} />

              <Typography fontWeight={700} mb={1.5}>
                Requirements
              </Typography>
              <Stack component="ul" gap={1} sx={{ pl: 2, m: 0, mb: 3 }}>
                {job.requirements.map((item, i) => (
                  <Typography component="li" key={i} fontSize="14px" color="text.secondary" lineHeight={1.7}>
                    {item}
                  </Typography>
                ))}
              </Stack>

              {job.niceToHave.length > 0 && (
                <>
                  <Divider sx={{ mb: 2.5 }} />
                  <Typography fontWeight={700} mb={1.5}>
                    Nice to Have
                  </Typography>
                  <Stack component="ul" gap={1} sx={{ pl: 2, m: 0 }}>
                    {job.niceToHave.map((item, i) => (
                      <Typography component="li" key={i} fontSize="14px" color="text.secondary" lineHeight={1.7}>
                        {item}
                      </Typography>
                    ))}
                  </Stack>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid size={{ xs: 12, md: 4 }}>
          {/* Profile Readiness */}
          <Card
            elevation={0}
            sx={{ border: "1px solid", borderColor: "divider", borderRadius: "12px", mb: 2 }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" alignItems="center" gap={1} mb={1.5}>
                <Shield size={16} color="#FF7300" />
                <Typography fontWeight={700} fontSize="14px">
                  Passport Readiness
                </Typography>
              </Stack>

              <Typography fontSize="13px" color="text.secondary" mb={1}>
                Your profile is{" "}
                <Box component="span" sx={{ fontWeight: 700, color: readinessScore >= 70 ? "#10B981" : "#F59E0B" }}>
                  {readinessScore}% ready
                </Box>{" "}
                for this job
              </Typography>

              <LinearProgress
                variant="determinate"
                value={readinessScore}
                sx={{
                  mb: 2,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: "action.hover",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 3,
                    backgroundColor: readinessScore >= 70 ? "#10B981" : "#F59E0B",
                  },
                }}
              />

              {missingSkills.length > 0 && (
                <Box>
                  <Typography fontSize="12px" color="text.secondary" mb={1}>
                    Missing skills:
                  </Typography>
                  <Stack direction="row" gap={0.75} flexWrap="wrap">
                    {missingSkills.map((s) => (
                      <Chip
                        key={s}
                        label={s}
                        size="small"
                        sx={{ fontSize: "11px", backgroundColor: "#FEF2F2", color: "#EF4444" }}
                      />
                    ))}
                  </Stack>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Apply Card */}
          <Card
            elevation={0}
            sx={{ border: "1px solid", borderColor: "divider", borderRadius: "12px", position: "sticky", top: 16 }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Stack gap={1.5}>
                {alreadyApplied ? (
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: "8px",
                      backgroundColor: "#ECFDF5",
                      textAlign: "center",
                    }}
                  >
                    <Typography fontSize="13px" fontWeight={600} color="#10B981">
                      ✓ Application Submitted
                    </Typography>
                  </Box>
                ) : (
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<Send size={15} />}
                    onClick={() => setApplyJob(job)}
                    sx={{ borderRadius: "8px", fontWeight: 700, py: 1.25 }}
                  >
                    Apply with Candidate Passport
                  </Button>
                )}
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={isSaved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                  onClick={() => dispatch(toggleSaveJob(job.id))}
                  sx={{
                    borderRadius: "8px",
                    fontWeight: 600,
                    color: isSaved ? "#FF7300" : undefined,
                    borderColor: isSaved ? "#FF7300" : undefined,
                  }}
                >
                  {isSaved ? "Saved" : "Save Job"}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <ApplyModal job={applyJob} open={!!applyJob} onClose={() => setApplyJob(null)} />
    </Box>
  );
};

export default JobDetail;
