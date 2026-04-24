# Component Definitions
## Bug Squelcher — Tech Debt Bounty Board (Intent 1)

---

## Backend Components

### BugService
- **Layer**: Service
- **Location**: `backend/src/bugs/bug.service.ts`
- **Responsibilities**:
  - Orchestrates all bug-related business operations
  - Calls Prisma directly (no repository wrapper)
  - Maps between API display strings and Prisma storage values (status, severity)
  - Enforces business rules: existence checks on get/update/delete
  - Returns plain objects (never Prisma types) to the controller
- **Interfaces**: Called by BugController; calls PrismaClient

### BugController
- **Layer**: Controller (HTTP boundary)
- **Location**: `backend/src/bugs/bug.controller.ts`
- **Responsibilities**:
  - Handles HTTP request/response lifecycle
  - Validates all incoming request data using Zod schemas at the boundary
  - Delegates to BugService after successful validation
  - Maps service results to HTTP responses with correct status codes
  - Handles and formats error responses
- **Interfaces**: Receives Express `Request`/`Response`; calls BugService

### BugRouter
- **Layer**: Routing
- **Location**: `backend/src/bugs/bug.routes.ts`
- **Responsibilities**:
  - Declares all `/api/bugs` route definitions
  - Binds HTTP methods + paths to BugController handler methods
  - Mounted by the Express app
- **Interfaces**: Express Router; references BugController

### PrismaClient (singleton)
- **Layer**: Data Access
- **Location**: `backend/src/lib/prisma.ts`
- **Responsibilities**:
  - Exports a single shared PrismaClient instance
  - Prevents multiple connections in development (hot-reload safe)
- **Interfaces**: Imported by BugService

### OpenAPI Spec
- **Layer**: Documentation
- **Location**: `backend/src/openapi.ts`
- **Responsibilities**:
  - Exports the OpenAPI 3.0 JSON spec object describing all `/api/bugs` endpoints
  - Served at `GET /openapi.json`
  - Consumed by swagger-ui-express at `GET /docs`
- **Interfaces**: Imported by App

### App
- **Layer**: Application Bootstrap
- **Location**: `backend/src/app.ts`
- **Responsibilities**:
  - Creates and configures the Express application
  - Registers middleware (JSON body parser, CORS)
  - Mounts BugRouter at `/api/bugs`
  - Mounts swagger-ui-express at `/docs`
  - Registers global error middleware
- **Interfaces**: Exports Express `app`; imports BugRouter, OpenAPI spec

### ErrorMiddleware
- **Layer**: Middleware
- **Location**: `backend/src/middleware/error.middleware.ts`
- **Responsibilities**:
  - Global Express error handler (4-argument signature)
  - Catches unhandled errors and returns structured JSON error responses
- **Interfaces**: Registered on Express app

---

## Frontend Components

### App
- **Layer**: Root
- **Location**: `frontend/src/App.tsx`
- **Responsibilities**:
  - Wraps the application in `FluentProvider` and `QueryClientProvider`
  - Renders the top-level layout and view toggle (Kanban / List)
  - Hosts the `BugFormModal` (shared between create and edit)
- **Interfaces**: Renders KanbanBoard, ListView, BugFormModal

### KanbanBoard
- **Layer**: Feature Component
- **Location**: `frontend/src/bugs/components/KanbanBoard.tsx`
- **Responsibilities**:
  - Renders three `KanbanColumn` components (one per status)
  - Manages drag-and-drop context (DnD provider)
  - Handles drop events — calls `useUpdateBug` to persist status change
  - Receives bug list from parent (data fetched via `useBugs`)
- **Interfaces**: Receives `Bug[]`; calls useUpdateBug on drop

### KanbanColumn
- **Layer**: Feature Component
- **Location**: `frontend/src/bugs/components/KanbanColumn.tsx`
- **Responsibilities**:
  - Renders a single status column with its label and bug cards
  - Acts as a drop target for drag-and-drop
  - Renders a list of `BugCard` components for its status
- **Interfaces**: Receives `status`, `Bug[]`; renders BugCard

### BugCard
- **Layer**: Feature Component
- **Location**: `frontend/src/bugs/components/BugCard.tsx`
- **Responsibilities**:
  - Renders a single bug's summary (title, severity label, status)
  - Acts as a drag source for drag-and-drop
  - Provides Edit and Delete action triggers
  - Severity badge uses inline style for dynamic color (architecture-approved exception)
- **Interfaces**: Receives `Bug`; emits onEdit, onDelete callbacks

### BugFormModal
- **Layer**: Feature Component
- **Location**: `frontend/src/bugs/components/BugFormModal.tsx`
- **Responsibilities**:
  - Shared modal for both Create and Edit operations
  - Renders form fields: title (text), stepsToReproduce (dynamic numbered steps), severity (select)
  - In edit mode, also renders status (select)
  - Uses React Hook Form + Zod schema for validation
  - Calls `useCreateBugForm` (create) or `useUpdateBug` (edit) on submit
- **Interfaces**: Receives `bug?` (undefined = create mode); calls hooks on submit

### ListView
- **Layer**: Feature Component
- **Location**: `frontend/src/bugs/components/ListView.tsx`
- **Responsibilities**:
  - Renders all bugs in a Fluent UI DataGrid / Table
  - Columns: title, severity label, status, createdAt
  - Supports pagination (page controls or infinite scroll)
  - Provides Edit and Delete action triggers per row
- **Interfaces**: Receives `Bug[]`, pagination state; emits onEdit, onDelete

### FormField (shared)
- **Layer**: Shared Component
- **Location**: `frontend/src/shared/components/FormField.tsx`
- **Responsibilities**:
  - Reusable wrapper for a labelled form input with error message display
  - Used inside BugFormModal for consistent field layout
- **Interfaces**: Receives label, error, children

---

## Frontend Hooks & API

### useBugs
- **Location**: `frontend/src/bugs/hooks/useBugs.ts`
- **Responsibilities**: TanStack Query `useQuery` — fetches all bugs from `GET /api/bugs`

### useCreateBugForm
- **Location**: `frontend/src/bugs/hooks/useCreateBugForm.ts`
- **Responsibilities**: React Hook Form + Zod + TanStack Query `useMutation` for creating a bug

### useUpdateBug
- **Location**: `frontend/src/bugs/hooks/useUpdateBug.ts`
- **Responsibilities**: TanStack Query `useMutation` for updating a bug (status change or full edit)

### useDeleteBug
- **Location**: `frontend/src/bugs/hooks/useDeleteBug.ts`
- **Responsibilities**: TanStack Query `useMutation` for deleting a bug

### bugKeys
- **Location**: `frontend/src/bugs/hooks/bugKeys.ts`
- **Responsibilities**: TanStack Query key factory for cache invalidation

### bugs.api
- **Location**: `frontend/src/bugs/api/bugs.api.ts`
- **Responsibilities**: Raw fetch functions called by hooks; reads `VITE_API_BASE_URL`
