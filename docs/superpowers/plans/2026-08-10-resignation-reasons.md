# Predefined Resignation Reasons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admins pick a resignation reason from 15 predefined options while still allowing a custom reason, replacing the current free-text input in the leaver flow.

**Architecture:** Frontend-only change in the `webapp` sub-project. A new constant holds the 15 reasons. Canonicalization and option-filtering logic is extracted into a small pure-function module so it can be unit tested without rendering React. The `resignationReason` field in `JobInfo.tsx` becomes a MUI `Autocomplete` with `freeSolo` that consumes those helpers. No database migration, no backend change, no API change.

**Tech Stack:** React 18 (CRA + react-app-rewired), TypeScript, MUI v5, Formik + Yup, Jest + React Testing Library.

**Spec:** `docs/superpowers/specs/2026-08-10-resignation-reasons-design.md`

## Global Constraints

- Work only inside `apps/people-app/webapp/`. Do not modify `backend/`, `microapp/`, `people-scheduler/`, or any `.sql` file.
- The stored value stays a plain `string | null`. Do not change the payload shape, the API contract, or the `resignation.reason VARCHAR(300)` column.
- Do not change the existing Yup schema for `resignationReason` (`JobInfo.tsx`): it keeps `max(300)`, the whitespace-to-null transform, and the conditional-required rule for `MarkedLeaver` / `Left`.
- Preserve the reason list order exactly as written in Task 1. Do not sort it.
- Use path aliases (`@config/`, `@utils/`, `@slices/`, `@view/`), never relative `../../` imports, per the project CLAUDE.md. **One exception:** Jest resolves no aliases in this project (`config-overrides.js` aliases webpack only, and there is no `moduleNameMapper`), so the test file and the helper module it loads use relative imports. Everything else, including `JobInfo.tsx`, uses aliases.
- All new files need the standard WSO2 Apache-2.0 copyright header, copied verbatim from the top of `webapp/src/view/employees/onboarding/singleOnboarding/steps/JobInfo.tsx` (lines 1-15), with the year `2026`.
- Run all commands from `apps/people-app/webapp/`.
- **Formik validation:** the enclosing form sets `validateOnChange={false}` and `validateOnBlur={true}` (`src/view/employees/onboarding/EmployeeForm.tsx:861-862`). Every `setFieldValue("resignationReason", …)` in Task 4 MUST pass `true` as the third argument (`shouldValidate`), or the required-field error never recomputes as the user types. Nearby fields in this file omit that argument — do not copy them; the third argument is load-bearing here and must not be removed for consistency with neighbouring code.
- **Staging:** the working tree has unrelated modifications in `backend/Dependencies.toml` and `webapp/src/utils/apiService.ts`. Stage only the exact files each task names — use path-scoped `git add <path>`. Never run `git add -A`, `git add .`, or `git commit -am`.
- This webapp currently has **zero test files**. Task 2 introduces the first one. Do not add render/component tests — only pure-function unit tests.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/config/constant.ts` | *(modify)* Add the `ResignationReasons` list beside existing fixed lists (`EmployeeTitle`, `EmployeeGenders`, `Countries`). |
| `src/view/employees/onboarding/singleOnboarding/steps/resignationReason.utils.ts` | *(create)* Pure helpers: canonicalize a typed reason, decide whether to offer the `Add "…"` row. No React, no MUI imports. |
| `src/view/employees/onboarding/singleOnboarding/steps/resignationReason.utils.test.ts` | *(create)* Unit tests for the helpers. First test file in the webapp. |
| `src/view/employees/onboarding/singleOnboarding/steps/JobInfo.tsx` | *(modify)* Replace the `resignationReason` `TextField` with a `freeSolo` `Autocomplete` wired to the helpers. |

The helpers live next to `JobInfo.tsx` rather than in `@utils/utils.ts` because they are specific to this one field; files that change together live together.

---

### Task 1: Add the reason list constant

**Files:**
- Modify: `src/config/constant.ts` (append at end of file)

**Interfaces:**
- Consumes: nothing.
- Produces: `ResignationReasons: string[]` — exported from `@config/constant`. Used by Task 2 and Task 4.

- [ ] **Step 1: Append the constant**

Open `src/config/constant.ts` and append at the end of the file:

```ts
export const ResignationReasons = [
  "Termination",
  "Internal Transition",
  "Personal Reasons",
  "Migration",
  "Joining another company - Local",
  "Joining another company - Overseas",
  "Higher Studies - Overseas",
  "Mismatch in Job role",
  "Higher Studies - Local",
  "Decided to leave during review",
  "Deceased",
  "Involuntary Resignation",
  "Moving to Part-time Consultancy",
  "Secondment",
  "Retirement",
];
```

Do not reorder or re-capitalize the entries.

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors referencing `constant.ts`.

Note, corrected after execution: this project's `tsc` passes with ZERO errors. The plan originally assumed pre-existing unrelated type errors; that was wrong. Treat any type error as new and fix it.

- [ ] **Step 3: Commit**

```bash
git add src/config/constant.ts
git commit -m "feat(people-app): add predefined resignation reason list"
```

---

### Task 2: Write failing tests for the reason helpers

**Files:**
- Create: `src/view/employees/onboarding/singleOnboarding/steps/resignationReason.utils.test.ts`

**Interfaces:**
- Consumes: `ResignationReasons` from `@config/constant` (Task 1).
- Produces: nothing consumed by later tasks. Defines the contract Task 3 must satisfy.

This task writes tests against a module that does not exist yet. That is intentional — the tests must fail first.

- [ ] **Step 1: Write the failing tests**

Create the file with the copyright header, then:

Note on imports: `config-overrides.js` sets path aliases for **webpack only** — it exports no `jest` override and there is no `moduleNameMapper`, so Jest cannot resolve `@config/` or `@view/`. Test files therefore use a relative import for the module under test. This is the one sanctioned exception to the no-relative-imports constraint, and it applies to `*.test.ts` files only; production code must keep using aliases.

```ts
import {
  canonicalizeReason,
  shouldOfferCustomReason,
} from "./resignationReason.utils";

