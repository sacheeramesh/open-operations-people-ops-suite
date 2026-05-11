# API Reference — WSO2 Careers Backend

Base URL: `CAREERS_BACKEND_BASE_URL` (configured in `webapp/public/config.js`)  
Default local base: `http://localhost:8080`

---

## Authentication

All endpoints require a valid Asgardeo-issued Bearer token.

```
Authorization: Bearer <access_token>
```

The backend validates the token in two stages:

1. **JWT validation** — verifies signature against JWKS fetched from `asgardeo_jwks_url` (RS256, cached in-process).
2. **Introspection fallback** — if JWT decode fails (e.g. opaque token), the backend calls `asgardeo_introspect_url` with client credentials and checks that `active: true`.

On failure the backend returns `401 Unauthorized` before any upstream call is made.

---

## Upstream Proxy

The backend is a thin proxy in front of a **Vacancy Service**. It authenticates frontend requests via Asgardeo, then re-authenticates to the upstream with a client-credentials token (`vacancy_client_id` / `vacancy_client_secret`) cached in memory until expiry.

---

## Endpoints

### 1. List Jobs

```
GET /jobs
```

Returns all published job listings in basic summary form.

**Request**

| Part | Detail |
|------|--------|
| Method | `GET` |
| Path | `/jobs` |
| Headers | `Authorization: Bearer <token>` |
| Query params | none |
| Body | none |

**Response — 200 OK**

