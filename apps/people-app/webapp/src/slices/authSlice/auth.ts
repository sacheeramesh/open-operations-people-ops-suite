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

import { State } from "@/types/types";
import { BasicUserInfo, DecodedIDTokenPayload } from "@asgardeo/auth-spa";
import {
  ADMIN_PRIVILEGE,
  EMPLOYEE_VIEW_PRIVILEGE,
  LEAD_PRIVILEGE,
  REPORT_PRIVILEGE,
  RESIGNATION_PRIVILEGE,
  SERVICE_DESK_PRIVILEGE,
  SnackMessage,
} from "@config/constant";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { RootState } from "@slices/store";

export enum Role {
  EMPLOYEE = "EMPLOYEE",
  LEAD = "LEAD",
  ADMIN = "ADMIN",
  SERVICE_DESK = "SERVICE_DESK",
  // Delegated roles. Each grants one capability rather than extending the employee
  // baseline, and a user may hold several at once alongside the roles above.
  EMPLOYEE_VIEW = "EMPLOYEE_VIEW",
  RESIGNATION = "RESIGNATION",
  REPORT = "REPORT",
}

interface AuthState {
  status: State;
  mode: "active" | "maintenance";
  statusMessage: string | null;
  isAuthenticated: boolean;
  userInfo: BasicUserInfo | null;
  decodedIdToken: DecodedIDTokenPayload | null;
  roles: Role[];
}

interface AuthData {
  userInfo: BasicUserInfo;
  idToken: string;
  decodedIdToken: DecodedIDTokenPayload;
}

export interface UserState {
  state: State;
  stateMessage: string | null;
  errorMessage: string | null;
  userInfo: UserInfoInterface | null;
  isProfileMissing: boolean;
}

export interface UserInfoInterface {
  id: number;                 
  employeeId: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  employeeThumbnail: string | null;
  designation: string | null;
  privileges: number[];
}

const initialState: AuthState = {
  status: State.idle,
  mode: "active",
  statusMessage: null,
  isAuthenticated: false,
  userInfo: null,
  decodedIdToken: null,
  roles: [],
};

export const loadPrivileges = createAsyncThunk(
  "auth/loadPrivileges",
  (_, { getState, dispatch, rejectWithValue }) => {
    const { userInfo, state, errorMessage } = (
      getState() as { user: UserState }
    ).user;

    if (state === State.failed) {
      dispatch(
        enqueueSnackbarMessage({
          message: SnackMessage.error.fetchPrivileges,
          type: "error",
        })
      );
      return rejectWithValue(errorMessage);
    }
    const userPrivileges = userInfo?.privileges || [];
    const roles: Role[] = [Role.EMPLOYEE];

    if (userPrivileges.includes(LEAD_PRIVILEGE)) {
      roles.push(Role.LEAD);
    }
    if (userPrivileges.includes(ADMIN_PRIVILEGE)) {
      roles.push(Role.ADMIN);
    }
    if (userPrivileges.includes(SERVICE_DESK_PRIVILEGE)) {
      roles.push(Role.SERVICE_DESK);
    }
    if (userPrivileges.includes(EMPLOYEE_VIEW_PRIVILEGE)) {
      roles.push(Role.EMPLOYEE_VIEW);
    }
    if (userPrivileges.includes(RESIGNATION_PRIVILEGE)) {
      roles.push(Role.RESIGNATION);
    }
    if (userPrivileges.includes(REPORT_PRIVILEGE)) {
      roles.push(Role.REPORT);
    }
    return { roles };
  }
);

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUserAuthData: (state, action: PayloadAction<AuthData>) => {
      state.userInfo = action.payload.userInfo;
      state.decodedIdToken = action.payload.decodedIdToken;
      state.status = State.success;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadPrivileges.pending, (state) => {
        state.status = State.loading;
      })
      .addCase(loadPrivileges.fulfilled, (state, action) => {
        state.status = State.success;
        state.roles = action.payload.roles;
      })
      .addCase(loadPrivileges.rejected, (state, action) => {
        state.status = State.failed;
        state.statusMessage = action.payload as string;
      });
  },
});

export const { setUserAuthData } = authSlice.actions;
export const selectRoles = (state: RootState) => state.auth.roles;
export default authSlice.reducer;