describe("canonicalizeReason", () => {
  it("returns null for null input", () => {
    expect(canonicalizeReason(null)).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(canonicalizeReason("")).toBeNull();
  });

  it("returns null for whitespace-only input", () => {
    expect(canonicalizeReason("   ")).toBeNull();
  });

  it("returns a predefined reason unchanged", () => {
    expect(canonicalizeReason("Retirement")).toBe("Retirement");
  });

  it("canonicalizes casing to the predefined spelling", () => {
    expect(canonicalizeReason("retirement")).toBe("Retirement");
    expect(canonicalizeReason("RETIREMENT")).toBe("Retirement");
  });

  it("canonicalizes a multi-word reason regardless of casing", () => {
    expect(canonicalizeReason("personal reasons")).toBe("Personal Reasons");
    expect(canonicalizeReason("joining another company - local")).toBe(
      "Joining another company - Local",
    );
  });

  it("trims surrounding whitespace before matching", () => {
    expect(canonicalizeReason("  Retirement  ")).toBe("Retirement");
  });

  it("preserves a custom reason that is not on the list", () => {
    expect(canonicalizeReason("Moving abroad")).toBe("Moving abroad");
  });

  it("trims a custom reason but keeps its casing", () => {
    expect(canonicalizeReason("  moving abroad  ")).toBe("moving abroad");
  });
});

