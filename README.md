# WorkForce Hub

WorkForce Hub is a full-stack HR management app with role-based access, employee & department management, leave workflows, payroll records, dashboards, in-app notifications, and real-time chat (WebSockets via Django Channels).

This README is generated **from the actual implemented code** in this repository (no assumed features).

## Project Overview

- **Frontend**: React (Vite) + Tailwind CSS
- **Backend**: Django + Django REST Framework (DRF)
- **Realtime**: Django Channels (WebSockets) with optional Redis channel layer
- **Auth**: SimpleJWT (access + refresh tokens)

## Key Features (implemented)

### Authentication & Roles
- **JWT login** and token refresh (`/api/auth/login/`, `/api/auth/token/refresh/`)
- **Current user profile** (`/api/auth/profile/`)
- **Change password** (`/api/auth/change-password/`)
- **Admin/HR reset password** (`/api/auth/admin-reset-password/`)
- **Roles stored on user model**: `admin`, `hr`, `manager`, `employee`
- **Role-based permissions** used on key endpoints (admin-only, admin/hr, manager-or-above)

### Employees & Departments
- **Employees CRUD** with role restrictions (admin/hr manage; admin delete)
- **Employee “me” endpoints**:
  - `GET /api/employees/me/`
  - `PATCH /api/employees/me/update/` (supports multipart for profile picture)
- **Departments CRUD** (admin-only)
- **Employee list filters** (server-side) including `search`, `department`, `status` (`active`, `inactive`, `present`)

### Leave Management
- **Leave types** CRUD (admin/hr create/update/delete)
- **Leave requests**
  - Employees create requests (validated against leave balance)
  - Managers/admin/hr can approve/reject (approval deducts balance; atomic update)
  - “My leave history” endpoint: `GET /api/leaves/requests/my/`
- **Leave balances**
  - Admin/hr view and adjust balances (`/api/leaves/balances/<id>/adjust/`)
  - “My balances” endpoint: `GET /api/leaves/balances/my/`
  - Extra leave cap enforcement exists in serializer validation
- **Backfill command** exists: `python manage.py backfill_leave_balances`

### Payroll
- **Salary records** with computed `net_salary = basic + bonus - deductions`
- **Role filtering**:
  - Admin/hr: all records
  - Manager: department salaries
  - Employee: own salaries
- **My salary** endpoint: `GET /api/payroll/my/`
- Salary create/update logs to audit + notifies employees

### Dashboards, Audit Logs, Notifications
- **Dashboard summary**: `GET /api/dashboard/summary/` (admin/hr only)
- **Dashboard drill-down endpoints**:
  - Employees list: `GET /api/dashboard/employees/`
  - Departments list/detail: `GET /api/dashboard/departments/`, `GET /api/dashboard/departments/<id>/`
  - Pending leaves: `GET /api/dashboard/leaves/pending/`
  - Leave overview: `GET /api/dashboard/leaves/overview/`
  - Payroll overview: `GET /api/dashboard/payroll/overview/`
  - Activity feed (audit log): `GET /api/dashboard/activity/`
- **Notifications** (in-app):
  - List: `GET /api/dashboard/notifications/`
  - Mark read: `PATCH /api/dashboard/notifications/<id>/read/`
  - Mark all read: `PATCH /api/dashboard/notifications/read-all/`
  - Clear all: `DELETE /api/dashboard/notifications/clear-all/`

### Chat (REST + WebSockets)

**Company-wide chat**
- REST:
  - Members: `GET /api/chat/company/members/`
  - Messages list/create (supports attachments): `GET|POST /api/chat/company/messages/`
  - Delete (soft delete + broadcast): `DELETE /api/chat/company/messages/<id>/`
  - Mark read: `POST /api/chat/company/messages/mark-read/`
- WebSocket: `ws://<host>:8000/ws/company-chat/?token=<access>`
  - Events implemented: typing, join/leave presence, message broadcast, deletion broadcast, read receipts

**Department chat**
- WebSocket consumer exists: `ws://<host>:8000/ws/chat/<department_id>/?token=<access>`
- REST history exists: `GET /api/chat/messages/?department=<id>`
- Note: a `frontend/src/pages/chat/DepartmentChat.jsx` UI exists, but is **not currently routed** in the app router.

## Core Modules

