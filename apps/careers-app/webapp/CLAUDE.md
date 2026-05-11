# CLAUDE.md — React + Vite + Oxygen UI Project

## Stack

- **Frontend**: React 18+, Vite
- **UI Library**: [Oxygen UI](https://github.com/wso2/oxygen-ui) (WSO2's design system, built on MUI v5+)
- **Language**: TypeScript (strict mode)
- **Backend**: Ballerina (REST APIs)

---

## Component Rules

- Functional components only. No class components.
- One component per file. Filename matches the component name exactly.
- Export components as named exports, not default exports.
- Keep components under 150 lines. Split if larger.
- Co-locate component files: `ComponentName/index.tsx`, `ComponentName/ComponentName.test.tsx`.
- Use barrel exports (`index.ts`) in every feature folder.

```
src/
  features/
    auth/
      components/
        LoginForm/
          index.tsx
          LoginForm.test.tsx
      hooks/
        useAuth.ts
      index.ts          ← barrel export
  shared/
    components/
    hooks/
    utils/
  services/             ← Ballerina API layer
  types/                ← Global TypeScript types
```

---

## State Management — Pick the Right Tool

Choose based on the use case, not habit:

| Use case | Tool |
|---|---|
| Local UI state (toggles, form inputs) | `useState` |
| Derived/computed state | `useMemo`, `useReducer` |
| Shared UI state across components | Zustand |
| Server data (fetch, cache, sync) | TanStack Query |
| Cross-cutting concerns (auth, theme) | React Context (read-only preferred) |

**Rules:**
- Never use Context for frequently changing state — use Zustand instead.
- Never fetch data inside components directly — always use TanStack Query hooks.
- Keep Zustand stores small and feature-scoped (one store per domain, e.g. `useAuthStore`, `useCartStore`).
- Prefer TanStack Query's `staleTime` and `gcTime` over manual caching logic.

---

## MUI Usage

- Use MUI's `sx` prop for one-off styles. Use `styled()` for reusable styled components.
- Never mix MUI styling with plain CSS or inline `style={{}}` objects.
- Use `useTheme()` to access theme tokens — never hardcode colors or spacing.
- Extend the theme in `src/theme.ts`. Do not override MUI defaults inline across components.
- Prefer MUI's `Stack`, `Grid2`, and `Box` for layout. Avoid custom flex/grid wrappers.
- Always pass `aria-label` or `aria-labelledby` to interactive MUI components.

```tsx
// ✅ Good
<Button sx={{ mt: 2 }} variant="contained" onClick={handleSubmit}>
  Save
</Button>

// ❌ Bad — hardcoded color, inline style
<button style={{ marginTop: '16px', backgroundColor: '#1976d2' }}>
  Save
</button>
```

---

## Hooks

- Extract ALL business logic into custom hooks (`useAuth`, `useInvoice`, etc.).
- Custom hooks live in the feature's `hooks/` folder or `shared/hooks/` if reusable.
- Hook filenames: `useFeatureName.ts` (camelCase, `use` prefix always).
- Never put API calls, Zustand access, or side effects directly in component bodies.

---

## TypeScript

- Strict mode enabled. No `any`. Use `unknown` + type narrowing if needed.
- Define API response types in `src/types/` and co-locate them with the service file.
- Use `interface` for object shapes, `type` for unions and utility types.
- All props must be explicitly typed — no implicit `{}` or `React.FC` without generics.

---

## API Layer (Ballerina Backend)

- All API calls go through `src/services/`. Components never call `fetch` directly.
- Each service file maps to one Ballerina resource (e.g. `invoiceService.ts`, `authService.ts`).
- Wrap all API functions for use with TanStack Query (`queryFn`, `mutationFn`).
- Handle errors at the service layer and throw typed errors for Query to catch.

```ts
// src/services/invoiceService.ts
export async function fetchInvoices(): Promise<Invoice[]> {
  const res = await fetch('/api/invoices');
  if (!res.ok) throw new Error('Failed to fetch invoices');
  return res.json();
}
```

---

## Testing

- Jest + React Testing Library. Test files colocated: `Component.test.tsx`.
- Test behavior, not implementation. No snapshot tests.
- Mock API calls at the service layer, not at `fetch`.
- Every custom hook must have a corresponding test using `renderHook`.

---

## Code Quality

- No functions over 40 lines without discussion.
- No unhandled promise rejections — always `.catch()` or `try/catch` in async functions.
- No `console.log` in committed code.
- Run `npx tsc --noEmit` to type-check before presenting code.
- Prefer early returns over nested conditionals.

---

## Claude Behavior

- **Before implementing anything, ask clarifying questions until all ambiguity is resolved.** Do not write a single line of code until requirements, edge cases, and acceptance criteria are clear. Ask about: intended behavior, expected inputs/outputs, error scenarios, affected components, and any design or API constraints.
- Before implementing, briefly state the approach and which state tool you'll use and why.
- After implementing, run a mental pass: missing error boundaries? unhandled loading states? missing aria labels?
- When generating MUI components, always include loading, empty, and error states.
- Do not introduce new dependencies without flagging them explicitly.
