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

import { Navigate, RouterProvider, createBrowserRouter } from "react-router-dom";

import { useMemo } from "react";

import Layout from "@layout/Layout";
import NotFoundPage from "@layout/pages/404";
import { RootState, useAppSelector } from "@slices/store";

import { getActiveRoutesV2, routes } from "../route";

const AppHandler = () => {
  const auth = useAppSelector((state: RootState) => state.auth);

  const router = useMemo(
    () =>
      createBrowserRouter([
        {
          path: "/",
          element: <Layout />,
          errorElement: <NotFoundPage />,
          children: [
            { index: true, element: <Navigate to="/dashboard" replace /> },
            ...getActiveRoutesV2(routes, auth.roles),
          ],
        },
      ]),
    [auth.roles],
  );

  return <RouterProvider router={router} />;
};

export default AppHandler;
