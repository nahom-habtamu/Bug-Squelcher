# Services Design
## Bug Squelcher — Tech Debt Bounty Board (Intent 1)

---

## Backend Service Layer

### BugService — Orchestration Responsibilities

The service layer sits between the HTTP controller boundary and the Prisma data access layer.

**Orchestration patterns:**

1. **Input normalization** — trim whitespace from string fields before persistence
2. **Enum mapping** — translate API display strings ↔ Prisma storage strings
   - `'In Progress'` ↔ `'InProgress'`
   - `'Works on My Machine'` ↔ `'WorksOnMyMachine'`
   - Severity values are identical in both layers (P0/P1/P2/P3)
3. **Existence enforcement** — call `prisma.bug.findUnique` before update/delete; throw structured error if not found
4. **Default injection** — set `status: 'Open'` on create (controller does not pass status)
5. **Output mapping** — convert Prisma result back to API `Bug` shape before returning

**Mapping objects (defined in service, never imported from @prisma/client):**
```typescript
const STATUS_TO_PRISMA: Record<BugStatus, string> = {
  'Open': 'Open',
  'In Progress': 'InProgress',
  'Works on My Machine': 'WorksOnMyMachine',
}

const PRISMA_TO_STATUS: Record<string, BugStatus> = {
  'Open': 'Open',
  'InProgress': 'In Progress',
  'WorksOnMyMachine': 'Works on My Machine',
}
```

---

## Frontend Service Layer (TanStack Query + API module)

The frontend has no explicit "service" class. The service layer is composed of:

| Layer | Role |
|---|---|
| `bugs.api.ts` | Raw async fetch functions — single responsibility: HTTP calls |
| `hooks/use*.ts` | TanStack Query wrappers — cache management, loading/error state, mutation side effects |
| `queryClient.ts` | Singleton QueryClient — shared cache, stale time, retry config |

**Cache invalidation strategy:**
- On successful `createBug` mutation → invalidate `bugKeys.all`
- On successful `updateBug` mutation → invalidate `bugKeys.all` and `bugKeys.detail(id)`
- On successful `deleteBug` mutation → invalidate `bugKeys.all`

**Optimistic updates:**
- Drag-and-drop status change uses `useUpdateBug` — no optimistic update in Intent 1 (simple invalidate-on-success is sufficient)

---

## Cross-Cutting: Error Handling

**Backend:**
- Controller catches service errors and maps to HTTP status codes
- 404 → `{ error: 'Bug not found' }`
- 400 → Zod flatten output `{ error: { fieldErrors: {...} } }`
- 500 → Global error middleware catches unhandled errors

**Frontend:**
- TanStack Query surfaces `isError` / `error` states to components
- Components display Fluent UI `MessageBar` for error states
- Mutation errors shown inline in modal or as toast notification
