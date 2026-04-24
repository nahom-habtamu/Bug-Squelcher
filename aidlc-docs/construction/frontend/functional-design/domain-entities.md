# Domain Entities — Frontend
## Bug Squelcher — Tech Debt Bounty Board (Intent 1)

---

## Bug Type

```typescript
// frontend/src/bugs/bug.types.ts

export type Severity  = 'P0' | 'P1' | 'P2' | 'P3'
export type BugStatus = 'Open' | 'In Progress' | 'Works on My Machine'

export interface Bug {
  id: string
  title: string
  stepsToReproduce: string   // newline-delimited: "step1\nstep2\nstep3"
  severity: Severity
  status: BugStatus
  createdAt: string          // ISO 8601
  updatedAt: string          // ISO 8601
}

export interface CreateBugDto {
  title: string
  stepsToReproduce: string
  severity: Severity
}

export interface UpdateBugDto {
  title?: string
  stepsToReproduce?: string
  severity?: Severity
  status?: BugStatus
}
```

---

## Display Mappings (frontend/src/bugs/bug.types.ts or constants file)

```typescript
export const SEVERITY_LABEL: Record<Severity, string> = {
  P0: 'Critical',
  P1: 'High',
  P2: 'Medium',
  P3: 'Low',
}

// Badge colors for severity (inline style — architecture-approved exception)
export const SEVERITY_COLOR: Record<Severity, string> = {
  P0: '#C50F1F',   // red  (tokens.colorPaletteRedBackground3 equivalent)
  P1: '#CA5010',   // orange
  P2: '#986F0B',   // yellow/gold
  P3: '#107C10',   // green
}

export const STATUS_COLUMNS: BugStatus[] = [
  'Open',
  'In Progress',
  'Works on My Machine',
]
```

---

## Zod Schemas (frontend/src/bugs/schemas/bug.schemas.ts)

```typescript
import { z } from 'zod'

export const severitySchema = z.enum(['P0', 'P1', 'P2', 'P3'])
export const statusSchema   = z.enum(['Open', 'In Progress', 'Works on My Machine'])

export const createBugSchema = z.object({
  title:            z.string().trim().min(1, 'Title is required'),
  stepsToReproduce: z.string().trim().min(1, 'At least one step is required'),
  severity:         severitySchema,
})

export const updateBugSchema = z.object({
  title:            z.string().trim().min(1).optional(),
  stepsToReproduce: z.string().trim().min(1).optional(),
  severity:         severitySchema.optional(),
  status:           statusSchema.optional(),
})

export type CreateBugFormValues = z.infer<typeof createBugSchema>
export type UpdateBugFormValues = z.infer<typeof updateBugSchema>
```

---

## Steps-to-Reproduce Serialization

The `stepsToReproduce` field is stored as a newline-delimited string.
The `BugFormModal` manages an array of step strings in local state and serializes/deserializes:

```typescript
// Deserialize for form (string → string[])
const steps = bug.stepsToReproduce.split('\n').filter(Boolean)

// Serialize for API (string[] → string)
const stepsToReproduce = steps.join('\n')
```
