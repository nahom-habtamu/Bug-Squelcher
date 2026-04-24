# Backend Code Generation Plan
## Bug Squelcher — Tech Debt Bounty Board (Intent 1)

**Unit**: backend  
**Location**: `backend/` (workspace root)  
**Module system**: CommonJS (`"module": "commonjs"`)

---

## Context & Dependencies
- Depends on: Docker/PostgreSQL running (infrastructure unit)
- Exposes: REST API at http://localhost:3001
- CORS: allows http://localhost:5173
- No ESM-only packages — verified before each dependency

---

## Step 1: Project Scaffold — package.json, tsconfig.json, .env.example
- [x] Create `backend/package.json` with scripts: `dev`, `build`, `start`, `db:migrate`, `db:generate`
- [x] Dependencies: `express`, `cors`, `@prisma/client`, `zod`, `swagger-ui-express`, `dotenv`
- [x] DevDependencies: `typescript`, `ts-node-dev`, `prisma`, `@types/express`, `@types/cors`, `@types/swagger-ui-express`, `@types/node`
- [x] Create `backend/tsconfig.json` — CommonJS, strict, outDir: dist, rootDir: src
- [x] Create `backend/.env.example` with `DATABASE_URL` and `PORT=3001`

## Step 2: Docker Compose (workspace root)
- [x] Create `docker-compose.yml` at workspace root
- [x] PostgreSQL 16, port 5433:5432, db: bug_squelcher, user/pass: postgres/postgres

## Step 3: Prisma Schema
- [x] Create `backend/prisma/schema.prisma`
- [x] datasource: postgresql, env("DATABASE_URL")
- [x] generator: prisma-client-js
- [x] Bug model with all fields per domain-entities.md
- [x] Severity enum: P0, P1, P2, P3
- [x] Status enum: Open, InProgress, WorksOnMyMachine

## Step 4: PrismaClient Singleton
- [x] Create `backend/src/lib/prisma.ts`
- [x] Export singleton PrismaClient (hot-reload safe via global)

## Step 5: Bug Types
- [x] Create `backend/src/bugs/bug.types.ts`
- [x] Export: `Severity`, `BugStatus`, `Bug`, `CreateBugInput`, `UpdateBugInput`
- [x] Export: `STATUS_TO_PRISMA`, `PRISMA_TO_STATUS` mapping objects

## Step 6: Bug Service
- [x] Create `backend/src/bugs/bug.service.ts`
- [x] Implement: `listBugs`, `getBugById`, `createBug`, `updateBug`, `deleteBug`
- [x] `AppError` class for NOT_FOUND errors
- [x] `mapBug` helper for Prisma→API shape conversion
- [x] All string trimming, status mapping, existence checks per business-logic-model.md

## Step 7: Bug Controller
- [x] Create `backend/src/bugs/bug.controller.ts`
- [x] Zod schemas: `createBugSchema`, `updateBugSchema`
- [x] All 5 handler methods with Zod validation + service delegation
- [x] Correct HTTP status codes per business-rules.md

## Step 8: Bug Routes
- [x] Create `backend/src/bugs/bug.routes.ts`
- [x] Express Router binding all 5 routes to controller methods

## Step 9: OpenAPI Spec
- [x] Create `backend/src/openapi.ts`
- [x] Full OpenAPI 3.0 spec object covering all 7 endpoints
- [x] Bug schema, Severity enum, Status enum defined in components/schemas

## Step 10: Error Middleware
- [x] Create `backend/src/middleware/error.middleware.ts`
- [x] 4-argument Express error handler → 500 JSON response

## Step 11: Express App
- [x] Create `backend/src/app.ts`
- [x] JSON body parser, CORS (origin: http://localhost:5173)
- [x] Mount bug router at `/api/bugs`
- [x] Mount swagger-ui-express at `/docs`, serve spec at `/openapi.json`
- [x] Register error middleware last

## Step 12: Entry Point
- [x] Create `backend/src/index.ts`
- [x] Load dotenv, import app, call `app.listen(PORT)`

---

## Story Coverage
| Work Item | Requirement |
|---|---|
| Steps 1–2 | Project scaffold + infrastructure |
| Step 3–4 | FR-01 through FR-06 (data model) |
| Steps 5–8 | FR-01 Create, FR-02/03 List, FR-04 Update, FR-05 Delete, FR-06 Drag status |
| Step 9 | API documentation |
| Steps 10–12 | App bootstrap + error handling |

## Compatibility Checks
- `express` — CJS ✅
- `cors` — CJS ✅
- `swagger-ui-express` — CJS ✅ (explicitly chosen over ESM-only @scalar)
- `zod` — CJS ✅
- `@prisma/client` — CJS ✅
- `dotenv` — CJS ✅
- NO `node-fetch` v3+, NO `chalk` v5+, NO `@scalar/express-api-reference`
