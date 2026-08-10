# Predefined resignation reasons with custom entry

**Date:** 2026-08-10
**App:** people-app (webapp)
**Status:** Approved

## Problem

When an employee's status is set to **Marked leaver** or **Left**, the admin must supply a
reason for leaving. Today that field is a plain free-text input
(`JobInfo.tsx`, "Reason for Leaving"), so every reason is typed by hand. The value feeds the
resignation report, where free text produces inconsistent groupings — spelling variants, casing
differences, and near-duplicates of what is really the same reason.

HR has a settled list of 15 reasons that covers almost every case, but not all of them, so the
field cannot become a closed dropdown.

## Goal

Offer the 15 predefined reasons as selectable options while still allowing a custom reason to be
entered, and make the custom path deliberate rather than accidental.

## Scope

Frontend only. No database migration, no backend change, no API change. The value remains a
`string` stored in the existing `resignation.reason VARCHAR(300)` column and travels the existing
payload path unchanged.

## Design

### 1. Reason list as a frontend constant

The list lives in `webapp/src/config/constant.ts` as a new export, alongside the existing fixed
lists (`EmployeeTitle`, `EmployeeGenders`, `Countries`):

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

Order is preserved as supplied.

**Why a constant rather than DB-backed master data:** the list is expected to be stable, and the
free-text escape hatch already covers anything missing. A constant means one file, no migration,
no API, and no admin CRUD screen. If HR later needs to curate the list without a release, moving
it to master data is a separate, self-contained change.

### 2. Field behavior

The plain `TextField` for `resignationReason` in
`webapp/src/view/employees/onboarding/singleOnboarding/steps/JobInfo.tsx` becomes a MUI
`Autocomplete` (added to the existing `@mui/material` import) rendering a `TextField` internally.
Existing wiring carries over unchanged: `sx={textFieldSx}`, error/`helperText` binding,
`inputProps={{ maxLength: 300 }}`, and `disabled={!isLeaverStatus}`.

- **`freeSolo`** — custom text is permitted.
- **Explicit custom-entry row** — `filterOptions` performs standard filtering, then appends a
  synthetic Add row when the trimmed input matches no option case-insensitively. Selecting that
  row commits the typed text. This makes off-list entry a deliberate act and prevents a
  half-typed option (e.g. `Retire`) from being saved as-is when the user moves on without
  clicking a suggestion.

  The Add row is a sentinel **object** (`{ addCustom: true, value }`), not a marker string, and
  `onChange` branches on its type to extract the clean `value`. This matters: MUI hands
  `onChange` the raw option, and `getOptionLabel` affects only rendering — so a string marker
  like `Add "<text>"` would be persisted verbatim while the input displayed the stripped text.
  An object sentinel also cannot collide with user text containing quotes. The `Add "…"` wording
  survives as display-only, via `renderOption`.
- **Case-insensitive canonicalization** — input that case-insensitively equals a list entry is
  stored with the list's canonical spelling. Typing `retirement` saves `Retirement`. This is
  applied in one place, the `onChange`/`onBlur` commit path that writes to Formik, so both
  picking an option and typing a match end up at the same normalized value. The `Add "…"` row is
  suppressed when the input matches a list entry, so there is no path to creating a casing
  duplicate.
- **Value handling** — empty or whitespace-only input normalizes to `null`, matching the current
  `e.target.value || null` behavior. Formik remains the single source of truth via
  `setFieldValue`.
- **Legacy values** — a stored reason that is not on the list displays as-is in the input and
  stays editable. No forced re-pick.

**Why grandfather legacy values:** employees already marked leaver may hold free-text reasons that
predate the list. Forcing a re-pick would turn an unrelated edit (for example, adjusting the final
day of employment) into a data-cleanup chore, and the stored value is still valid free text.

### 3. Deliberately unchanged

- **Yup schema** (`JobInfo.tsx`, `resignationReason`) — keeps `max(300)`, the whitespace-to-null
  transform, and the conditional-required rule for `MarkedLeaver` / `Left`. No new validation is
  added: a custom reason is valid by definition, so there is no list-membership rule to enforce.
- **300-character cap** — retained, matching the `VARCHAR(300)` column width. It only ever
  constrains custom text; all predefined reasons are far shorter.
- **Backend** — the null-presence check in `service.bal` and the pass-through in
  `db_queries.bal` are untouched. The backend does not and will not validate the reason against
  the list.
- **Review step** — `Review.tsx` does not render this field, so nothing to update.

## Accepted trade-off

Because free text remains permitted and legacy rows are grandfathered, the resignation report can
still contain off-list values. This design improves consistency but does not guarantee it. That
follows directly from the "list plus custom" requirement and is accepted, not an oversight.

## Files affected

| File | Change |
|---|---|
| `webapp/src/config/constant.ts` | Add `ResignationReasons` export |
| `webapp/src/view/employees/onboarding/singleOnboarding/steps/JobInfo.tsx` | Replace the `resignationReason` `TextField` with a `freeSolo` `Autocomplete`; add `Autocomplete` to the MUI import |
