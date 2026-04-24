# Business Logic Model — Backend
## Bug Squelcher — Tech Debt Bounty Board (Intent 1)

---

## Operation Flows

### listBugs
```
1. Call prisma.bug.findMany({ orderBy: { createdAt: 'desc' } })
2. Map each Prisma result: convert status Prisma→API string
3. Return Bug[]
```

### getBugById(id)
```
1. Call prisma.bug.findUnique({ where: { id } })
2. If null → throw NOT_FOUND error
3. Map Prisma result: convert status Prisma→API string
4. Return Bug
```

### createBug(data)
```
1. Trim title and stepsToReproduce
2. Map severity (pass-through — identical values)
3. Set status = 'Open' (Prisma value)
4. Call prisma.bug.create({ data: { title, stepsToReproduce, severity, status: 'Open' } })
5. Map Prisma result: convert status Prisma→API string
6. Return Bug
```

### updateBug(id, data)
```
1. Call prisma.bug.findUnique({ where: { id } })
2. If null → throw NOT_FOUND error
3. Build update payload (only include fields present in data):
   - If title provided: trim it
   - If stepsToReproduce provided: trim it
   - If severity provided: pass through
   - If status provided: map API→Prisma string
4. Call prisma.bug.update({ where: { id }, data: payload })
5. Map Prisma result: convert status Prisma→API string
6. Return Bug
```

### deleteBug(id)
```
1. Call prisma.bug.findUnique({ where: { id } })
2. If null → throw NOT_FOUND error
3. Call prisma.bug.delete({ where: { id } })
4. Return void
```

---

## Mapping Utility (defined in bug.service.ts)

```typescript
type BugStatus = 'Open' | 'In Progress' | 'Works on My Machine'
type Severity   = 'P0' | 'P1' | 'P2' | 'P3'

const STATUS_TO_PRISMA: Record<BugStatus, string> = {
  'Open':                  'Open',
  'In Progress':           'InProgress',
  'Works on My Machine':   'WorksOnMyMachine',
}

const PRISMA_TO_STATUS: Record<string, BugStatus> = {
  'Open':              'Open',
  'InProgress':        'In Progress',
  'WorksOnMyMachine':  'Works on My Machine',
}

// Helper: map a raw Prisma bug record to the API Bug shape
function mapBug(prismaBug: any): Bug {
  return {
    id:               prismaBug.id,
    title:            prismaBug.title,
    stepsToReproduce: prismaBug.stepsToReproduce,
    severity:         prismaBug.severity as Severity,
    status:           PRISMA_TO_STATUS[prismaBug.status],
    createdAt:        prismaBug.createdAt.toISOString(),
    updatedAt:        prismaBug.updatedAt.toISOString(),
  }
}
```

---

## Zod Schemas (defined in bug.controller.ts or a schemas file)

```typescript
import { z } from 'zod'

const severityEnum = z.enum(['P0', 'P1', 'P2', 'P3'])
const statusEnum   = z.enum(['Open', 'In Progress', 'Works on My Machine'])

const createBugSchema = z.object({
  title:            z.string().trim().min(1, 'Title is required'),
  stepsToReproduce: z.string().trim().min(1, 'Steps to reproduce are required'),
  severity:         severityEnum,
})

const updateBugSchema = z.object({
  title:            z.string().trim().min(1).optional(),
  stepsToReproduce: z.string().trim().min(1).optional(),
  severity:         severityEnum.optional(),
  status:           statusEnum.optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' }
)
```

---

## Error Handling Model

```typescript
// Structured error thrown by service, caught by controller
class AppError extends Error {
  constructor(
    public readonly code: 'NOT_FOUND' | 'VALIDATION',
    message: string
  ) {
    super(message)
  }
}

// Controller error mapping
if (err instanceof AppError) {
  if (err.code === 'NOT_FOUND') return res.status(404).json({ error: err.message })
}
// Unhandled errors fall through to global error middleware → 500
```

---

## OpenAPI Spec Structure

The spec object in `openapi.ts` covers:
- `GET /api/bugs` — 200 array of Bug schema
- `POST /api/bugs` — 201 Bug, 400 validation error
- `GET /api/bugs/{id}` — 200 Bug, 404
- `PUT /api/bugs/{id}` — 200 Bug, 400, 404
- `DELETE /api/bugs/{id}` — 204, 404
- Bug schema with all fields, severity enum, status enum
