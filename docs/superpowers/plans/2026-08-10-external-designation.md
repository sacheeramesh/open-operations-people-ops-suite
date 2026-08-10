# External-Facing Designation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Store a free-text external-facing designation per employee, independent of the composed internal designation, and surface it for editing, review, listing, and reporting.

**Architecture:** A nullable `VARCHAR(100)` column on `employee`, threaded through the Ballerina backend (types, three SELECT projections, insert, conditional update) and the React webapp (types, one input, one review field, two report files, two list tables, one profile grid). The field is stored and displayed verbatim — it never participates in the SQL `CONCAT` that builds the internal display designation. Every layer mirrors the existing `job_role` field, which is the template throughout.

**Tech Stack:** MySQL, Ballerina 2201.12.7, React 18 (CRA + react-app-rewired), TypeScript, MUI v5 (incl. DataGrid), Formik + Yup.

**Spec:** `docs/superpowers/specs/2026-08-10-external-designation-design.md`

## Global Constraints

- Field name: `external_designation` (SQL) / `externalDesignation` (Ballerina + TypeScript). Label shown to users: **External Designation**. Column type `VARCHAR(100) NULL`.
- It is a **plain text field**. No dropdown, no autocomplete, no curated list, no `Add "…"` affordance.
- It is **independent**. Never add it to the `CONCAT(...) AS designation` expression in any query, and never let it override or fall back to the composed designation.
- Do **not** modify the existing `designation`, `job_role`, or `secondary_job_title` behavior anywhere.
- Mirror `job_role` exactly at every layer. When in doubt, find `job_role` / `jobRole` in the file and follow it.
- Webapp: use path aliases (`@slices/`, `@view/`, `@config/`, `@utils/`), never relative `../../` imports. Use MUI `sx` + `useTheme()` for styles. Nullable types as `field: T | null`, not `field?: T`.
- Backend: `Config.toml.local` needs no change (no new configurable).
- Staging: the working tree has unrelated modifications in `backend/Dependencies.toml` and `webapp/src/utils/apiService.ts`. Stage only files each task names, via path-scoped `git add`. Never `git add -A`, `git add .`, or `git commit -am`.
- Verification commands run from `apps/people-app/webapp/` (frontend) or `apps/people-app/backend/` (backend).
- `npx tsc --noEmit -p tsconfig.json` currently passes with **zero** errors. Any type error is new and must be fixed.

---

## File Structure

| File | Responsibility |
|---|---|
| `backend/resources/people_app_table_update_v1.0.22.sql` | *(create)* Add column; drop/recreate audit procedure + both triggers |
| `backend/resources/people_app_creation.sql` | *(modify)* Column on `employee`; thread through procedure signature, JSON payload, both trigger `CALL`s |
| `backend/modules/database/types.bal` | *(modify)* `externalDesignation` on `EmployeeBasicInfo`, the employee record, and add/update payload types |
| `backend/modules/database/db_queries.bal` | *(modify)* Three SELECT projections, insert value, conditional update |
| `webapp/src/slices/employeeSlice/employee.ts` | *(modify)* Interface fields |
| `webapp/src/types/types.tsx` | *(modify)* Interface field + default |
| `webapp/src/view/employees/onboarding/singleOnboarding/steps/JobInfo.tsx` | *(modify)* TextField + Yup rule |
| `webapp/src/view/employees/onboarding/singleOnboarding/steps/Review.tsx` | *(modify)* ReviewField |
| `webapp/src/view/employees/onboarding/EmployeeForm.tsx` | *(modify)* Initial values + patch payload |
| `webapp/src/view/reports/reportColumns.ts` | *(modify)* Column registry entry |
| `webapp/src/view/reports/EmployeeReportTable.tsx` | *(modify)* Column renderer |
| `webapp/src/view/employees/employeesView/employeesTable/EmployeesTable.tsx` | *(modify)* Grid column |
| `webapp/src/view/employees/myTeam/MyTeamTable.tsx` | *(modify)* Grid column |
| `webapp/src/view/me/index.tsx` | *(modify)* Details-grid field |

