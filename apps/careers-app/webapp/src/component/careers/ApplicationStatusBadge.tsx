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

import { Chip } from "@mui/material";

import { ApplicationStatus } from "@config/constant";

interface Props {
  status: ApplicationStatus;
  size?: "small" | "medium";
}

const statusConfig: Record<ApplicationStatus, { color: string; bg: string }> = {
  [ApplicationStatus.Applied]: { color: "#3B82F6", bg: "#EFF6FF" },
  [ApplicationStatus.Screening]: { color: "#F59E0B", bg: "#FFFBEB" },
  [ApplicationStatus.Interview]: { color: "#8B5CF6", bg: "#F5F3FF" },
  [ApplicationStatus.Offer]: { color: "#10B981", bg: "#ECFDF5" },
  [ApplicationStatus.Rejected]: { color: "#EF4444", bg: "#FEF2F2" },
};

const ApplicationStatusBadge = ({ status, size = "small" }: Props) => {
  const config = statusConfig[status];
  return (
    <Chip
      label={status}
      size={size}
      sx={{
        fontWeight: 600,
        fontSize: "11px",
        color: config.color,
        backgroundColor: config.bg,
        border: `1px solid ${config.color}30`,
        borderRadius: "6px",
      }}
    />
  );
};

export default ApplicationStatusBadge;
