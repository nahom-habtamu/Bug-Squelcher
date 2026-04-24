# Units of Work
## Bug Squelcher — Tech Debt Bounty Board (Intent 1)

---

## Unit 1: Backend API

| Field | Value |
|---|---|
| **Unit Name** | backend |
| **Type** | Independently deployable service |
| **Runtime** | Node.js 20 + TypeScript (CommonJS) |
| **Framework** | Express 4.x + Prisma 5.x |
| **Database** | PostgreSQL 16 (Docker) |
| **Root Directory** | `backend/` |
| **Entry Point** | `src/index.ts` |
| **Dev Port** | 3001 |

### Responsibilities
- Expose REST API for all bug CRUD operations
- Persist bugs to PostgreSQL via Prisma
- Validate all incoming requests with Zod
- Serve Swagger UI at `/docs` and raw spec at `/openapi.json`
- Map between API display strings and Prisma storage enums

### Files to Create
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
  .env.example
  package.json
  tsconfig.json
```

### Build & Run
```bash
cd backend
cp .env.example .env
npm install
npm run db:migrate
npm run dev        # ts-node-dev, port 3001
npm run build      # tsc → dist/
npm start          # node dist/index.js
```

---

## Unit 2: Frontend SPA

| Field | Value |
|---|---|
| **Unit Name** | frontend |
| **Type** | Independently deployable SPA |
| **Runtime** | Browser (Vite 5 dev server) |
| **Framework** | React 18 + Fluent UI v9 |
| **State** | TanStack Query v5 + React Hook Form 7 + Zod 3 |
| **Root Directory** | `frontend/` |
| **Entry Point** | `src/main.tsx` |
| **Dev Port** | 5173 |

### Responsibilities
- Render Kanban board (primary view) with drag-and-drop
- Render list/table view (secondary view) with pagination
- Provide create/edit modal with structured steps input
- Provide delete confirmation dialog
- Manage all server state via TanStack Query
- Communicate with backend via direct CORS (no proxy)

### Files to Create
```
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
  .env.example
  index.html
  package.json
  tsconfig.json
  vite.config.ts
```

### Build & Run
```bash
cd frontend
cp .env.example .env
npm install
npm run dev        # Vite dev server, port 5173
npm run build      # Vite → dist/
npm run preview    # Preview production build
```

---

## Infrastructure Unit: Docker / Database

| Field | Value |
|---|---|
| **Unit Name** | infrastructure |
| **Type** | Supporting infrastructure (not a deployable app unit) |
| **File** | `docker-compose.yml` (workspace root) |
| **Service** | PostgreSQL 16 |
| **Port Mapping** | 5433 → 5432 |

### Files to Create
```
docker-compose.yml   (workspace root)
```

### Start / Stop
```bash
docker compose up -d    # start
docker compose down     # stop
```