describe("shouldOfferCustomReason", () => {
  it("is false for empty input", () => {
    expect(shouldOfferCustomReason("")).toBe(false);
  });

  it("is false for whitespace-only input", () => {
    expect(shouldOfferCustomReason("   ")).toBe(false);
  });

  it("is false when the input matches a predefined reason", () => {
    expect(shouldOfferCustomReason("Retirement")).toBe(false);
  });

  it("is false when the input matches a predefined reason case-insensitively", () => {
    expect(shouldOfferCustomReason("retirement")).toBe(false);
    expect(shouldOfferCustomReason("PERSONAL REASONS")).toBe(false);
  });

  it("is true for off-list text", () => {
    expect(shouldOfferCustomReason("Moving abroad")).toBe(true);
  });

  it("is true for a partially typed predefined reason", () => {
    expect(shouldOfferCustomReason("Retire")).toBe(true);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `CI=true yarn test --testPathPattern=resignationReason.utils`

Expected: FAIL — the suite cannot resolve `resignationReason.utils`, reporting `Cannot find module`. This confirms the tests exercise real code rather than passing vacuously.

- [ ] **Step 3: Commit the failing tests**

```bash
git add src/view/employees/onboarding/singleOnboarding/steps/resignationReason.utils.test.ts
git commit -m "test(people-app): add failing tests for resignation reason helpers"
```

---

### Task 3: Implement the reason helpers

**Files:**
- Create: `src/view/employees/onboarding/singleOnboarding/steps/resignationReason.utils.ts`
- Test: `src/view/employees/onboarding/singleOnboarding/steps/resignationReason.utils.test.ts` (from Task 2)

**Interfaces:**
- Consumes: `ResignationReasons` from `@config/constant` (Task 1).
- Produces, both used by Task 4:
  - `canonicalizeReason(input: string | null): string | null` — trims; returns `null` for empty/whitespace; returns the canonical list spelling when the trimmed text matches a list entry case-insensitively; otherwise returns the trimmed text unchanged.
  - `shouldOfferCustomReason(input: string): boolean` — `true` only when the trimmed input is non-empty and does not match any list entry case-insensitively.

- [ ] **Step 1: Write the minimal implementation**

Create the file with the copyright header, then:

Import note: because Jest resolves no path aliases (see Task 2), this module — which Jest loads as the module under test — must import the constant relatively too. `JobInfo.tsx` in Task 4 is never loaded by Jest, so it keeps the `@config/constant` alias.

```ts
import { ResignationReasons } from "../../../../../config/constant";

/**
 * Finds the canonical spelling of a reason, matching case-insensitively.
 * Returns undefined when the text is not one of the predefined reasons.
 */
const findPredefinedReason = (trimmed: string): string | undefined =>
  ResignationReasons.find(
    (reason) => reason.toLowerCase() === trimmed.toLowerCase(),
  );

/**
 * Normalizes a typed or selected resignation reason before it is stored.
 *
 * Empty and whitespace-only input becomes null, matching how the field
 * behaved when it was a plain text input. Text matching a predefined
 * reason is stored with the list's canonical casing so the resignation
 * report does not accumulate casing variants. Anything else is a custom
 * reason and is kept as typed, minus surrounding whitespace.
 */
export const canonicalizeReason = (input: string | null): string | null => {
  const trimmed = (input ?? "").trim();
  if (trimmed === "") return null;
  return findPredefinedReason(trimmed) ?? trimmed;
};

/**
 * Whether the dropdown should offer an explicit `Add "..."` row for the
 * current input. Off-list text only — matching a predefined reason (in any
 * casing) must not offer a duplicate custom entry.
 */
export const shouldOfferCustomReason = (input: string): boolean => {
  const trimmed = input.trim();
  if (trimmed === "") return false;
  return findPredefinedReason(trimmed) === undefined;
};
```

- [ ] **Step 2: Run the tests to verify they pass**

Run: `CI=true yarn test --testPathPattern=resignationReason.utils`
Expected: PASS — 15 tests across 2 suites.

This is the first test ever run in this webapp. If Jest fails to start at all (rather than failing an assertion), that is an infrastructure problem, not a logic one — report it rather than working around it by weakening the tests.

- [ ] **Step 3: Commit**

```bash
git add src/view/employees/onboarding/singleOnboarding/steps/resignationReason.utils.ts
git commit -m "feat(people-app): add resignation reason canonicalization helpers"
```

---

### Task 4: Replace the text field with a freeSolo Autocomplete

**Files:**
- Modify: `src/view/employees/onboarding/singleOnboarding/steps/JobInfo.tsx` (MUI import block around lines 25-38; the `resignationReason` field at lines 1883-1903)

**Interfaces:**
- Consumes: `ResignationReasons` (Task 1); `canonicalizeReason`, `shouldOfferCustomReason` (Task 3).
- Produces: nothing consumed by later tasks.

Context the implementer needs: this field sits inside a Formik form accessed via `useFormikContext`. The surrounding code already has `values`, `touched`, `errors`, `setFieldValue`, `handleBlur`, `textFieldSx` (a `useMemo` at line 438), and `isLeaverStatus` (a boolean at line 615) in scope. The field is one of three in a leaver-details `Grid`, the other two being `DatePicker`s for final day in office / final day of employment.

- [ ] **Step 1: Add the imports**

In the `@mui/material` import block, add `Autocomplete` alongside the existing named imports (`Box`, `Grid`, `TextField`, …).

This file does not currently import from `@config/constant`, so add a new import. Place both near the existing `@utils/utils` and `@slices/` imports:

```ts
import { ResignationReasons } from "@config/constant";
import {
  canonicalizeReason,
  shouldOfferCustomReason,
} from "@view/employees/onboarding/singleOnboarding/steps/resignationReason.utils";
```

- [ ] **Step 2: Replace the field**

> **Corrected after execution — the code below is WRONG as written.** It uses a string
> sentinel `Add "<text>"` and relies on `getOptionLabel` to strip it before the value reaches
> Formik. `getOptionLabel` does not do that: MUI's `handleOptionClick` passes the raw option to
> `selectNewValue`, which assigns it unchanged. The result was a silent persistence bug — the
> input displayed `Moving abroad` while Formik stored `Add "Moving abroad"`. The shipped code
> (commit `f146bbd0`) uses a sentinel **object** `{ addCustom: true, value }`, branches on its
> type in `onChange` to extract `value`, and keeps the `Add "…"` wording display-only via
> `renderOption`. Read `JobInfo.tsx` for the correct implementation; the block below is retained
> only as the historical record of what was planned.

Replace the whole `<TextField ... name="resignationReason" ... />` block (lines 1883-1903, the `<Grid item>` contents) with:

```tsx
<Grid item xs={12} sm={6} md={4}>
  <Autocomplete
    freeSolo
    disabled={!isLeaverStatus}
    options={ResignationReasons}
    value={values.resignationReason ?? ""}
    // A stored reason that predates this list stays editable as typed
    // text; admins are not forced to re-pick one from the list.
    onChange={(_event, newValue) =>
      setFieldValue(
        "resignationReason",
        canonicalizeReason(
          typeof newValue === "string" ? newValue : null,
        ),
        true,
      )
    }
    onInputChange={(_event, newInputValue, changeReason) => {
      // Ignore the reset MUI fires while committing a selection; onChange
      // already stored the canonical value for that path.
      if (changeReason === "reset") return;
      setFieldValue("resignationReason", newInputValue || null, true);
    }}
    onBlur={(event) => {
      setFieldValue(
        "resignationReason",
        canonicalizeReason(values.resignationReason ?? null),
        true,
      );
      handleBlur(event);
    }}
    filterOptions={(options, state) => {
      const input = state.inputValue;
      const filtered = options.filter((option) =>
        option.toLowerCase().includes(input.trim().toLowerCase()),
      );
      // Make off-list entry deliberate: a half-typed option like "Retire"
      // gets an explicit Add row rather than being silently saved.
      if (shouldOfferCustomReason(input)) {
        filtered.push(`Add "${input.trim()}"`);
      }
      return filtered;
    }}
    // The Add row carries its label as its value, so strip the wrapper
    // before it reaches Formik.
    getOptionLabel={(option) => {
      const match = /^Add "(.*)"$/.exec(option);
      return match ? match[1] : option;
    }}
    renderInput={(params) => (
      <TextField
        {...params}
        fullWidth
        label="Reason for Leaving"
        name="resignationReason"
        error={Boolean(touched.resignationReason && errors.resignationReason)}
        helperText={
          touched.resignationReason && errors.resignationReason
            ? errors.resignationReason
            : "Select a reason or type a custom one"
        }
        inputProps={{ ...params.inputProps, maxLength: 300 }}
        sx={textFieldSx}
      />
    )}
  />
</Grid>
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no *new* errors mentioning `JobInfo.tsx` or `resignationReason.utils.ts`. (Pre-existing unrelated errors may remain — compare against `git stash` output if unsure.)

- [ ] **Step 4: Verify the unit tests still pass**

Run: `CI=true yarn test --testPathPattern=resignationReason.utils`
Expected: PASS — still 15 tests.

- [ ] **Step 5: Verify in the running app**

Run: `yarn start`

Then, as an admin:
1. Open an employee and go to the **Job Info** step.
2. With status **not** Marked leaver/Left, confirm the field is disabled.
3. Set status to **Marked leaver** — the field becomes enabled.
4. Open the dropdown: all 15 reasons appear, in the order from Task 1.
5. Pick `Retirement` — it lands in the field.
6. Clear it and type `retirement` (lowercase). Confirm **no** `Add "retirement"` row appears, and that blurring the field canonicalizes the value to `Retirement`.
7. Clear it and type `Moving abroad`. Confirm an `Add "Moving abroad"` row appears; click it and confirm the field holds `Moving abroad`.
8. Clear the field entirely and confirm the required-field validation error appears (status is Marked leaver).
9. Save and reload the employee; confirm the stored reason round-trips.

- [ ] **Step 6: Commit**

```bash
git add src/view/employees/onboarding/singleOnboarding/steps/JobInfo.tsx
git commit -m "feat(people-app): offer predefined resignation reasons with custom entry"
```

---

## Self-Review

**Spec coverage** — every spec section maps to a task:

| Spec requirement | Task |
|---|---|
| `ResignationReasons` in `constant.ts`, order preserved | Task 1 |
| `freeSolo` Autocomplete replacing the TextField | Task 4 |
| Explicit `Add "…"` row for off-list text | Task 3 (`shouldOfferCustomReason`), Task 4 (`filterOptions`) |
| Case-insensitive canonicalization | Task 3 (`canonicalizeReason`), Task 4 (`onChange`/`onBlur`) |
| Empty/whitespace normalizes to `null` | Task 3, tested in Task 2 |
| Legacy off-list values stay editable, no forced re-pick | Task 4 (`value` binding + comment), verified in Step 5 |
| Yup schema unchanged | Global Constraints (explicit prohibition) |
| 300-char cap retained | Task 4 (`maxLength: 300`) |
| Backend / DB / Review step untouched | Global Constraints (scope limited to `webapp/`) |

**Type consistency** — `canonicalizeReason(string | null): string | null` and `shouldOfferCustomReason(string): boolean` are declared identically in Task 3's Interfaces block, Task 2's tests, and Task 4's call sites. `ResignationReasons` is `string[]` throughout.

**Placeholder scan** — no TBDs, no "add error handling", no "similar to Task N". Every code step carries literal code.

**Known risk flagged for the implementer:** the `onInputChange` / `onChange` / `onBlur` interplay on a `freeSolo` MUI `Autocomplete` is the fiddliest part of Task 4 — MUI fires `onInputChange` with reason `"reset"` during selection, which is why that guard exists. Step 5's manual checks 6 and 7 exist specifically to catch a regression here. If the value fails to round-trip, debug that interplay first rather than the helpers, which Task 2 already covers.