Tasks are ordered so each is independently reviewable: schema → backend → shared types → input/review → read-only surfaces. Nothing renders the field until Task 4, and nothing can render it before the backend returns it.

---

### Task 1: Database column and audit path

**Files:**
- Create: `backend/resources/people_app_table_update_v1.0.22.sql`
- Modify: `backend/resources/people_app_creation.sql`

**Interfaces:**
- Consumes: nothing.
- Produces: `employee.external_designation VARCHAR(100) NULL`, audited on insert and update.

**Why the audit work is mandatory:** `prc_employee_audit` is called **positionally** from two triggers. Adding a parameter without updating both `CALL`s silently shifts every argument after it, corrupting the audit JSON for unrelated columns. Skipping the audit path entirely leaves the column working for reads/writes while every change to it is invisible in the audit table.

- [ ] **Step 1: Add the column to the creation script**

In `people_app_creation.sql`, in `CREATE TABLE employee`, add after the `job_role` line (~line 315):

```sql
  `external_designation` VARCHAR(100) NULL,
```

- [ ] **Step 2: Thread it through the audit procedure and triggers in the creation script**

Three edits in `people_app_creation.sql`, all in `prc_employee_audit` and its triggers:

1. Parameter list (~line 782), immediately after `IN p_job_role VARCHAR(100),`:

```sql
  IN p_external_designation      VARCHAR(100),
```

2. `JSON_OBJECT` payload (~line 825), immediately after the `'job_role', p_job_role,` line:

```sql
      'external_designation',      p_external_designation,
```

3. Both trigger `CALL`s (~lines 863 and 887) — in each, the argument list line reading
`NEW.secondary_job_title,       NEW.job_role,             NEW.manager_email,        NEW.employee_status,`
becomes:

```sql
    NEW.secondary_job_title,       NEW.job_role,             NEW.external_designation,
    NEW.manager_email,             NEW.employee_status,
```

Apply this to `trg_employee_audit_insert` **and** `trg_employee_audit_update`. The parameter's position in the procedure signature and its position in both `CALL`s must match exactly.

- [ ] **Step 3: Write the migration**

Create `backend/resources/people_app_table_update_v1.0.22.sql`. It must be runnable against a database already at v1.0.21. Copy the full, final `prc_employee_audit` body and both trigger bodies from the creation script as edited in Steps 1-2 — the migration and the creation script must produce an identical schema.

```sql
-- People App schema update v1.0.22
-- Adds employee.external_designation and threads it through the audit path.

ALTER TABLE `employee`
  ADD COLUMN `external_designation` VARCHAR(100) NULL AFTER `job_role`;

DROP TRIGGER IF EXISTS `trg_employee_audit_insert`;
DROP TRIGGER IF EXISTS `trg_employee_audit_update`;
DROP PROCEDURE IF EXISTS `prc_employee_audit`;

-- Recreate prc_employee_audit with p_external_designation added after p_job_role,
-- and 'external_designation' added to its JSON_OBJECT payload after 'job_role'.
-- (Copy the complete procedure body from people_app_creation.sql.)

-- Recreate trg_employee_audit_insert and trg_employee_audit_update passing
-- NEW.external_designation immediately after NEW.job_role.
-- (Copy both complete trigger bodies from people_app_creation.sql.)
```

Replace each comment with the actual DDL copied from the creation script, including the `DELIMITER //` … `//` `DELIMITER ;` wrappers used there. Do not leave comments in place of code.

- [ ] **Step 4: Verify the two scripts agree**

Run:

```bash
cd apps/people-app/backend/resources
grep -n "external_designation\|p_external_designation" people_app_creation.sql people_app_table_update_v1.0.22.sql
```

Expected: the creation script shows 4 hits (column, parameter, JSON payload, and the two trigger lines) and the migration shows the same identifiers. Confirm by eye that the parameter appears in the same ordinal position in the procedure signature and in both `CALL`s in each file.

