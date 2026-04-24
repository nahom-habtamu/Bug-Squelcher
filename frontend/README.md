# Bug Squelcher — Frontend

React + Vite + TypeScript SPA for the Tech Debt Bounty Board.

## Quick Start

```bash
# Ensure backend is running first (http://localhost:3001)

npm install
cp .env.example .env
npm run dev
# App: http://localhost:5173
```

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check + build to `dist/` |
| `npm run preview` | Preview production build |

## Features

- Kanban board with drag-and-drop status changes
- List/table view with pagination
- Create & edit bugs via shared modal
- Structured numbered steps-to-reproduce input
- Delete confirmation dialog
- Severity displayed as labels (Critical / High / Medium / Low)
