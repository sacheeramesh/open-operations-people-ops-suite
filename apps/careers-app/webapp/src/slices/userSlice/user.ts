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

import { PayloadAction, createSlice } from "@reduxjs/toolkit";

import { State } from "@/types/types";

export interface UserInfoInterface {
  personId: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  employeeThumbnail: string | null;
  jobRole: string;
}

interface UserState {
  state: State;
  stateMessage: string | null;
  errorMessage: string | null;
  userInfo: UserInfoInterface | null;
}

const initialState: UserState = {
  state: State.idle,
  stateMessage: null,
  errorMessage: null,
  userInfo: null,
};

export const UserSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUserInfo: (state, action: PayloadAction<UserInfoInterface>) => {
      state.userInfo = action.payload;
      state.state = State.success;
    },
    clearUserInfo: (state) => {
      state.userInfo = null;
      state.state = State.idle;
    },
  },
});

export const { setUserInfo, clearUserInfo } = UserSlice.actions;
export default UserSlice.reducer;
