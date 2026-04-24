# Frontend Code Generation Plan
## Bug Squelcher — Tech Debt Bounty Board (Intent 1)

**Unit**: frontend
**Location**: `frontend/` (workspace root)
**Framework**: React 18 + Vite 5 + TypeScript + Fluent UI v9

---

## Context & Dependencies
- Depends on: backend API running at http://localhost:3001
- Dev server: http://localhost:5173
- All styling via makeStyles + tokens (no inline styles except Badge severity color)
- All interactive elements must have data-testid attributes
- Drag-and-drop: @hello-pangea/dnd (CJS-compatible)

---

## Step 1: Project Scaffold
- [x] Create `frontend/package.json`
- [x] Create `frontend/tsconfig.json`
- [x] Create `frontend/vite.config.ts`
- [x] Create `frontend/index.html`
- [x] Create `frontend/.env.example`

## Step 2: Bug Types & Schemas
- [x] Create `frontend/src/bugs/bug.types.ts` — Bug, Severity, BugStatus, DTOs, display maps
- [x] Create `frontend/src/bugs/schemas/bug.schemas.ts` — Zod schemas + inferred form types

## Step 3: Query Infrastructure
- [x] Create `frontend/src/lib/queryClient.ts` — QueryClient singleton
- [x] Create `frontend/src/bugs/hooks/bugKeys.ts` — TanStack Query key factory
- [x] Create `frontend/src/bugs/api/bugs.api.ts` — raw fetch functions

## Step 4: TanStack Query Hooks
- [x] Create `frontend/src/bugs/hooks/useBugs.ts`
- [x] Create `frontend/src/bugs/hooks/useCreateBugForm.ts`
- [x] Create `frontend/src/bugs/hooks/useUpdateBug.ts`
- [x] Create `frontend/src/bugs/hooks/useDeleteBug.ts`

## Step 5: Shared Component
- [x] Create `frontend/src/shared/components/FormField.tsx`

## Step 6: BugCard Component
- [x] Create `frontend/src/bugs/components/BugCard.tsx`
- [x] Draggable wrapper, severity badge (inline style exception), edit/delete buttons

## Step 7: KanbanColumn Component
- [x] Create `frontend/src/bugs/components/KanbanColumn.tsx`
- [x] Droppable wrapper, column header, bug count, list of BugCards

## Step 8: KanbanBoard Component
- [x] Create `frontend/src/bugs/components/KanbanBoard.tsx`
- [x] DragDropContext, onDragEnd → useUpdateBug, renders 3 KanbanColumns

## Step 9: BugFormModal Component
- [x] Create `frontend/src/bugs/components/BugFormModal.tsx`
- [x] Create + edit modes, dynamic steps input, RHF + Zod, all data-testid attrs

## Step 10: ListView Component
- [x] Create `frontend/src/bugs/components/ListView.tsx`
- [x] Fluent UI Table, client-side pagination (page size 10), edit/delete per row

## Step 11: App Root
- [x] Create `frontend/src/App.tsx` — FluentProvider, QueryClientProvider, view toggle, delete confirm dialog, modal state
- [x] Create `frontend/src/main.tsx` — ReactDOM.createRoot entry point

## Step 12: README
- [x] Create `frontend/README.md`

---

## Compatibility Checks
- `@fluentui/react-components` — CJS/ESM dual ✅
- `@tanstack/react-query` v5 — ESM/CJS dual ✅
- `react-hook-form` — CJS ✅
- `zod` — CJS ✅
- `@hello-pangea/dnd` — CJS-compatible fork of react-beautiful-dnd ✅
- NO react-beautiful-dnd (unmaintained, React 18 issues)
