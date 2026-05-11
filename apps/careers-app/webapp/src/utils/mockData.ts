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

import { ApplicationStatus, Department } from "@config/constant";
import { Application, CandidateProfile, Job } from "@/types/types";

// ── Mock Candidate Passport ────────────────────────────────────────────────────

export const mockCandidateProfile: CandidateProfile = {
  personId: "P-10234",
  firstName: "John",
  lastName: "Silva",
  email: "john@example.com",
  phone: "+94 77 123 4567",
  country: "Sri Lanka",
  linkedIn: "https://linkedin.com/in/johnsilva",
  github: "https://github.com/johnsilva",
  currentRole: "Senior Software Engineer",
  yearsOfExperience: 5,
  skills: ["Kubernetes", "Java", "Microservices", "React", "Docker"],
  preferredRoles: ["Software Engineer", "Cloud Architect"],
  preferredLocations: ["Sri Lanka", "Remote"],
  summary:
    "Experienced software engineer specializing in cloud-native microservices and developer platforms. Passionate about open-source integration and API management.",
  resumes: [
    {
      id: "r1",
      name: "John_Silva_Resume_2025.pdf",
      uploadedAt: "2025-01-15",
      isActive: true,
      url: "#",
    },
    {
      id: "r2",
      name: "John_Silva_Resume_Backend.pdf",
      uploadedAt: "2024-11-20",
      isActive: false,
      url: "#",
    },
  ],
  portfolio: [
    {
      id: "p1",
      title: "WSO2 API Manager Plugin",
      description: "Open-source plugin for VSCode to manage WSO2 API Manager resources.",
      url: "https://github.com/johnsilva/wso2-apim-vscode",
      type: "github",
    },
    {
      id: "p2",
      title: "Microservices Orchestration Demo",
      description: "Demo project showcasing Kubernetes-based microservices orchestration.",
      url: "https://github.com/johnsilva/k8s-microservices-demo",
      type: "project",
    },
  ],
  completionPercentage: 70,
};

// ── Mock Jobs (used for landing page previews only — Browse Jobs loads from API) ──

export const mockJobs: Job[] = [
  {
    id: "j1",
    title: "Software Engineer – Platform",
    team: "ENGINEERING",
    country: ["SRI LANKA"],
    jobType: "Full Time",
    publishStatus: "All",
    postedDate: "2025-02-20",
  },
  {
    id: "j2",
    title: "Senior Cloud Engineer",
    team: "ENGINEERING",
    country: ["GLOBAL"],
    jobType: "Full Time",
    publishStatus: "All",
    postedDate: "2025-02-18",
  },
  {
    id: "j3",
    title: "Developer Advocate",
    team: "MARKETING",
    country: ["UNITED STATES"],
    jobType: "Full Time",
    publishStatus: "All",
    postedDate: "2025-02-15",
  },
];

// ── Mock Applications ──────────────────────────────────────────────────────────

export const mockApplications: Application[] = [
  {
    id: "a1",
    jobId: "j1",
    jobTitle: "Software Engineer – Platform",
    department: Department.Engineering,
    appliedDate: "2025-02-22",
    status: ApplicationStatus.Screening,
    resumeVersionId: "r1",
    notes: "Applied via Candidate Passport",
  },
  {
    id: "a2",
    jobId: "j2",
    jobTitle: "Senior Cloud Engineer",
    department: Department.Cloud,
    appliedDate: "2025-02-19",
    status: ApplicationStatus.Interview,
    resumeVersionId: "r1",
    notes: "First round interview scheduled for March 5",
  },
  {
    id: "a3",
    jobId: "j5",
    jobTitle: "Frontend Engineer – React",
    department: Department.Engineering,
    appliedDate: "2025-02-10",
    status: ApplicationStatus.Applied,
    resumeVersionId: "r2",
    notes: "Applied via Candidate Passport",
  },
];

// ── Mock Saved Jobs ────────────────────────────────────────────────────────────

export const mockSavedJobIds: string[] = ["j3", "j4", "j6"];