- [ ] **Step 5: Commit**

```bash
git add apps/people-app/backend/resources/people_app_creation.sql apps/people-app/backend/resources/people_app_table_update_v1.0.22.sql
git commit -m "feat(people-app): add external_designation column with audit support"
```

---

### Task 2: Backend types and queries

**Files:**
- Modify: `backend/modules/database/types.bal`
- Modify: `backend/modules/database/db_queries.bal`

**Interfaces:**
- Consumes: `employee.external_designation` (Task 1).
- Produces: `externalDesignation` as `string?` on `EmployeeBasicInfo`, the employee record type, and the add/update payload types; returned by the single-employee, employee-list, and basic-info queries; accepted on create and update.

- [ ] **Step 1: Add the field to the types**

In `types.bal`, add beside each existing `jobRole` declaration (~lines 186, 848, 969), following the surrounding doc-comment style:

```ballerina
    # External-facing designation
    string? externalDesignation;
```

For the payload types that default their fields (~lines 848, 969), match the neighbour's form instead:

```ballerina
    # External-facing designation
    string? externalDesignation = ();
```

Additionally add it to `EmployeeBasicInfo` (~line 84, where the composed `designation` is declared):

```ballerina
    # External-facing designation
    string? externalDesignation?;
```

`EmployeeBasicInfo` backs `/user-info`, which populates `userSlice` — the Me page reads from there, so without this member that surface can never show the value.

- [ ] **Step 2: Add the SELECT projections**

In `db_queries.bal`, add immediately after each `e.job_role AS jobRole,` line (~lines 155 and 240):

```sql
        e.external_designation AS externalDesignation,
```

Match the surrounding indentation — the line-240 query is nested one level deeper than the line-155 query.

Also add it to the basic-info query (~line 495), immediately after its `e.secondary_job_title AS secondaryJobTitle,` line (that query projects `secondary_job_title` but not `job_role`):

```sql
        e.external_designation AS externalDesignation,
```

**Do not** touch the `CONCAT(...) AS designation` expressions in any of these queries.

- [ ] **Step 3: Add the insert value**

In the insert query, add immediately after the `${payload.jobRole},` line (~line 1448):

```ballerina
            ${payload.externalDesignation},
```

Add `external_designation` to that statement's column list in the matching ordinal position — find the column list above the `VALUES` clause and insert it directly after `job_role`.

- [ ] **Step 4: Add the conditional update**

In the update-builder, add immediately after the `payload.jobRole` block (~line 1710):

```ballerina
    if payload.externalDesignation is string {
        if payload.externalDesignation == "" {
            updates.push(`external_designation = NULL`);
        } else {
            updates.push(`external_designation = ${payload.externalDesignation}`);
        }
    }
```

The empty-string-means-clear branch is required: it is how clearing the field in the UI nulls the column, matching `jobRole`.

- [ ] **Step 5: Build the backend**

Run: `cd apps/people-app/backend && bal build`
Expected: BUILD SUCCESSFUL, no new errors.

- [ ] **Step 6: Commit**

```bash
git add apps/people-app/backend/modules/database/types.bal apps/people-app/backend/modules/database/db_queries.bal
git commit -m "feat(people-app): return and persist external designation"
```

---

### Task 3: Webapp types

**Files:**
- Modify: `webapp/src/slices/employeeSlice/employee.ts`
- Modify: `webapp/src/types/types.tsx`

**Interfaces:**
- Consumes: the API shape from Task 2.
- Produces: `externalDesignation` on the employee and payload interfaces, consumed by Tasks 4-6.

- [ ] **Step 1: Add to the slice interfaces**

In `employee.ts`, add beside each `jobRole` declaration:

- after line ~36 (`jobRole: string | null;`):

```ts
  externalDesignation: string | null;
```

- after lines ~184 and ~220 (`jobRole?: string | null;`), in the two payload interfaces:

```ts
  externalDesignation?: string | null;
```

- [ ] **Step 2: Add to types.tsx**

After line ~91 (`jobRole: string;`):

