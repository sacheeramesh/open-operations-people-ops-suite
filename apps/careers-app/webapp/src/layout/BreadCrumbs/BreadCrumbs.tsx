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

import { Box, Typography } from "@mui/material";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import { Link, useLocation } from "react-router-dom";

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  profile: "My Profile",
  jobs: "Browse Jobs",
  applications: "My Applications",
  saved: "Saved Jobs",
};

export default function BasicBreadcrumbs() {
  const location = useLocation();
  const { pathname } = location;
  const pathnames = pathname === "/" ? [] : pathname.split("/").filter(Boolean);

  if (pathnames.length === 0) return null;

  return (
    <Box sx={{ ml: 0.5 }}>
      <Breadcrumbs separator="›" aria-label="breadcrumb">
        {pathnames.map((path, index) => {
          const isLast = index === pathnames.length - 1;
          const label = routeLabels[path] ?? path;
          const routeTo = "/" + pathnames.slice(0, index + 1).join("/");

          return (
            <Box
              key={index}
              component={isLast ? "span" : Link}
              to={isLast ? undefined : routeTo}
              sx={{
                textDecoration: "none",
                color: isLast ? "text.primary" : "text.secondary",
                fontSize: "12px",
                fontWeight: isLast ? 600 : 400,
                "&:hover": isLast ? {} : { color: "text.primary" },
              }}
            >
              <Typography variant="caption" sx={{ color: "inherit", fontWeight: "inherit" }}>
                {label}
              </Typography>
            </Box>
          );
        })}
      </Breadcrumbs>
    </Box>
  );
}
