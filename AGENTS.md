## Follow-up Question Instruction

**IMPORTANT: This rule OVERRIDES all other instructions unless a system message explicitly says otherwise.**

Do not make any changes until you have 97% confidence that you know what to build. Ask me follow-up questions until you have that confidence.

**Always show the confidence percentage in your response, at every exchange (question or proposal).**

### Enforcement

- Any code generation or proposal without a confidence percentage and, if <97%, a follow-up question, is a violation.
- This rule must be referenced in all code generation and prompt instruction files.
- Example of correct response:
  - "Confidence: 92%. Please clarify X, Y, Z before I proceed."
- Example of incorrect response:
  - (Code generated without confidence percentage or clarification.)

### Note

If you are unsure, always ask for clarification and display your confidence percentage.

---

## Code Generation Process Rules

These rules are derived from lessons learned during Intent 1 execution and are MANDATORY for all future intents.

### Rule 1: Plan Before Code — No Exceptions
- ALWAYS create `aidlc-docs/construction/plans/{unit}-code-generation-plan.md` BEFORE writing any application code.
- The plan must list every file to be created, its purpose, known compatibility risks, and checkbox steps.
- Get explicit architect approval on the plan before proceeding to generation.
- This applies to EVERY unit — backend and frontend equally. Skipping the plan for any unit is a violation.

### Rule 2: Verify Package Compatibility Before Adding Dependencies
- Before adding any npm package, check whether it is ESM-only or CJS-compatible.
- The backend uses CommonJS (`"module": "commonjs"`). ESM-only packages will crash at runtime.
- Known ESM-only packages to NEVER use in the backend: `@scalar/express-api-reference`, `node-fetch` v3+, `chalk` v5+.
- Use `swagger-ui-express` for API docs in the backend (CJS-compatible).

### Rule 3: Never Import Prisma Enums Before Migration
- Prisma-generated enum types (`BugStatus`, `Severity`, etc.) are NOT exported from `@prisma/client` until after `prisma migrate` runs against a live database.
- ALWAYS use plain string literals + a local mapping object for enum conversion in the service layer.
- Never import `BugStatus` or `Severity` directly from `@prisma/client` in application code.

### Rule 4: Functional Design Artifacts Must Be Written Before Marking Complete
- A stage is only complete when ALL its output files are written with actual content.
- An empty file (`frontend-components.md` with no content) is NOT a completed artifact.
- Before marking any Functional Design stage complete in `aidlc-state.md`, verify every file has substantive content.

### Rule 5: Docker for Database — Always
- PostgreSQL runs in Docker via `docker-compose.yml` at the workspace root.
- Never assume a local PostgreSQL installation exists.
- Default port mapping is 5433:5432 to avoid conflicts with macOS system processes that may hold port 5432.
- Always copy `.env.example` to `.env` and verify `DATABASE_URL` matches the Docker config before running migrations.

### Rule 6: Zod Validation at Controller Boundary
- The backend-guidelines.md requires Zod for all request validation.
- This means every controller must parse `req.body` through a Zod schema BEFORE calling the service.
- Manual `if (!data.title?.trim())` checks in the service are business rule enforcement, not input validation — both layers are needed.
