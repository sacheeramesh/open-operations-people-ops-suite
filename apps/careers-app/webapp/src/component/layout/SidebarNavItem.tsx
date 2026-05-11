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

import { Box, Tooltip, useTheme } from "@mui/material";
import { Link } from "react-router-dom";

import { RouteDetail } from "@/types/types";

import LinkItem from "./LinkItem";
import SidebarSubMenu from "./SidebarSubMenu";

function SidebarNavItem({
  route,
  isActive,
  open,
  onClick,
}: {
  route: RouteDetail;
  isActive: boolean;
  open: boolean;
  onClick: () => void;
}) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 1,
        width: "100%",
      }}
    >
      <Tooltip
        title={!open ? route.text : ""}
        placement="right"
        arrow
        disableHoverListener={open}
        slotProps={{
          tooltip: {
            sx: {
              backgroundColor: theme.palette.grey[900],
              color: "#fff",
              borderRadius: "4px",
              fontSize: "12px",
            },
          },
          arrow: { sx: { color: theme.palette.grey[900] } },
        }}
      >
        {route.element ? (
          <Link
            to={route.path}
            style={{ width: "100%", display: "block", textDecoration: "none" }}
            onClick={onClick}
          >
            <LinkItem
              label={route.text}
              icon={route.icon}
              open={open}
              isActive={isActive}
              hasChildren={!!(route.children && route.children.length > 0)}
              route={route}
            />
          </Link>
        ) : (
          <Box
            component="button"
            sx={{ width: "100%", cursor: "pointer", border: "none", background: "none", p: 0 }}
            onClick={onClick}
          >
            <LinkItem
              label={route.text}
              icon={route.icon}
              open={open}
              isActive={isActive}
              hasChildren={!!(route.children && route.children.length > 0)}
              route={route}
            />
          </Box>
        )}
      </Tooltip>

      {route.children?.length && isActive && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
            ml: open ? 2.5 : 0,
            borderLeft: open ? `1px solid ${theme.palette.divider}` : "none",
            px: "8px",
          }}
        >
          <SidebarSubMenu parentRoute={route} open={open} />
        </Box>
      )}
    </Box>
  );
}

export default SidebarNavItem;
