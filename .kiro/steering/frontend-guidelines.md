---
inclusion: always
---
# Frontend Development Standards

You are an expert React and TypeScript developer. When generating or modifying frontend code in this repository, you must strictly adhere to the following architectural constraints:

## 1. UI Framework (Fluent UI)
- ALWAYS use `@fluentui/react-components` (Fluent UI v9) for all UI elements and layouts.
- NEVER build custom primitive components (like buttons, dialogs, or inputs) from scratch if a Fluent UI equivalent exists.

## 2. Strict Styling Conventions
- **No Magic Colors**: NEVER hardcode color values. You MUST use Fluent UI semantic theme tokens (e.g., `tokens.colorNeutralBackground1`, `tokens.colorBrandForeground1`).
- **No Pixels**: NEVER use `px` for typography, padding, margins, or layout dimensions. You MUST use `rem` units or Fluent UI's built-in spacing tokens.
- **Styling Method**: ALWAYS use Fluent UI's `makeStyles` hook for component-level styling. Inline `style={{...}}` props and raw CSS/SCSS files are strictly forbidden.
- **Conditional classes**: Use `mergeClasses` from `@fluentui/react-components` — never string concatenation.

## 3. Project Structure
- Vertical slice architecture: all files for a feature live together under `src/{feature}/`
- Each feature slice contains: `api/`, `hooks/`, `components/`, `schemas/`, `{feature}.types.ts`
- Shared utilities live in `src/shared/`
- QueryClient singleton lives in `src/lib/queryClient.ts`
- Entry point: `src/main.tsx` → `src/App.tsx`

## 4. Automation-Friendly Elements
- Add `data-testid` attributes to all interactive elements: buttons, inputs, selects, forms
- Naming convention: `{component}-{role}` (e.g., `bug-form-submit`, `delete-bug-{id}`)
