# Business Rules — Frontend
## Bug Squelcher — Tech Debt Bounty Board (Intent 1)

---

## Form Validation Rules

### Create Bug Form
| Field | Rule |
|---|---|
| title | Required, min 1 char after trim |
| stepsToReproduce | At least 1 step with non-empty text |
| severity | Required, must be one of P0/P1/P2/P3 |
| status | Not shown on create — always Open |

### Edit Bug Form
| Field | Rule |
|---|---|
| title | Required, min 1 char after trim |
| stepsToReproduce | At least 1 step with non-empty text |
| severity | Required, must be one of P0/P1/P2/P3 |
| status | Required, must be one of the three valid statuses |

---

## UI Interaction Rules

### BR-F01: View Toggle
- Default view on load: Kanban board
- Toggle persists only for the session (no localStorage in Intent 1)
- Both views share the same `useBugs` query — no separate fetch

### BR-F02: Create vs Edit Modal
- Modal is in **create mode** when `bug` prop is `undefined`
- Modal is in **edit mode** when `bug` prop is a `Bug` object
- Edit mode pre-populates all fields from the bug
- Edit mode shows the `status` field; create mode does not
- On successful submit: close modal, invalidate `bugKeys.all`

### BR-F03: Delete Confirmation
- Delete action (from BugCard or ListView row) opens a Fluent UI `Dialog` confirmation
- Confirmation dialog shows the bug title
- On confirm: call `useDeleteBug`, close dialog, invalidate `bugKeys.all`
- On cancel: close dialog, no action

### BR-F04: Drag-and-Drop
- Only available on the Kanban board view
- Dragging a BugCard and dropping onto a different column calls `useUpdateBug` with `{ status: targetColumnStatus }`
- Dropping onto the same column is a no-op
- While mutation is in-flight: card is not optimistically moved (simple invalidate-on-success)

### BR-F05: Structured Steps Input
- BugFormModal maintains a `string[]` state for steps
- "Add step" button appends an empty string to the array
- Each step renders as a text input with a remove button
- Minimum 1 step required (validated by Zod after join)
- Steps are joined with `\n` before being passed to the API

### BR-F06: Pagination (List View)
- ListView uses Fluent UI DataGrid with client-side pagination
- Page size: 10 rows per page
- Pagination controls rendered below the table
- All bugs are fetched in a single `GET /api/bugs` call; pagination is client-side only

### BR-F07: Severity Display
- Severity is always displayed as a label (Critical / High / Medium / Low)
- P0–P3 codes are never shown in the UI
- Severity badge uses inline `style` for background color (architecture-approved exception)

### BR-F08: Error States
- If `useBugs` query fails: show a Fluent UI `MessageBar` with error message
- If a mutation fails: show error inline in the modal or as a brief toast
- Loading state: show Fluent UI `Spinner` while `useBugs` is loading

---

## Cache Invalidation Rules

| Mutation | Invalidates |
|---|---|
| createBug success | `bugKeys.all` |
| updateBug success | `bugKeys.all` |
| deleteBug success | `bugKeys.all` |

Stale time: default (0) — always refetch on window focus.