```ts
  externalDesignation: string;
```

After line ~141 (`jobRole: "",`) in the defaults object:

```ts
  externalDesignation: "",
```

Note this file models these fields as non-null `string` with `""` defaults while the slice uses `string | null`. Follow each file's existing convention rather than unifying them — that inconsistency is pre-existing and out of scope.

- [ ] **Step 3: Type-check**

Run: `cd apps/people-app/webapp && npx tsc --noEmit -p tsconfig.json`
Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add apps/people-app/webapp/src/slices/employeeSlice/employee.ts apps/people-app/webapp/src/types/types.tsx
git commit -m "feat(people-app): add external designation to webapp types"
```

---

### Task 4: Onboarding input and review

**Files:**
- Modify: `webapp/src/view/employees/onboarding/singleOnboarding/steps/JobInfo.tsx`
- Modify: `webapp/src/view/employees/onboarding/singleOnboarding/steps/Review.tsx`
- Modify: `webapp/src/view/employees/onboarding/EmployeeForm.tsx`

**Interfaces:**
- Consumes: `externalDesignation` from Task 3.
- Produces: the field is editable, validated, reviewed, and included in create/update payloads.

- [ ] **Step 1: Add the Yup rule**

In `JobInfo.tsx`, beside the `jobRole` rule (~line 142):

```ts
    externalDesignation: Yup.string()
      .max(100, "External designation must be at most 100 characters")
      .transform((value) =>
        typeof value === "string" && value.trim() === "" ? null : value,
      )
      .nullable(),
```

Optional in all cases — no `.when(...)` clause, no status dependency.

- [ ] **Step 2: Add the input**

In `JobInfo.tsx`, in the same `Grid` container as Job Role and Secondary Job Title, add a third `Grid item` immediately after the Secondary Job Title item (~line 1325):

```tsx
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="External Designation"
              name="externalDesignation"
              value={values.externalDesignation ?? ""}
              onChange={handleChange}
              onBlur={handleBlur}
              error={Boolean(
                touched.externalDesignation && errors.externalDesignation,
              )}
              helperText={
                touched.externalDesignation && errors.externalDesignation
              }
              inputProps={{ maxLength: 100 }}
              sx={textFieldSx}
            />
          </Grid>
```

This uses plain `handleChange`/`handleBlur`, exactly like its two neighbours — no `setFieldValue`, no canonicalization, no autocomplete.

- [ ] **Step 3: Add the review field**

In `Review.tsx`, in the same section as Job Role (~line 425), after that field's `Grid item`:

```tsx
          <Grid item xs={12} sm={6} md={4}>
            <ReviewField
              label="External Designation"
              value={values.externalDesignation}
            />
          </Grid>
```

- [ ] **Step 4: Wire the form payloads**

`jobRole` appears in exactly three places in `EmployeeForm.tsx`. Add a parallel line beside each, matching its form exactly:

1. Initial values from the loaded employee (~line 112, `base.jobRole = employee.jobRole ?? "";`):

```ts
    base.externalDesignation = employee.externalDesignation ?? "";
```

2. Payload builder (~line 167, `jobRole: values.jobRole,`):

```ts
  externalDesignation: values.externalDesignation,
```

3. Job patch builder (~line 678, `jobRole: values.jobRole || "",`):

```tsx
                externalDesignation: values.externalDesignation || "",
