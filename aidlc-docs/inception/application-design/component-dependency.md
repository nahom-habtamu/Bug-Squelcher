# Component Dependencies
## Bug Squelcher — Tech Debt Bounty Board (Intent 1)

---

## Backend Dependency Graph

```
index.ts
  └── app.ts
        ├── bug.routes.ts
        │     └── bug.controller.ts
        │           ├── bug.service.ts
        │           │     └── lib/prisma.ts  (PrismaClient singleton)
        │           └── bug.types.ts
        ├── openapi.ts
        └── middleware/error.middleware.ts
```

**Dependency rules:**
- `index.ts` → imports `app`, calls `app.listen()`
- `app.ts` → imports router, openapi spec, error middleware; no business logic
- `bug.routes.ts` → imports controller; binds routes
- `bug.controller.ts` → imports service + Zod schemas; never imports Prisma directly
- `bug.service.ts` → imports PrismaClient; owns all Prisma calls
- `lib/prisma.ts` → exports singleton; no other imports

---

## Frontend Dependency Graph

```
main.tsx
  └── App.tsx
        ├── lib/queryClient.ts          (QueryClientProvider)
        ├── bugs/components/KanbanBoard.tsx
        │     └── bugs/components/KanbanColumn.tsx
        │           └── bugs/components/BugCard.tsx
        ├── bugs/components/ListView.tsx
        ├── bugs/components/BugFormModal.tsx
        │     ├── shared/components/FormField.tsx
        │     ├── bugs/hooks/useCreateBugForm.ts
        │     │     ├── bugs/api/bugs.api.ts
        │     │     └── bugs/schemas/bug.schemas.ts
        │     └── bugs/hooks/useUpdateBug.ts
        │           └── bugs/api/bugs.api.ts
        ├── bugs/hooks/useBugs.ts
        │     └── bugs/api/bugs.api.ts
        └── bugs/hooks/useDeleteBug.ts
              └── bugs/api/bugs.api.ts
```

**Dependency rules:**
- Components never call `bugs.api.ts` directly — always through hooks
- Hooks own all TanStack Query logic; components receive data/callbacks only
- `bug.schemas.ts` (Zod) is shared between `useCreateBugForm` and `useUpdateBug`
- `bug.types.ts` is imported by components, hooks, and api module — single source of truth
- `bugKeys.ts` is imported only by hooks — never by components

---

## Cross-Unit Dependencies (Backend ↔ Frontend)

| Contract | Backend Produces | Frontend Consumes |
|---|---|---|
| `Bug` shape | JSON response body | `bug.types.ts` interface |
| Status strings | `'Open'`, `'In Progress'`, `'Works on My Machine'` | Same strings in `BugStatus` type |
| Severity strings | `'P0'`, `'P1'`, `'P2'`, `'P3'` | Same strings in `Severity` type |
| Base URL | `http://localhost:3001` | `VITE_API_BASE_URL` env var |
| CORS origin | `http://localhost:5173` | Frontend dev server origin |

---

## Communication Patterns

| Pattern | Where Used |
|---|---|
| REST/JSON over HTTP | Frontend → Backend (all API calls) |
| TanStack Query cache | Frontend internal (server state management) |
| React props/callbacks | Component → Component (parent → child data, child → parent events) |
| React state (useState) | App.tsx — view toggle (Kanban/List), selected bug for edit, modal open state |
| Drag-and-drop events | KanbanBoard → useUpdateBug (status change on drop) |
