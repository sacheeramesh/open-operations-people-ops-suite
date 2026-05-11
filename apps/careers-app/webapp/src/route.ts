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

import {
  AssignmentOutlined,
  BookmarkBorderOutlined,
  DashboardOutlined,
  HelpOutlineOutlined,
  PersonOutlined,
  WorkOutlineOutlined,
} from "@mui/icons-material";
import type { RouteObject } from "react-router-dom";

import React from "react";

import { Role } from "@slices/authSlice/auth";
import type { RouteDetail, RouteObjectWithRole } from "@/types/types";
import { isIncludedRole } from "@utils/utils";
import { View } from "@view/index";

export const routes: RouteObjectWithRole[] = [
  {
    path: "/dashboard",
    text: "Dashboard",
    icon: React.createElement(DashboardOutlined, { sx: { fontSize: 20 } }),
    element: React.createElement(View.dashboard),
    allowRoles: [Role.CANDIDATE, Role.ADMIN],
  },
  {
    path: "/profile",
    text: "My Profile",
    icon: React.createElement(PersonOutlined, { sx: { fontSize: 20 } }),
    element: React.createElement(View.profile),
    allowRoles: [Role.CANDIDATE, Role.ADMIN],
  },
  {
    path: "/jobs",
    text: "Browse Jobs",
    icon: React.createElement(WorkOutlineOutlined, { sx: { fontSize: 20 } }),
    element: React.createElement(View.jobs),
    allowRoles: [Role.CANDIDATE, Role.ADMIN],
  },
  {
    path: "/jobs/:id",
    text: "Job Detail",
    icon: React.createElement(WorkOutlineOutlined, { sx: { fontSize: 20 } }),
    element: React.createElement(View.jobDetail),
    allowRoles: [Role.CANDIDATE, Role.ADMIN],
    bottomNav: true,
  },
  {
    path: "/applications",
    text: "My Applications",
    icon: React.createElement(AssignmentOutlined, { sx: { fontSize: 20 } }),
    element: React.createElement(View.applications),
    allowRoles: [Role.CANDIDATE, Role.ADMIN],
  },
  {
    path: "/saved",
    text: "Saved Jobs",
    icon: React.createElement(BookmarkBorderOutlined, { sx: { fontSize: 20 } }),
    element: React.createElement(View.savedJobs),
    allowRoles: [Role.CANDIDATE, Role.ADMIN],
  },
  {
    path: "/help",
    text: "Help",
    icon: React.createElement(HelpOutlineOutlined, { sx: { fontSize: 20 } }),
    element: React.createElement(View.help),
    allowRoles: [Role.CANDIDATE, Role.ADMIN],
    bottomNav: true,
  },
];

export const getActiveRoutesV2 = (
  routes: RouteObjectWithRole[] | undefined,
  roles: string[],
): RouteObjectWithRole[] => {
  if (!routes) return [];
  const routesObj: RouteObjectWithRole[] = [];
  routes.forEach((routeObj) => {
    if (isIncludedRole(roles, routeObj.allowRoles)) {
      routesObj.push({
        ...routeObj,
        children: getActiveRoutesV2(routeObj.children, roles),
      });
    }
  });
  return routesObj;
};

export const getActiveRoutes = (roles: string[]): RouteObject[] => {
  const routesObj: RouteObject[] = [];
  routes.forEach((routeObj) => {
    if (isIncludedRole(roles, routeObj.allowRoles)) {
      routesObj.push({ ...routeObj });
    }
  });
  return routesObj;
};

export const getActiveRouteDetails = (roles: string[]): RouteDetail[] => {
  const routesObj: RouteDetail[] = [];
  routes.forEach((routeObj) => {
    if (routeObj.path && isIncludedRole(roles, routeObj.allowRoles)) {
      routesObj.push({
        ...routeObj,
        path: routeObj.path ?? "",
      });
    }
  });
  return routesObj;
};
