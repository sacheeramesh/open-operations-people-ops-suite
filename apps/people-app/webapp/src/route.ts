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

import {
  Navigate,
  NonIndexRouteObject,
  Outlet,
  useLocation,
} from "react-router-dom";
import { useSelector } from "react-redux";
import { selectRoles } from "@slices/authSlice/auth";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import HubIcon from "@mui/icons-material/Hub";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import WorkspacesIcon from "@mui/icons-material/Workspaces";
import AssessmentIcon from "@mui/icons-material/Assessment";
import GroupsIcon from "@mui/icons-material/Groups";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import { Role } from "@slices/authSlice/auth";
import { isIncludedRole } from "@utils/utils";
import { View } from "@view/index";
import { BadgeSharp, Groups } from "@mui/icons-material";

export interface RouteObjectWithRole extends NonIndexRouteObject {
  allowRoles: string[];
  /** Route is excluded from the router and sidebar if the user has any of these roles. */
  excludeRoles?: string[];
  icon:
    | React.ReactElement<any, string | React.JSXElementConstructor<any>>
    | undefined;
  text: string;
  children?: RouteObjectWithRole[];
  bottomNav?: boolean;
  hideFromSidebar?: boolean;
}

export interface RouteDetail {
  path: string;
  allowRoles: string[];
  excludeRoles?: string[];
  icon:
    | React.ReactElement<any, string | React.JSXElementConstructor<any>>
    | undefined;
  text: string;
  children?: RouteDetail[];
  bottomNav?: boolean;
  hideFromSidebar?: boolean;
}

const EmployeesRoot = () => {
  const { pathname } = useLocation();
  if (pathname === "/employees") {
    return React.createElement(Navigate, { to: "/employees/view", replace: true });
  }
  return React.createElement(Outlet);
};

const ReportsRoot = () => {
  const { pathname } = useLocation();
  const roles = useSelector(selectRoles);
  if (pathname === "/reports") {
    const redirectTo = roles.includes(Role.ADMIN)
      ? "/reports/active-employees"
      : "/reports/qr-codes";
    return React.createElement(Navigate, { to: redirectTo, replace: true });
  }
  return React.createElement(Outlet);
};

const OnboardingRoot = () => {
  const { pathname } = useLocation();
  if (pathname === "/onboarding") {
    return React.createElement(Navigate, { to: "/onboarding/single", replace: true });
  }
  return React.createElement(Outlet);
};

const MasterDataRoot = () => {
  const { pathname, search } = useLocation();
  if (pathname === "/master-data") {
    // Forward the query string so links such as /master-data?tab=teams keep their tab.
    return React.createElement(Navigate, {
      to: `/master-data/org-structure${search}`,
      replace: true,
    });
  }
  return React.createElement(Outlet);
};