```json
[
  {
    "id": 42,
    "title": "Senior Software Engineer",
    "team": "Platform",
    "country": ["LK", "US"],
    "job_type": "full-time",
    "publish_status": "published",
    "published_on": "2025-04-10"
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | `number` | Unique vacancy ID |
| `title` | `string` | Job title |
| `team` | `string` | Team or department |
| `country` | `string[]` | ISO country codes where the role is open |
| `job_type` | `string` | e.g. `"full-time"`, `"intern"`, `"contract"` |
| `publish_status` | `string` | e.g. `"published"`, `"draft"` |
| `published_on` | `string` | ISO 8601 date string |

**Frontend mapping** (`vacancyService.ts`)

| API field | Frontend field |
|-----------|----------------|
| `id` | `id` (cast to `string`) |
| `title` | `title` |
| `team` | `team` |
| `country` | `country` |
| `job_type` | `jobType` |
| `publish_status` | `publishStatus` |
| `published_on` | `postedDate` |

**Errors**

| Status | Condition |
|--------|-----------|
| `401` | Missing or invalid Asgardeo token |
| `502` | Upstream vacancy service returned a non-2xx response |
| `504` | Upstream vacancy service unreachable |

---

### 2. Get Job Detail

```
GET /jobs/{job_id}
```

Returns full details for a single job vacancy.

**Request**

| Part | Detail |
|------|--------|
| Method | `GET` |
| Path | `/jobs/{job_id}` |
| Path params | `job_id` — vacancy ID (string) |
| Headers | `Authorization: Bearer <token>` |
| Query params | none |
| Body | none |

**Response — 200 OK**

```json
{
  "id": 42,
  "title": "Senior Software Engineer",
  "team": "Platform",
  "country": ["LK", "US"],
  "job_type": "full-time",
  "publish_status": "published",
  "published_on": "2025-04-10",
  "allow_remote": true,
  "mainContent": "<p>Role overview HTML...</p>",
  "taskInformation": "<p>What you will do...</p>",
  "additionalContent": "<p>Benefits and perks...</p>"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | `number` | Unique vacancy ID |
| `title` | `string` | Job title |
| `team` | `string` | Team or department |
| `country` | `string[]` | ISO country codes |
| `job_type` | `string` | Employment type |
| `publish_status` | `string` | Publication status |
| `published_on` | `string` | ISO 8601 date string |
| `allow_remote` | `boolean` | Whether remote work is permitted |
| `mainContent` | `string \| null` | HTML — role overview |
| `taskInformation` | `string \| null` | HTML — responsibilities |
| `additionalContent` | `string \| null` | HTML — benefits / extra info |

**Frontend mapping** (`vacancyService.ts`)

| API field | Frontend field |
|-----------|----------------|
| `id` | `id` (cast to `string`) |
| `title` | `title` |
| `team` | `team` |
| `country` | `country` |
| `job_type` | `jobType` |
| `publish_status` | `publishStatus` |
| `published_on` | `postedDate` |
| `allow_remote` | `allowRemote` |
| `mainContent` | `mainContent` |
| `taskInformation` | `taskInformation` |
| `additionalContent` | `additionalContent` |

**Errors**

| Status | Condition |
|--------|-----------|
| `401` | Missing or invalid Asgardeo token |
| `404` | Job not found (upstream returned 404) |
| `502` | Upstream vacancy service returned a non-2xx response |
| `504` | Upstream vacancy service unreachable |

---

### 3. Get Org Structure

```
GET /jobs/org-structure
```

Returns the available filter options for locations and teams, used to populate the job search filter UI.

**Request**

| Part | Detail |
|------|--------|
| Method | `GET` |
| Path | `/jobs/org-structure` |
| Headers | `Authorization: Bearer <token>` |
| Query params | none |
| Body | none |

**Response — 200 OK**

```json
{
  "location_list": {
    "LK": "Sri Lanka",
    "US": "United States",
    "AU": "Australia"
  },
  "team_list": {
    "PLT": "Platform",
    "IAM": "Identity & Access Management",
    "INT": "Integration"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `location_list` | `Record<string, string>` | Map of location code → display name |
| `team_list` | `Record<string, string>` | Map of team code → display name |

**Frontend mapping** (`vacancyService.ts`)

The frontend extracts only the values (display names):

```ts
locations: Object.values(response.data.location_list)  // string[]
teams:     Object.values(response.data.team_list)       // string[]
```

**Errors**

| Status | Condition |
|--------|-----------|
| `401` | Missing or invalid Asgardeo token |
| `502` | Upstream vacancy service returned a non-2xx response |
| `504` | Upstream vacancy service unreachable |

---

## Registered URL Slots (Not Yet Implemented)

The following paths are registered in the frontend config (`AppConfig.serviceUrls`) but no backend routes or frontend API calls exist for them yet.

| URL | Purpose (inferred) |
|-----|--------------------|
| `GET /user-info` | Fetch authenticated user profile |
| `GET/POST /candidates` | Candidate profile management |
| `GET/POST /applications` | Job application submission and tracking |

The frontend types file (`types.ts`) already defines shapes for `CandidateProfile` and `Application` — see below for the expected contracts when these are implemented.

---

## Planned Types (Frontend-defined, Backend not yet implemented)

### `CandidateProfile`

```typescript
interface CandidateProfile {
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

interface ResumeVersion {
  id: string;
  name: string;
  uploadedAt: string;
  isActive: boolean;
  url: string;
}

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  url: string;
  type: "github" | "project" | "link";
}
```

### `Application`

```typescript
interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  department: string;
  appliedDate: string;
  status: ApplicationStatus;   // enum: see types.ts
  resumeVersionId: string;
  notes: string;
}
```

> **Note:** Application submission in `ApplyModal.tsx` is currently mocked client-side (simulated delay, Redux state update only). No HTTP request is made.

---

## Error Response Shape

All error responses use FastAPI's default envelope:

```json
{
  "detail": "Human-readable error message"
}
```

---

## Architecture Overview

```
Browser (React)
    │  Authorization: Bearer <asgardeo_token>
    ▼
FastAPI Backend  (this service)
    │  validates token via Asgardeo JWKS / introspection
    │  Authorization: Bearer <vacancy_service_token>  ← client credentials grant
    ▼
Upstream Vacancy Service
```
