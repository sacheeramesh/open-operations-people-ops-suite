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

import { ApplicationStatus, Department, ExperienceLevel } from "@config/constant";
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

// ── Mock Jobs ──────────────────────────────────────────────────────────────────

export const mockJobs: Job[] = [
  {
    id: "j1",
    title: "Software Engineer – Platform",
    department: Department.Engineering,
    location: "Colombo, Sri Lanka",
    experienceLevel: ExperienceLevel.Mid,
    postedDate: "2025-02-20",
    isRemote: false,
    salaryRange: "LKR 250,000 – 400,000/month",
    teamSize: "10–15 engineers",
    requiredSkills: ["Java", "Kubernetes", "Microservices", "REST APIs"],
    description:
      "Join our Platform Engineering team to build the next generation of WSO2 integration middleware. You will work on core platform features, improve developer experience, and contribute to open-source projects.",
    responsibilities: [
      "Design and implement scalable backend services using Java and Spring Boot.",
      "Contribute to the WSO2 API Manager and Integration Platform.",
      "Collaborate with cross-functional teams to define technical architecture.",
      "Mentor junior engineers and conduct code reviews.",
      "Participate in open-source community engagement.",
    ],
    requirements: [
      "3+ years of Java development experience.",
      "Strong understanding of microservices architecture.",
      "Experience with Kubernetes and container orchestration.",
      "Familiarity with REST and GraphQL API design.",
      "BSc in Computer Science or equivalent.",
    ],
    niceToHave: [
      "Experience with WSO2 products.",
      "Contributions to open-source projects.",
      "Knowledge of Ballerina language.",
    ],
  },
  {
    id: "j2",
    title: "Senior Cloud Engineer",
    department: Department.Cloud,
    location: "Remote",
    experienceLevel: ExperienceLevel.Senior,
    postedDate: "2025-02-18",
    isRemote: true,
    salaryRange: "$80,000 – $110,000/year",
    teamSize: "8 engineers",
    requiredSkills: ["AWS", "Kubernetes", "Terraform", "CI/CD", "Docker"],
    description:
      "Lead the design and operations of WSO2's cloud infrastructure. This role involves building highly available, scalable cloud environments that power WSO2 Asgardeo and Choreo platforms.",
    responsibilities: [
      "Design and manage multi-cloud infrastructure on AWS and Azure.",
      "Build and maintain CI/CD pipelines using GitHub Actions and ArgoCD.",
      "Implement infrastructure-as-code using Terraform and Helm.",
      "Monitor and optimize system performance, availability, and cost.",
      "Lead incident response and post-mortem processes.",
    ],
    requirements: [
      "5+ years of cloud engineering experience.",
      "Expert-level AWS knowledge (certifications preferred).",
      "Strong Kubernetes and Helm experience.",
      "Proficiency in Terraform and infrastructure-as-code.",
      "Experience with observability tools (Prometheus, Grafana, Datadog).",
    ],
    niceToHave: [
      "Experience with Istio or other service mesh technologies.",
      "Background in platform engineering or SRE.",
      "Familiarity with WSO2 Choreo or Asgardeo.",
    ],
  },
  {
    id: "j3",
    title: "Developer Advocate",
    department: Department.DevRel,
    location: "San Francisco, USA",
    experienceLevel: ExperienceLevel.Mid,
    postedDate: "2025-02-15",
    isRemote: false,
    salaryRange: "$95,000 – $130,000/year",
    teamSize: "5 advocates",
    requiredSkills: ["Technical Writing", "Public Speaking", "APIs", "Developer Tools"],
    description:
      "Champion WSO2 products in the developer community. Create compelling technical content, speak at conferences, and build relationships with the global open-source community.",
    responsibilities: [
      "Create technical blogs, tutorials, and video content.",
      "Represent WSO2 at conferences and meetups worldwide.",
      "Engage with developers on GitHub, Discord, and community forums.",
      "Provide feedback from the community to the product team.",
      "Build sample applications and integrations demonstrating WSO2 products.",
    ],
    requirements: [
      "3+ years of developer advocacy or technical writing experience.",
      "Strong public speaking and presentation skills.",
      "Hands-on development experience with APIs and integration tools.",
      "Active presence in developer communities.",
    ],
    niceToHave: [
      "Experience with WSO2 API Manager or similar platforms.",
      "YouTube or podcast presence.",
      "Contributions to developer documentation.",
    ],
  },
  {
    id: "j4",
    title: "Product Manager – Integration",
    department: Department.Product,
    location: "London, UK",
    experienceLevel: ExperienceLevel.Senior,
    postedDate: "2025-02-10",
    isRemote: true,
    salaryRange: "£70,000 – £95,000/year",
    teamSize: "Product & Engineering (~20)",
    requiredSkills: ["Product Strategy", "Roadmap Planning", "Stakeholder Management", "APIs"],
    description:
      "Define and drive the product vision for WSO2's Integration Platform. Work closely with engineering, design, and customers to deliver world-class integration tooling.",
    responsibilities: [
      "Define product strategy and roadmap for WSO2 integration products.",
      "Conduct customer research and competitive analysis.",
      "Work with engineering teams to prioritize and deliver features.",
      "Create detailed product requirements and acceptance criteria.",
      "Communicate product strategy to internal and external stakeholders.",
    ],
    requirements: [
      "5+ years of product management experience in B2B SaaS.",
      "Deep understanding of API management and integration platforms.",
      "Strong analytical and communication skills.",
      "Experience working with distributed engineering teams.",
    ],
    niceToHave: [
      "Technical background in software engineering.",
      "Experience with enterprise integration patterns.",
      "Knowledge of WSO2 product ecosystem.",
    ],
  },
  {
    id: "j5",
    title: "Frontend Engineer – React",
    department: Department.Engineering,
    location: "Colombo, Sri Lanka",
    experienceLevel: ExperienceLevel.Mid,
    postedDate: "2025-02-08",
    isRemote: false,
    salaryRange: "LKR 200,000 – 350,000/month",
    teamSize: "8 engineers",
    requiredSkills: ["React", "TypeScript", "CSS", "REST APIs"],
    description:
      "Build beautiful and performant web applications for WSO2's developer portal and management consoles. Work with a talented team to deliver polished UI/UX for enterprise customers.",
    responsibilities: [
      "Build reusable React components and frontend libraries.",
      "Collaborate with UX designers to implement pixel-perfect interfaces.",
      "Optimize application performance and accessibility.",
      "Write unit and integration tests.",
      "Participate in code reviews and knowledge sharing.",
    ],
    requirements: [
      "3+ years of React development experience.",
      "Proficiency in TypeScript and modern JavaScript.",
      "Experience with state management (Redux, Zustand).",
      "Strong CSS and responsive design skills.",
    ],
    niceToHave: [
      "Experience with Material-UI or similar component libraries.",
      "Knowledge of micro-frontend architecture.",
      "Familiarity with WSO2 developer portal.",
    ],
  },
  {
    id: "j6",
    title: "Site Reliability Engineer",
    department: Department.Cloud,
    location: "Remote",
    experienceLevel: ExperienceLevel.Senior,
    postedDate: "2025-02-05",
    isRemote: true,
    salaryRange: "$90,000 – $120,000/year",
    teamSize: "6 SREs",
    requiredSkills: ["Linux", "Kubernetes", "Prometheus", "Incident Management"],
    description:
      "Ensure the reliability and scalability of WSO2 cloud services. Drive improvements in observability, automation, and incident response across our global infrastructure.",
    responsibilities: [
      "Monitor and maintain the reliability of production systems.",
      "Build and improve observability stacks (Prometheus, Grafana, Loki).",
      "Automate operational processes to reduce toil.",
      "Lead blameless post-mortem processes.",
      "Collaborate with developers to implement reliability best practices.",
    ],
    requirements: [
      "5+ years of SRE or operations engineering experience.",
      "Deep Linux administration skills.",
      "Strong Kubernetes and distributed systems knowledge.",
      "Experience with incident management tools.",
    ],
    niceToHave: [
      "Background in chaos engineering.",
      "Experience with multi-region deployments.",
      "SRE certifications.",
    ],
  },
  {
    id: "j7",
    title: "Technical Support Engineer",
    department: Department.Engineering,
    location: "Colombo, Sri Lanka",
    experienceLevel: ExperienceLevel.Junior,
    postedDate: "2025-01-28",
    isRemote: false,
    salaryRange: "LKR 120,000 – 200,000/month",
    teamSize: "12 engineers",
    requiredSkills: ["Java", "Debugging", "API Management", "Customer Support"],
    description:
      "Provide world-class technical support for WSO2 customers globally. Investigate issues, develop solutions, and work directly with the engineering team to resolve complex problems.",
    responsibilities: [
      "Handle customer technical queries via tickets and calls.",
      "Reproduce and debug issues in WSO2 products.",
      "Create knowledge base articles and troubleshooting guides.",
      "Collaborate with engineering on escalated issues.",
      "Deliver product training to customers.",
    ],
    requirements: [
      "1-2 years of software support or development experience.",
      "Basic Java and web services knowledge.",
      "Strong analytical and problem-solving skills.",
      "Excellent verbal and written communication.",
    ],
    niceToHave: [
      "Experience with WSO2 API Manager.",
      "Knowledge of OAuth2 and OIDC.",
      "Familiarity with enterprise middleware.",
    ],
  },
  {
    id: "j8",
    title: "HR Business Partner",
    department: Department.HR,
    location: "Colombo, Sri Lanka",
    experienceLevel: ExperienceLevel.Mid,
    postedDate: "2025-01-20",
    isRemote: false,
    salaryRange: "LKR 180,000 – 280,000/month",
    teamSize: "People Ops Team (~15)",
    requiredSkills: ["HR Management", "Employee Relations", "Talent Management", "HR Systems"],
    description:
      "Partner with business leaders to drive people strategy and foster WSO2's unique culture. Support the entire employee lifecycle from recruitment to career development.",
    responsibilities: [
      "Partner with leadership on workforce planning and org design.",
      "Drive performance management and compensation programs.",
      "Handle employee relations matters with care and confidentiality.",
      "Support talent acquisition for key roles.",
      "Champion diversity, equity, and inclusion initiatives.",
    ],
    requirements: [
      "3+ years of HR business partnering experience.",
      "Strong knowledge of Sri Lankan labor law.",
      "Experience with HRIS systems.",
      "Excellent interpersonal and communication skills.",
    ],
    niceToHave: [
      "Experience in a technology company.",
      "SHRM or CIPD certification.",
      "Global HR experience.",
    ],
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
