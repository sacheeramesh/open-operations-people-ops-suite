# External-facing designation

**Date:** 2026-08-10
**App:** people-app (backend + webapp)
**Status:** Approved

## Problem

An employee's title in the system is an internal HR construct. The backend composes a display
string in SQL from three fields:

```
designation + " " + secondary_job_title + " & " + job_role
```

producing values like `Software Engineer II & Tech Lead`. This is the leveling/HR view — it
encodes job band and career function through `designation_id`, and it is what `/user-info` and the
employee screens show.

That is not always the title an employee should carry externally. There is no field today for the
customer-facing title, so it cannot be stored with the employee record or reported on.

## Goal

Store an external-facing designation per employee, independent of the internal composed
designation, and expose it for editing and reporting.

## Design decisions

Two decisions were made explicitly and shape everything below:

1. **Free text, not a controlled list.** A plain `VARCHAR(100)` column on `employee`, edited via a
   plain text field. No master-data table, no dropdown, no curated list, and no
   custom-entry/autocomplete affordance.
2. **Independent field.** The existing composed designation is left exactly as-is. External
   designation is stored and returned as its own field; it does not override, fall back to, or
   participate in the `CONCAT` that builds the internal display string.

The implementation mirrors the existing `job_role` and `secondary_job_title` fields at every
layer. Those two are the template — the new field introduces no new pattern anywhere.

## Design

### 1. Database

New migration `backend/resources/people_app_table_update_v1.0.22.sql` (latest existing is
`v1.0.21`):

```sql
ALTER TABLE `employee`
  ADD COLUMN `external_designation` VARCHAR(100) NULL AFTER `job_role`;
```

Nullable, no default, no backfill — existing employees have no external designation until one is
set. The same column is added to `people_app_creation.sql` so a freshly created database matches a
migrated one.

**The audit path must be updated in the same migration.** This is not optional bookkeeping: the
employee audit trail is driven by a stored procedure called positionally from two triggers, and
all of it enumerates columns explicitly:

| Location in `people_app_creation.sql` | What it enumerates |
|---|---|
| ~line 781 | `prc_employee_audit` parameter list (`IN p_job_role VARCHAR(100)`, …) |
| ~line 824 | The `JSON_OBJECT` payload built inside the procedure (`'job_role', p_job_role`, …) |
| ~line 863 | `trg_employee_audit_insert` — positional `CALL` arguments |
| ~line 887 | `trg_employee_audit_update` — positional `CALL` arguments |

Because the `CALL` is positional, adding a parameter without updating both triggers silently
shifts every argument after it. The migration therefore drops and recreates the procedure and both
triggers with `external_designation` threaded through all four places.

If this is skipped, the column still works for reads and writes, but every change to it is
invisible in the audit table — the failure is silent and only discovered later when someone asks
"when did this change?" and the history has nothing.

### 2. Backend

Follows `job_role` line for line:

- **`modules/database/types.bal`** — `string? externalDesignation` on the employee record type and
  on the add/update payload types, beside the existing `jobRole` declarations.
- **`modules/database/db_queries.bal`**:
  - `e.external_designation AS externalDesignation` added to the two SELECT lists that project
    `e.job_role AS jobRole` — the single-employee query (~line 155) and the employee-list query
    (~line 240). The list query is what feeds the All Employees and My Team tables and the report
    grid, so it is required for those surfaces to render the field at all.
  - **Also added to the basic-info query (~line 495)**, which projects `secondary_job_title` but
    *not* `job_role`. This query backs `EmployeeBasicInfo`, returned by `getEmployeeBasicInfo` →
    `/user-info` (`service.bal:82`) and `getAllEmployeesBasicInfo` (`service.bal:659`). The **Me**
    page renders from `userSlice`, which is populated from `/user-info` — so without this
    projection the Me page field would always be empty. `EmployeeBasicInfo` in `types.bal`
    (~line 84, where the composed `designation` is declared) therefore also needs an
    `externalDesignation` member.
  - The insert value added alongside `${payload.jobRole}` (~line 1448).
  - A conditional-update block matching the `payload.jobRole` pattern (~line 1710), including its
    empty-string-means-clear behavior, so clearing the field in the UI nulls the column.
- **The composed `designation` CONCAT is not touched** in any of the three queries. External
  designation is returned as its own field, never merged into the internal display string.

### 3. Webapp

- **`slices/employeeSlice/employee.ts` and `types/types.tsx`** — `externalDesignation: string | null`
  on the employee and payload interfaces (nullable via `| null`, per the project convention).
- **`JobInfo.tsx`** — a fourth `TextField` in the same `Grid` as Job Role and Secondary Job Title,
  using the identical treatment: `handleChange`, `handleBlur`, `sx={textFieldSx}`,
  `error`/`helperText` bound to Formik state, and `inputProps={{ maxLength: 100 }}` to match the
  column width. Yup: `.max(100)` with the whitespace-to-null transform the neighbouring fields use,
  and `.nullable()` — the field is optional regardless of employee status.
- **`view/employees/onboarding/singleOnboarding/steps/Review.tsx`** — a `ReviewField` in the same
  section as Job Role (~line 425) and Secondary Job Title (~line 390). A field an admin fills in
  Job Info must appear in the Review summary, or they confirm a record that hides it.
