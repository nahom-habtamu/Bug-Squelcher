# Application Design — Consolidated
## Bug Squelcher — Tech Debt Bounty Board (Intent 1)

---

## Overview

Full-stack web application with two independently deployable units:
- **Backend**: Node.js 20 / Express 4 / TypeScript (CommonJS) / Prisma 5 / PostgreSQL 16
- **Frontend**: React 18 / Vite 5 / TypeScript / Fluent UI v9 / TanStack Query v5

Both units follow vertical slice architecture — all feature code lives under `src/bugs/`.

---

## Backend Architecture

### Layer Stack
```
HTTP Request
    │
    ▼
BugRouter (bug.routes.ts)        — route declarations only
    │
    ▼
BugController (bug.controller.ts) — Zod validation, HTTP lifecycle
    │
    ▼
BugService (bug.service.ts)      — business logic, enum mapping, existence checks
    │
    ▼
PrismaClient (lib/prisma.ts)     — data access (PostgreSQL via Docker)
```

### Key Design Decisions
- **No repository pattern** — Prisma IS the data layer; BugService calls it directly
- **Enum mapping in service** — plain string objects map API ↔ Prisma storage values; no `@prisma/client` enum imports
- **Zod at controller boundary** — all `req.body` / `req.params` validated before service call
- **CommonJS only** — no ESM-only packages; `swagger-ui-express` for API docs

### API Endpoints
| Method | Path | Handler | Response |
|---|---|---|---|
| GET | /api/bugs | listBugs | 200 Bug[] |
| POST | /api/bugs | createBug | 201 Bug |
| GET | /api/bugs/:id | getBugById | 200 Bug |
| PUT | /api/bugs/:id | updateBug | 200 Bug |
| DELETE | /api/bugs/:id | deleteBug | 204 |
| GET | /docs | swagger-ui | 200 HTML |
| GET | /openapi.json | openapi spec | 200 JSON |

---

## Frontend Architecture

### Component Tree
```
App.tsx
  ├── FluentProvider + QueryClientProvider
  ├── View Toggle (Kanban | List)          — useState
  ├── KanbanBoard                          — primary view
  │     └── KanbanColumn (×3)
  │           └── BugCard (×n)            — drag source
  ├── ListView                             — secondary view
  │     └── DataGrid rows (×n)
  └── BugFormModal                         — shared create/edit
        └── FormField (shared)
```

### Data Flow
```
useBugs (TanStack Query)
    │  Bug[]
    ▼
App.tsx ──────────────────────────────────────────────────────────┐
    │  Bug[]                                                       │
    ├──► KanbanBoard ──► KanbanColumn ──► BugCard                 │
    │                                        │ onEdit / onDelete  │
    └──► ListView                            │                    │
              │ onEdit / onDelete            │                    │
              └──────────────────────────────┘                    │
                                             │                    │
                                    App.tsx state                 │
                                    (selectedBug, modalOpen)      │
                                             │                    │
                                             ▼                    │
                                       BugFormModal ◄─────────────┘
                                       useCreateBugForm / useUpdateBug
```

### State Management
| State | Location | Mechanism |
|---|---|---|
| Bug list (server) | TanStack Query cache | `useBugs` |
| Modal open | App.tsx | `useState` |
| Selected bug (edit) | App.tsx | `useState<Bug \| null>` |
| View toggle | App.tsx | `useState<'kanban' \| 'list'>` |
| Form state | BugFormModal | React Hook Form |
| Drag state | KanbanBoard | DnD library context |

---

## Shared Contracts

### Bug Type (both units)
```typescript
interface Bug {
  id: string
  title: string
  stepsToReproduce: string   // newline-delimited steps
  severity: 'P0' | 'P1' | 'P2' | 'P3'
  status: 'Open' | 'In Progress' | 'Works on My Machine'
  createdAt: string
  updatedAt: string
}
```

### Severity Display Mapping (frontend only)
```typescript
const SEVERITY_LABEL: Record<Severity, string> = {
  P0: 'Critical',
  P1: 'High',
  P2: 'Medium',
  P3: 'Low',
}
```

### Steps to Reproduce Serialization
- UI: dynamic numbered step rows (add / remove)
- Storage: newline-delimited string (`step1\nstep2\nstep3`)
- Serialization/deserialization handled in `BugFormModal`

---

## File Structure (target)

```
backend/
  prisma/
    schema.prisma
  src/
    bugs/
      bug.types.ts
      bug.service.ts
      bug.controller.ts
      bug.routes.ts
    lib/prisma.ts
    middleware/error.middleware.ts
    openapi.ts
    app.ts
    index.ts

frontend/
  src/
    bugs/
      api/bugs.api.ts
      hooks/
        bugKeys.ts
        useBugs.ts
        useUpdateBug.ts
        useDeleteBug.ts
        useCreateBugForm.ts
      schemas/bug.schemas.ts
      components/
        KanbanBoard.tsx
        KanbanColumn.tsx
        BugCard.tsx
        BugFormModal.tsx
        ListView.tsx
      bug.types.ts
    shared/components/FormField.tsx
    lib/queryClient.ts
    App.tsx
    main.tsx
```

---

*See `components.md`, `component-methods.md`, `services.md`, and `component-dependency.md` for detailed breakdowns.*
