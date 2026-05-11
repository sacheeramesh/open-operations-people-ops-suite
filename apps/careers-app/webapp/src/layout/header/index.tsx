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

import { Avatar, Box, Menu, MenuItem, Stack, Tooltip, Typography, useTheme } from "@mui/material";
import Toolbar from "@mui/material/Toolbar";

import React from "react";

import wso2LogoBlack from "@assets/images/wso2-logo_black.svg";
import wso2LogoWhite from "@assets/images/wso2-logo_white.svg";
import { APP_NAME } from "@config/config";
import { useAppAuthContext } from "@context/AuthContext";
import BasicBreadcrumbs from "@layout/BreadCrumbs/BreadCrumbs";
import { RootState, useAppSelector } from "@slices/store";

const Header = () => {
  const authContext = useAppAuthContext();
  const theme = useTheme();
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);
  const user = useAppSelector((state: RootState) => state.user);

  return (
    <Box
      sx={{
        zIndex: 10,
        backgroundColor: theme.palette.surface?.territory?.active ?? theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      <Toolbar
        variant="dense"
        sx={{
          py: 0.5,
          display: "flex",
          gap: 1,
          "&.MuiToolbar-root": { pl: 1.5 },
        }}
      >
        {/* Logo */}
        <Stack direction="row" alignItems="center" gap={1.5} sx={{ cursor: "pointer" }} onClick={() => (window.location.href = "/")}>
          <Box
            component="img"
            src={theme.palette.mode === "dark" ? wso2LogoWhite : wso2LogoBlack}
            alt="WSO2"
            sx={{ height: 24, width: "auto", flexShrink: 0 }}
          />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontSize: "15px",
              color: theme.palette.customText?.primary?.p1?.active ?? "text.primary",
              whiteSpace: "nowrap",
            }}
          >
            {APP_NAME.replace("WSO2 ", "")}
          </Typography>
        </Stack>

        <BasicBreadcrumbs />

        {/* Spacer */}
        <Box sx={{ flex: 1 }} />

        {/* User */}
        <Box sx={{ flexGrow: 0 }}>
          {user.userInfo && (
            <>
              <Tooltip title="Account settings">
                <Stack
                  direction="row"
                  alignItems="center"
                  gap={1}
                  sx={{ cursor: "pointer", py: 0.5, px: 1, borderRadius: "8px", "&:hover": { backgroundColor: "action.hover" } }}
                  onClick={(e) => setAnchorElUser(e.currentTarget)}
                >
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      fontSize: "13px",
                      fontWeight: 700,
                      backgroundColor: "#FF7300",
                    }}
                    src={user.userInfo?.employeeThumbnail || ""}
                  >
                    {user.userInfo?.firstName?.charAt(0)}
                  </Avatar>
                  <Box sx={{ display: { xs: "none", sm: "block" } }}>
                    <Typography
                      noWrap
                      sx={{ fontSize: "13px", fontWeight: 600, lineHeight: 1.2, color: "text.primary" }}
                    >
                      {user.userInfo?.firstName} {user.userInfo?.lastName}
                    </Typography>
                    <Typography noWrap sx={{ fontSize: "11px", color: "text.secondary", lineHeight: 1.2 }}>
                      {user.userInfo?.jobRole}
                    </Typography>
                  </Box>
                </Stack>
              </Tooltip>

              <Menu
                sx={{ mt: "8px" }}
                anchorEl={anchorElUser}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                open={Boolean(anchorElUser)}
                onClose={() => setAnchorElUser(null)}
                PaperProps={{ sx: { borderRadius: "10px", minWidth: 160 } }}
              >
                <MenuItem
                  onClick={() => {
                    setAnchorElUser(null);
                    authContext.appSignOut();
                  }}
                  sx={{ fontSize: "14px" }}
                >
                  Logout
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Toolbar>
    </Box>
  );
};

export default Header;
