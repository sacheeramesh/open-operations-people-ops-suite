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

import DOMPurify from "dompurify";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { ArrowLeft, Bookmark, BookmarkCheck, Briefcase, MapPin, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useAuthContext } from "@asgardeo/auth-react";

import ApplyModal from "@component/careers/ApplyModal";
import { Job } from "@/types/types";
import { toggleSaveJob } from "@slices/careersSlice/careers";
import { RootState, useAppDispatch, useAppSelector } from "@slices/store";
import { VacancyDetail, fetchVacancyDetail } from "@utils/vacancyService";

const teamColors: Record<string, string> = {
  ENGINEERING: "#3B82F6",
  "CUSTOMER SUCCESS": "#8B5CF6",
  MARKETING: "#10B981",
  SALES: "#EF4444",
  "SALES ENGINEERING": "#F59E0B",
  "People Operations": "#EC4899",
  FINANCE: "#06B6D4",
  "CHANNEL SALES": "#6366F1",
  "DIGITAL TRANSFORMATION": "#14B8A6",
  "BUSINESS OPERATIONS": "#F97316",
};

const JobDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { getAccessToken } = useAuthContext();

  const savedJobIds = useAppSelector((state: RootState) => state.careers.savedJobIds);
  const applications = useAppSelector((state: RootState) => state.careers.applications);

  const [detail, setDetail] = useState<VacancyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [applyJob, setApplyJob] = useState<Job | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(false);
    getAccessToken()
      .then((token) => fetchVacancyDetail(id, token))
      .then(setDetail)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id, getAccessToken]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress size={32} sx={{ color: "#FF7300" }} />
      </Box>
    );
  }

  if (error || !detail) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography variant="h5" mb={2} color="text.primary">
          Failed to load job details.
        </Typography>
        <Button variant="contained" onClick={() => navigate("/jobs")}>
          Back to Jobs
        </Button>
      </Box>
    );
  }

  const isSaved = savedJobIds.includes(detail.id);
  const alreadyApplied = applications.some((a) => a.jobId === detail.id);
  const color = teamColors[detail.team] ?? "#6B7280";

  const jobForApply: Job = {
    id: detail.id,
    title: detail.title,
    team: detail.team,
    country: detail.country,
    jobType: detail.jobType,
    publishStatus: detail.publishStatus,
    postedDate: detail.postedDate,
  };

  return (
    <Box>
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
                label={detail.team}
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
                {detail.title}
              </Typography>
              <Stack direction="row" gap={3} flexWrap="wrap">
                <Stack direction="row" alignItems="center" gap={0.75}>
                  <MapPin size={14} color="#9CA3AF" />
                  <Typography fontSize="13px" color="text.secondary">
                    {detail.country.join(", ")}
                    {detail.allowRemote && (
                      <Box
                        component="span"
                        sx={{
                          ml: 0.75,
                          px: 0.75,
                          py: 0.1,
                          borderRadius: "4px",
                          fontSize: "10px",
                          backgroundColor: "#ECFDF5",
                          color: "#10B981",
                          fontWeight: 600,
                        }}
                      >
                        Remote
                      </Box>
                    )}
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" gap={0.75}>
                  <Briefcase size={14} color="#9CA3AF" />
                  <Typography fontSize="13px" color="text.secondary">
                    {detail.jobType}
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          {/* Job Description */}
          {detail.mainContent && (
            <Card
              elevation={0}
              sx={{ border: "1px solid", borderColor: "divider", borderRadius: "12px", mb: 2 }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(detail.mainContent ?? "") }}
                  sx={{
                    fontSize: "14px",
                    lineHeight: 1.8,
                    color: "text.secondary",
                    "& h1, & h2, & h3": { color: "text.primary", fontWeight: 700, mt: 2, mb: 1 },
                    "& ul, & ol": { pl: 2.5 },
                    "& li": { mb: 0.5 },
                    "& p": { mb: 1.5 },
                    "& strong": { color: "text.primary" },
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* Task Information */}
          {detail.taskInformation && (
            <Card
              elevation={0}
              sx={{ border: "1px solid", borderColor: "divider", borderRadius: "12px", mb: 2 }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(detail.taskInformation ?? "") }}
                  sx={{
                    fontSize: "14px",
                    lineHeight: 1.8,
                    color: "text.secondary",
                    "& h1, & h2, & h3": { color: "text.primary", fontWeight: 700, mt: 2, mb: 1 },
                    "& ul, & ol": { pl: 2.5 },
                    "& li": { mb: 0.5 },
                    "& p": { mb: 1.5 },
                    "& strong": { color: "text.primary" },
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* Additional Content */}
          {detail.additionalContent && (
            <Card
              elevation={0}
              sx={{ border: "1px solid", borderColor: "divider", borderRadius: "12px", mb: 2 }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(detail.additionalContent ?? "") }}
                  sx={{
                    fontSize: "14px",
                    lineHeight: 1.8,
                    color: "text.secondary",
                    "& h1, & h2, & h3": { color: "text.primary", fontWeight: 700, mt: 2, mb: 1 },
                    "& ul, & ol": { pl: 2.5 },
                    "& li": { mb: 0.5 },
                    "& p": { mb: 1.5 },
                    "& strong": { color: "text.primary" },
                  }}
                />
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Sidebar */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: "12px",
              position: "sticky",
              top: 16,
            }}
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
                    onClick={() => setApplyJob(jobForApply)}
                    sx={{ borderRadius: "8px", fontWeight: 700, py: 1.25 }}
                  >
                    Apply with Candidate Passport
                  </Button>
                )}
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={isSaved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                  onClick={() => dispatch(toggleSaveJob(detail.id))}
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
