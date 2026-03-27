<p align="center">
  <h1 align="center">🏢 WorkForce Hub</h1>
  <p align="center">
    A full-stack Employee Management System with role-based access control, leave & payroll workflows, real-time chat, and an admin dashboard — built with Django REST Framework and React.
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Django-5.0-092E20?style=for-the-badge&logo=django&logoColor=white" alt="Django" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
</p>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Development](#local-development)
  - [Docker Deployment](#-docker-deployment)
- [Environment Variables](#-environment-variables)
- [Default Credentials](#-default-credentials)
- [API Documentation](#-api-documentation)
- [API Reference](#-api-reference)
- [WebSocket Endpoints](#-websocket-endpoints)
- [License](#-license)

---

## 🔎 Overview

WorkForce Hub is an end-to-end Human Resource Management application. It provides a Django-powered REST API backend with WebSocket support via Django Channels, paired with a modern React single-page application. The system supports four user roles — **Admin**, **HR**, **Manager**, and **Employee** — each with granular permissions controlling access to employees, departments, leave workflows, payroll records, dashboards, notifications, and real-time company chat.

---

## 🛠 Tech Stack

### Backend

| Technology | Purpose |
|---|---|
| **Django 5.0** | Web framework |
| **Django REST Framework** | RESTful API layer |
| **SimpleJWT** | JWT authentication (access + refresh tokens) |
| **Django Channels + Daphne** | ASGI server & WebSocket support |
| **channels-redis** | Redis-backed channel layer (optional) |
| **drf-spectacular** | OpenAPI schema + Swagger / ReDoc UI |
| **django-filter** | Server-side filtering |
| **django-cors-headers** | Cross-origin request handling |
| **Pillow** | Image processing (profile pictures) |
| **SQLite** | Default development database |

### Frontend

| Technology | Purpose |
|---|---|
| **React 19** | UI library |
| **Vite 7** | Build tool & dev server |
| **Tailwind CSS 4** | Utility-first styling |
| **React Router 7** | Client-side routing |
| **Axios** | HTTP client with JWT interceptor |
| **Lucide React + React Icons** | Iconography |
| **Day.js** | Date formatting |
| **React Easy Crop** | Profile picture cropping |
| **Inter (Google Font)** | Typography |

### Infrastructure

| Technology | Purpose |
|---|---|
| **Docker & Docker Compose** | Containerized deployment |
| **Nginx** | Production reverse proxy for the frontend |
| **Redis** | Optional WebSocket channel layer backend |

---

## ✨ Features

### 🔐 Authentication & Role-Based Access

- JWT login with automatic token refresh (access: 30 min, refresh: 1 day)
- Token rotation with blacklist-after-rotation enabled
- Four roles: `admin` · `hr` · `manager` · `employee`
- Granular permission classes: `IsAdmin`, `IsAdminOrHR`, `IsManagerOrAbove`, `IsOwnerOrAdmin`
- User profile view and self-service password change
- Admin/HR password reset for any user

### 👥 Employee & Department Management

- Full CRUD for employees (admin/hr create & edit; admin delete)
- Full CRUD for departments (admin only)
- Employee self-profile update with profile picture upload (multipart)
- Server-side search, department filter, and status filter on employee list
- Employee detail view with employee code, designation, contact info, and emergency contacts

### 📋 Leave Management

- Configurable leave types (paid/unpaid, max days, document requirement)
- Leave request workflow: submit → pending → approved/rejected
- Balance validation before request creation
- Atomic balance deduction on approval
- Leave balance management with admin/hr adjustment capability
- "My leave history" and "My balances" endpoints for employees
- Leave balance backfill management command

### 💰 Payroll

- Salary records with auto-computed `net_salary = basic + bonus − deductions`
- Role-scoped visibility: admin/hr see all, managers see department, employees see own
- "My salary" endpoint for individual employees
- Audit logging and notification on salary create/update

### 📊 Admin Dashboard

- Summary statistics endpoint (employee count, department count, pending leaves, payroll totals)
- Drill-down pages: employees list, departments list/detail, pending leaves, leave overview, payroll overview, activity feed
- Audit log capturing system events (leave requests, approvals, salary actions, employee creation, profile updates)

### 🔔 In-App Notifications

- Notification list with read/unread status
- Mark individual or all notifications as read
- Clear all notifications

### 💬 Real-Time Chat

- **Company-wide chat** with REST + WebSocket support
  - Message send/receive with file attachments
  - Soft delete with broadcast notification
  - Read receipts and mark-read functionality
  - Typing indicators and online presence (join/leave events)
- **Department chat** with WebSocket consumer and REST message history

### 🎨 Frontend UI

- Responsive layout with sidebar navigation
- Light/dark theme toggle via ThemeContext
- Landing page, login page, and protected route system
- Modal dialogs (AlertModal) for confirmations
- Pagination across all list views

---

## 🏗 Architecture

```
┌─────────────────────┐         ┌─────────────────────────────┐
│                     │  HTTP   │                             │
│   React SPA         │◄───────►│   Django REST Framework     │
│   (Vite + Tailwind) │         │   (DRF + SimpleJWT)         │
│                     │  WS     │                             │
│   WebSocket Client  │◄───────►│   Django Channels (Daphne)  │
│                     │         │                             │
└─────────────────────┘         └──────────┬──────────────────┘
                                           │
                                    ┌──────┴──────┐
                                    │   SQLite    │
                                    │   (default) │
                                    └──────┬──────┘
                                           │
                                    ┌──────┴──────┐
                                    │   Redis     │
                                    │  (optional) │
                                    └─────────────┘
```

---

## 📂 Project Structure

```
WorkForce_Hub/
├── backend/
│   ├── config/                 # Django project settings, URLs, ASGI config
│   │   ├── settings.py         # App config, JWT, DRF, Channels, DB
│   │   ├── urls.py             # Root URL routing
│   │   └── asgi.py             # ASGI application with WebSocket routing
│   ├── accounts/               # Custom User model, auth views, permissions
│   │   ├── models.py           # User model with role field
│   │   ├── views.py            # Login, profile, password change/reset
│   │   └── permissions.py      # IsAdmin, IsAdminOrHR, IsManagerOrAbove, etc.
│   ├── employees/              # Employee & Department models, views, signals
│   │   ├── models.py           # Employee, Department
│   │   ├── views.py            # EmployeeViewSet, DepartmentViewSet
│   │   └── signals.py          # Auto-create employee profile on user creation
│   ├── leaves/                 # Leave types, requests, balances
│   │   ├── models.py           # LeaveType, LeaveRequest, LeaveBalance
│   │   ├── views.py            # CRUD + approve/reject actions
│   │   └── management/         # backfill_leave_balances command
│   ├── payroll/                # Salary records
│   │   ├── models.py           # Salary with net_salary auto-compute
│   │   └── views.py            # SalaryViewSet with role-based filtering
│   ├── dashboard/              # Admin dashboard, audit log, notifications
│   │   ├── models.py           # AuditLog, Notification
│   │   └── views.py            # Summary, drill-down, notification endpoints
│   ├── chat/                   # Real-time messaging
│   │   ├── models.py           # ChatMessage, CompanyChatMessage, read receipts
│   │   ├── consumers.py        # WebSocket consumers (company + department)
│   │   ├── routing.py          # WebSocket URL patterns
│   │   └── views.py            # REST endpoints for chat history & management
│   ├── seed_data.py            # Database seeder (departments, users, leaves, payroll)
│   ├── entrypoint.sh           # Docker entrypoint (migrate, create admin, seed, start)
│   ├── Dockerfile              # Multi-stage backend Docker image
│   └── requirements.txt        # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Root component with route definitions
│   │   ├── main.jsx            # React entry point
│   │   ├── index.css           # Global styles
│   │   ├── api/
│   │   │   └── axios.js        # Axios instance with JWT interceptor & auto-refresh
│   │   ├── context/
│   │   │   ├── AuthContext.jsx  # Authentication state & login/logout logic
│   │   │   └── ThemeContext.jsx # Light/dark theme toggle
│   │   ├── components/
│   │   │   ├── Layout.jsx      # Sidebar + header layout shell
│   │   │   ├── ProtectedRoute.jsx  # Auth & role guard
│   │   │   └── AlertModal.jsx  # Reusable confirmation modal
│   │   └── pages/
│   │       ├── LandingPage.jsx
│   │       ├── Login.jsx
│   │       ├── Dashboard.jsx
│   │       ├── Profile.jsx
│   │       ├── ChangePassword.jsx
│   │       ├── departments/    # DepartmentList, DepartmentForm
│   │       ├── employees/      # EmployeeList, EmployeeForm, EmployeeDetail
│   │       ├── leaves/         # LeaveRequestList, LeaveRequestForm, LeaveTypeList
│   │       ├── payroll/        # SalaryList, SalaryForm, MySalary
│   │       ├── dashboard/      # Drill-down pages (employees, departments, etc.)
│   │       └── chat/           # CompanyChat, DepartmentChat
│   ├── index.html              # HTML entry point
│   ├── vite.config.js          # Vite config with proxy & Tailwind plugin
│   ├── nginx.conf              # Nginx config for production build
│   ├── Dockerfile              # Multi-stage frontend Docker image
│   └── package.json            # Node dependencies & scripts
│
├── docker-compose.yml          # Redis + Backend + Frontend services
├── requirements.txt            # Python dependencies (root copy)
├── .env                        # Environment variables
└── .gitignore
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version |
|---|---|
| Python | 3.10+ |
| Node.js | 18+ |
| Docker & Docker Compose | Latest (only for containerized deployment) |

### Local Development

#### 1. Clone the Repository

```bash
git clone https://github.com/your-username/WorkForce_Hub.git
cd WorkForce_Hub
```

#### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows (PowerShell)
.\venv\Scripts\Activate.ps1

# macOS / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
python manage.py migrate

# Create a superuser
python manage.py createsuperuser

# (Optional) Seed demo data
python seed_data.py

# Start the development server
python manage.py runserver 8000
```

> The backend starts at `http://localhost:8000`

#### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

> The frontend starts at `http://localhost:5173` with API requests proxied to the backend.

---

### 🐳 Docker Deployment

Launch all services (Redis, backend, frontend) with a single command:

```bash
docker compose up --build
```

| Service | URL |
|---|---|
| **Frontend** | `http://localhost:80` (port 80) |
| **Backend API** | `http://localhost:8000` |
| **Redis** | `localhost:6379` (internal) |

The backend container automatically:
1. Runs database migrations
2. Creates an admin superuser
3. Seeds demo data (departments, employees, leave types, payroll records)
4. Starts the Daphne ASGI server

---

## ⚙ Environment Variables

Create a `.env` file in the project root (or configure these in your environment):

| Variable | Default | Description |
|---|---|---|
| `SECRET_KEY` | `django-insecure-change-this` | Django secret key |
| `DEBUG` | `True` | Debug mode toggle |
| `ALLOWED_HOSTS` | `127.0.0.1,localhost` | Comma-separated allowed hosts |
| `CHANNEL_LAYER_BACKEND` | `inmemory` | Channel layer: `inmemory` or `redis` |
| `REDIS_URL` | `redis://127.0.0.1:6379/0` | Redis connection URL |
| `DJANGO_SUPERUSER_USERNAME` | — | Auto-created admin username (Docker) |
| `DJANGO_SUPERUSER_EMAIL` | — | Auto-created admin email (Docker) |
| `DJANGO_SUPERUSER_PASSWORD` | — | Auto-created admin password (Docker) |
| `VITE_API_URL` | `http://localhost:8000` | Backend URL for the frontend |

---

## 🔑 Default Credentials

When using Docker or after running `seed_data.py`, the following demo accounts are available:

| Username | Password | Role |
|---|---|---|
| `admin` | `Admin@123` | Admin (superuser) |
| `admin1` | `Admin@123` | Admin |
| `hr_neha` | `Neha@123` | HR |
| `mgr_rahul` | `Rahul@123` | Manager |
| `dev_ankit` | `Ankit@123` | Employee |
| `dev_priya` | `Priya@123` | Employee |
| `fin_sneha` | `Sneha@123` | Employee |
| `mkt_arjun` | `Arjun@123` | Employee |
| `ops_kavya` | `Kavya@123` | Employee |

---

## 📖 API Documentation

The backend auto-generates interactive API documentation when running:

| Tool | URL |
|---|---|
| **Swagger UI** | [`/api/docs/`](http://localhost:8000/api/docs/) |
| **ReDoc** | [`/api/redoc/`](http://localhost:8000/api/redoc/) |
| **OpenAPI Schema** (JSON) | [`/api/schema/`](http://localhost:8000/api/schema/) |
| **Django Admin** | [`/admin/`](http://localhost:8000/admin/) |

---

## 📡 API Reference

### Authentication — `/api/auth/`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/login/` | Obtain JWT token pair | Public |
| `POST` | `/api/auth/token/refresh/` | Refresh access token | Public |
| `GET` | `/api/auth/profile/` | Current user profile | Authenticated |
| `PUT` | `/api/auth/change-password/` | Change own password | Authenticated |
| `POST` | `/api/auth/admin-reset-password/` | Reset any user's password | Admin / HR |

### Employees — `/api/employees/`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/employees/` | List employees (search, filter) | Admin / HR / Manager |
| `POST` | `/api/employees/` | Create employee | Admin / HR |
| `GET` | `/api/employees/{id}/` | Employee detail | Admin / HR / Manager |
| `PUT/PATCH` | `/api/employees/{id}/` | Update employee | Admin / HR |
| `DELETE` | `/api/employees/{id}/` | Delete employee | Admin |
| `GET` | `/api/employees/me/` | Own employee profile | Authenticated |
| `PATCH` | `/api/employees/me/update/` | Update own profile (multipart) | Authenticated |

### Departments — `/api/departments/`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/departments/` | List all departments | Admin / HR |
| `POST` | `/api/departments/` | Create department | Admin |
| `GET` | `/api/departments/{id}/` | Department detail | Admin / HR |
| `PUT/PATCH` | `/api/departments/{id}/` | Update department | Admin |
| `DELETE` | `/api/departments/{id}/` | Delete department | Admin |

### Leave Management — `/api/leaves/`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/leaves/types/` | List leave types | Authenticated |
| `POST` | `/api/leaves/types/` | Create leave type | Admin / HR |
| `PUT/PATCH` | `/api/leaves/types/{id}/` | Update leave type | Admin / HR |
| `DELETE` | `/api/leaves/types/{id}/` | Delete leave type | Admin / HR |
| `GET` | `/api/leaves/requests/` | List leave requests | Authenticated |
| `POST` | `/api/leaves/requests/` | Submit leave request | Authenticated |
| `POST` | `/api/leaves/requests/{id}/approve/` | Approve request | Admin / HR / Manager |
| `POST` | `/api/leaves/requests/{id}/reject/` | Reject request | Admin / HR / Manager |
| `GET` | `/api/leaves/requests/my/` | Own leave history | Authenticated |
| `GET` | `/api/leaves/balances/` | List leave balances | Admin / HR |
| `GET` | `/api/leaves/balances/my/` | Own leave balances | Authenticated |
| `POST` | `/api/leaves/balances/{id}/adjust/` | Adjust balance | Admin / HR |

### Payroll — `/api/payroll/`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/payroll/` | List salary records | Role-scoped |
| `POST` | `/api/payroll/` | Create salary record | Admin |
| `PUT/PATCH` | `/api/payroll/{id}/` | Update salary record | Admin |
| `DELETE` | `/api/payroll/{id}/` | Delete salary record | Admin |
| `GET` | `/api/payroll/my/` | Own salary records | Authenticated |

### Dashboard — `/api/dashboard/`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/dashboard/summary/` | Dashboard statistics | Admin / HR |
| `GET` | `/api/dashboard/employees/` | Employee list | Admin / HR |
| `GET` | `/api/dashboard/departments/` | Department list | Admin / HR |
| `GET` | `/api/dashboard/departments/{id}/` | Department detail | Admin / HR |
| `GET` | `/api/dashboard/leaves/pending/` | Pending leave requests | Admin / HR |
| `GET` | `/api/dashboard/leaves/overview/` | Leave overview | Admin / HR |
| `GET` | `/api/dashboard/payroll/overview/` | Payroll overview | Admin / HR |
| `GET` | `/api/dashboard/activity/` | Audit log / activity feed | Admin / HR |

### Notifications — `/api/dashboard/notifications/`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/dashboard/notifications/` | List notifications | Authenticated |
| `PATCH` | `/api/dashboard/notifications/{id}/read/` | Mark as read | Authenticated |
| `PATCH` | `/api/dashboard/notifications/read-all/` | Mark all as read | Authenticated |
| `DELETE` | `/api/dashboard/notifications/clear-all/` | Clear all notifications | Authenticated |

### Chat — `/api/chat/`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/chat/messages/` | Department chat history | Authenticated |
| `GET` | `/api/chat/company/members/` | Company chat member list | Authenticated |
| `GET/POST` | `/api/chat/company/messages/` | List / send company messages | Authenticated |
| `DELETE` | `/api/chat/company/messages/{id}/` | Soft-delete a message | Authenticated |
| `POST` | `/api/chat/company/messages/mark-read/` | Mark messages as read | Authenticated |

---

## 🔌 WebSocket Endpoints

| Endpoint | Description |
|---|---|
| `ws://<host>:8000/ws/company-chat/?token=<access>` | Company-wide real-time chat |
| `ws://<host>:8000/ws/chat/<department_id>/?token=<access>` | Department-scoped real-time chat |

**Supported events:** `message`, `typing`, `join`, `leave`, `delete`, `read_receipt`

---

## 🔒 Security

- JWT authentication enforced globally via DRF default permission classes
- Role-based permission guards on all sensitive endpoints
- Refresh token rotation with automatic blacklisting
- Axios interceptor handles silent token refresh on 401 responses
- Audit log records all significant system actions
- Soft-delete pattern for chat messages (preserves audit trail)
- CORS configured via `django-cors-headers`
- Django password validators enabled (similarity, minimum length, common, numeric)

---

## 📄 License

This project is for educational and demonstration purposes.
