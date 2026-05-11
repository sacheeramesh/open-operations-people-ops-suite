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

import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { Application, CandidateProfile, Job } from "@/types/types";
import { State } from "@/types/types";
import { mockApplications, mockCandidateProfile, mockSavedJobIds } from "@utils/mockData";
import { OrgStructure, fetchOrgStructure, fetchVacancies } from "@utils/vacancyService";

interface CareersState {
  profile: CandidateProfile;
  jobs: Job[];
  jobsState: State;
  orgStructure: OrgStructure;
  orgStructureState: State;
  applications: Application[];
  savedJobIds: string[];
}

const initialState: CareersState = {
  profile: mockCandidateProfile,
  jobs: [],
  jobsState: State.idle,
  orgStructure: { locations: [], teams: [] },
  orgStructureState: State.idle,
  applications: mockApplications,
  savedJobIds: mockSavedJobIds,
};

export const loadJobs = createAsyncThunk("careers/loadJobs", async (accessToken: string) => {
  return await fetchVacancies(accessToken);
});

export const loadOrgStructure = createAsyncThunk("careers/loadOrgStructure", async (accessToken: string) => {
  return await fetchOrgStructure(accessToken);
});

export const CareersSlice = createSlice({
  name: "careers",
  initialState,
  reducers: {
    updateProfile: (state, action: PayloadAction<Partial<CandidateProfile>>) => {
      state.profile = { ...state.profile, ...action.payload };
    },
    addApplication: (state, action: PayloadAction<Application>) => {
      const existing = state.applications.find((a) => a.jobId === action.payload.jobId);
      if (!existing) {
        state.applications.unshift(action.payload);
      }
    },
    toggleSaveJob: (state, action: PayloadAction<string>) => {
      const idx = state.savedJobIds.indexOf(action.payload);
      if (idx >= 0) {
        state.savedJobIds.splice(idx, 1);
      } else {
        state.savedJobIds.push(action.payload);
      }
    },
    addSkill: (state, action: PayloadAction<string>) => {
      if (!state.profile.skills.includes(action.payload)) {
        state.profile.skills.push(action.payload);
        state.profile.completionPercentage = Math.min(100, state.profile.completionPercentage + 5);
      }
    },
    removeSkill: (state, action: PayloadAction<string>) => {
      state.profile.skills = state.profile.skills.filter((s) => s !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadJobs.pending, (state) => {
        state.jobsState = State.loading;
      })
      .addCase(loadJobs.fulfilled, (state, action) => {
        state.jobs = action.payload;
        state.jobsState = State.success;
      })
      .addCase(loadJobs.rejected, (state) => {
        state.jobsState = State.failed;
      })
      .addCase(loadOrgStructure.pending, (state) => {
        state.orgStructureState = State.loading;
      })
      .addCase(loadOrgStructure.fulfilled, (state, action) => {
        state.orgStructure = action.payload;
        state.orgStructureState = State.success;
      })
      .addCase(loadOrgStructure.rejected, (state) => {
        state.orgStructureState = State.failed;
        state.orgStructure = { locations: [], teams: [] };
      });
  },
});

export const { updateProfile, addApplication, toggleSaveJob, addSkill, removeSkill } =
  CareersSlice.actions;
export default CareersSlice.reducer;
