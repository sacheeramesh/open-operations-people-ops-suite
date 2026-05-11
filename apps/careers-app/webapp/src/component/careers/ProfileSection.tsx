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

import { Box, Card, CardContent, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { Pencil, X } from "lucide-react";
import { useState } from "react";

interface ProfileSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  editContent?: React.ReactNode;
}

const ProfileSection = ({ title, icon, children, editContent }: ProfileSectionProps) => {
  const [editing, setEditing] = useState(false);

  return (
    <Card
      elevation={0}
      sx={{ border: "1px solid", borderColor: "divider", borderRadius: "12px", mb: 2 }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Stack direction="row" alignItems="center" gap={1}>
            {icon && <Box sx={{ color: "#FF7300", display: "flex" }}>{icon}</Box>}
            <Typography fontWeight={700} fontSize="15px">
              {title}
            </Typography>
          </Stack>
          {editContent && (
            <Tooltip title={editing ? "Cancel" : "Edit"}>
              <IconButton
                size="small"
                onClick={() => setEditing(!editing)}
                sx={{ color: editing ? "error.main" : "text.secondary" }}
              >
                {editing ? <X size={16} /> : <Pencil size={16} />}
              </IconButton>
            </Tooltip>
          )}
        </Stack>

        {editing && editContent ? editContent : children}
      </CardContent>
    </Card>
  );
};

export default ProfileSection;
