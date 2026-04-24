# Unit of Work — Dependency Matrix
## Bug Squelcher — Tech Debt Bounty Board (Intent 1)

---

## Dependency Matrix

| Unit | Depends On | Dependency Type | Notes |
|---|---|---|---|
| backend | infrastructure (Docker/PostgreSQL) | Runtime | Must be running before backend starts |
| frontend | backend | Runtime | Calls backend API at `VITE_API_BASE_URL` |
| frontend | infrastructure | None | Frontend has no direct DB dependency |

---

## Build / Start Sequence

```
Step 1: infrastructure   docker compose up -d
Step 2: backend          npm install → db:migrate → dev
Step 3: frontend         npm install → dev
```

Each step must complete before the next begins.

---

## Inter-Unit Contracts

### Backend → Frontend Contract
- **Protocol**: HTTP/JSON REST
- **Base URL**: `http://localhost:3001` (dev)
- **CORS**: Backend allows `http://localhost:5173`
- **Breaking change risk**: Any change to Bug shape, endpoint paths, or status/severity string values requires coordinated update in both units

### Shared Type Definitions
Both units independently define the `Bug` interface — they are NOT shared via a package.
The backend `bug.types.ts` and frontend `bug.types.ts` must stay in sync manually.

---

## Parallel Development Opportunities

| Work Stream | Can Parallelize? | Notes |
|---|---|---|
| Backend schema + service | Yes | Independent of frontend |
| Frontend components (mock data) | Yes | Can develop with hardcoded fixtures |
| Backend controller + routes | Yes | After service is defined |
| Frontend hooks + API module | Partial | Needs backend URL/shape agreed upfront |
| Integration (frontend ↔ backend) | No | Requires both units running |
