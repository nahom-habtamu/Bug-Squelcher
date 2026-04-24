# Integration Test Instructions
## Bug Squelcher — Tech Debt Bounty Board (Intent 1)

---

## Overview

Integration tests verify the full request path: Frontend → Backend API → PostgreSQL → Response → UI update.

All scenarios below require both the backend and frontend dev servers running, with the Docker database up.

---

## Environment Setup

```bash
# Terminal 1 — database
docker compose up -d

# Terminal 2 — backend
cd backend && npm run dev

# Terminal 3 — frontend
cd frontend && npm run dev
```

Verify connectivity:
```bash
curl http://localhost:3001/api/bugs
# Expected: [] (empty array on fresh DB)
```

---

## Scenario 1: Full Bug Lifecycle (Create → Read → Update → Delete)

**Tests**: FR-01, FR-02, FR-04, FR-05

```
1. Open http://localhost:5173
2. Click "Report Bug"
3. Fill: Title="Login page crashes", Steps="1. Go to /login\n2. Click submit", Severity=Critical
4. Click "Report Bug" (submit)

Expected:
  - Modal closes
  - Bug appears in "Open" column on Kanban board
  - GET /api/bugs returns the new bug with status="Open", severity="P0"

5. Click Edit on the new bug card
6. Change Status to "In Progress"
7. Click "Save Changes"

Expected:
  - Modal closes
  - Bug card moves to "In Progress" column
  - PUT /api/bugs/:id called with { status: "In Progress" }
  - Database stores status as "InProgress"

8. Click Delete on the bug card
9. Confirm deletion in dialog

Expected:
  - Bug removed from board
  - DELETE /api/bugs/:id returns 204
  - GET /api/bugs no longer includes the bug
```

---

## Scenario 2: Drag-and-Drop Status Change

**Tests**: FR-06

```
1. Create a bug (status = Open)
2. On Kanban board, drag the card from "Open" to "Works on My Machine"

Expected:
  - Card appears in "Works on My Machine" column
  - PUT /api/bugs/:id called with { status: "Works on My Machine" }
  - API returns bug with status="Works on My Machine"
  - Database stores "WorksOnMyMachine"

3. Drag the same card back to "Open"

Expected:
  - Card returns to "Open" column
  - Status updated correctly
```

---

## Scenario 3: Kanban ↔ List View Consistency

**Tests**: FR-02, FR-03

```
1. Create 3 bugs with different severities (P0, P1, P3)
2. Verify all 3 appear in Kanban "Open" column
3. Click "List" tab

Expected:
  - All 3 bugs appear in the table
  - Severity shows labels (Critical, High, Low) — not P0/P1/P3
  - Newest bug appears first

4. Edit one bug's status to "In Progress" from the list view
5. Switch back to Kanban view

Expected:
  - Bug now appears in "In Progress" column
  - "Open" column has 2 bugs
```

---

## Scenario 4: Pagination Integration

**Tests**: FR-09

```
1. Create 12 bugs via the UI (or via API: POST /api/bugs × 12)
2. Switch to List view

Expected:
  - Page 1 shows exactly 10 bugs
  - "Page 1 of 2" indicator visible
  - Next page button enabled

3. Click next page

Expected:
  - Page 2 shows 2 remaining bugs
  - Previous page button enabled
  - Next page button disabled
```

---

## Scenario 5: Validation Errors Propagate Correctly

**Tests**: FR-01 validation

```
1. Open "Report Bug" modal
2. Click submit without filling any fields

Expected:
  - "Title is required" error shown
  - "At least one step is required" error shown
  - No API call made

3. Fill title only, submit

Expected:
  - Steps error still shown
  - No API call made

4. Fill all fields with valid data, submit

Expected:
  - No errors
  - Bug created successfully
```

---

## Scenario 6: CORS Verification

```bash
# Confirm frontend origin is accepted by backend
curl -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     http://localhost:3001/api/bugs -v

# Expected response headers:
# Access-Control-Allow-Origin: http://localhost:5173
# Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS
```

---

## Cleanup

```bash
# Stop all services
docker compose down

# Remove database volume (full reset)
docker compose down -v
```
