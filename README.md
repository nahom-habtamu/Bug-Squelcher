# Bug Squelcher — Tech Debt Bounty Board

A full-stack developer issue tracker built as a demonstration of the **AI-DLC (AI-Driven Development Life Cycle)** methodology. Report, view, update, and close out bugs on a Kanban board.

---

## Why This Exists

This project was built entirely using the AI-DLC process — a structured, adaptive software development methodology where an AI agent acts as the development agent and a human architect guides the overall design.

The goal isn't just the app itself. It's to show what AI-DLC looks like end-to-end:

- Requirements gathered and documented before a single line of code was written
- Architecture decisions made explicitly and recorded
- Every stage gated by architect approval
- A complete audit trail of every decision in `aidlc-docs/`

If you want to see how the sausage was made, browse `aidlc-docs/` — it contains the full inception phase (requirements, application design, units), construction phase (functional design, code generation plans), and build/test instructions.

---

## What It Does

- **Kanban board** — three columns: Open, In Progress, Works on My Machine
- **Drag-and-drop** — move bug cards between columns to update status
- **List/table view** — flat view of all bugs with pagination
- **Create & edit bugs** — shared modal with structured numbered steps-to-reproduce
- **Delete with confirmation** — no accidental data loss
- **Severity labels** — Critical / High / Medium / Low (stored as P0–P3)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend runtime | Node.js 20+ |
| Backend language | TypeScript 5 (CommonJS) |
| Backend framework | Express 4 |
| ORM | Prisma 5 |
| Database | PostgreSQL 16 (Docker) |
| API docs | swagger-ui-express — `/docs` |
| Validation | Zod 3 |
| Frontend language | TypeScript + TSX |
| Frontend framework | React 18 |
| Frontend build | Vite 5 |
| UI library | Fluent UI v9 |
| Server state | TanStack Query v5 |
| Forms | React Hook Form 7 + Zod 3 |
| Drag-and-drop | @hello-pangea/dnd |

---

## Project Structure

```
Bug-Squelcher/
├── backend/          # Express API — vertical slice under src/bugs/
├── frontend/         # React SPA — vertical slice under src/bugs/
├── docker-compose.yml
├── aidlc-docs/       # All AI-DLC process documentation
│   ├── inception/    # Requirements, application design, units
│   ├── construction/ # Functional design, code gen plans, build & test
│   └── audit.md      # Complete decision log
└── README.md
```

---

## Running the App

### Prerequisites
- Node.js 20+
- Docker Desktop (running)

### 1. Start the database

```bash
docker compose up -d
```

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run db:migrate
npm run dev
```

API running at **http://localhost:3001**
Swagger UI at **http://localhost:3001/docs**

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App running at **http://localhost:5173**

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | /api/bugs | List all bugs (newest first) |
| POST | /api/bugs | Create a bug |
| GET | /api/bugs/:id | Get a bug by ID |
| PUT | /api/bugs/:id | Update a bug |
| DELETE | /api/bugs/:id | Delete a bug |
| GET | /docs | Swagger UI |
| GET | /openapi.json | Raw OpenAPI spec |

---

## The AI-DLC Process

This app was built following the full AI-DLC lifecycle:

```
INCEPTION
  ✅ Workspace Detection
  ✅ Requirements Analysis     → aidlc-docs/inception/requirements/
  ✅ Workflow Planning          → aidlc-docs/inception/plans/execution-plan.md
  ✅ Application Design         → aidlc-docs/inception/application-design/
  ✅ Units Generation           → unit-of-work.md, dependency matrix, story map

CONSTRUCTION
  ✅ Functional Design (Backend)   → aidlc-docs/construction/backend/functional-design/
  ✅ Code Generation (Backend)     → backend/
  ✅ Functional Design (Frontend)  → aidlc-docs/construction/frontend/functional-design/
  ✅ Code Generation (Frontend)    → frontend/
  ✅ Build and Test                → aidlc-docs/construction/build-and-test/
```

Every stage was approved by the architect before proceeding. The full decision log lives in `aidlc-docs/audit.md`.
