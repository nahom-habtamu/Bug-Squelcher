# Requirements Document
## Bug Squelcher — Tech Debt Bounty Board (Intent 1)

---

## Intent Analysis Summary

| Field | Value |
|---|---|
| **User Request** | Build a Tech Debt Bounty Board — a developer issue tracker where users can report, view, update, and close out bugs |
| **Request Type** | New Project (Greenfield) |
| **Scope Estimate** | Multiple Components — full-stack (backend API + frontend SPA) |
| **Complexity Estimate** | Moderate — CRUD with Kanban UI, drag-and-drop, dual views, structured form inputs |

---

## Functional Requirements

### FR-01: Bug Reporting
- Users can create a new bug by filling out a modal form
- Required fields: `title`, `stepsToReproduce` (structured numbered steps), `severity`
- `severity` options: Critical, High, Medium, Low (stored as P0/P1/P2/P3 internally)
- `status` defaults to `Open` on creation
- `id`, `createdAt`, `updatedAt` are system-generated — not user-editable

### FR-02: Bug Viewing — Kanban Board (Primary View)
- The default/primary view is a Kanban board
- Three columns, one per status: `Open`, `In Progress`, `Works on My Machine`
- Each column displays all bugs with that status as cards
- Bug cards display: title, severity label (Critical/High/Medium/Low), and any other relevant summary info
- Bugs are ordered newest-first within each column

### FR-03: Bug Viewing — List/Table View (Secondary View)
- A secondary flat list/table view is available alongside the Kanban board
- Users can toggle between Kanban view and List view
- List view shows all bugs in a tabular format (newest first)
- Columns: title, severity label, status, createdAt

### FR-04: Bug Editing
- Users can edit an existing bug using the same modal form used for creation
- All user-editable fields can be updated: `title`, `stepsToReproduce`, `severity`, `status`
- Edit is triggered from the bug card (Kanban) or the list row (table view)

### FR-05: Bug Deletion
- Users can delete a bug from the bug card or list row
- A confirmation dialog must be shown before the delete is executed
- On confirmation, the bug is permanently removed

### FR-06: Drag-and-Drop Status Change
- On the Kanban board, users can drag a bug card from one column and drop it into another
- Dropping a card into a column updates the bug's `status` to match that column
- The change is persisted immediately via the API

### FR-07: Structured Steps to Reproduce
- The `stepsToReproduce` field uses a dynamic numbered-step input
- Users can add new steps, remove existing steps, and reorder steps
- The structured steps are serialized to a string for storage (e.g., newline-delimited or JSON)

### FR-08: No Authentication
- The application is open/anonymous for this intent
- No login, session management, or role-based access control is required

### FR-09: Pagination / Infinite Scroll
- The list/table view supports pagination or infinite scroll to handle larger datasets
- The Kanban board may also apply a reasonable limit per column with a "load more" affordance if needed

---

## Non-Functional Requirements

### NFR-01: Tech Stack (Mandated by Architecture)
- Backend: Node.js 20+, TypeScript 5.x (CommonJS), Express 4.x, Prisma 5.x, PostgreSQL 16 (Docker)
- Frontend: React 18.x, Vite 5.x, TypeScript 5.x, Fluent UI v9, TanStack Query v5, React Hook Form 7.x + Zod 3.x
- API docs: swagger-ui-express at `/docs`

### NFR-02: API Design
- RESTful JSON API following the contract defined in the architecture document
- All endpoints under `/api/bugs`
- Proper HTTP status codes (200, 201, 204, 400, 404, 500)
- Zod validation at every controller boundary

### NFR-03: UI Standards
- All styling via Fluent UI `makeStyles` + `tokens` — no inline styles (exception: Badge severity color)
- No hardcoded colors or px values — tokens and rem only
- All interactive elements must have `data-testid` attributes

### NFR-04: Code Architecture
- Vertical slice architecture — all feature code under `src/bugs/` in both backend and frontend
- No repository pattern — Prisma called directly from service layer
- Backend is CommonJS — no ESM-only packages

### NFR-05: Performance
- No strict latency SLA for this intent
- Pagination/infinite scroll on list view to avoid loading unbounded datasets

### NFR-06: Accessibility
- Use Fluent UI components which provide baseline accessibility (ARIA roles, keyboard navigation)
- `data-testid` attributes on all interactive elements for automation

---

## Extension Configuration

| Extension | Enabled | Rationale |
|---|---|---|
| Security Baseline | **No** | PoC/prototype — no auth, no sensitive data |
| Property-Based Testing | **No** | Simple CRUD application — standard unit/integration tests sufficient |

---

## Data Model (from Architecture)

```
Bug
├── id               UUID (PK, auto-generated)
├── title            String (required, trimmed)
├── stepsToReproduce String (required, trimmed)
├── severity         Enum: P0 | P1 | P2 | P3
├── status           Enum: Open | In Progress | Works on My Machine
├── createdAt        DateTime (auto, immutable)
└── updatedAt        DateTime (auto-updated on every write)
```

Severity display mapping:
| Stored Value | Display Label |
|---|---|
| P0 | Critical |
| P1 | High |
| P2 | Medium |
| P3 | Low |

Status Prisma mapping:
| Display / API String | Prisma Enum Value |
|---|---|
| Open | Open |
| In Progress | InProgress |
| Works on My Machine | WorksOnMyMachine |

---

## Key Decisions

| # | Decision | Rationale |
|---|---|---|
| 1 | Three statuses only (Open, In Progress, Works on My Machine) | Architect confirmed — no Closed/Resolved status in this intent |
| 2 | Severity displayed as label only (Critical/High/Medium/Low) | Cleaner UX — codes (P0–P3) are internal only |
| 3 | Kanban + List/Table dual view | Architect requested secondary flat view alongside Kanban |
| 4 | No filtering/search | Out of scope for Intent 1 |
| 5 | Same modal for create and edit | Reduces component duplication |
| 6 | Delete confirmation dialog | Prevents accidental data loss |
| 7 | Structured numbered steps for stepsToReproduce | Better UX for reproducibility |
| 8 | No authentication | Open/anonymous app for this intent |
| 9 | Drag-and-drop status change on Kanban | Core Kanban UX pattern |
| 10 | Pagination/infinite scroll on list view | Handle datasets beyond 100 bugs |
