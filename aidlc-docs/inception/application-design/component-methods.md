# Component Methods
## Bug Squelcher — Tech Debt Bounty Board (Intent 1)

> Note: Detailed business rules and implementation logic are defined in Functional Design (Construction Phase).

---

## Backend: BugService

```typescript
// List all bugs, newest first
listBugs(): Promise<Bug[]>

// Get a single bug by ID — throws 404 if not found
getBugById(id: string): Promise<Bug>

// Create a new bug — status defaults to 'Open'
createBug(data: CreateBugInput): Promise<Bug>

// Partially update a bug — throws 404 if not found
updateBug(id: string, data: UpdateBugInput): Promise<Bug>

// Delete a bug — throws 404 if not found
deleteBug(id: string): Promise<void>
```

**Types** (defined in `bug.types.ts`):
```typescript
type Severity = 'P0' | 'P1' | 'P2' | 'P3'
type BugStatus = 'Open' | 'In Progress' | 'Works on My Machine'

interface Bug {
  id: string
  title: string
  stepsToReproduce: string
  severity: Severity
  status: BugStatus
  createdAt: string   // ISO string
  updatedAt: string   // ISO string
}

interface CreateBugInput {
  title: string
  stepsToReproduce: string
  severity: Severity
}

interface UpdateBugInput {
  title?: string
  stepsToReproduce?: string
  severity?: Severity
  status?: BugStatus
}
```

---

## Backend: BugController

```typescript
// GET /api/bugs
listBugs(req: Request, res: Response): Promise<void>

// GET /api/bugs/:id
getBugById(req: Request, res: Response): Promise<void>

// POST /api/bugs
createBug(req: Request, res: Response): Promise<void>

// PUT /api/bugs/:id
updateBug(req: Request, res: Response): Promise<void>

// DELETE /api/bugs/:id
deleteBug(req: Request, res: Response): Promise<void>
```

---

## Frontend: bugs.api.ts

```typescript
fetchBugs(): Promise<Bug[]>
fetchBug(id: string): Promise<Bug>
createBug(data: CreateBugDto): Promise<Bug>
updateBug(id: string, data: UpdateBugDto): Promise<Bug>
deleteBug(id: string): Promise<void>
```

---

## Frontend: Hooks

```typescript
// useBugs.ts
useBugs(): UseQueryResult<Bug[]>

// useCreateBugForm.ts
useCreateBugForm(onSuccess: () => void): {
  register, control, handleSubmit, errors, isSubmitting
}

// useUpdateBug.ts
useUpdateBug(): UseMutationResult<Bug, Error, { id: string; data: UpdateBugDto }>

// useDeleteBug.ts
useDeleteBug(): UseMutationResult<void, Error, string>

// bugKeys.ts
bugKeys.all: QueryKey
bugKeys.detail(id: string): QueryKey
```

---

## Frontend: Components (key props)

```typescript
// KanbanBoard
interface KanbanBoardProps {
  bugs: Bug[]
}

// KanbanColumn
interface KanbanColumnProps {
  status: BugStatus
  bugs: Bug[]
  onEdit: (bug: Bug) => void
  onDelete: (id: string) => void
}

// BugCard
interface BugCardProps {
  bug: Bug
  onEdit: (bug: Bug) => void
  onDelete: (id: string) => void
}

// BugFormModal
interface BugFormModalProps {
  open: boolean
  bug?: Bug          // undefined = create mode, defined = edit mode
  onDismiss: () => void
}

// ListView
interface ListViewProps {
  bugs: Bug[]
  onEdit: (bug: Bug) => void
  onDelete: (id: string) => void
}
```
