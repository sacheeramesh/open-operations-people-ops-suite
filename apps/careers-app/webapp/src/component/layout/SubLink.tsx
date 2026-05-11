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

import { Box, Typography, useTheme } from "@mui/material";
import { Link, useLocation } from "react-router-dom";

import React from "react";

interface SubLinkProps {
  to: string;
  parentPath: string | undefined;
  primary: string;
  icon?: React.ReactElement;
  open: boolean;
}

function SubLink({ to, parentPath, primary, icon, open }: SubLinkProps) {
  const theme = useTheme();
  const location = useLocation();
  const fullPath = parentPath ? `/${parentPath}/${to}` : `/${to}`;
  const isActive = location.pathname === fullPath;

  return (
    <Link to={fullPath} style={{ textDecoration: "none", width: "100%", display: "block" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 1,
          py: 0.75,
          borderRadius: "6px",
          transition: "all 0.2s",
          backgroundColor: isActive ? theme.palette.customNavigation.clickedBg : "transparent",
          "&:hover": {
            backgroundColor: theme.palette.customNavigation.hoverBg,
          },
          color: isActive
            ? theme.palette.customNavigation.textClicked
            : theme.palette.customNavigation.text,
        }}
      >
        {icon && (
          <Box sx={{ display: "flex", alignItems: "center", "& svg": { width: 16, height: 16 } }}>
            {icon}
          </Box>
        )}
        {open && (
          <Typography sx={{ fontSize: "13px", fontWeight: isActive ? 600 : 400 }}>
            {primary}
          </Typography>
        )}
      </Box>
    </Link>
  );
}

export default SubLink;
