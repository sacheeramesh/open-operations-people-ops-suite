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
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Briefcase,
  FileText,
  Github,
  Globe,
  Link as LinkIcon,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Plus,
  Shield,
  Star,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import ProfileSection from "@component/careers/ProfileSection";
import { addSkill, removeSkill, updateProfile } from "@slices/careersSlice/careers";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { SnackMessage } from "@config/constant";
import { RootState, useAppDispatch, useAppSelector } from "@slices/store";

const Profile = () => {
  const dispatch = useAppDispatch();
  const profile = useAppSelector((state: RootState) => state.careers.profile);

  const [newSkill, setNewSkill] = useState("");
  const [basicForm, setBasicForm] = useState({
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    phone: profile.phone,
    country: profile.country,
    linkedIn: profile.linkedIn,
    github: profile.github,
  });
  const [profForm, setProfForm] = useState({
    currentRole: profile.currentRole,
    yearsOfExperience: profile.yearsOfExperience,
    summary: profile.summary,
  });

  const handleSaveBasic = () => {
    dispatch(updateProfile(basicForm));
    dispatch(enqueueSnackbarMessage({ message: SnackMessage.success.profileUpdated, type: "success" }));
  };

  const handleSaveProf = () => {
    dispatch(updateProfile(profForm));
    dispatch(enqueueSnackbarMessage({ message: SnackMessage.success.profileUpdated, type: "success" }));
  };

  const handleAddSkill = () => {
    const trimmed = newSkill.trim();
    if (trimmed) {
      dispatch(addSkill(trimmed));
      setNewSkill("");
    }
  };

  const getCompletionColor = () => {
    if (profile.completionPercentage >= 80) return "#10B981";
    if (profile.completionPercentage >= 50) return "#F59E0B";
    return "#EF4444";
  };

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700} mb={0.5} color="text.primary">
            Candidate Passport
          </Typography>
          <Typography color="text.secondary" fontSize="14px">
            Your persistent professional identity — applies to every WSO2 job automatically.
          </Typography>
        </Box>
        <Chip
          icon={<Shield size={13} />}
          label={`${profile.personId}`}
          size="small"
          sx={{ backgroundColor: "#FF730015", color: "#FF7300", fontWeight: 600 }}
        />
      </Stack>

      <Grid container spacing={3}>
        {/* Left — Profile Summary Card */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Card
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: "12px",
              textAlign: "center",
              position: "sticky",
              top: 16,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ position: "relative", display: "inline-flex", mb: 2 }}>
                <CircularProgress
                  variant="determinate"
                  value={profile.completionPercentage}
                  size={100}
                  thickness={3}
                  sx={{ color: getCompletionColor() }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Avatar sx={{ width: 76, height: 76, fontSize: "24px", fontWeight: 800, backgroundColor: "#FF7300" }}>
                    {profile.firstName.charAt(0)}
                  </Avatar>
                </Box>
              </Box>

              <Typography fontWeight={700} fontSize="16px">
                {profile.firstName} {profile.lastName}
              </Typography>
              <Typography fontSize="13px" color="text.secondary" mb={0.5}>
                {profile.currentRole}
              </Typography>
              <Typography fontSize="12px" color={getCompletionColor()} fontWeight={600} mb={2}>
                {profile.completionPercentage}% complete
              </Typography>

              <Stack gap={1}>
                <Stack direction="row" alignItems="center" gap={1}>
                  <Mail size={13} color="#9CA3AF" />
                  <Typography fontSize="12px" color="text.secondary" noWrap>
                    {profile.email}
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" gap={1}>
                  <MapPin size={13} color="#9CA3AF" />
                  <Typography fontSize="12px" color="text.secondary">
                    {profile.country}
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" gap={1}>
                  <Briefcase size={13} color="#9CA3AF" />
                  <Typography fontSize="12px" color="text.secondary">
                    {profile.yearsOfExperience} years exp.
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Right — Sections */}
        <Grid size={{ xs: 12, md: 9 }}>
          {/* Basic Info */}
          <ProfileSection
            title="Basic Information"
            icon={<Shield size={16} />}
            editContent={
              <Stack gap={2}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="First Name"
                      value={basicForm.firstName}
                      onChange={(e) => setBasicForm({ ...basicForm, firstName: e.target.value })}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Last Name"
                      value={basicForm.lastName}
                      onChange={(e) => setBasicForm({ ...basicForm, lastName: e.target.value })}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Email"
                      value={basicForm.email}
                      onChange={(e) => setBasicForm({ ...basicForm, email: e.target.value })}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Phone"
                      value={basicForm.phone}
                      onChange={(e) => setBasicForm({ ...basicForm, phone: e.target.value })}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Country"
                      value={basicForm.country}
                      onChange={(e) => setBasicForm({ ...basicForm, country: e.target.value })}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="LinkedIn URL"
                      value={basicForm.linkedIn}
                      onChange={(e) => setBasicForm({ ...basicForm, linkedIn: e.target.value })}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="GitHub URL"
                      value={basicForm.github}
                      onChange={(e) => setBasicForm({ ...basicForm, github: e.target.value })}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                </Grid>
                <Button variant="contained" size="small" onClick={handleSaveBasic} sx={{ alignSelf: "flex-start" }}>
                  Save Changes
                </Button>
              </Stack>
            }
          >
            <Grid container spacing={2}>
              {[
                { icon: <Mail size={14} />, label: "Email", value: profile.email },
                { icon: <Phone size={14} />, label: "Phone", value: profile.phone },
                { icon: <MapPin size={14} />, label: "Country", value: profile.country },
                {
                  icon: <Linkedin size={14} />,
                  label: "LinkedIn",
                  value: profile.linkedIn ? (
                    <Typography
                      component="a"
                      href={profile.linkedIn}
                      target="_blank"
                      fontSize="13px"
                      sx={{ color: "#3B82F6", textDecoration: "none" }}
                    >
                      View Profile
                    </Typography>
                  ) : (
                    "Not added"
                  ),
                },
                {
                  icon: <Github size={14} />,
                  label: "GitHub",
                  value: profile.github ? (
                    <Typography
                      component="a"
                      href={profile.github}
                      target="_blank"
                      fontSize="13px"
                      sx={{ color: "#3B82F6", textDecoration: "none" }}
                    >
                      View Profile
                    </Typography>
                  ) : (
                    "Not added"
                  ),
                },
              ].map((item, i) => (
                <Grid key={i} size={{ xs: 12, sm: 6 }}>
                  <Stack direction="row" gap={1} alignItems="flex-start">
                    <Box sx={{ color: "#9CA3AF", mt: 0.15 }}>{item.icon}</Box>
                    <Box>
                      <Typography fontSize="11px" color="text.secondary" fontWeight={600} textTransform="uppercase">
                        {item.label}
                      </Typography>
                      {typeof item.value === "string" ? (
                        <Typography fontSize="13px">{item.value}</Typography>
                      ) : (
                        item.value
                      )}
                    </Box>
                  </Stack>
                </Grid>
              ))}
            </Grid>
          </ProfileSection>

          {/* Professional Details */}
          <ProfileSection
            title="Professional Details"
            icon={<Briefcase size={16} />}
            editContent={
              <Stack gap={2}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Current Role"
                      value={profForm.currentRole}
                      onChange={(e) => setProfForm({ ...profForm, currentRole: e.target.value })}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Years of Experience"
                      type="number"
                      value={profForm.yearsOfExperience}
                      onChange={(e) =>
                        setProfForm({ ...profForm, yearsOfExperience: parseInt(e.target.value) || 0 })
                      }
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Professional Summary"
                      value={profForm.summary}
                      onChange={(e) => setProfForm({ ...profForm, summary: e.target.value })}
                      fullWidth
                      size="small"
                      multiline
                      rows={3}
                    />
                  </Grid>
                </Grid>
                <Button variant="contained" size="small" onClick={handleSaveProf} sx={{ alignSelf: "flex-start" }}>
                  Save Changes
                </Button>
              </Stack>
            }
          >
            <Stack gap={2}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography fontSize="11px" color="text.secondary" fontWeight={600} textTransform="uppercase" mb={0.5}>
                    Current Role
                  </Typography>
                  <Typography fontSize="14px">{profile.currentRole}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography fontSize="11px" color="text.secondary" fontWeight={600} textTransform="uppercase" mb={0.5}>
                    Experience
                  </Typography>
                  <Typography fontSize="14px">{profile.yearsOfExperience} years</Typography>
                </Grid>
              </Grid>
              {profile.summary && (
                <Box>
                  <Typography fontSize="11px" color="text.secondary" fontWeight={600} textTransform="uppercase" mb={0.5}>
                    Summary
                  </Typography>
                  <Typography fontSize="14px" color="text.secondary" lineHeight={1.7}>
                    {profile.summary}
                  </Typography>
                </Box>
              )}
            </Stack>
          </ProfileSection>

          {/* Skills */}
          <ProfileSection
            title="Skills"
            icon={<Star size={16} />}
            editContent={
              <Stack gap={2}>
                <Stack direction="row" gap={1} flexWrap="wrap">
                  {profile.skills.map((skill) => (
                    <Chip
                      key={skill}
                      label={skill}
                      size="small"
                      onDelete={() => dispatch(removeSkill(skill))}
                      deleteIcon={<Trash2 size={12} />}
                      sx={{ fontWeight: 500 }}
                    />
                  ))}
                </Stack>
                <Stack direction="row" gap={1} alignItems="center">
                  <TextField
                    size="small"
                    placeholder="Add a skill (e.g., Golang)"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddSkill()}
                    sx={{ maxWidth: 260 }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Plus size={14} />}
                    onClick={handleAddSkill}
                  >
                    Add
                  </Button>
                </Stack>
              </Stack>
            }
          >
            <Stack direction="row" gap={1} flexWrap="wrap">
              {profile.skills.map((skill) => (
                <Chip key={skill} label={skill} size="small" sx={{ fontWeight: 500 }} />
              ))}
              {profile.skills.length === 0 && (
                <Typography fontSize="13px" color="text.secondary">
                  No skills added yet.
                </Typography>
              )}
            </Stack>
          </ProfileSection>

          {/* Resume Management */}
          <ProfileSection title="Resume" icon={<FileText size={16} />}>
            <Stack gap={1.5}>
              {profile.resumes.map((resume) => (
                <Box
                  key={resume.id}
                  sx={{
                    p: 2,
                    borderRadius: "8px",
                    border: "1px solid",
                    borderColor: resume.isActive ? "#FF7300" : "divider",
                    backgroundColor: resume.isActive ? "#FF730008" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Stack direction="row" alignItems="center" gap={1.5}>
                    <FileText size={18} color={resume.isActive ? "#FF7300" : "#9CA3AF"} />
                    <Box>
                      <Typography fontSize="13px" fontWeight={600}>
                        {resume.name}
                      </Typography>
                      <Typography fontSize="11px" color="text.secondary">
                        Uploaded {resume.uploadedAt}
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" alignItems="center" gap={1}>
                    {resume.isActive && (
                      <Chip
                        label="Active"
                        size="small"
                        sx={{ fontSize: "10px", height: 20, backgroundColor: "#ECFDF5", color: "#10B981", fontWeight: 600 }}
                      />
                    )}
                    <Tooltip title="Download">
                      <IconButton size="small">
                        <FileText size={14} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Box>
              ))}
              <Button
                variant="outlined"
                size="small"
                startIcon={<Plus size={14} />}
                sx={{ alignSelf: "flex-start", borderRadius: "8px" }}
              >
                Upload New Resume
              </Button>
            </Stack>
          </ProfileSection>

          {/* Portfolio */}
          <ProfileSection title="Portfolio" icon={<Globe size={16} />}>
            <Stack gap={1.5}>
              {profile.portfolio.map((item) => (
                <Box
                  key={item.id}
                  sx={{
                    p: 2,
                    borderRadius: "8px",
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                    <Stack direction="row" gap={1.5} alignItems="flex-start">
                      {item.type === "github" ? (
                        <Github size={16} color="#9CA3AF" />
                      ) : (
                        <LinkIcon size={16} color="#9CA3AF" />
                      )}
                      <Box>
                        <Typography fontSize="13px" fontWeight={600}>
                          {item.title}
                        </Typography>
                        <Typography fontSize="12px" color="text.secondary" lineHeight={1.6}>
                          {item.description}
                        </Typography>
                      </Box>
                    </Stack>
                    <Typography
                      component="a"
                      href={item.url}
                      target="_blank"
                      fontSize="12px"
                      sx={{ color: "#3B82F6", textDecoration: "none", fontWeight: 600, whiteSpace: "nowrap" }}
                    >
                      View →
                    </Typography>
                  </Stack>
                </Box>
              ))}
              {profile.portfolio.length === 0 && (
                <Typography fontSize="13px" color="text.secondary">
                  No portfolio items added.
                </Typography>
              )}
              <Button
                variant="outlined"
                size="small"
                startIcon={<Plus size={14} />}
                sx={{ alignSelf: "flex-start", borderRadius: "8px" }}
              >
                Add Portfolio Item
              </Button>
            </Stack>
          </ProfileSection>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;
