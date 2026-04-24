# Build Instructions
## Bug Squelcher — Tech Debt Bounty Board (Intent 1)

---

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js | 20+ | `node --version` to verify |
| npm | 10+ | Bundled with Node 20 |
| Docker Desktop | Latest | Must be running |
| Git | Any | For workspace |

---

## Step 1: Start the Database

From the **workspace root**:

```bash
docker compose up -d
```

Verify it's running:

```bash
docker compose ps
# Expected: db   postgres:16   Up   0.0.0.0:5433->5432/tcp
```

---

## Step 2: Build the Backend

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Run Prisma migration (creates tables + generates client)
npm run db:migrate

# Verify TypeScript compiles cleanly
npm run build
```

**Expected output:**
- `npm run db:migrate` → `✔ Generated Prisma Client` + `Applied 1 migration`
- `npm run build` → no errors, `dist/` directory created with compiled JS

**Build artifacts:** `backend/dist/` — compiled CommonJS JavaScript

---

## Step 3: Build the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Type-check + build
npm run build
```

**Expected output:**
- `npm run build` → `✓ built in Xs`, `dist/` directory created

**Build artifacts:** `frontend/dist/` — static HTML/JS/CSS bundle

---

## Troubleshooting

### `docker compose up` fails — port 5433 already in use
```bash
# Find what's using the port
lsof -i :5433
# Kill it or change the host port in docker-compose.yml
```

### `npm run db:migrate` fails — "Can't reach database server"
```bash
# Confirm Docker container is running
docker compose ps
# Confirm .env DATABASE_URL matches docker-compose.yml
cat backend/.env
# Should be: postgresql://postgres:postgres@localhost:5433/bug_squelcher
```

### `npm run db:migrate` fails — "Prisma enums not found"
```bash
# Regenerate the Prisma client after migration
npm run db:generate
```

### Backend `npm run build` TypeScript errors
```bash
# Ensure you're in the backend directory
# Check tsconfig.json has "module": "commonjs"
# Never import Prisma enum types directly from @prisma/client
```

### Frontend `npm run build` TypeScript errors
```bash
# Ensure you're in the frontend directory
# Run: npx tsc --noEmit to see all type errors
```
