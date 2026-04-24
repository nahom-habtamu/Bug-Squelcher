---
inclusion: always
---
# Backend Development Standards

You are an expert Node.js and TypeScript backend architect. When generating or modifying backend code in this repository, you must strictly adhere to the following constraints:

## 1. Core Technology Stack
- **Runtime**: Node.js 20+
- **Framework**: Express.js with TypeScript (`"module": "commonjs"` — NOT ESM)
- **ORM**: Prisma (called directly from the service layer — no repository wrapper)
- **Validation**: Zod for ALL runtime request validation (body, query, params)
- **API Docs**: `swagger-ui-express` for interactive API reference at `/docs`

## 2. Architectural Pattern
- **Vertical Slicing**: Organize all backend code by feature/domain (e.g., `src/bugs/`), NOT by technical layer. Each slice owns its routes, controller, service, and types.
- **Direct ORM Access**: ALWAYS call Prisma directly from the service layer. Prisma IS the repository — never wrap it.
- **No Repository Classes**: NEVER create `BugRepository` or similar wrapper classes.

## 3. Validation Rules
- ALWAYS use Zod schemas at the controller boundary to validate `req.body`, `req.params`, and `req.query` before passing data to the service.
- The service layer enforces business rules (e.g., existence checks, status transitions). Zod handles shape/type validation.
- Example pattern:
  ```typescript
  const schema = z.object({ title: z.string().min(1), severity: z.enum(['P0','P1','P2','P3']) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  ```

## 4. Prisma Enum Compatibility
- NEVER import Prisma-generated enum types (e.g., `BugStatus`, `Severity`) directly from `@prisma/client` in application code.
- These types are only available after `prisma migrate` runs against a live database.
- ALWAYS use plain string literals and a local mapping object instead:
  ```typescript
  const STATUS_TO_PRISMA: Record<BugStatus, string> = {
    'Open': 'Open',
    'In Progress': 'InProgress',
    'Works on My Machine': 'WorksOnMyMachine',
  };
  ```

## 5. Module System
- The backend uses CommonJS (`"module": "commonjs"` in tsconfig).
- NEVER install ESM-only packages (packages with `"type": "module"` and no CJS build).
- Before adding any new package, verify it ships a CommonJS build.
- Known ESM-only packages to avoid: `@scalar/express-api-reference`, `node-fetch` v3+, `chalk` v5+.

## 6. Docker & Database
- PostgreSQL runs in Docker via `docker-compose.yml` at the workspace root.
- Default connection: `postgresql://postgres:postgres@localhost:5433/bug_squelcher` (port 5433 to avoid conflicts with macOS system processes on 5432).
- NEVER assume a local PostgreSQL installation — always use Docker.
