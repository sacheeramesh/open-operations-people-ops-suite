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

import { BasicUserInfo, DecodedIDTokenPayload } from "@asgardeo/auth-spa";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";

import { State } from "@/types/types";
import { RootState } from "@slices/store";

export enum Role {
  CANDIDATE = "CANDIDATE",
  ADMIN = "ADMIN",
}

interface ExtendedDecodedIDTokenPayload extends DecodedIDTokenPayload {
  groups?: string[];
}

interface AuthState {
  status: State;
  mode: "active" | "maintenance";
  statusMessage: string | null;
  userInfo: BasicUserInfo | null;
  decodedIdToken: ExtendedDecodedIDTokenPayload | null;
  roles: Role[];
}

interface AuthData {
  userInfo: BasicUserInfo;
  decodedIdToken: ExtendedDecodedIDTokenPayload;
}

const initialState: AuthState = {
  status: State.idle,
  mode: "active",
  statusMessage: null,
  userInfo: null,
  decodedIdToken: null,
  roles: [],
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUserAuthData: (state, action: PayloadAction<AuthData>) => {
      state.userInfo = action.payload.userInfo;
      state.decodedIdToken = action.payload.decodedIdToken;
      state.status = State.success;
      // All authenticated users get CANDIDATE role
      state.roles = [Role.CANDIDATE];
    },
    setAuthError: (state) => {
      state.status = State.failed;
      state.statusMessage = "Authentication failed. Please try again.";
      state.userInfo = null;
      state.decodedIdToken = null;
      state.roles = [];
    },
    setAuthSuccess: (state) => {
      state.status = State.success;
      if (state.roles.length === 0) {
        state.roles = [Role.CANDIDATE];
      }
    },
  },
});

export const { setUserAuthData, setAuthError, setAuthSuccess } = authSlice.actions;
export const selectRoles = (state: RootState) => state.auth.roles;
export default authSlice.reducer;
