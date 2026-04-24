# Execution Plan
## Bug Squelcher — Tech Debt Bounty Board (Intent 1)

---

## Detailed Analysis Summary

### Change Impact Assessment
- **User-facing changes**: Yes — full SPA with Kanban board, list view, create/edit modal, drag-and-drop
- **Structural changes**: Yes — new full-stack project from scratch (greenfield)
- **Data model changes**: Yes — new `Bug` entity with UUID PK, severity enum, status enum
- **API changes**: Yes — new REST API with 5 endpoints under `/api/bugs`
- **NFR impact**: Minimal — tech stack fully mandated; pagination required on list view

### Risk Assessment
- **Risk Level**: Low-Medium
- **Rollback Complexity**: Easy (greenfield — nothing to break)
- **Testing Complexity**: Moderate (drag-and-drop, structured steps, dual views)

---

## Workflow Visualization

```
INCEPTION PHASE
  [DONE]  Workspace Detection
  [SKIP]  Reverse Engineering     (Greenfield — no existing code)
  [DONE]  Requirements Analysis
  [SKIP]  User Stories            (Single user type, clear requirements, no multi-persona)
  [NOW ]  Workflow Planning
  [NEXT]  Application Design      (New components, service layer, component boundaries needed)
  [NEXT]  Units Generation        (Two deployable units: backend + frontend)

CONSTRUCTION PHASE
  Per-Unit: Backend
    [NEXT]  Functional Design     (New data model, status/severity mapping, API contract)
    [SKIP]  NFR Requirements      (Tech stack fully mandated by architecture steering)
    [SKIP]  NFR Design            (Follows from NFR Requirements skip)
    [SKIP]  Infrastructure Design (Docker + PostgreSQL fully defined in architecture)
    [NEXT]  Code Generation       (Backend implementation)
  Per-Unit: Frontend
    [NEXT]  Functional Design     (Component tree, state management, drag-and-drop design)
    [SKIP]  NFR Requirements      (Tech stack fully mandated)
    [SKIP]  NFR Design            (Follows from NFR Requirements skip)
    [SKIP]  Infrastructure Design (Vite + env vars fully defined)
    [NEXT]  Code Generation       (Frontend implementation)
  [NEXT]  Build and Test

OPERATIONS PHASE
  [HOLD]  Operations              (Placeholder — future expansion)
```

---

## Phases to Execute

### 🔵 INCEPTION PHASE
- [x] Workspace Detection — COMPLETED
- [x] Reverse Engineering — SKIPPED (Greenfield)
- [x] Requirements Analysis — COMPLETED
- [ ] User Stories — **SKIP**
  - **Rationale**: Single developer user type, no multi-persona complexity, requirements are clear and complete, no acceptance testing or cross-team collaboration needed for this intent
- [x] Workflow Planning — IN PROGRESS
- [ ] Application Design — **EXECUTE**
  - **Rationale**: New full-stack system requires component boundary definition, service layer design, and interface contracts for both backend (bugs slice) and frontend (Kanban, list view, modal, hooks)
- [ ] Units Generation — **EXECUTE**
  - **Rationale**: Two distinct deployable units (backend Node/Express API + frontend React SPA) with separate package.json, build systems, and deployment concerns; dependency mapping needed

### 🟢 CONSTRUCTION PHASE — Unit: Backend
- [ ] Functional Design — **EXECUTE**
  - **Rationale**: New Prisma schema, status/severity string mapping objects, Zod validation schemas, service business logic, controller boundary design
- [ ] NFR Requirements — **SKIP**
  - **Rationale**: Tech stack fully mandated by architecture steering (Node 20, Express 4, Prisma 5, PostgreSQL 16, swagger-ui-express); no tech stack decisions remain
- [ ] NFR Design — **SKIP**
  - **Rationale**: Follows from NFR Requirements skip
- [ ] Infrastructure Design — **SKIP**
  - **Rationale**: Docker + PostgreSQL fully specified in architecture; port mapping (5433:5432), connection string, and docker-compose all defined
- [ ] Code Generation — **EXECUTE** (ALWAYS)

### 🟢 CONSTRUCTION PHASE — Unit: Frontend
- [ ] Functional Design — **EXECUTE**
  - **Rationale**: Component tree design (KanbanBoard, KanbanColumn, BugCard, BugFormModal, ListView), TanStack Query hook design, Zod schema design, drag-and-drop interaction design, structured steps input design
- [ ] NFR Requirements — **SKIP**
  - **Rationale**: Tech stack fully mandated (React 18, Vite 5, Fluent UI v9, TanStack Query v5, RHF + Zod)
- [ ] NFR Design — **SKIP**
  - **Rationale**: Follows from NFR Requirements skip
- [ ] Infrastructure Design — **SKIP**
  - **Rationale**: Vite config, env vars, and CORS setup fully defined in architecture
- [ ] Code Generation — **EXECUTE** (ALWAYS)

### 🟢 CONSTRUCTION PHASE
- [ ] Build and Test — **EXECUTE** (ALWAYS)

### 🟡 OPERATIONS PHASE
- [ ] Operations — PLACEHOLDER (future expansion)

---

## Stages to Execute (Summary)
1. Application Design
2. Units Generation
3. Functional Design — Backend
4. Code Generation — Backend
5. Functional Design — Frontend
6. Code Generation — Frontend
7. Build and Test

## Stages to Skip (Summary)
| Stage | Reason |
|---|---|
| Reverse Engineering | Greenfield project |
| User Stories | Single user type, clear requirements |
| NFR Requirements (both units) | Tech stack fully mandated by architecture |
| NFR Design (both units) | Follows from NFR Requirements skip |
| Infrastructure Design (both units) | Docker + Vite fully defined in architecture |

---

## Success Criteria
- **Primary Goal**: Fully functional Tech Debt Bounty Board with Kanban + list views, CRUD operations, drag-and-drop, and structured steps input
- **Key Deliverables**:
  - Backend REST API (5 endpoints) with Prisma + PostgreSQL
  - Swagger UI at `/docs`
  - Frontend React SPA with Kanban board and list/table view
  - Drag-and-drop status changes
  - Create/edit modal with structured steps
  - Delete confirmation dialog
  - Pagination on list view
- **Quality Gates**:
  - All Zod validation at controller boundary
  - All Fluent UI makeStyles (no inline styles except Badge severity)
  - All interactive elements have `data-testid`
  - Backend compiles as CommonJS (no ESM-only packages)
  - Prisma enums never imported directly from `@prisma/client`