- **`EmployeeForm.tsx`** — included in the edit-mode patch payload alongside the other job fields.

#### Report layer (two files, both required)

The report layer registers a column in one file and renders it in another. Updating only one
leaves the column either unselectable or unrenderable.

- **`view/reports/reportColumns.ts`** — `{ key: "externalDesignation", label: "External
  Designation", group: "Job & Career" }`, beside the existing `jobRole` entry.
- **`view/reports/EmployeeReportTable.tsx`** — a matching column definition (~line 166, where
  `jobRole` is defined), following the `textCol` pattern used by its neighbours and reading
  `row.externalDesignation`.

Note an existing quirk, left untouched: the column keyed `jobRole` in `EmployeeReportTable.tsx`
sets `field: "designation"` and its `valueGetter` returns `row.designation` — so the column
labelled "Job Role" actually renders the *composed* designation, not `row.jobRole`. There is
therefore no raw-field title column to copy; the new column is genuinely new. Whether that quirk
is a bug is out of scope here.

#### Employee list and profile views

These three views currently display only the composed `designation`. Each gets the external
designation as an additional, clearly labelled surface:

- **`view/employees/employeesView/employeesTable/EmployeesTable.tsx`** — a column after the
  existing `designation` column (~line 186), matching its `Tooltip` + ellipsis `renderCell`
  treatment, headed "External Designation", falling back to `"N/A"` as its neighbours do.
- **`view/employees/myTeam/MyTeamTable.tsx`** — the same column, matching that file's slightly
  narrower `flex`/`minWidth` conventions (~line 189).
- **`view/me/index.tsx`** — this page shows the designation in *two* places: a `Chip` in the
  profile header (~line 647) and a labelled field in the details grid (~line 790). Add external
  designation **only to the details grid**, as a labelled field beside "Designation" and
  "Job Band". The header chip row is an identity summary; adding a second title chip there
  duplicates information at the most prominent point on the page. The field is omitted entirely
  when empty, consistent with how the page treats other optional values.

### 4. Out of scope

- No master-data table, admin CRUD screen, or dropdown of any kind.
- No change to the composed internal designation or to how it is displayed.
- No microapp change.
- No backfill of existing employees.
- **Not added to the bulk CSV onboarding template.** The two comparable fields disagree on this —
  `secondaryJobTitle` is in `BULK_TEMPLATE_HEADERS` (`constant.ts`) while `jobRole` is not — so
  there is no precedent to follow. External designation is excluded from bulk upload for now:
  it is a per-employee editorial decision rather than bulk-import data, and adding a template
  column changes a file format that customers already have. It can be added later without a
  migration if bulk entry turns out to be needed.

## Accepted trade-off

Free text on a customer-facing title carries a consistency exposure: nothing prevents
`Sr. Software Engineer`, `Senior SW Engineer`, and `Senior Software Engineer` coexisting as three
spellings of one title. This was chosen deliberately — it matches the existing `job_role` /
`secondary_job_title` precedent and keeps the change small.

Should it drift in practice, a curated list with a free-text escape hatch (the pattern shipped for
resignation reasons) retrofits onto this column without a data migration, since the storage type is
identical. That is a future option, not part of this work.

## Files affected

| File | Change |
|---|---|
| `backend/resources/people_app_table_update_v1.0.22.sql` | *(create)* Add column; recreate audit procedure + both triggers |
| `backend/resources/people_app_creation.sql` | *(modify)* Column on `employee`; thread through procedure signature, JSON payload, and both triggers |
| `backend/modules/database/types.bal` | *(modify)* `externalDesignation` on record and payload types |
| `backend/modules/database/db_queries.bal` | *(modify)* Three SELECTs, insert value, conditional update |
| `webapp/src/slices/employeeSlice/employee.ts` | *(modify)* Interface field |
| `webapp/src/types/types.tsx` | *(modify)* Interface field + default |
| `webapp/src/view/employees/onboarding/singleOnboarding/steps/JobInfo.tsx` | *(modify)* TextField + Yup rule |
| `webapp/src/view/employees/onboarding/singleOnboarding/steps/Review.tsx` | *(modify)* ReviewField in the job section |
| `webapp/src/view/employees/onboarding/EmployeeForm.tsx` | *(modify)* Edit-mode patch payload |
| `webapp/src/view/reports/reportColumns.ts` | *(modify)* Report column registry entry |
| `webapp/src/view/reports/EmployeeReportTable.tsx` | *(modify)* Report column renderer |
| `webapp/src/view/employees/employeesView/employeesTable/EmployeesTable.tsx` | *(modify)* Column after `designation` |
| `webapp/src/view/employees/myTeam/MyTeamTable.tsx` | *(modify)* Column after `designation` |
| `webapp/src/view/me/index.tsx` | *(modify)* Labelled field in the details grid (not the header chip) |

### Surface audit

Every place that displays employment information was enumerated, not inferred:

| Surface | Shows today | External designation |
|---|---|---|
| Job Info step | Job Role, Secondary Job Title | Editable input |
| Review step | Job Role, Secondary Job Title | Shown |
| Reports (registry + renderer) | Composed designation, job band | New selectable column |
| All Employees table | Composed designation | New column |
| My Team table | Composed designation | New column |
| Me page | Composed designation (chip + grid) | Grid field only |
| microapp | No job-title fields | Not applicable |