- **accounts**: custom user model (`role`), profile/password endpoints, role permissions
- **employees**: employees + departments, employee self-profile update
- **leaves**: leave types, leave balances, leave requests + approval actions
- **payroll**: salary records and calculations
- **dashboard**: audit log, notifications, admin/hr dashboards + summaries
- **chat**: department chat + company chat (REST + consumers)

## Technology Stack (from repo)

### Backend
- Django 5.0.x
- Django REST Framework
- SimpleJWT
- Django Channels + Daphne
- `channels_redis` (optional, via Redis)
- drf-spectacular (OpenAPI + Swagger/ReDoc)
- SQLite (default dev DB)

### Frontend
- React 19 + Vite
- Tailwind CSS (via `@tailwindcss/vite`)
- React Router
- Axios
- Lucide icons + React Icons

## Project Structure

```text
WorkForce_Hub/
├── backend/
│   ├── accounts/        # User + auth/profile/password + permissions
│   ├── employees/       # Employee + Department + "me" endpoints
│   ├── leaves/          # Leave types, requests, balances + actions
│   ├── payroll/         # Salary records (net salary computed)
│   ├── dashboard/       # Summary endpoints, audit log, notifications
│   ├── chat/            # REST chat endpoints + WebSocket consumers
│   └── config/          # Django settings/urls/asgi
├── frontend/
│   ├── src/
│   │   ├── api/         # Axios instance + token refresh interceptor
│   │   ├── components/  # Layout, ProtectedRoute, modals, etc.
│   │   ├── context/     # Auth + Theme contexts
│   │   └── pages/       # Landing, Login, Dashboard, CRUD pages, Chat
│   └── vite.config.js   # Dev proxy to backend (/api, /media)
├── docker-compose.yml   # Redis (optional channel layer)
└── requirements.txt     # Python dependencies
```

## Installation Instructions

### Prerequisites
- Python 3.10+ (repo currently runs on modern Python; Django 5)
- Node.js 18+
- (Optional) Docker for Redis, if you want Redis-backed WebSockets

### Backend Setup (Django)

```bash
cd backend
python -m venv .venv
# activate venv (Windows PowerShell)
.\.venv\Scripts\Activate.ps1
pip install -r ../requirements.txt
python manage.py migrate
python manage.py runserver 8000
```

#### Environment variables
Backend uses `python-decouple` and reads from environment:
- `SECRET_KEY` (default: `django-insecure-change-this`)
- `DEBUG` (default: `True`)
- `ALLOWED_HOSTS` (default: `127.0.0.1,localhost`)
- `CHANNEL_LAYER_BACKEND` (default: `inmemory`; set to `redis` to use Redis)
- `REDIS_URL` (default: `redis://127.0.0.1:6379/0`)

### Frontend Setup (React)

```bash
cd frontend
npm install
npm run dev
```

Vite proxies:
- `/api` → `http://127.0.0.1:8000`
- `/media` → `http://127.0.0.1:8000`

## Real-Time Features

WorkForce Hub uses Django Channels consumers:

- **Company chat**: `ws://<host>:8000/ws/company-chat/?token=<access>`
- **Department chat**: `ws://<host>:8000/ws/chat/<department_id>/?token=<access>`

To use Redis channel layer (optional), start Redis and set:

```bash
docker compose up -d
set CHANNEL_LAYER_BACKEND=redis
set REDIS_URL=redis://127.0.0.1:6379/0
```

## Security Features

- **JWT authentication** enforced by DRF default settings.
- **Role-based permissions** (`IsAdmin`, `IsAdminOrHR`, `IsManagerOrAbove`, etc.).
- Sensitive operations (e.g., salary create/update/delete, department CRUD) are restricted by role.
- Audit log records key system actions (leave requests/approvals, salary actions, employee creation, profile updates).

## API Documentation

When the backend is running:
- OpenAPI schema: `/api/schema/`
- Swagger UI: `/api/docs/`
- ReDoc: `/api/redoc/`

## Future Improvements (optional)

These are *not* fully implemented across the repo and are listed as potential enhancements:
- Route and ship the existing department chat UI (`DepartmentChat.jsx`) in the main navigation.
- Add automated creation of leave balance records for all employees when new leave types are created.
- Add stronger production settings (CORS tightening, secure cookie options if needed, production channel layer config).
