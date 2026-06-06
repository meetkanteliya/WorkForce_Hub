# WorkForce Hub

![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)
![Django](https://img.shields.io/badge/Django-5.0-green?logo=django)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)
![License](https://img.shields.io/badge/License-MIT-yellow)

A full-stack **Employee Management System** built with Django and React. Manage employees, departments, leaves, and payroll — with real-time chat and a live dashboard.

---

## Features

- 👤 **Employee Management** — Create, edit, and manage employee profiles with photo upload
- 🏢 **Department Management** — Organize employees into departments
- 🗓️ **Leave Management** — Apply for leaves; HR/Admin approve or reject with balance tracking
- 💰 **Payroll** — Manage salary records per employee
- 🔐 **Role-Based Access Control** — Four roles with route-level enforcement on frontend and backend
- 💬 **Real-Time Chat** — Department chat and company-wide chat via WebSockets
- 📊 **Dashboard & Analytics** — Live stats and activity feed via WebSocket
- 🔔 **Notifications** — In-app notifications with mark-read support
- 🔑 **JWT Authentication** — Access + refresh tokens with automatic silent refresh

---

## Tech Stack

### Frontend
- **React 19** + **Vite 7** — SPA with fast dev server
- **React Router DOM v7** — Client-side routing
- **Redux Toolkit** — Global state management (8 slices)
- **Axios** — HTTP client with JWT interceptors
- **TailwindCSS v4** — Styling
- **Lucide React** — Icons

### Backend
- **Django 5** + **Django REST Framework** — REST API
- **Django Channels** + **Daphne** — WebSocket support (ASGI server)
- **djangorestframework-simplejwt** — JWT auth
- **drf-spectacular** — Auto-generated Swagger/ReDoc docs
- **SQLite** — Database (file-based, zero config)

### Infrastructure
- **Docker Compose** — Three services: `frontend`, `backend`, `redis`
- **Redis 7** — WebSocket channel layer
- **Nginx** — Serves the React SPA; proxies `/api` and `/media` to the backend

---

## Architecture

```
Browser
  │
  ├── :80  →  Nginx (frontend)
  │            ├── /          → React SPA (Vite build)
  │            ├── /api/      → proxied to backend:8000
  │            └── /media/    → proxied to backend:8000
  │
  └── :8000 → Daphne (backend)
               ├── HTTP   → Django REST Framework
               └── WS     → Django Channels → Redis
```

---

## Getting Started

### Docker (Recommended)

```bash
git clone https://github.com/meetkanteliya/WorkForce_Hub.git
cd WorkForce_Hub

# Start all services
docker compose up --build
```

| Service | URL |
|---|---|
| App | http://localhost |
| API | http://localhost:8000/api/ |
| Swagger Docs | http://localhost:8000/api/docs/ |

On first boot, migrations run automatically and sample data is seeded.

**Default login:**
```
Username: admin
Password: Admin@123
```

---

### Local Setup

**Backend**
```bash
cd backend
python -m venv venv && source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createadmin
daphne -b 0.0.0.0 -p 8000 config.asgi:application
```

**Frontend**
```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

> The Vite dev server proxies `/api` and `/media` to `http://localhost:8000` automatically.

---

## Environment Variables

Place these in `.env` at the project root (used by Docker Compose).

```env
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=*

REDIS_URL=redis://redis:6379/0
CHANNEL_LAYER_BACKEND=redis       # Set to "inmemory" to skip Redis locally

DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_PASSWORD=Admin@123
DJANGO_SUPERUSER_EMAIL=admin@workforcehub.com
```

> ⚠️ Change `SECRET_KEY` and `DEBUG=False` before deploying to production.

---

## Role-Based Access

| Role | What they can do |
|---|---|
| **Admin** | Full access — all employees, departments, payroll, leaves, password resets |
| **HR** | Manage employees, departments, leaves; view payroll and dashboard |
| **Manager** | View their team and manager dashboard |
| **Employee** | Own profile, leave applications, own salary, chat |

Permissions are enforced on both the **backend** (DRF permission classes) and **frontend** (React `ProtectedRoute`).

---

## Main APIs

Base URL: `/api/`  |  Full docs: `/api/docs/`

| Group | Endpoint Prefix | Key Actions |
|---|---|---|
| Auth | `/api/auth/` | Login, token refresh, profile, change password |
| Employees | `/api/employees/` | CRUD, own profile (`/me/`) |
| Departments | `/api/departments/` | CRUD |
| Leaves | `/api/leaves/` | Types, requests, balances |
| Payroll | `/api/payroll/` | Salary records |
| Dashboard | `/api/dashboard/` | Stats, activity, notifications, manager/employee views |
| Chat | `/api/chat/` | Message history, company chat |

---

## WebSocket Endpoints

| Endpoint | Purpose |
|---|---|
| `ws://.../ws/chat/{department_id}/` | Department real-time chat |
| `ws://.../ws/company-chat/` | Company-wide real-time chat |
| `ws://.../ws/dashboard/` | Live dashboard updates |

---

## Project Structure

```
WorkForce_Hub/
├── docker-compose.yml
├── .env
├── backend/
│   ├── config/          # Django settings, URLs, ASGI
│   ├── accounts/        # Custom user model, JWT auth, permissions
│   ├── employees/       # Employee & Department API
│   ├── leaves/          # Leave types, requests, balances
│   ├── payroll/         # Salary records
│   ├── dashboard/       # Stats, notifications, WebSocket consumer
│   ├── chat/            # Real-time chat, WebSocket consumer
│   └── Dockerfile
└── frontend/
    ├── src/
    │   ├── App.jsx       # Route definitions
    │   ├── api/          # Axios instance + interceptors
    │   ├── store/        # Redux store + 8 slices
    │   ├── components/   # Shared UI components
    │   └── pages/        # Feature pages
    ├── vite.config.js
    ├── nginx.conf
    └── Dockerfile
```

---

## Screenshots

> _Add screenshots here_

---

## Contact

**Meet Kanteliya**
GitHub: [@meetkanteliya](https://github.com/meetkanteliya)
