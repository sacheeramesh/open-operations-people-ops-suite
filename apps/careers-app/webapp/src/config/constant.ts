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

export const SnackMessage = {
  success: {
    applicationSubmitted: "Application submitted successfully!",
    profileUpdated: "Profile updated successfully!",
    jobSaved: "Job saved to your list.",
    resumeUploaded: "Resume uploaded successfully!",
  },
  error: {
    fetchJobs: "Unable to retrieve job listings.",
    fetchApplications: "Unable to retrieve your applications.",
    fetchProfile: "Unable to retrieve your profile.",
    submitApplication: "Failed to submit application. Please try again.",
    insufficientPrivileges: "Insufficient Privileges",
    fetchPrivileges: "Failed to fetch Privileges",
  },
  warning: {},
};

export const APP_DESC =
  "Build your Candidate Passport and apply to WSO2 jobs with a single profile.";

export const redirectUrl = "careers-app-redirect-url";

export enum ApplicationStatus {
  Applied = "Applied",
  Screening = "Screening",
  Interview = "Interview",
  Offer = "Offer",
  Rejected = "Rejected",
}

export enum Department {
  Engineering = "Engineering",
  Cloud = "Cloud",
  DevRel = "Developer Relations",
  Product = "Product",
  Sales = "Sales",
  HR = "Human Resources",
  Marketing = "Marketing",
}

export enum ExperienceLevel {
  Junior = "Junior (0-2 yrs)",
  Mid = "Mid-level (2-5 yrs)",
  Senior = "Senior (5-8 yrs)",
  Lead = "Lead (8+ yrs)",
}
