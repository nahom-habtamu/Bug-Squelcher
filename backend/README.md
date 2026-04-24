# Bug Squelcher — Backend

Express + TypeScript + Prisma REST API for the Tech Debt Bounty Board.

## Quick Start

```bash
# 1. Start the database (from workspace root)
docker compose up -d

# 2. Install dependencies
npm install

# 3. Copy env and run migrations
cp .env.example .env
npm run db:migrate

# 4. Start dev server
npm run dev
# API: http://localhost:3001
# Swagger UI: http://localhost:3001/docs
```

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with hot-reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production build |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:generate` | Regenerate Prisma client |

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | /api/bugs | List all bugs (newest first) |
| POST | /api/bugs | Create a bug |
| GET | /api/bugs/:id | Get a bug by ID |
| PUT | /api/bugs/:id | Update a bug |
| DELETE | /api/bugs/:id | Delete a bug |
| GET | /docs | Swagger UI |
| GET | /openapi.json | Raw OpenAPI spec |