```

Verify with `grep -n "jobRole\|externalDesignation" src/view/employees/onboarding/EmployeeForm.tsx` — expect six hits, paired.

- [ ] **Step 5: Type-check**

Run: `cd apps/people-app/webapp && npx tsc --noEmit -p tsconfig.json`
Expected: zero errors.

- [ ] **Step 6: Commit**

```bash
git add apps/people-app/webapp/src/view/employees/onboarding/singleOnboarding/steps/JobInfo.tsx apps/people-app/webapp/src/view/employees/onboarding/singleOnboarding/steps/Review.tsx apps/people-app/webapp/src/view/employees/onboarding/EmployeeForm.tsx
git commit -m "feat(people-app): capture external designation during onboarding"
```

---

### Task 5: Report column

**Files:**
- Modify: `webapp/src/view/reports/reportColumns.ts`
- Modify: `webapp/src/view/reports/EmployeeReportTable.tsx`

**Interfaces:**
- Consumes: `externalDesignation` from Task 3.
- Produces: a selectable, renderable "External Designation" report column.

**Both files are required.** `reportColumns.ts` declares which columns are *selectable*; `EmployeeReportTable.tsx` defines how each *renders*. A column registered in one but not the other is either unselectable or unrenderable.

- [ ] **Step 1: Register the column**

In `reportColumns.ts`, after the `jobRole` entry (~line 40):

```ts
  { key: "externalDesignation",   label: "External Designation",    group: "Job & Career" },
```

Match the file's existing column alignment.

- [ ] **Step 2: Add the renderer**

In `EmployeeReportTable.tsx`, in the column-definitions object beside `jobRole` (~line 166):

```ts
    externalDesignation: textCol(
      "externalDesignation",
      "External Designation",
      180,
    ),
```

Use the `textCol` helper, as the neighbouring simple text columns do. It is defined locally at ~line 102 with the signature `textCol(field: keyof Employee, headerName: string, minWidth: number)` and renders `row[field]` through a `TextCell`.

Because its first parameter is typed `keyof Employee`, this will not compile unless Task 3 has added `externalDesignation` to the `Employee` interface. If you hit a type error there, Task 3 is missing or incomplete — do not widen the type or cast around it.

Note the existing `jobRole` entry is hand-rolled and sets `field: "designation"`, rendering the *composed* designation rather than `row.jobRole` — do not copy that entry, and do not change it. `textCol` reads the real field.

- [ ] **Step 3: Type-check**

Run: `cd apps/people-app/webapp && npx tsc --noEmit -p tsconfig.json`
Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add apps/people-app/webapp/src/view/reports/reportColumns.ts apps/people-app/webapp/src/view/reports/EmployeeReportTable.tsx
git commit -m "feat(people-app): add external designation report column"
```

---

### Task 6: List tables and profile page

**Files:**
- Modify: `webapp/src/view/employees/employeesView/employeesTable/EmployeesTable.tsx`
- Modify: `webapp/src/view/employees/myTeam/MyTeamTable.tsx`
- Modify: `webapp/src/view/me/index.tsx`

**Interfaces:**
- Consumes: `externalDesignation` from Task 3; the API projections from Task 2.
- Produces: the field visible in All Employees, My Team, and the Me profile.

- [ ] **Step 1: Add the All Employees column**

In `EmployeesTable.tsx`, immediately after the `designation` column definition (~line 186), add a column with the same `Tooltip` + ellipsis `renderCell` treatment:

```tsx
    {
      field: "externalDesignation",
      headerName: "External Designation",
      flex: 0.9,
      minWidth: 150,
      resizable: false,
      renderCell: (params: GridRenderCellParams<Employee>) => (
        <Tooltip title={params.value || "N/A"} arrow>
          <Box
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              color: theme.palette.text.primary,
            }}
          >
            {params.value || "N/A"}
          </Box>
        </Tooltip>
      ),
    },
```

Copy the closing structure of the adjacent `designation` column exactly if it differs from the above.

- [ ] **Step 2: Add the My Team column**

In `MyTeamTable.tsx`, immediately after its `designation` column (~line 189), using that file's narrower conventions:

```tsx
      {
        field: "externalDesignation",
        headerName: "External Designation",
        flex: 0.8,
        minWidth: 140,
        resizable: false,
        renderCell: (params: GridRenderCellParams<Employee>) => (
          <Tooltip title={params.value || "N/A"} arrow>
            <Box sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: theme.palette.text.primary }}>
              {params.value || "N/A"}
            </Box>
          </Tooltip>
        ),
      },
```

- [ ] **Step 3: Add the Me profile field**

