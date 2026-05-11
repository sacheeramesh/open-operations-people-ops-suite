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
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import {
  BookOpen,
  Briefcase,
  CheckCircle,
  Globe,
  MapPin,
  Star,
  User,
  Zap,
} from "lucide-react";

import { mockJobs } from "@utils/mockData";
import { useAppAuthContext } from "@context/AuthContext";

const LoginScreen = () => {
  const { appSignIn, appSignOut } = useAppAuthContext();
  const theme = useTheme();

  const featuredJobs = mockJobs.slice(0, 3);

  const deptColors: Record<string, string> = {
    Engineering: "#3B82F6",
    Cloud: "#8B5CF6",
    "Developer Relations": "#10B981",
    Product: "#F59E0B",
    Sales: "#EF4444",
    "Human Resources": "#EC4899",
    Marketing: "#06B6D4",
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)"
            : "linear-gradient(135deg, #fff7f0 0%, #ffffff 50%, #f0f9ff 100%)",
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          borderBottom: `1px solid ${theme.palette.divider}`,
          backdropFilter: "blur(8px)",
          backgroundColor: theme.palette.mode === "dark" ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.8)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <Container maxWidth="lg">
          <Stack direction="row" alignItems="center" justifyContent="space-between" py={1.5}>
            <Stack direction="row" alignItems="center" gap={1.5}>
              <Box
                component="img"
                src={
                  theme.palette.mode === "dark"
                    ? "https://wso2.cachefly.net/wso2/sites/all/image_resources/logos/WSO2-Logo-White.png"
                    : "https://wso2.cachefly.net/wso2/sites/all/image_resources/logos/WSO2-Logo-Black.png"
                }
                alt="WSO2"
                sx={{ height: 28, width: "auto" }}
              />
              <Box>
                <Typography
                  sx={{ fontWeight: 700, fontSize: "16px", lineHeight: 1, color: "text.primary" }}
                >
                  WSO2 Careers
                </Typography>
                <Typography sx={{ fontSize: "11px", color: "text.secondary" }}>
                  Candidate Passport Platform
                </Typography>
              </Box>
            </Stack>
            <LoadingButton
              variant="contained"
              size="small"
              onClick={() => {
                appSignOut();
                appSignIn();
              }}
              sx={{ fontWeight: 600, borderRadius: "8px", px: 2.5 }}
            >
              Sign in with Asgardeo
            </LoadingButton>
          </Stack>
        </Container>
      </Box>

      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ pt: 8, pb: 6 }}>
        <Grid container spacing={6} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <Chip
              label="Now hiring across 8 departments"
              size="small"
              sx={{
                mb: 2,
                backgroundColor: "#FF730020",
                color: "#FF7300",
                fontWeight: 600,
                border: "1px solid #FF730040",
              }}
            />
            <Typography
              variant="h3"
              sx={{ fontWeight: 800, lineHeight: 1.2, mb: 2, color: "text.primary" }}
            >
              Build the Future of{" "}
              <Box component="span" sx={{ color: "#FF7300" }}>
                Open Source
              </Box>{" "}
              Integration
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.8 }}>
              Create your{" "}
              <Box component="span" sx={{ fontWeight: 700, color: "#FF7300" }}>
                Candidate Passport
              </Box>{" "}
              — a single profile that travels with you across all WSO2 job applications. No more
              uploading CVs repeatedly.
            </Typography>
            <Stack direction="row" gap={2} flexWrap="wrap">
              <LoadingButton
                variant="contained"
                size="large"
                onClick={() => {
                  appSignOut();
                  appSignIn();
                }}
                sx={{
                  fontWeight: 700,
                  borderRadius: "10px",
                  px: 4,
                  py: 1.5,
                  background: "linear-gradient(135deg, #FF7300, #FF9500)",
                  boxShadow: "0 4px 20px rgba(255, 115, 0, 0.3)",
                  "&:hover": { boxShadow: "0 6px 24px rgba(255, 115, 0, 0.4)" },
                }}
              >
                Create Candidate Profile
              </LoadingButton>
              <LoadingButton
                variant="outlined"
                size="large"
                onClick={() => {
                  appSignOut();
                  appSignIn();
                }}
                sx={{ fontWeight: 600, borderRadius: "10px", px: 4, py: 1.5 }}
              >
                Explore Jobs ({mockJobs.length})
              </LoadingButton>
            </Stack>

            {/* Social proof */}
            <Stack direction="row" gap={3} mt={4} flexWrap="wrap">
              {[
                { icon: <Briefcase size={14} />, label: `${mockJobs.length} Open Roles` },
                { icon: <Globe size={14} />, label: "5 Countries" },
                { icon: <Star size={14} />, label: "4.8★ Glassdoor" },
              ].map((item, i) => (
                <Stack key={i} direction="row" alignItems="center" gap={0.5}>
                  <Box sx={{ color: "#FF7300" }}>{item.icon}</Box>
                  <Typography variant="caption" fontWeight={600} color="text.secondary">
                    {item.label}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            {/* Candidate Passport Card */}
            <Card
              elevation={0}
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: "16px",
                background:
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(255,255,255,0.9)",
                backdropFilter: "blur(20px)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.1)",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" gap={1.5} mb={2.5}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: "10px",
                      background: "linear-gradient(135deg, #FF7300, #FF9500)",
                    }}
                  >
                    <User size={20} color="#fff" />
                  </Box>
                  <Box>
                    <Typography fontWeight={700} fontSize="15px">
                      Candidate Passport
                    </Typography>
                    <Typography fontSize="12px" color="text.secondary">
                      Your persistent professional identity
                    </Typography>
                  </Box>
                  <Chip
                    label="70% complete"
                    size="small"
                    sx={{ ml: "auto", backgroundColor: "#FF730020", color: "#FF7300", fontWeight: 600 }}
                  />
                </Stack>

                <Divider sx={{ mb: 2 }} />

                <Stack gap={1.5}>
                  {[
                    { icon: <CheckCircle size={14} />, label: "Basic Info", done: true },
                    { icon: <CheckCircle size={14} />, label: "5 Skills added", done: true },
                    { icon: <CheckCircle size={14} />, label: "Resume uploaded", done: true },
                    { icon: <BookOpen size={14} />, label: "Work Experience missing", done: false },
                    { icon: <Globe size={14} />, label: "Portfolio not added", done: false },
                  ].map((item, i) => (
                    <Stack key={i} direction="row" alignItems="center" gap={1.5}>
                      <Box sx={{ color: item.done ? "#10B981" : theme.palette.text.disabled }}>
                        {item.icon}
                      </Box>
                      <Typography
                        fontSize="13px"
                        sx={{
                          color: item.done ? "text.primary" : "text.disabled",
                          textDecoration: item.done ? "none" : "none",
                        }}
                      >
                        {item.label}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>

                <Box
                  sx={{
                    mt: 2.5,
                    p: 1.5,
                    borderRadius: "8px",
                    backgroundColor:
                      theme.palette.mode === "dark" ? "rgba(255,115,0,0.1)" : "#FFF7F0",
                    border: "1px solid #FF730030",
                  }}
                >
                  <Stack direction="row" alignItems="center" gap={1}>
                    <Zap size={14} color="#FF7300" />
                    <Typography fontSize="12px" color="#FF7300" fontWeight={600}>
                      Apply to any job instantly with your Passport
                    </Typography>
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Featured Jobs */}
      <Box
        sx={{
          py: 6,
          backgroundColor:
            theme.palette.mode === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h5" fontWeight={700} mb={1}>
            Featured Opportunities
          </Typography>
          <Typography color="text.secondary" mb={4}>
            Explore roles across engineering, cloud, product, and more.
          </Typography>

          <Grid container spacing={2}>
            {featuredJobs.map((job) => (
              <Grid key={job.id} size={{ xs: 12, md: 4 }}>
                <Card
                  elevation={0}
                  sx={{
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: "12px",
                    height: "100%",
                    transition: "all 0.2s",
                    "&:hover": {
                      borderColor: "#FF7300",
                      boxShadow: "0 4px 20px rgba(255, 115, 0, 0.1)",
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Chip
                      label={job.department}
                      size="small"
                      sx={{
                        mb: 1.5,
                        backgroundColor: `${deptColors[job.department] ?? "#6B7280"}20`,
                        color: deptColors[job.department] ?? "#6B7280",
                        fontWeight: 600,
                        fontSize: "11px",
                      }}
                    />
                    <Typography fontWeight={700} mb={1} sx={{ lineHeight: 1.3 }}>
                      {job.title}
                    </Typography>
                    <Stack direction="row" alignItems="center" gap={0.5} mb={0.5}>
                      <MapPin size={12} color={theme.palette.text.secondary} />
                      <Typography fontSize="12px" color="text.secondary">
                        {job.location}
                      </Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" gap={0.5}>
                      <Briefcase size={12} color={theme.palette.text.secondary} />
                      <Typography fontSize="12px" color="text.secondary">
                        {job.experienceLevel}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          py: 3,
          borderTop: `1px solid ${theme.palette.divider}`,
          backgroundColor:
            theme.palette.mode === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
        }}
      >
        <Container maxWidth="lg">
          <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
            <Box
              component="img"
              src={
                theme.palette.mode === "dark"
                  ? "https://wso2.cachefly.net/wso2/sites/all/image_resources/logos/WSO2-Logo-White.png"
                  : "https://wso2.cachefly.net/wso2/sites/all/image_resources/logos/WSO2-Logo-Black.png"
              }
              alt="WSO2"
              sx={{ height: 20, width: "auto", opacity: 0.7 }}
            />
            <Typography fontSize="12px" color="text.disabled" textAlign="center">
              © {new Date().getFullYear()} WSO2 LLC. Licensed under the{" "}
              <Box
                component="a"
                href="https://www.apache.org/licenses/LICENSE-2.0"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ color: "text.secondary", textDecoration: "underline" }}
              >
                Apache License 2.0
              </Box>
              . All rights reserved.
            </Typography>
            <Typography fontSize="12px" color="text.disabled">
              Powered by WSO2 Asgardeo
            </Typography>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

export default LoginScreen;
