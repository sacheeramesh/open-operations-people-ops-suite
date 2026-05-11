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

import { Box, Button, Card, CardContent, Chip, Stack, Tooltip, Typography } from "@mui/material";
import { Bookmark, BookmarkCheck, Briefcase, MapPin, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Job } from "@/types/types";
import { toggleSaveJob } from "@slices/careersSlice/careers";
import { RootState, useAppDispatch, useAppSelector } from "@slices/store";

interface JobCardProps {
  job: Job;
  onApply?: (job: Job) => void;
}

const deptColors: Record<string, string> = {
  Engineering: "#3B82F6",
  Cloud: "#8B5CF6",
  "Developer Relations": "#10B981",
  Product: "#F59E0B",
  Sales: "#EF4444",
  "Human Resources": "#EC4899",
  Marketing: "#06B6D4",
};

const JobCard = ({ job, onApply }: JobCardProps) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const savedJobIds = useAppSelector((state: RootState) => state.careers.savedJobIds);
  const isSaved = savedJobIds.includes(job.id);
  const color = deptColors[job.department] ?? "#6B7280";

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(toggleSaveJob(job.id));
  };

  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: "12px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.2s ease",
        "&:hover": {
          borderColor: "#FF7300",
          boxShadow: "0 4px 20px rgba(255, 115, 0, 0.08)",
          transform: "translateY(-1px)",
        },
      }}
    >
      <CardContent sx={{ p: 2.5, flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
          <Chip
            label={job.department}
            size="small"
            sx={{
              backgroundColor: `${color}15`,
              color: color,
              fontWeight: 600,
              fontSize: "11px",
              borderRadius: "6px",
            }}
          />
          <Tooltip title={isSaved ? "Unsave" : "Save job"}>
            <Box
              component="button"
              onClick={handleSave}
              sx={{
                border: "none",
                background: "none",
                cursor: "pointer",
                p: 0.5,
                borderRadius: "6px",
                color: isSaved ? "#FF7300" : "text.secondary",
                "&:hover": { backgroundColor: "action.hover" },
              }}
            >
              {isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
            </Box>
          </Tooltip>
        </Stack>

        {/* Title */}
        <Typography fontWeight={700} mb={1.5} sx={{ lineHeight: 1.3, fontSize: "15px" }}>
          {job.title}
        </Typography>

        {/* Meta */}
        <Stack gap={0.75} mb={2} sx={{ flex: 1 }}>
          <Stack direction="row" alignItems="center" gap={0.75}>
            <MapPin size={13} color="#9CA3AF" />
            <Typography fontSize="13px" color="text.secondary">
              {job.location}
              {job.isRemote && (
                <Box
                  component="span"
                  sx={{
                    ml: 0.5,
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
            <Briefcase size={13} color="#9CA3AF" />
            <Typography fontSize="13px" color="text.secondary">
              {job.experienceLevel}
            </Typography>
          </Stack>
        </Stack>

        {/* Actions */}
        <Stack direction="row" gap={1} mt="auto">
          <Button
            variant="outlined"
            size="small"
            fullWidth
            onClick={() => navigate(`/jobs/${job.id}`)}
            sx={{ borderRadius: "8px", fontSize: "12px", fontWeight: 600 }}
          >
            View Details
          </Button>
          <Button
            variant="contained"
            size="small"
            fullWidth
            startIcon={<Send size={13} />}
            onClick={() => onApply?.(job)}
            sx={{ borderRadius: "8px", fontSize: "12px", fontWeight: 600 }}
          >
            Apply
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default JobCard;
