# Unit of Work — Story Map
## Bug Squelcher — Tech Debt Bounty Board (Intent 1)

---

## Functional Requirements → Unit Mapping

| Requirement | Backend Unit | Frontend Unit |
|---|---|---|
| FR-01: Bug Reporting (create) | POST /api/bugs | BugFormModal + useCreateBugForm |
| FR-02: Kanban Board view | GET /api/bugs | KanbanBoard + KanbanColumn + BugCard |
| FR-03: List/Table view | GET /api/bugs | ListView + pagination |
| FR-04: Bug Editing | PUT /api/bugs/:id | BugFormModal (edit mode) + useUpdateBug |
| FR-05: Bug Deletion | DELETE /api/bugs/:id | BugCard/ListView delete + useDeleteBug + confirm dialog |
| FR-06: Drag-and-drop status | PUT /api/bugs/:id | KanbanBoard DnD + useUpdateBug |
| FR-07: Structured steps input | Storage (string) | BugFormModal dynamic step rows |
| FR-08: No authentication | N/A | N/A |
| FR-09: Pagination / infinite scroll | GET /api/bugs (all) | ListView pagination controls |

---

## Backend Unit — Work Items

| # | Work Item | Files |
|---|---|---|
| B1 | Prisma schema (Bug model) | `prisma/schema.prisma` |
| B2 | PrismaClient singleton | `src/lib/prisma.ts` |
| B3 | Bug types | `src/bugs/bug.types.ts` |
| B4 | Bug service (CRUD + mapping) | `src/bugs/bug.service.ts` |
| B5 | Bug controller (Zod + handlers) | `src/bugs/bug.controller.ts` |
| B6 | Bug routes | `src/bugs/bug.routes.ts` |
| B7 | OpenAPI spec | `src/openapi.ts` |
| B8 | Express app setup | `src/app.ts` |
| B9 | Error middleware | `src/middleware/error.middleware.ts` |
| B10 | Entry point | `src/index.ts` |
| B11 | Package config | `package.json`, `tsconfig.json`, `.env.example` |
| B12 | Docker compose | `docker-compose.yml` (workspace root) |

## Frontend Unit — Work Items

| # | Work Item | Files |
|---|---|---|
| F1 | Bug types | `src/bugs/bug.types.ts` |
| F2 | Zod schemas | `src/bugs/schemas/bug.schemas.ts` |
| F3 | Query key factory | `src/bugs/hooks/bugKeys.ts` |
| F4 | API module | `src/bugs/api/bugs.api.ts` |
| F5 | useBugs hook | `src/bugs/hooks/useBugs.ts` |
| F6 | useCreateBugForm hook | `src/bugs/hooks/useCreateBugForm.ts` |
| F7 | useUpdateBug hook | `src/bugs/hooks/useUpdateBug.ts` |
| F8 | useDeleteBug hook | `src/bugs/hooks/useDeleteBug.ts` |
| F9 | QueryClient singleton | `src/lib/queryClient.ts` |
| F10 | FormField shared component | `src/shared/components/FormField.tsx` |
| F11 | BugCard component | `src/bugs/components/BugCard.tsx` |
| F12 | KanbanColumn component | `src/bugs/components/KanbanColumn.tsx` |
| F13 | KanbanBoard component | `src/bugs/components/KanbanBoard.tsx` |
| F14 | BugFormModal component | `src/bugs/components/BugFormModal.tsx` |
| F15 | ListView component | `src/bugs/components/ListView.tsx` |
| F16 | App root | `src/App.tsx`, `src/main.tsx` |
| F17 | Package config | `package.json`, `tsconfig.json`, `vite.config.ts`, `.env.example`, `index.html` |
