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

import type { NonIndexRouteObject } from "react-router-dom";

import { ApplicationStatus } from "@config/constant";

// ── Navigation / Route ────────────────────────────────────────────────────────

export type NavState = {
  hovered: number | null;
  active: number | null;
  expanded: number | null;
};

export interface RouteDetail {
  path: string;
  allowRoles: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: React.ReactElement<any, any> | undefined;
  text: string;
  children?: RouteObjectWithRole[];
  bottomNav?: boolean;
  element?: React.ReactNode;
}

export interface RouteObjectWithRole extends NonIndexRouteObject {
  allowRoles: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: React.ReactElement<any, any> | undefined;
  text: string;
  children?: RouteObjectWithRole[];
  bottomNav?: boolean;
  element?: React.ReactNode;
}

// ── State & UI ─────────────────────────────────────────────────────────────────

export enum State {
  failed = "failed",
  success = "success",
  loading = "loading",
  idle = "idle",
}

export enum ConfirmationType {
  update = "update",
  send = "send",
  upload = "upload",
  accept = "accept",
}

// ── Candidate / Profile ────────────────────────────────────────────────────────

export interface ResumeVersion {
  id: string;
  name: string;
  uploadedAt: string;
  isActive: boolean;
  url: string;
}

export interface CandidateProfile {
  personId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  linkedIn: string;
  github: string;
  currentRole: string;
  yearsOfExperience: number;
  skills: string[];
  preferredRoles: string[];
  preferredLocations: string[];
  summary: string;
  resumes: ResumeVersion[];
  portfolio: PortfolioItem[];
  completionPercentage: number;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  url: string;
  type: "github" | "project" | "link";
}

// ── Jobs ───────────────────────────────────────────────────────────────────────

export interface Job {
  id: string;
  title: string;
  team: string;
  country: string[];
  jobType: string;
  publishStatus: string;
  postedDate: string;
}

// ── Applications ───────────────────────────────────────────────────────────────

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  department: string;
  appliedDate: string;
  status: ApplicationStatus;
  resumeVersionId: string;
  notes: string;
}
