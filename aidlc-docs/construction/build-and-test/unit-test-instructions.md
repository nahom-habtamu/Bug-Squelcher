# Unit Test Instructions
## Bug Squelcher — Tech Debt Bounty Board (Intent 1)

> **Note**: Automated unit tests are not included in Intent 1 (no test framework was scaffolded per project scope). This document describes the manual verification steps that serve as the unit-level quality gate, and provides the recommended test setup for a future intent.

---

## Manual Unit Verification — Backend

Run the dev server and exercise each service operation via the Swagger UI.

### Start the backend
```bash
cd backend
npm run dev
# Running at http://localhost:3001
# Swagger UI at http://localhost:3001/docs
```

### Verify each operation via Swagger UI (`http://localhost:3001/docs`)

| # | Operation | Input | Expected Result |
|---|---|---|---|
| B1 | `POST /api/bugs` | `{ title: "Test", stepsToReproduce: "Step 1", severity: "P1" }` | 201 + Bug with `status: "Open"`, UUID id, ISO timestamps |
| B2 | `POST /api/bugs` | `{ title: " ", stepsToReproduce: "x", severity: "P1" }` | 400 validation error (title too short after trim) |
| B3 | `POST /api/bugs` | `{ title: "T", severity: "P1" }` (missing stepsToReproduce) | 400 validation error |
| B4 | `POST /api/bugs` | `{ title: "T", stepsToReproduce: "s", severity: "P5" }` | 400 validation error (invalid severity) |
| B5 | `GET /api/bugs` | — | 200 + array, newest first |
| B6 | `GET /api/bugs/:id` | valid UUID from B1 | 200 + Bug |
| B7 | `GET /api/bugs/:id` | `00000000-0000-0000-0000-000000000000` | 404 `{ error: "Bug not found" }` |
| B8 | `PUT /api/bugs/:id` | `{ status: "In Progress" }` | 200 + Bug with updated status |
| B9 | `PUT /api/bugs/:id` | `{ status: "Works on My Machine" }` | 200 + Bug with updated status |
| B10 | `PUT /api/bugs/:id` | `{}` (empty body) | 400 (at least one field required) |
| B11 | `PUT /api/bugs/:id` | non-existent id | 404 |
| B12 | `DELETE /api/bugs/:id` | valid UUID | 204 no body |
| B13 | `DELETE /api/bugs/:id` | non-existent id | 404 |

### Verify status mapping
After B8, confirm the stored Prisma value is `InProgress` but the API returns `"In Progress"`:
```bash
# Check directly in the database
docker exec -it $(docker compose ps -q db) psql -U postgres -d bug_squelcher \
  -c "SELECT id, status FROM \"Bug\" LIMIT 5;"
# status column should show: InProgress, WorksOnMyMachine (no spaces)
```

---

## Manual Unit Verification — Frontend

### Start both servers
```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
# Open http://localhost:5173
```

### Component verification checklist

| # | Component | Action | Expected |
|---|---|---|---|
| F1 | App loads | Open http://localhost:5173 | Kanban board visible, 3 columns |
| F2 | New Bug button | Click "Report Bug" | Modal opens in create mode (no Status field) |
| F3 | Form validation | Submit empty form | Validation errors on title + steps |
| F4 | Create bug | Fill all fields, submit | Modal closes, bug appears in "Open" column |
| F5 | Severity badge | Create P0 bug | Red "Critical" badge on card |
| F6 | Edit bug | Click Edit on card | Modal opens in edit mode (Status field visible, fields pre-filled) |
| F7 | Edit save | Change status to "In Progress", save | Card moves to "In Progress" column |
| F8 | Delete confirm | Click Delete on card | Confirmation dialog shows bug title |
| F9 | Delete cancel | Click Cancel in dialog | Dialog closes, bug remains |
| F10 | Delete confirm | Click Delete in dialog | Bug removed from board |
| F11 | Drag-and-drop | Drag card to different column | Card moves, status updated via API |
| F12 | Drag same column | Drag card within same column | No API call, card stays |
| F13 | List view | Click "List" tab | Table view with all bugs |
| F14 | Pagination | Create 11+ bugs, go to list view | Page 1 shows 10, page 2 shows remainder |
| F15 | List edit | Click Edit in list row | Same edit modal opens |
| F16 | List delete | Click Delete in list row | Same confirmation dialog |
| F17 | Steps input | Add 3 steps in form | Numbered inputs, remove buttons work |
| F18 | data-testid | Inspect DOM | All interactive elements have data-testid |

---

## Recommended Future Test Setup (Intent 2+)

### Backend — Vitest + Supertest
```bash
cd backend
npm install --save-dev vitest supertest @types/supertest
```

Key test files to create:
- `backend/src/bugs/bug.service.test.ts` — unit test service with mocked Prisma
- `backend/src/bugs/bug.controller.test.ts` — integration test with Supertest

### Frontend — Vitest + React Testing Library
```bash
cd frontend
npm install --save-dev vitest @testing-library/react @testing-library/user-event jsdom
```

Key test files to create:
- `frontend/src/bugs/components/BugCard.test.tsx`
- `frontend/src/bugs/components/BugFormModal.test.tsx`
- `frontend/src/bugs/hooks/useBugs.test.ts`
