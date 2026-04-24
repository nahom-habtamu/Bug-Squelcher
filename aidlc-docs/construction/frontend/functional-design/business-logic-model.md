# Business Logic Model — Frontend
## Bug Squelcher — Tech Debt Bounty Board (Intent 1)

---

## Data Flow: Fetch & Display

```
App mounts
  → useBugs() fires GET /api/bugs
  → TanStack Query caches Bug[]
  → App passes Bug[] to KanbanBoard and ListView
  → KanbanBoard filters by status per column
  → ListView renders all bugs with pagination
```

---

## Data Flow: Create Bug

```
User clicks "New Bug" button (App.tsx)
  → setModalOpen(true), setSelectedBug(null)
  → BugFormModal renders in create mode (bug prop = undefined)
  → User fills title, steps, severity
  → handleSubmit fires
  → useCreateBugForm.onSubmit:
      1. Serialize steps array → stepsToReproduce string
      2. Call POST /api/bugs with { title, stepsToReproduce, severity }
      3. On success: invalidate bugKeys.all, call onDismiss()
      4. On error: display error message in modal
```

---

## Data Flow: Edit Bug

```
User clicks Edit on BugCard or ListView row
  → App.tsx: setSelectedBug(bug), setModalOpen(true)
  → BugFormModal renders in edit mode (bug prop = Bug)
  → Form pre-populated: steps deserialized from stepsToReproduce string
  → User modifies fields
  → handleSubmit fires
  → useUpdateBug.mutate({ id: bug.id, data: changedFields })
      1. Serialize steps array → stepsToReproduce string
      2. Call PUT /api/bugs/:id with changed fields
      3. On success: invalidate bugKeys.all, call onDismiss()
      4. On error: display error message in modal
```

---

## Data Flow: Delete Bug

```
User clicks Delete on BugCard or ListView row
  → App.tsx: setDeleteTarget(bug.id), setConfirmOpen(true)
  → Confirmation Dialog renders with bug title
  → User clicks "Delete" in dialog
  → useDeleteBug.mutate(bug.id)
      1. Call DELETE /api/bugs/:id
      2. On success: invalidate bugKeys.all, close dialog
      3. On error: show error, close dialog
  → User clicks "Cancel" → close dialog, no action
```

---

## Data Flow: Drag-and-Drop Status Change

```
User drags BugCard from column A to column B
  → KanbanBoard onDrop handler fires with { bugId, targetStatus }
  → If targetStatus === bug.status → no-op
  → Else: useUpdateBug.mutate({ id: bugId, data: { status: targetStatus } })
      1. Call PUT /api/bugs/:id with { status: targetStatus }
      2. On success: invalidate bugKeys.all (card moves to new column)
      3. On error: show toast error (card stays in original column)
```

---

## TanStack Query Configuration

```typescript
// frontend/src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      retry: 1,
    },
  },
})
```

---

## Hook Signatures

```typescript
// useBugs
function useBugs(): UseQueryResult<Bug[], Error>

// useCreateBugForm
function useCreateBugForm(onSuccess: () => void): {
  control: Control<CreateBugFormValues>
  handleSubmit: UseFormHandleSubmit<CreateBugFormValues>
  formState: { errors: FieldErrors; isSubmitting: boolean }
  register: UseFormRegister<CreateBugFormValues>
}

// useUpdateBug
function useUpdateBug(): UseMutationResult<
  Bug,
  Error,
  { id: string; data: UpdateBugDto }
>

// useDeleteBug
function useDeleteBug(): UseMutationResult<void, Error, string>
```

---

## Drag-and-Drop Library

Use `@hello-pangea/dnd` (CJS-compatible fork of react-beautiful-dnd):
- `DragDropContext` wraps `KanbanBoard`
- `Droppable` wraps each `KanbanColumn` (droppableId = status string)
- `Draggable` wraps each `BugCard` (draggableId = bug.id)
- `onDragEnd` callback in `KanbanBoard` triggers `useUpdateBug`