export const routes: RouteObjectWithRole[] = [
  {
    path: "/",
    text: "Me",
    icon: React.createElement(AccountCircleIcon),
    element: React.createElement(View.me),
    allowRoles: [Role.ADMIN, Role.EMPLOYEE],
  },
  {
    path: "/employees",
    text: "Employees",
    icon: React.createElement(BadgeSharp),
    element: React.createElement(EmployeesRoot),
    allowRoles: [Role.ADMIN, Role.EMPLOYEE_VIEW],
    children: [
      {
        path: "/employees/view",
        text: "All",
        element: React.createElement(View.employeesList),
        icon: React.createElement(Groups),
        allowRoles: [Role.ADMIN, Role.EMPLOYEE_VIEW],
      },
      {
        path: "/employees/my-team",
        text: "My Team",
        icon: React.createElement(PeopleAltIcon),
        element: React.createElement(View.myTeamView),
        allowRoles: [Role.LEAD],
      },
    ],
  },
  {
    path: "/onboarding",
    text: "Onboarding",
    icon: React.createElement(GroupAddIcon),
    element: React.createElement(OnboardingRoot),
    allowRoles: [Role.ADMIN],
    children: [
      {
        path: "/onboarding/single",
        text: "Single",
        icon: React.createElement(PersonAddAlt1Icon),
        element: React.createElement(View.employeeOnboarding),
        allowRoles: [Role.ADMIN],
      },
      {
        path: "/onboarding/bulk",
        text: "Bulk",
        icon: React.createElement(UploadFileIcon),
        element: React.createElement(View.bulkOnboarding),
        allowRoles: [Role.ADMIN],
      },
    ],
  },
  // Top-level My Team entry shown only for lead-only users (hidden when the user also has admin
  // access, since admin+lead users see My Team nested under Employees instead).
  {
    path: "/employees/my-team",
    text: "My Team",
    icon: React.createElement(PeopleAltIcon),
    element: React.createElement(View.myTeamView),
    allowRoles: [Role.LEAD],
    excludeRoles: [Role.ADMIN],
  },
  {
    path: "/reports",
    text: "Reports",
    icon: React.createElement(AssessmentIcon),
    element: React.createElement(ReportsRoot),
    allowRoles: [Role.ADMIN, Role.SERVICE_DESK, Role.REPORT],
    children: [
      {
        path: "/reports/active-employees",
        text: "Active Employees",
        icon: React.createElement(Groups),
        element: React.createElement(View.activeEmployeesReport),
        allowRoles: [Role.ADMIN, Role.REPORT],
      },
      {
        path: "/reports/inactive-employees",
        text: "Resignations",
        icon: React.createElement(PersonOffIcon),
        element: React.createElement(View.resignationReport),
        allowRoles: [Role.ADMIN, Role.REPORT],
      },
      {
        path: "/reports/qr-codes",
        text: "QR Codes",
        icon: React.createElement(QrCode2Icon),
        element: React.createElement(View.qrCodesReport),
        allowRoles: [Role.ADMIN, Role.SERVICE_DESK],
      },
    ],
  },
  {
    path: "/master-data",
    text: "Master Data",
    icon: React.createElement(HubIcon),
    element: React.createElement(MasterDataRoot),
    allowRoles: [Role.ADMIN],
    children: [
      {
        path: "/master-data/org-structure",
        text: "Org Structure",
        icon: React.createElement(AccountTreeIcon),
        element: React.createElement(View.masterDataView),
        allowRoles: [Role.ADMIN],
      },
      {
        path: "/master-data/career-functions",
        text: "Career Functions",
        icon: React.createElement(WorkspacesIcon),
        element: React.createElement(View.careerFunctionView),
        allowRoles: [Role.ADMIN],
      },
    ],
  },
  // Todo: Uncomment when help view is ready
  // {
  //   path: "/help",
  //   text: "Help",
  //   icon: React.createElement(HelpOutlineIcon),
  //   element: React.createElement(View.help),
  //   allowRoles: [Role.ADMIN, Role.TEAM],
  //   bottomNav: true,
  // },
  {
    path: "/employees/:employeeId",
    text: "Employees",
    icon: React.createElement(GroupsIcon),
    element: React.createElement(View.employeeDetails),
    allowRoles: [Role.ADMIN, Role.LEAD, Role.EMPLOYEE_VIEW],
    hideFromSidebar: true,
  },
  {
    path: "/employees/:employeeId/edit",
    text: "Edit Employee",
    icon: React.createElement(GroupsIcon),
    element: React.createElement(View.employeeEdit),
    allowRoles: [Role.ADMIN],
    hideFromSidebar: true,
  },
];

function isRouteActive(routeObj: RouteObjectWithRole, roles: string[]): boolean {
  return (
    isIncludedRole(roles, routeObj.allowRoles) &&
    !(routeObj.excludeRoles && isIncludedRole(roles, routeObj.excludeRoles))
  );
}

export const getActiveRoutesV2 = (
  routes: RouteObjectWithRole[] | undefined,
  roles: string[],
): RouteObjectWithRole[] => {
  if (!routes) return [];
  var routesObj: RouteObjectWithRole[] = [];
  routes.forEach((routeObj) => {
    if (isRouteActive(routeObj, roles)) {
      routesObj.push({
        ...routeObj,
        children: routeObj.children ? getActiveRoutesV2(routeObj.children, roles) : undefined,
      });
    }
  });
  return routesObj;
};

export const getActiveRouteDetails = (roles: string[]): RouteDetail[] => {
  const filterRoutes = (routeList: RouteObjectWithRole[]): RouteDetail[] =>
    routeList.reduce<RouteDetail[]>((acc, routeObj) => {
      if (isRouteActive(routeObj, roles)) {
        acc.push({
          ...routeObj,
          path: routeObj.path ?? "",
          children: routeObj.children ? filterRoutes(routeObj.children) : undefined,
        });
      }
      return acc;
    }, []);
  return filterRoutes(routes);
};
