# Business Rules — Backend
## Bug Squelcher — Tech Debt Bounty Board (Intent 1)

---

## Input Validation Rules (Zod — Controller Boundary)

### Create Bug (POST /api/bugs)
```
title            required, string, min length 1 after trim
stepsToReproduce required, string, min length 1 after trim
severity         required, enum: 'P0' | 'P1' | 'P2' | 'P3'
```
- `status` is NOT accepted on create — always defaults to `'Open'`
- `id`, `createdAt`, `updatedAt` are NOT accepted — system-generated

### Update Bug (PUT /api/bugs/:id)
```
title            optional, string, min length 1 after trim (if provided)
stepsToReproduce optional, string, min length 1 after trim (if provided)
severity         optional, enum: 'P0' | 'P1' | 'P2' | 'P3' (if provided)
status           optional, enum: 'Open' | 'In Progress' | 'Works on My Machine' (if provided)
```
- At least one field must be present (partial update — empty body is a 400)
- `id`, `createdAt`, `updatedAt` are NOT accepted

### Path Params
```
id   required, string (UUID format validated by Prisma — not pre-validated by Zod)
```

---

## Business Logic Rules (Service Layer)

### BR-01: Existence Check
- `getBugById`, `updateBug`, `deleteBug` must verify the bug exists before proceeding
- If not found: throw a structured error that the controller maps to HTTP 404
- Error shape: `{ code: 'NOT_FOUND', message: 'Bug not found' }`

### BR-02: String Trimming
- `title` and `stepsToReproduce` are trimmed of leading/trailing whitespace before persistence
- Applied on both create and update

### BR-03: Status Default on Create
- `status` is always set to `'Open'` (Prisma: `'Open'`) on create
- The controller never passes `status` to the service's `createBug` method

### BR-04: Enum Mapping
- Service owns all mapping between API strings and Prisma storage strings
- Mapping objects are defined as constants in `bug.service.ts`
- Never import Prisma enum types from `@prisma/client`

### BR-05: Ordering
- `listBugs` always returns bugs ordered by `createdAt` descending (newest first)

### BR-06: Immutable Fields
- `id` and `createdAt` are never updated after creation
- Prisma `@updatedAt` handles `updatedAt` automatically — service never sets it manually

---

## HTTP Response Rules (Controller Layer)

| Operation | Success Code | Error Codes |
|---|---|---|
| GET /api/bugs | 200 + Bug[] | 500 |
| POST /api/bugs | 201 + Bug | 400 (validation), 500 |
| GET /api/bugs/:id | 200 + Bug | 404, 500 |
| PUT /api/bugs/:id | 200 + Bug | 400 (validation), 404, 500 |
| DELETE /api/bugs/:id | 204 (no body) | 404, 500 |

### Error Response Shape
```json
// 400 Validation error
{ "error": { "fieldErrors": { "title": ["Required"] } } }

// 404 Not found
{ "error": "Bug not found" }

// 500 Internal
{ "error": "Internal server error" }
```

---

## CORS Rules
- Allowed origin: `http://localhost:5173` only
- Methods: GET, POST, PUT, DELETE, OPTIONS
- Headers: Content-Type
