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

import { Box, Divider, Stack, Tooltip, Typography, useTheme } from "@mui/material";
import { ChevronLeft, ChevronRight, Moon, Sun } from "lucide-react";
import { useLocation } from "react-router-dom";

import { useMemo, useState } from "react";

import { NavState } from "@/types/types";
import SidebarNavItem from "@component/layout/SidebarNavItem";
import { ColorModeContext } from "@src/App";
import { getActiveRouteDetails } from "@src/route";

interface SidebarProps {
  open: boolean;
  handleDrawer: () => void;
  roles: string[];
  currentPath: string;
}

const Sidebar = (props: SidebarProps) => {
  const allRoutes = useMemo(() => getActiveRouteDetails(props.roles), [props.roles]);
  const location = useLocation();
  const theme = useTheme();

  const [navState, setNavState] = useState<NavState>({ active: null, hovered: null, expanded: null });

  const handleClick = (idx: number) => {
    setNavState((prev) => ({ ...prev, active: prev.active === idx ? null : idx }));
  };

  const renderControlButton = (
    icon: React.ReactNode,
    onClick?: () => void,
    tooltipTitle?: string,
  ) => {
    const button = (
      <Box
        component="button"
        type="button"
        onClick={onClick}
        disabled={!onClick}
        aria-label={tooltipTitle}
        sx={{
          width: props.open ? "100%" : "fit-content",
          padding: theme.spacing(1),
          borderRadius: "8px",
          cursor: onClick ? "pointer" : "default",
          border: "none",
          background: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: props.open ? "flex-start" : "center",
          gap: theme.spacing(1),
          color: theme.palette.customNavigation?.text ?? theme.palette.text.secondary,
          transition: "all 0.2s ease-in-out",
          ...(onClick && {
            "&:hover": {
              backgroundColor: theme.palette.customNavigation?.hoverBg ?? "action.hover",
              color: theme.palette.customNavigation?.hover ?? "text.primary",
            },
          }),
        }}
      >
        {icon}
      </Box>
    );

    if (tooltipTitle && !props.open) {
      return (
        <Tooltip title={tooltipTitle} placement="right" arrow>
          {button}
        </Tooltip>
      );
    }
    return button;
  };

  return (
    <ColorModeContext.Consumer>
      {(colorMode) => {
        const currentYear = new Date().getFullYear();

        return (
          <Box
            sx={{
              height: "100%",
              paddingY: "16px",
              paddingX: "12px",
              backgroundColor:
                theme.palette.surface?.secondary?.active ?? theme.palette.background.default,
              borderRight: `1px solid ${theme.palette.divider}`,
              zIndex: 10,
              display: "flex",
              flexDirection: "column",
              width: props.open ? "200px" : "fit-content",
              transition: "width 0.2s ease",
            }}
          >
            {/* Navigation List */}
            <Stack
              direction="column"
              gap={0.75}
              sx={{ overflow: "visible", width: props.open ? "100%" : "fit-content" }}
            >
              {allRoutes.map((route, idx) => {
                const isActivePath =
                  location.pathname === route.path ||
                  (route.path !== "/" && location.pathname.startsWith(route.path));

                return (
                  !route.bottomNav && (
                    <Box key={idx} sx={{ width: props.open ? "100%" : "fit-content" }}>
                      <SidebarNavItem
                        route={route}
                        open={props.open}
                        isActive={navState.active === null ? isActivePath : navState.active === idx}
                        onClick={() => handleClick(idx)}
                      />
                    </Box>
                  )
                );
              })}
            </Stack>

            <Box sx={{ flexGrow: 1 }} />

            {/* Footer Controls */}
            <Stack direction="column" gap={0.5} sx={{ pb: "8px" }}>
              {renderControlButton(
                colorMode.mode === "dark" ? <Sun size={18} /> : <Moon size={18} />,
                colorMode.toggleColorMode,
                colorMode.mode === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode",
              )}

              {renderControlButton(
                !props.open ? <ChevronRight size={18} /> : <ChevronLeft size={18} />,
                props.handleDrawer,
                props.open ? "Collapse Sidebar" : "Expand Sidebar",
              )}

              <Divider sx={{ my: 0.5 }} />

              {renderControlButton(
                <Typography variant="caption" sx={{ whiteSpace: "nowrap", color: "inherit" }}>
                  {props.open ? `© ${currentYear} WSO2 LLC` : "v2"}
                </Typography>,
                undefined,
                `WSO2 Careers v2.0`,
              )}
            </Stack>
          </Box>
        );
      }}
    </ColorModeContext.Consumer>
  );
};

export default Sidebar;
