# Frontend Components — Functional Design
## Bug Squelcher — Tech Debt Bounty Board (Intent 1)

---

## Component Hierarchy

```
App.tsx
  ├── FluentProvider (theme: webLightTheme)
  └── QueryClientProvider (client: queryClient)
        ├── [Header / toolbar area]
        │     ├── "New Bug" Button  data-testid="new-bug-button"
        │     └── View Toggle       data-testid="view-toggle-kanban" / "view-toggle-list"
        ├── KanbanBoard             (view === 'kanban')
        │     └── DragDropContext
        │           └── KanbanColumn × 3
        │                 └── Droppable
        │                       └── BugCard × n
        │                             └── Draggable
        ├── ListView                (view === 'list')
        │     └── DataGrid + pagination
        └── BugFormModal            (open={modalOpen})
              └── Dialog
                    └── form
                          ├── FormField: title
                          ├── FormField: steps (dynamic rows)
                          ├── FormField: severity (Select)
                          └── FormField: status (Select, edit mode only)
```

---

## App.tsx

### State
```typescript
const [view, setView]               = useState<'kanban' | 'list'>('kanban')
const [modalOpen, setModalOpen]     = useState(false)
const [selectedBug, setSelectedBug] = useState<Bug | null>(null)
const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
const [confirmOpen, setConfirmOpen] = useState(false)

const { data: bugs = [], isLoading, isError } = useBugs()
const deleteMutation = useDeleteBug()
```

### Handlers
```typescript
const handleNewBug   = () => { setSelectedBug(null); setModalOpen(true) }
const handleEdit     = (bug: Bug) => { setSelectedBug(bug); setModalOpen(true) }
const handleDelete   = (id: string) => { setDeleteTarget(id); setConfirmOpen(true) }
const handleConfirmDelete = () => {
  if (deleteTarget) deleteMutation.mutate(deleteTarget, { onSettled: () => setConfirmOpen(false) })
}
```

### Renders
- Loading: `<Spinner />` centered
- Error: `<MessageBar intent="error">Failed to load bugs</MessageBar>`
- Delete confirm: Fluent UI `<Dialog>` with title "Delete Bug?" and bug title in body

---

## KanbanBoard

### Props
```typescript
interface KanbanBoardProps {
  bugs: Bug[]
  onEdit: (bug: Bug) => void
  onDelete: (id: string) => void
}
```

### Logic
- Wraps children in `<DragDropContext onDragEnd={handleDragEnd}>`
- `handleDragEnd(result)`:
  - If `!result.destination` → return
  - If `result.destination.droppableId === result.source.droppableId` → return
  - Call `updateMutation.mutate({ id: result.draggableId, data: { status: result.destination.droppableId as BugStatus } })`
- Renders 3 `<KanbanColumn>` components, one per `STATUS_COLUMNS` entry

---

## KanbanColumn

### Props
```typescript
interface KanbanColumnProps {
  status: BugStatus
  bugs: Bug[]
  onEdit: (bug: Bug) => void
  onDelete: (id: string) => void
}
```

### Renders
- Column header: status label
- Bug count badge
- `<Droppable droppableId={status}>`
- List of `<BugCard>` for bugs filtered to this status

---

## BugCard

### Props
```typescript
interface BugCardProps {
  bug: Bug
  index: number          // required by @hello-pangea/dnd Draggable
  onEdit: (bug: Bug) => void
  onDelete: (id: string) => void
}
```

### Renders
- `<Draggable draggableId={bug.id} index={index}>`
- Fluent UI `<Card>` containing:
  - Bug title
  - Severity badge (inline style color — approved exception)
  - Edit button `data-testid={`edit-bug-${bug.id}`}`
  - Delete button `data-testid={`delete-bug-${bug.id}`}`

---

## BugFormModal

### Props
```typescript
interface BugFormModalProps {
  open: boolean
  bug?: Bug
  onDismiss: () => void
}
```

### State
```typescript
const [steps, setSteps] = useState<string[]>(
  bug ? bug.stepsToReproduce.split('\n').filter(Boolean) : ['']
)
```

### Form Setup
```typescript
// Create mode
const { control, handleSubmit, formState } = useCreateBugForm(onDismiss)

// Edit mode
const updateMutation = useUpdateBug()
const { control, handleSubmit, formState } = useForm<UpdateBugFormValues>({
  resolver: zodResolver(updateBugSchema),
  defaultValues: { title: bug.title, severity: bug.severity, status: bug.status }
})
```

### Renders (Fluent UI Dialog)
- Dialog title: "Report Bug" (create) or "Edit Bug" (edit)
- `<FormField label="Title">` → `<Input data-testid="bug-form-title" />`
- Steps section:
  - Numbered step inputs `data-testid={`bug-form-step-${i}`}`
  - "Add Step" button `data-testid="bug-form-add-step"`
  - Remove button per step `data-testid={`bug-form-remove-step-${i}`}`
- `<FormField label="Severity">` → `<Select data-testid="bug-form-severity">`
- `<FormField label="Status">` (edit mode only) → `<Select data-testid="bug-form-status">`
- Submit button `data-testid="bug-form-submit"`
- Cancel button `data-testid="bug-form-cancel"`

---

## ListView

### Props
```typescript
interface ListViewProps {
  bugs: Bug[]
  onEdit: (bug: Bug) => void
  onDelete: (id: string) => void
}
```

### State
```typescript
const [currentPage, setCurrentPage] = useState(1)
const PAGE_SIZE = 10
const paginatedBugs = bugs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
const totalPages = Math.ceil(bugs.length / PAGE_SIZE)
```

### Renders
- Fluent UI `<DataGrid>` or `<Table>` with columns: Title, Severity, Status, Created At, Actions
- Actions column: Edit button `data-testid={`list-edit-bug-${bug.id}`}`, Delete button `data-testid={`list-delete-bug-${bug.id}`}`
- Pagination controls below table: prev/next buttons, page indicator

---

## FormField (shared)

### Props
```typescript
interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
}
```

### Renders
- Fluent UI `<Field label={label} required={required} validationMessage={error} validationState={error ? 'error' : 'none'}`
- Wraps `children` (the actual input)
