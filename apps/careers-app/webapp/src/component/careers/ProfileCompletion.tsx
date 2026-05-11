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

import { Box, Button, Card, CardContent, Chip, LinearProgress, Stack, Typography } from "@mui/material";
import { CheckCircle2, Circle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CompletionItem {
  label: string;
  done: boolean;
}

interface ProfileCompletionProps {
  percentage: number;
  items: CompletionItem[];
}

const ProfileCompletion = ({ percentage, items }: ProfileCompletionProps) => {
  const navigate = useNavigate();

  const getColor = () => {
    if (percentage >= 80) return "#10B981";
    if (percentage >= 50) return "#F59E0B";
    return "#EF4444";
  };

  return (
    <Card
      elevation={0}
      sx={{ border: "1px solid", borderColor: "divider", borderRadius: "12px", height: "100%" }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography fontWeight={700} fontSize="15px">
            Profile Completion
          </Typography>
          <Chip
            label={`${percentage}%`}
            size="small"
            sx={{
              fontWeight: 700,
              backgroundColor: `${getColor()}15`,
              color: getColor(),
              fontSize: "12px",
            }}
          />
        </Stack>

        <Box mb={2}>
          <LinearProgress
            variant="determinate"
            value={percentage}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: "action.hover",
              "& .MuiLinearProgress-bar": {
                borderRadius: 4,
                background: `linear-gradient(90deg, ${getColor()}, ${getColor()}cc)`,
              },
            }}
          />
        </Box>

        <Stack gap={1} mb={2.5}>
          {items.map((item, i) => (
            <Stack key={i} direction="row" alignItems="center" gap={1}>
              {item.done ? (
                <CheckCircle2 size={15} color="#10B981" />
              ) : (
                <Circle size={15} color="#D1D5DB" />
              )}
              <Typography
                fontSize="13px"
                sx={{ color: item.done ? "text.primary" : "text.disabled" }}
              >
                {item.label}
              </Typography>
            </Stack>
          ))}
        </Stack>

        <Button
          variant="outlined"
          size="small"
          fullWidth
          onClick={() => navigate("/profile")}
          sx={{ borderRadius: "8px", fontWeight: 600, fontSize: "12px" }}
        >
          Complete Profile
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProfileCompletion;
