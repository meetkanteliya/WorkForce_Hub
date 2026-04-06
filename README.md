<p align="center">
  <img src="https://img.shields.io/badge/Django-5.0-092E20?style=for-the-badge&logo=django&logoColor=white" alt="Django" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Redux_Toolkit-2.8-764ABC?style=for-the-badge&logo=redux&logoColor=white" alt="Redux Toolkit" />
  <img src="https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/WebSocket-Channels-FF6F00?style=for-the-badge&logo=websocket&logoColor=white" alt="WebSocket" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License" />
</p>

# 🏢 WorkForce Hub

> A full-stack Employee Management System with real-time chat, leave management, payroll processing, and an analytics dashboard — built with Django REST Framework and React.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Docker Setup (Recommended)](#option-1--docker-setup-recommended)
  - [Manual Setup](#option-2--manual-setup)
- [Environment Variables](#-environment-variables)
- [API Documentation](#-api-documentation)
- [Role-Based Access Control](#-role-based-access-control)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🔍 Overview

**WorkForce Hub** is a comprehensive, production-ready Employee Management System designed for small-to-medium organisations. It centralises employee data, streamlines leave workflows, automates payroll calculations, and provides real-time department & company-wide chat — all behind a role-based access control system.

The application ships fully containerised with Docker Compose, including a Redis-backed WebSocket layer for real-time messaging and an auto-seeded database for instant demo readiness.

---

## ✨ Key Features

| Module | Highlights |
| --- | --- |
| **🔐 Authentication** | JWT-based login with access/refresh token rotation, role-aware guards, and profile management with avatar cropping |
| **👥 Employee Management** | Full CRUD for employees with department assignment, designation tracking, profile pictures, and emergency contacts |
| **🏬 Department Management** | Create and organise departments; employees auto-sync to department-based chat groups |
| **📅 Leave Management** | Configurable leave types, per-employee balance tracking, request/approve/reject workflows, and calendar views |
| **💰 Payroll** | Salary records with basic salary, bonus, deductions, and auto-calculated net pay; personal salary history for employees |
| **📊 Analytics Dashboard** | Summary cards, employee/department/leave/payroll drill-down pages, and a centralised activity feed powered by audit logs |
| **💬 Real-Time Chat** | Company-wide and department-based chat rooms via Django Channels + WebSockets, with message history, file attachments, read receipts, and soft-delete |
| **🔔 Notifications** | In-app notification system for leave approvals/rejections and key system events |
| **🌗 Theme Support** | Light and dark mode toggle across the entire UI |

---

## 🛠 Tech Stack

### Backend

| Technology | Purpose |
| --- | --- |
| **Django 5.0** | Web framework & ORM |
| **Django REST Framework** | RESTful API layer |
| **Simple JWT** | Token-based authentication |
| **Django Channels** | WebSocket support (ASGI) |
| **Daphne** | ASGI server |
| **Redis** | Channel layer backend for WebSockets |
| **drf-spectacular** | OpenAPI 3.0 schema & Swagger/ReDoc documentation |
| **django-filter** | Advanced queryset filtering |
| **Pillow** | Image processing (profile pictures) |
| **SQLite** | Default database (swap-ready for PostgreSQL) |

### Frontend

| Technology | Purpose |
| --- | --- |
| **React 19** | UI library |
| **Redux Toolkit 2.8** | Centralised state management (8 slices, async thunks) |
| **Vite 7** | Build tool & dev server |
| **React Router 7** | Client-side routing with protected routes |
| **Axios** | HTTP client with JWT interceptor |
| **Lucide React** | Icon library |
| **Day.js** | Date formatting & manipulation |
| **react-easy-crop** | Profile picture cropping |
| **Tailwind CSS 4** | Utility-first styling |

### DevOps & Tooling

| Technology | Purpose |
| --- | --- |
| **Docker & Docker Compose** | Containerised deployment (multi-stage builds) |
| **Nginx** | Frontend static file serving & reverse proxy |
| **Playwright** | End-to-end browser testing |
| **ESLint** | JavaScript linting |

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         Client (Browser)                     │
│            React 19 + Redux Toolkit + React Router           │
├──────────────────────────────────────────────────────────────┤
│                      Redux Store (8 Slices)                  │
│  auth · theme · chat · employees · departments · leaves      │
│  payroll · dashboard        (async thunks + selectors)       │
└──────────────────┬──────────────────────┬────────────────────┘
                   │ HTTP (REST)          │ WebSocket
                   ▼                      ▼
┌──────────────────────────────┐ ┌─────────────────────────────┐
│      Django REST Framework   │ │    Django Channels (ASGI)    │
│     JWT Auth · Filtering     │ │   Chat Consumers · Signals   │
│     Pagination · Swagger     │ │                               │
└──────────────┬───────────────┘ └──────────┬──────────────────┘
               │                            │
               ▼                            ▼
┌──────────────────────────────┐ ┌─────────────────────────────┐
│          SQLite / DB         │ │       Redis (Channel Layer)  │
│  Users · Employees · Leaves  │ │    Pub/Sub for WebSockets    │
│  Payroll · Chat · AuditLogs  │ │                               │
└──────────────────────────────┘ └─────────────────────────────┘
```

---

## 📁 Project Structure

```
WorkForce_Hub/
├── backend/                        # Django application
│   ├── accounts/                   # Custom User model, auth views, JWT, permissions
│   │   ├── models.py               # User model (admin, hr, manager, employee roles)
│   │   ├── permissions.py          # RBAC permission classes
│   │   ├── views.py                # Login, register, profile endpoints
│   │   └── management/             # Custom management commands (createadmin)
│   ├── employees/                  # Employee & Department CRUD
│   │   ├── models.py               # Employee, Department models
│   │   ├── serializers.py          # Nested serializers with user creation
│   │   ├── signals.py              # Auto-create employee profile on user creation
│   │   └── views.py                # ViewSets with filtering & search
│   ├── leaves/                     # Leave management system
│   │   ├── models.py               # LeaveType, LeaveBalance, LeaveRequest
│   │   ├── views.py                # Apply, approve/reject, balance tracking
│   │   └── signals.py              # Auto-create leave balances
│   ├── payroll/                    # Payroll & salary management
│   │   ├── models.py               # Salary model with auto net-pay calculation
│   │   └── views.py                # Salary CRUD + personal salary history
│   ├── chat/                       # Real-time messaging
│   │   ├── models.py               # ChatMessage, CompanyChatMessage, ReadReceipts
│   │   ├── consumers.py            # WebSocket consumers (company & department)
│   │   └── routing.py              # WebSocket URL routing
│   ├── dashboard/                  # Analytics & notifications
│   │   ├── models.py               # AuditLog, Notification
│   │   ├── views.py                # Summary, drill-downs, notification management
│   │   └── urls.py                 # Dashboard & notification endpoints
│   ├── config/                     # Django project configuration
│   │   ├── settings.py             # Settings with env-based config
│   │   ├── asgi.py                 # ASGI application (Channels routing)
│   │   └── urls.py                 # Root URL configuration
│   ├── seed_data.py                # Idempotent data seeder for demo data
│   ├── entrypoint.sh               # Docker startup: migrate → create admin → seed → serve
│   ├── Dockerfile                  # Multi-stage Python build
│   └── requirements.txt            # Python dependencies
│
├── frontend/                       # React application
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js            # Axios instance with JWT interceptor & token refresh
│   │   ├── store/                  # Redux Toolkit state management
│   │   │   ├── store.js            # configureStore with 8 reducers
│   │   │   └── slices/
│   │   │       ├── authSlice.js    # Login, profile, logout, role selectors
│   │   │       ├── themeSlice.js   # Dark/light mode toggle
│   │   │       ├── chatSlice.js    # Channel-keyed messaging state
│   │   │       ├── employeeSlice.js # Employee CRUD + pagination
│   │   │       ├── departmentSlice.js # Department CRUD (shared lookup)
│   │   │       ├── leaveSlice.js   # Leave requests, types, balances
│   │   │       ├── payrollSlice.js # Salary CRUD
│   │   │       └── dashboardSlice.js # Analytics & drill-down data
│   │   ├── components/
│   │   │   ├── Layout.jsx           # Sidebar navigation, topbar, notification bell
│   │   │   ├── ProtectedRoute.jsx   # Role-based route guard
│   │   │   └── AlertModal.jsx       # Reusable confirmation modal
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx      # Public landing page
│   │   │   ├── Login.jsx            # Login form
│   │   │   ├── Dashboard.jsx        # Main analytics dashboard
│   │   │   ├── Profile.jsx          # User profile with avatar crop
│   │   │   ├── ChangePassword.jsx   # Password change form
│   │   │   ├── employees/           # EmployeeList, EmployeeForm, EmployeeDetail
│   │   │   ├── departments/         # DepartmentList, DepartmentForm
│   │   │   ├── leaves/              # LeaveRequestList, LeaveRequestForm, LeaveTypeList
│   │   │   ├── payroll/             # SalaryList, SalaryForm, MySalary
│   │   │   ├── chat/                # CompanyChat, DepartmentChat
│   │   │   └── dashboard/           # 6 drill-down analytics pages
│   │   ├── App.jsx                  # Root component with route definitions
│   │   ├── main.jsx                 # Entry point (Redux Provider wrap)
│   │   └── index.css                # Global styles
│   ├── Dockerfile                   # Multi-stage Node build → Nginx
│   ├── nginx.conf                   # Nginx configuration for SPA
│   ├── vite.config.js               # Vite configuration
│   └── package.json                 # Node dependencies & scripts
│
├── docker-compose.yml              # Orchestrates: Redis, Backend, Frontend
├── .env                            # Environment variables (not committed)
├── .gitignore                      # Git ignore rules
└── README.md                       # You are here
```

---

## 🚀 Getting Started

### Prerequisites

- **Docker & Docker Compose** (for containerised setup) — [Install Docker](https://docs.docker.com/get-docker/)
- **Or** for manual setup:
  - Python 3.11+
  - Node.js 20+
  - Redis (for WebSocket support)

---

### Option 1 — Docker Setup (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/your-username/WorkForce_Hub.git
cd WorkForce_Hub

# 2. Configure environment variables
#    Edit the .env file at the project root (see Environment Variables section)

# 3. Build and start all services
docker compose up --build -d

# 4. Access the application
#    Frontend  →  http://localhost
#    Backend   →  http://localhost:8000
#    API Docs  →  http://localhost:8000/api/docs/
```

The Docker setup automatically:
- ✅ Starts Redis for WebSocket channel layer
- ✅ Runs database migrations
- ✅ Creates a superuser admin account
- ✅ Seeds demo data (departments, employees, leave types, payroll records)
- ✅ Serves the frontend via Nginx on port 80

**Stop all services:**

```bash
docker compose down
```

**Reset and rebuild from scratch:**

```bash
docker compose down -v    # removes volumes (database data)
docker compose up --build -d
```

---

### Option 2 — Manual Setup

#### Backend

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create and activate a virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Apply database migrations
python manage.py migrate

# 5. Create a superuser
python manage.py createsuperuser

# 6. (Optional) Seed demo data
python seed_data.py

# 7. Start the development server
#    For HTTP only:
python manage.py runserver

#    For HTTP + WebSocket support:
daphne -b 0.0.0.0 -p 8000 config.asgi:application
```

> **Note:** For real-time chat, you need Redis running locally (`redis-server`) and `CHANNEL_LAYER_BACKEND=redis` in your environment. Without Redis, the app falls back to an in-memory channel layer (single-process only).

#### Frontend

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev

# 4. Open the app
#    → http://localhost:5173
```

---

## ⚙ Environment Variables

Create a `.env` file in the project root:

| Variable | Description | Default |
| --- | --- | --- |
| `SECRET_KEY` | Django secret key | `django-insecure-change-this` |
| `DEBUG` | Enable debug mode | `True` |
| `ALLOWED_HOSTS` | Comma-separated allowed hosts | `127.0.0.1,localhost` |
| `REDIS_URL` | Redis connection URL | `redis://redis:6379/0` |
| `CHANNEL_LAYER_BACKEND` | Channel layer (`redis` or `inmemory`) | `inmemory` |
| `DJANGO_SUPERUSER_USERNAME` | Auto-created admin username | `admin` |
| `DJANGO_SUPERUSER_EMAIL` | Auto-created admin email | `admin@workforcehub.com` |
| `DJANGO_SUPERUSER_PASSWORD` | Auto-created admin password | `Admin@123` |
| `VITE_API_URL` | Backend API URL for the frontend | `http://localhost:8000` |

> [!IMPORTANT]
> **For production:** Change `SECRET_KEY` to a strong random value, set `DEBUG=False`, and restrict `ALLOWED_HOSTS`.

---

## 📖 API Documentation

The backend provides auto-generated API documentation via **drf-spectacular**:

| Endpoint | Description |
| --- | --- |
| `GET /api/docs/` | **Swagger UI** — Interactive API explorer |
| `GET /api/redoc/` | **ReDoc** — Alternative API documentation |
| `GET /api/schema/` | **OpenAPI 3.0 Schema** — Raw JSON/YAML schema |

### Key API Endpoints

```
Authentication
  POST   /api/auth/login/              # Obtain JWT tokens
  POST   /api/auth/token/refresh/      # Refresh access token
  GET    /api/auth/me/                 # Current user profile
  PUT    /api/auth/me/                 # Update profile

Employees
  GET    /api/employees/               # List employees (filterable, searchable)
  POST   /api/employees/               # Create employee + user account
  GET    /api/employees/:id/           # Employee detail
  PUT    /api/employees/:id/           # Update employee
  DELETE /api/employees/:id/           # Delete employee

Departments
  GET    /api/departments/             # List departments
  POST   /api/departments/             # Create department
  PUT    /api/departments/:id/         # Update department
  DELETE /api/departments/:id/         # Delete department

Leaves
  GET    /api/leave-types/             # List leave types
  GET    /api/leave-requests/          # List leave requests
  POST   /api/leave-requests/          # Submit leave request
  PATCH  /api/leave-requests/:id/      # Approve / reject

Payroll
  GET    /api/salaries/                # List salary records
  POST   /api/salaries/                # Create salary record
  GET    /api/my-salary/               # Personal salary history

Dashboard
  GET    /api/dashboard/summary/       # Dashboard summary cards
  GET    /api/dashboard/employees/     # Employee analytics
  GET    /api/dashboard/departments/   # Department analytics
  GET    /api/dashboard/leaves/pending/# Pending leave requests
  GET    /api/dashboard/payroll/overview/ # Payroll analytics
  GET    /api/dashboard/activity/      # Audit log activity feed

Notifications
  GET    /api/dashboard/notifications/         # List notifications
  PATCH  /api/dashboard/notifications/:id/read/ # Mark as read
  POST   /api/dashboard/notifications/read-all/ # Mark all as read

Chat (WebSocket)
  ws://   /ws/chat/company/            # Company-wide chat room
  ws://   /ws/chat/department/:id/     # Department chat room
```

---

## 🔒 Role-Based Access Control

The system supports four user roles with hierarchical permissions:

| Feature | Admin | HR | Manager | Employee |
| :--- | :---: | :---: | :---: | :---: |
| **Dashboard (Full Analytics)** | ✅ | ✅ | ❌ | ❌ |
| **View Employees** | ✅ | ✅ | ✅ | ❌ |
| **Create/Edit Employees** | ✅ | ✅ | ❌ | ❌ |
| **Manage Departments** | ✅ | ❌ | ❌ | ❌ |
| **View Departments** | ✅ | ✅ | ❌ | ❌ |
| **Apply for Leave** | ✅ | ✅ | ✅ | ✅ |
| **Approve/Reject Leaves** | ✅ | ✅ | ❌ | ❌ |
| **View All Leave Requests** | ✅ | ✅ | ❌ | ❌ |
| **Manage Payroll** | ✅ | ✅ | ❌ | ❌ |
| **View Own Salary** | ✅ | ✅ | ✅ | ✅ |
| **Company Chat** | ✅ | ✅ | ✅ | ✅ |
| **Edit Own Profile** | ✅ | ✅ | ✅ | ✅ |
| **Change Password** | ✅ | ✅ | ✅ | ✅ |

---

## 📸 Screenshots

> _Screenshots coming soon. Run the application to see the full UI._

<!-- 
Add screenshots here:
![Dashboard](docs/screenshots/dashboard.png)
![Employee List](docs/screenshots/employees.png)
![Chat](docs/screenshots/chat.png)
-->

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Commit** your changes with clear, descriptive messages
   ```bash
   git commit -m "feat: add employee export functionality"
   ```
4. **Push** to your fork
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Open a Pull Request** against the `main` branch

### Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Purpose |
| --- | --- |
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation changes |
| `style:` | Code style (formatting, no logic change) |
| `refactor:` | Code refactoring |
| `test:` | Adding or updating tests |
| `chore:` | Build process or tooling changes |

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend E2E tests
cd frontend
npm run e2e:install   # First time only
npm run e2e
```

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <b>Built with ❤️ using Django & React</b>
  <br />
  <sub>If you find this project useful, give it a ⭐ on GitHub!</sub>
</p>