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
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { AssignmentOutlined, BookmarkBorderOutlined, TrendingUpOutlined, WorkOutlineOutlined } from "@mui/icons-material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import ApplyModal from "@component/careers/ApplyModal";
import ApplicationStatusBadge from "@component/careers/ApplicationStatusBadge";
import JobCard from "@component/careers/JobCard";
import ProfileCompletion from "@component/careers/ProfileCompletion";
import { Job } from "@/types/types";
import { RootState, useAppSelector } from "@slices/store";

const Dashboard = () => {
  const navigate = useNavigate();
  const profile = useAppSelector((state: RootState) => state.careers.profile);
  const applications = useAppSelector((state: RootState) => state.careers.applications);
  const jobs = useAppSelector((state: RootState) => state.careers.jobs);
  const savedJobIds = useAppSelector((state: RootState) => state.careers.savedJobIds);
  const user = useAppSelector((state: RootState) => state.user.userInfo);

  const [applyJob, setApplyJob] = useState<Job | null>(null);

  const recentApplications = applications.slice(0, 3);
  const recommendedJobs = jobs
    .filter((j) => !applications.find((a) => a.jobId === j.id))
    .slice(0, 3);

  const completionItems = [
    { label: "Basic Info", done: !!(profile.firstName && profile.email) },
    { label: `${profile.skills.length} skills added`, done: profile.skills.length > 0 },
    { label: "Resume uploaded", done: profile.resumes.length > 0 },
    { label: "Work Experience", done: false },
    { label: "Portfolio added", done: profile.portfolio.length > 0 },
  ];

  const stats = [
    {
      icon: <AssignmentOutlined sx={{ fontSize: 22 }} />,
      label: "Applications",
      value: applications.length,
      color: "#3B82F6",
    },
    {
      icon: <TrendingUpOutlined sx={{ fontSize: 22 }} />,
      label: "In Progress",
      value: applications.filter((a) => a.status === "Interview" || a.status === "Screening").length,
      color: "#8B5CF6",
    },
    {
      icon: <BookmarkBorderOutlined sx={{ fontSize: 22 }} />,
      label: "Saved Jobs",
      value: savedJobIds.length,
      color: "#F59E0B",
    },
    {
      icon: <WorkOutlineOutlined sx={{ fontSize: 22 }} />,
      label: "Open Roles",
      value: jobs.length,
      color: "#10B981",
    },
  ];

  return (
    <Box>
      {/* Welcome */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700} mb={0.5} color="text.primary">
            Welcome back, {user?.firstName ?? profile.firstName} 👋
          </Typography>
          <Typography color="text.secondary" fontSize="14px">
            Here&apos;s your career activity overview.
          </Typography>
        </Box>
        <Chip
          label={`Passport: P-${profile.personId.replace("P-", "")}`}
          size="small"
          sx={{ backgroundColor: "#FF730015", color: "#FF7300", fontWeight: 600, fontSize: "11px" }}
        />
      </Stack>

      {/* Stats Row */}
      <Grid container spacing={2} mb={3}>
        {stats.map((stat, i) => (
          <Grid key={i} size={{ xs: 6, sm: 3 }}>
            <Card
              elevation={0}
              sx={{ border: "1px solid", borderColor: "divider", borderRadius: "12px" }}
            >
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Stack direction="row" alignItems="center" gap={1.5}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: "8px",
                      backgroundColor: `${stat.color}15`,
                      color: stat.color,
                      display: "flex",
                    }}
                  >
                    {stat.icon}
                  </Box>
                  <Box>
                    <Typography fontWeight={700} fontSize="20px" lineHeight={1}>
                      {stat.value}
                    </Typography>
                    <Typography fontSize="12px" color="text.secondary">
                      {stat.label}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5}>
        {/* Profile Completion */}
        <Grid size={{ xs: 12, md: 4 }}>
          <ProfileCompletion
            percentage={profile.completionPercentage}
            items={completionItems}
          />
        </Grid>

        {/* Recent Applications */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card
            elevation={0}
            sx={{ border: "1px solid", borderColor: "divider", borderRadius: "12px", height: "100%" }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography fontWeight={700} fontSize="15px">
                  Recent Applications
                </Typography>
                <Typography
                  fontSize="13px"
                  sx={{ color: "#FF7300", cursor: "pointer", fontWeight: 600 }}
                  onClick={() => navigate("/applications")}
                >
                  View all →
                </Typography>
              </Stack>

              {recentApplications.length === 0 ? (
                <Box
                  sx={{
                    py: 4,
                    textAlign: "center",
                    backgroundColor: "action.hover",
                    borderRadius: "8px",
                  }}
                >
                  <Typography color="text.secondary" fontSize="14px">
                    No applications yet. Start exploring jobs!
                  </Typography>
                </Box>
              ) : (
                <Stack gap={1.5}>
                  {recentApplications.map((app) => (
                    <Box
                      key={app.id}
                      sx={{
                        p: 2,
                        borderRadius: "10px",
                        border: "1px solid",
                        borderColor: "divider",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        transition: "all 0.15s",
                        "&:hover": { borderColor: "#FF7300", backgroundColor: "#FF730005" },
                      }}
                    >
                      <Box>
                        <Typography fontWeight={600} fontSize="14px">
                          {app.jobTitle}
                        </Typography>
                        <Typography fontSize="12px" color="text.secondary">
                          {app.department} · Applied {app.appliedDate}
                        </Typography>
                      </Box>
                      <ApplicationStatusBadge status={app.status} />
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recommended Jobs */}
        <Grid size={{ xs: 12 }}>
          <Typography fontWeight={700} fontSize="15px" mb={2}>
            Recommended for You
          </Typography>
          {recommendedJobs.length === 0 ? (
            <Typography color="text.secondary" fontSize="14px">
              Complete your profile to get personalized job recommendations.
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {recommendedJobs.map((job) => (
                <Grid key={job.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <JobCard job={job} onApply={setApplyJob} />
                </Grid>
              ))}
            </Grid>
          )}
        </Grid>
      </Grid>

      <ApplyModal job={applyJob} open={!!applyJob} onClose={() => setApplyJob(null)} />
    </Box>
  );
};

export default Dashboard;
