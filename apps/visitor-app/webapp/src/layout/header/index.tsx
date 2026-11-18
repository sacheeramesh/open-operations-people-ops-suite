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

import React from "react";
import { APP_NAME } from "@config/config";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { useAppAuthContext } from "@context/AuthContext";
import { RootState, useAppSelector } from "@slices/store";
import {
  AppBar,
  Avatar,
  Box,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
} from "@mui/material";
import "@fontsource-variable/sora";
import ChoreoLabsMark from "@component/common/ChoreoLabsMark";

// Brand lockup: the Choreo Labs mark, then the app name in Sora 600. Sized like the Choreo Labs
// Customer Portal header (24px mark, 20px gap, 16px name). vertical-align centres the mark on the
// cap height of the first letter.
const BRAND_FONT_FAMILY = "'Sora Variable', sans-serif";
const BRAND_FONT_PX = 16;
const BRAND_MARK_PX = 24;
const BRAND_GAP_PX = "20px";
const BRAND_MARK_ALIGN = `calc(0.5cap - ${BRAND_MARK_PX / 2}px)`;

const Header = () => {
  const authContext = useAppAuthContext();
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(
    null,
  );
  const user = useAppSelector((state: RootState) => state.user);

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        color: (theme) =>
          theme.palette.mode === "light"
            ? theme.palette.primary.main
            : theme.palette.common.white,

        background: (theme) =>
          theme.palette.mode === "light"
            ? theme.palette.common.white
            : theme.palette.primary.dark,
        boxShadow: 2,
      }}
    >
      <Toolbar
        variant="dense"
        sx={{
          paddingY: 0.3,
          "&.MuiToolbar-root": {
            pl: 0.3,
          },
        }}
      >
        <Box sx={{ flexGrow: 1, ml: 1.5 }}>
          {/* One line of text with the mark inline at its start, so BRAND_MARK_ALIGN can centre the
              mark on the cap height. lineHeight 0 makes the line box the mark's box, which the
              toolbar then centres. The mark takes the header's text colour. */}
          <Typography
            component="span"
            onClick={() => (window.location.href = "/")}
            sx={{
              display: "inline-block",
              cursor: "pointer",
              whiteSpace: "nowrap",
              fontFamily: BRAND_FONT_FAMILY,
              fontWeight: 600,
              fontSize: BRAND_FONT_PX,
              lineHeight: 0,
            }}
          >
            <Box
              component={ChoreoLabsMark}
              sx={{
                height: BRAND_MARK_PX,
                mr: BRAND_GAP_PX,
                verticalAlign: BRAND_MARK_ALIGN,
              }}
            />
            {APP_NAME}
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 0 }}>
          {user.userInfo && (
            <>
              <Stack flexDirection={"row"} alignItems={"center"} gap={2}>
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {user.userInfo?.firstName + " " + user.userInfo.lastName}
                  </Typography>
                  <Typography variant="body2">
                    {user.userInfo?.jobRole}
                  </Typography>
                </Box>
                <Tooltip title="Open settings">
                  <Avatar
                    onClick={handleOpenUserMenu}
                    sx={{ border: 1, borderColor: "primary.main" }}
                    src={user.userInfo?.employeeThumbnail || ""}
                    alt={user.userInfo?.firstName || "Avatar"}
                  >
                    {user.userInfo?.firstName?.charAt(0)}
                  </Avatar>
                </Tooltip>
              </Stack>

              <Menu
                sx={{ mt: "45px" }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                keepMounted
                transformOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
              >
                <MenuItem
                  key={"logout"}
                  onClick={() => {
                    authContext.appSignOut();
                  }}
                >
                  <Typography textAlign="center">Logout</Typography>
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
