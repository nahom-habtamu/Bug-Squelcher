---
inclusion: always
---
# Global Project Architecture — Bug Squelcher

## 1. Repository Structure

```
Bug-Squelcher/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── src/
│   │   ├── bugs/
│   │   │   ├── bug.types.ts
│   │   │   ├── bug.service.ts
│   │   │   ├── bug.controller.ts
│   │   │   └── bug.routes.ts
│   │   ├── lib/prisma.ts
│   │   ├── middleware/error.middleware.ts
│   │   ├── openapi.ts
│   │   ├── app.ts
│   │   └── index.ts
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── bugs/
│   │   │   ├── api/bugs.api.ts
│   │   │   ├── hooks/
│   │   │   │   ├── bugKeys.ts
│   │   │   │   ├── useBugs.ts
│   │   │   │   ├── useUpdateBug.ts
│   │   │   │   ├── useDeleteBug.ts
│   │   │   │   └── useCreateBugForm.ts
│   │   │   ├── schemas/bug.schemas.ts
│   │   │   ├── components/
│   │   │   │   ├── KanbanBoard.tsx
│   │   │   │   ├── KanbanColumn.tsx
│   │   │   │   ├── BugCard.tsx
│   │   │   │   └── BugFormModal.tsx
│   │   │   └── bug.types.ts
│   │   ├── shared/components/FormField.tsx
│   │   ├── lib/queryClient.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── README.md
├── docker-compose.yml
├── AGENTS.md
└── aidlc-docs/
```

## 2. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Backend runtime | Node.js 20+ | |
| Backend language | TypeScript 5.x | CommonJS — NOT ESM |
| Backend framework | Express.js 4.x | |
| ORM | Prisma 5.x | Direct in service, no repository wrapper |
| Database | PostgreSQL 16 | Docker only |
| API docs | swagger-ui-express 5.x | Mounted at /docs |
| Frontend language | TypeScript + TSX 5.x | |
| Frontend framework | React 18.x | |
| Frontend build | Vite 5.x | |
| UI library | Fluent UI v9 | makeStyles + tokens only |
| Server state | TanStack Query v5 | All API calls go through hooks |
| Form validation | React Hook Form 7.x + Zod 3.x | |

## 3. API Contract

| Method | Endpoint | Description | Success |
|---|---|---|---|
| GET | /api/bugs | List all bugs (newest first) | 200 Bug[] |
| POST | /api/bugs | Create bug | 201 Bug |
| GET | /api/bugs/:id | Get single bug | 200 Bug |
| PUT | /api/bugs/:id | Update bug (partial) | 200 Bug |
| DELETE | /api/bugs/:id | Delete bug | 204 |
| GET | /docs | Swagger UI | 200 HTML |
| GET | /openapi.json | Raw OpenAPI spec | 200 JSON |

## 4. Data Model

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

Prisma stores `InProgress` and `WorksOnMyMachine` (no spaces).
The service layer maps to/from the API display strings using a local string mapping object.
Never import Prisma enum types directly from `@prisma/client` — they are unavailable before migration.

## 5. Infrastructure

- Database: PostgreSQL 16 in Docker
- Host port 5433 maps to container port 5432 (avoids macOS conflicts on 5432)
- Start: `docker compose up -d` from workspace root
- Stop: `docker compose down`
- Migrations: `cd backend && npm run db:migrate`
- Connection string: `postgresql://postgres:postgres@localhost:5433/bug_squelcher`

## 6. Communication

- Frontend calls backend via direct CORS — no Vite proxy
- Backend allows origin: `http://localhost:5173`
- Frontend reads `VITE_API_BASE_URL` from `.env` (default: `http://localhost:3001`)

## 7. Dev Startup Sequence

```bash
# 1. Start the database
docker compose up -d

# 2. Backend
cd backend
cp .env.example .env
npm install
npm run db:migrate
npm run dev
# Running at http://localhost:3001
# Swagger UI at http://localhost:3001/docs

# 3. Frontend (separate terminal)
cd frontend
cp .env.example .env
npm install
npm run dev
# Running at http://localhost:5173
```

## 8. Architectural Constraints

- Vertical slices only — no global `controllers/`, `services/`, or `components/` folders
- No repository pattern — Prisma is the data access layer, never wrap it
- Backend is CommonJS — never install ESM-only packages
- Known ESM-only packages to never use in backend: `@scalar/express-api-reference`, `node-fetch` v3+, `chalk` v5+
- No inline styles in frontend — `makeStyles` + `tokens` only (one exception: Badge dynamic severity colors require inline style)
- No magic colors or px values in frontend — tokens and rem only
- Scope containment — each intent adds a new vertical slice, never modifies existing ones