In `me/index.tsx`, in the details `Grid` container that holds "Designation" and "Job Band" (~line 790), add a `Grid item` after the Designation one:

```tsx
                {employee?.externalDesignation && (
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                      External Designation
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {employee.externalDesignation}
                    </Typography>
                  </Grid>
                )}
```

Rendered only when set, so profiles without one are unchanged. **Do not** add a chip to the header chip row (~line 647) — that row is an identity summary, and a second title chip duplicates information at the most prominent point on the page.

- [ ] **Step 4: Type-check**

Run: `cd apps/people-app/webapp && npx tsc --noEmit -p tsconfig.json`
Expected: zero errors.

- [ ] **Step 5: Manual verification**

Run `yarn start` from `apps/people-app/webapp` with the backend running against a v1.0.22 database, then confirm:

1. Job Info step shows an **External Designation** text field beside Job Role and Secondary Job Title; it is a plain input with no dropdown.
2. Entering more than 100 characters is prevented by the input.
3. The Review step shows the entered value under **External Designation**.
4. Saving, then reopening the employee, round-trips the value.
5. Clearing the field and saving nulls it (the field is empty on reload, not showing the old value).
6. The internal composed designation (e.g. `Software Engineer II & Tech Lead`) is unchanged everywhere it appears.
7. All Employees and My Team show an **External Designation** column, with `N/A` where unset.
8. The Me page details grid shows **External Designation** when set, and omits it when not.
9. Reports offers **External Designation** as a selectable column that renders the value.

- [ ] **Step 6: Commit**

```bash
git add apps/people-app/webapp/src/view/employees/employeesView/employeesTable/EmployeesTable.tsx apps/people-app/webapp/src/view/employees/myTeam/MyTeamTable.tsx apps/people-app/webapp/src/view/me/index.tsx
git commit -m "feat(people-app): show external designation in list and profile views"
```

---

## Self-Review

**Spec coverage** — every spec section maps to a task:

| Spec requirement | Task |
|---|---|
| `external_designation VARCHAR(100) NULL` column | Task 1 |
| Audit procedure + both triggers updated | Task 1 |
| Migration `v1.0.22` matching the creation script | Task 1 |
| `externalDesignation` on Ballerina types incl. `EmployeeBasicInfo` | Task 2 |
| Two `jobRole` SELECTs + the basic-info SELECT | Task 2 |
| Insert value and conditional update with empty-means-clear | Task 2 |
| Composed `designation` CONCAT untouched | Global Constraints + Task 2 Step 2 |
| Webapp interfaces | Task 3 |
| Plain TextField, no dropdown | Global Constraints + Task 4 Step 2 |
| Yup `max(100)`, optional | Task 4 Step 1 |
| Review step field | Task 4 Step 3 |
| Report registry + renderer | Task 5 |
| All Employees / My Team columns | Task 6 |
| Me details grid, not header chip | Task 6 Step 3 |
| Not in bulk CSV template | Not implemented — correct, spec places it out of scope |
| No master data / dropdown / backfill / microapp change | Not implemented — correct, out of scope |

**Type consistency** — `externalDesignation` is `string?` in Ballerina, `string | null` in `employee.ts`, and `string` with a `""` default in `types.tsx`. That mismatch is deliberate and mirrors how `jobRole` is already declared in those same files; Task 3 Step 2 calls it out so an implementer does not "fix" it.

**Placeholder scan** — no TBDs. The one place the plan says "copy from the creation script" (Task 1 Step 3) is an explicit instruction with a stated correctness condition, and Step 4 verifies it; the DDL is too long to duplicate and must match by construction rather than by transcription.

**Known risks flagged for implementers:**
- Task 1 is the highest-risk task: the positional `CALL` means a misplaced argument corrupts audit JSON for *other* columns, and it fails silently. Step 4 exists to catch it.
- Task 6 has no automated coverage — the three surfaces are verified only by Step 5's manual checks.
- Tasks 4-6 cannot be meaningfully verified without a v1.0.22 database and a running backend; an implementer without one should report that rather than claim the manual checks passed.
