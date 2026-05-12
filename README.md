<div align="center">

# 🏢 WorkForce Hub

### Enterprise-Grade Employee Management System

*Full-stack application with real-time WebSocket communication, role-based access control, and comprehensive HR management*

[![Django](https://img.shields.io/badge/Django-5.0-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Redux](https://img.shields.io/badge/Redux_Toolkit-2.11-764ABC?style=for-the-badge&logo=redux&logoColor=white)](https://redux-toolkit.js.org/)
[![WebSocket](https://img.shields.io/badge/WebSocket-Channels_4.3-FF6F00?style=for-the-badge)](https://channels.readthedocs.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

[🚀 Live Demo](#) • [📖 Documentation](#-api-documentation) • [🐛 Report Bug](../../issues) • [✨ Request Feature](../../issues)

</div>

---

## 🎯 Why This Project?

This project demonstrates **production-ready full-stack development skills** that companies look for:

- ✅ **Real-time Communication** - WebSocket implementation with automatic reconnection, offline queuing, and optimistic updates
- ✅ **Scalable Architecture** - Modular Django apps, Redux state management, and containerized deployment
- ✅ **Security Best Practices** - JWT authentication, role-based permissions, file validation, and CSRF protection
- ✅ **Modern Tech Stack** - Latest versions of Django 5.0, React 19, and industry-standard tools
- ✅ **Production Deployment** - Docker Compose orchestration with Redis, Nginx, and multi-stage builds
- ✅ **Clean Code** - RESTful API design, component reusability, and separation of concerns
- ✅ **User Experience** - Responsive design, dark mode, optimistic UI updates, and error handling

---

## 📊 Project Metrics

<div align="center">

| Metric | Value |
|--------|-------|
| **Backend Modules** | 6 Django Apps (Accounts, Employees, Leaves, Payroll, Dashboard, Chat) |
| **API Endpoints** | 40+ RESTful endpoints with OpenAPI documentation |
| **Frontend Components** | 50+ React components with Redux state management |
| **Real-time Features** | WebSocket chat with typing indicators, reactions, and file sharing |
| **Authentication** | JWT with role-based access control (4 roles) |
| **Database Models** | 15+ models with relationships and constraints |
| **Deployment** | Docker Compose with 3 services (Backend, Frontend, Redis) |

</div>

---

## 🛠 Skills Demonstrated

<table>
<tr>
<td width="50%">

### Backend Development
- Django REST Framework API design
- WebSocket real-time communication
- JWT authentication & authorization
- Database modeling & migrations
- File upload handling & validation
- Signal-based event handling
- Custom management commands
- API documentation (OpenAPI/Swagger)

</td>
<td width="50%">

### Frontend Development
- React 19 with hooks & context
- Redux Toolkit state management
- Real-time WebSocket integration
- Responsive UI with Tailwind CSS
- Form handling & validation
- Image cropping & file uploads
- Optimistic UI updates
- Dark mode implementation

</td>
</tr>
<tr>
<td width="50%">

### DevOps & Deployment
- Docker containerization
- Docker Compose orchestration
- Multi-stage builds
- Nginx configuration
- Redis integration
- Environment configuration
- Volume management

</td>
<td width="50%">

### Software Engineering
- RESTful API design patterns
- Component-based architecture
- State management patterns
- Error handling & recovery
- Security best practices
- Code organization & modularity
- Git version control

</td>
</tr>
</table>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Real-Time Chat](#-real-time-chat)
- [Role-Based Access](#-role-based-access)
- [API Documentation](#-api-documentation)
- [Production Notes](#-production-notes)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)

---

## 📸 Screenshots

<div align="center">

### Dashboard
![Dashboard](https://github.com/user-attachments/assets/dashboard.png)
*Real-time analytics with attendance tracking, leave status, and organizational metrics*

### Employee Management
![Employees](https://github.com/user-attachments/assets/employees.png)
*Comprehensive employee directory with search, filters, and role management*

### Leave Management
![Leave Management](https://github.com/user-attachments/assets/leaves.png)
*Leave request workflow with approval/rejection system and status tracking*

### Payroll
![Payroll](https://github.com/user-attachments/assets/payroll.png)
*Salary management with automatic net pay calculation (basic + bonus - deductions)*

### Real-Time Chat
![Team Chat](https://github.com/user-attachments/assets/chat.png)
*Company-wide chat with @mentions, reactions, and message threading*

</div>

---

## 🔍 Overview

**WorkForce Hub** is a comprehensive employee management system that demonstrates modern full-stack development practices. Built with Django REST Framework and React, it showcases real-world application architecture, from authentication and authorization to real-time communication.

### 🎯 Key Highlights

- **🔐 Secure Authentication** - JWT-based auth with automatic token refresh and role-based permissions
- **⚡ Real-Time Communication** - WebSocket-powered chat with automatic reconnection and offline support
- **📊 Comprehensive HR Features** - Employee management, leave tracking, payroll processing, and analytics
- **🎨 Modern UI/UX** - Responsive design with dark mode, optimistic updates, and smooth animations
- **🐳 Production-Ready** - Fully containerized with Docker Compose for easy deployment
- **📚 Well-Documented** - OpenAPI/Swagger documentation for all API endpoints

### 💼 Business Value

This system provides essential HR functionality for small-to-medium organizations:
- Centralized employee records and department management
- Automated leave balance tracking and approval workflows
- Payroll management with automatic calculations
- Real-time team communication with file sharing
- Activity audit logs and analytics dashboard
- Role-based access control for data security

### 🎓 Learning Project

While functional and feature-complete, this is primarily a **portfolio project** demonstrating:
- Full-stack development capabilities
- Modern web technologies and best practices
- System design and architecture skills
- Problem-solving and implementation abilities

---

## ✨ Features

### Core Modules

#### 🔐 Authentication
- JWT-based authentication with token refresh
- Role-based access control (Admin, HR, Manager, Employee)
- Password change functionality
- Profile management with avatar upload

#### 👥 Employee Management
- CRUD operations for employee records
- Department assignment
- Profile picture upload with cropping
- Search and filter capabilities
- Employee detail views

#### 🏬 Department Management
- Department creation and organization
- Employee-department associations
- Department-based chat rooms

#### 📅 Leave Management
- Configurable leave types
- Per-employee leave balance tracking
- Leave request workflow
- Approval/rejection system
- Leave history views
- Automatic balance calculations

#### 💰 Payroll
- Salary record management
- Automatic net pay calculation (basic + bonus - deductions)
- Personal salary history
- Payroll overview and statistics

#### 📊 Dashboard & Analytics
- Summary cards with key metrics
- Employee statistics
- Department distribution
- Leave request tracking
- Payroll overview
- Activity feed (audit logs)
- Attendance tracking (check-in/out, hours worked)
- Manager dashboard (team view)
- Employee self-dashboard

#### 💬 Real-Time Chat
- **Company-wide chat** - All employees
- **Department chat** - Team-specific channels
- **WebSocket-powered** - Instant delivery
- **Message features:**
  - File attachments (images, PDFs, docs)
  - Reply to messages
  - Emoji reactions (one per user per message)
  - Message deletion (soft-delete with audit trail)
  - Typing indicators
  - Read receipts (backend ready)
- **Reliability features:**
  - Automatic reconnection with exponential backoff
  - Optimistic message rendering
  - Offline message queue
  - WebSocket payload safety
  - Scroll performance optimization

#### 🔔 Notifications
- In-app notification system
- Leave approval/rejection notifications
- Mark as read functionality
- Notification clearing

#### 🌗 Theme
- Light and dark mode toggle
- Persistent theme preference

---

## 🛠 Tech Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Django | 5.0 | Web framework |
| Django REST Framework | 3.16 | RESTful API |
| Django Channels | 4.3 | WebSocket support |
| Simple JWT | 5.5 | Authentication |
| Daphne | 4.1 | ASGI server |
| Redis | 7 | WebSocket channel layer |
| drf-spectacular | 0.29 | API documentation |
| Pillow | 12.1 | Image processing |
| SQLite | - | Database (default) |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19 | UI library |
| Redux Toolkit | 2.11 | State management |
| React Router | 7 | Client-side routing |
| Vite | 7 | Build tool |
| Tailwind CSS | 4 | Styling |
| Axios | 1.13 | HTTP client |
| Day.js | 1.11 | Date handling |
| Lucide React | 0.575 | Icons |
| react-easy-crop | 5.5 | Image cropping |

### DevOps
- Docker & Docker Compose
- Nginx (static file serving)
- Multi-stage builds

---

## 🏗 Architecture

### System Design

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  React 19 + Redux Toolkit + Tailwind CSS + WebSocket Client │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTP/REST + WebSocket
                     │
┌────────────────────▼────────────────────────────────────────┐
│                      API Gateway (Nginx)                     │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼────────┐       ┌───────▼────────┐
│  Django REST   │       │    Django      │
│   Framework    │       │   Channels     │
│  (HTTP/REST)   │       │  (WebSocket)   │
└───────┬────────┘       └───────┬────────┘
        │                        │
        │                        │
┌───────▼────────────────────────▼────────┐
│         Django ORM + SQLite              │
└──────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼────────┐       ┌───────▼────────┐
│  File Storage  │       │  Redis Cache   │
│    (Media)     │       │  (WebSocket)   │
└────────────────┘       └────────────────┘
```

### Key Architectural Decisions

1. **Modular Django Apps** - Each feature (employees, leaves, payroll, chat) is a separate app for maintainability
2. **Redux State Management** - Centralized state with 8 slices for predictable data flow
3. **WebSocket + REST Hybrid** - REST for CRUD operations, WebSocket for real-time features
4. **JWT Authentication** - Stateless authentication with automatic token refresh
5. **Docker Compose** - Multi-container orchestration for easy deployment
6. **Redis Channel Layer** - Scalable WebSocket message distribution

---

## 📁 Project Structure

```
WorkForce_Hub/
├── backend/
│   ├── accounts/           # User model, auth, permissions
│   ├── employees/          # Employee & department management
│   ├── leaves/             # Leave management system
│   ├── payroll/            # Salary management
│   ├── dashboard/          # Analytics, audit logs, notifications
│   ├── chat/               # Real-time messaging
│   ├── config/             # Django settings, ASGI, URLs
│   ├── media/              # Uploaded files
│   ├── manage.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── api/            # Axios configuration
│   │   ├── store/          # Redux slices (8 slices)
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   │   ├── chat/       # Chat pages + components + hooks
│   │   │   ├── employees/
│   │   │   ├── departments/
│   │   │   ├── leaves/
│   │   │   ├── payroll/
│   │   │   └── dashboard/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
│
├── docker-compose.yml
├── .env
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Docker & Docker Compose** (recommended)
- **Or** Python 3.11+, Node.js 20+, Redis (for manual setup)

### Docker Setup (Recommended)

```bash
# 1. Clone repository
git clone https://github.com/yourusername/WorkForce_Hub.git
cd WorkForce_Hub

# 2. Create .env file
cp .env.example .env
# Edit .env with your configuration

# 3. Build and start services
docker-compose up --build -d

# 4. Access application
# Frontend:  http://localhost
# Backend:   http://localhost:8000
# API Docs:  http://localhost:8000/api/docs/
```

**Default credentials:**
- Username: `admin`
- Password: `Admin@123`

**Stop services:**
```bash
docker-compose down
```

**Reset database:**
```bash
docker-compose down -v
docker-compose up --build -d
```

### Manual Setup

#### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start Redis (required for WebSocket)
redis-server

# Start server
daphne -b 0.0.0.0 -p 8000 config.asgi:application
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev

# Access at http://localhost:5173
```

---

## ⚙ Environment Variables

Create `.env` file in project root:

```env
# Django
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost

# Redis & WebSocket
REDIS_URL=redis://redis:6379/0
CHANNEL_LAYER_BACKEND=redis

# Auto-created Admin
DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_EMAIL=admin@workforcehub.com
DJANGO_SUPERUSER_PASSWORD=Admin@123

# Frontend
VITE_API_URL=http://localhost:8000
VITE_BACKEND_ORIGIN=http://localhost:8000
```

---

## 🔌 Real-Time Chat

### Architecture

The chat system uses Django Channels with Redis for WebSocket communication:

```
Client (React) <--WebSocket--> Django Channels <--Redis--> Other Clients
```

### Features

#### Connection Management
- **Automatic reconnection** with exponential backoff
- **Connection status** indicators (online/offline/reconnecting)
- **Offline queue** - Messages sent when offline are queued and sent on reconnection
- **JWT authentication** - WebSocket connections require valid token

#### Message Features
- **Optimistic rendering** - Messages appear instantly, reconciled with server
- **Status indicators** - Sending → Delivered → Failed
- **File attachments** - Images, PDFs, DOCX, XLSX, CSV, TXT (5MB limit)
- **Reply threading** - Reply to specific messages
- **Emoji reactions** - One reaction per user per message (database enforced)
- **Soft delete** - Messages marked deleted, not removed (audit trail)
- **Typing indicators** - Real-time typing status

#### Security
- **MIME type validation** - Server validates actual file type
- **Extension matching** - Extension must match MIME type
- **SVG blocked** - SVG files rejected (XSS risk)
- **Payload safety** - Try/catch on all JSON parsing
- **File size limits** - 5MB maximum

#### WebSocket Endpoints

```
Company Chat:     ws://localhost:8000/ws/company-chat/?token=<jwt>
Department Chat:  ws://localhost:8000/ws/chat/<dept_id>/?token=<jwt>
```

---

## 🔒 Role-Based Access

| Feature | Admin | HR | Manager | Employee |
|---------|:-----:|:--:|:-------:|:--------:|
| Dashboard Analytics | ✅ | ✅ | ❌ | ❌ |
| View All Employees | ✅ | ✅ | ✅ | ❌ |
| Create/Edit Employees | ✅ | ✅ | ❌ | ❌ |
| Manage Departments | ✅ | ❌ | ❌ | ❌ |
| Apply for Leave | ✅ | ✅ | ✅ | ✅ |
| Approve/Reject Leaves | ✅ | ✅ | ❌ | ❌ |
| Manage Payroll | ✅ | ✅ | ❌ | ❌ |
| View Own Salary | ✅ | ✅ | ✅ | ✅ |
| Company Chat | ✅ | ✅ | ✅ | ✅ |
| Department Chat | ✅ | ✅ | ✅ | ✅ |

---

## 📖 API Documentation

### Interactive Docs

| Endpoint | Description |
|----------|-------------|
| `/api/docs/` | Swagger UI - Interactive API explorer |
| `/api/redoc/` | ReDoc - Alternative documentation |
| `/api/schema/` | OpenAPI Schema - Raw JSON/YAML |

### Key Endpoints

```
Authentication
  POST   /api/auth/login/              # Login
  POST   /api/auth/token/refresh/      # Refresh token
  GET    /api/auth/me/                 # Current user
  POST   /api/auth/change-password/    # Change password

Employees
  GET    /api/employees/               # List employees
  POST   /api/employees/               # Create employee
  GET    /api/employees/{id}/          # Get employee
  PUT    /api/employees/{id}/          # Update employee
  DELETE /api/employees/{id}/          # Delete employee

Departments
  GET    /api/departments/             # List departments
  POST   /api/departments/             # Create department

Leaves
  GET    /api/leave-types/             # List leave types
  GET    /api/leave-requests/          # List leave requests
  POST   /api/leave-requests/          # Create leave request
  PATCH  /api/leave-requests/{id}/     # Approve/reject

Payroll
  GET    /api/salaries/                # List salaries
  POST   /api/salaries/                # Create salary
  GET    /api/my-salary/               # Own salary history

Dashboard
  GET    /api/dashboard/summary/       # Dashboard summary
  GET    /api/dashboard/employees/     # Employee analytics
  GET    /api/dashboard/departments/   # Department analytics
  GET    /api/dashboard/activity/      # Activity feed

Notifications
  GET    /api/dashboard/notifications/ # List notifications
  PATCH  /api/dashboard/notifications/{id}/read/ # Mark as read

Chat (WebSocket)
  ws://  /ws/company-chat/             # Company chat
  ws://  /ws/chat/{dept_id}/           # Department chat
```

---

## 🚨 Production Notes

### ⚠️ Important Considerations

**This project uses SQLite by default, which is NOT recommended for production.**

#### Before Production Deployment:

1. **Database**
   - Switch to PostgreSQL or MySQL
   - Configure proper database backups
   - Set up database connection pooling

2. **Security**
   - Change `SECRET_KEY` to a strong random value
   - Set `DEBUG=False`
   - Restrict `ALLOWED_HOSTS` to your domain
   - Change `CORS_ALLOW_ALL_ORIGINS` to specific origins
   - Use strong passwords for admin accounts
   - Enable HTTPS
   - Configure rate limiting

3. **Performance**
   - Use Gunicorn/uWSGI instead of Daphne for HTTP
   - Keep Daphne only for WebSocket
   - Configure Redis persistence
   - Set up CDN for static files
   - Enable database query optimization

4. **Monitoring**
   - Add logging configuration
   - Set up error tracking (Sentry)
   - Configure performance monitoring
   - Set up uptime monitoring

5. **Testing**
   - Add comprehensive test coverage
   - Set up CI/CD pipeline
   - Perform load testing

### Current Limitations

- ❌ Limited test coverage
- ❌ SQLite not suitable for concurrent users
- ❌ No email notifications (in-app only)
- ❌ No advanced analytics (basic aggregations)
- ❌ Single-tenant architecture
- ❌ No SSO/OAuth integration
- ❌ No automated backups

---

## 🔧 Troubleshooting

### WebSocket Connection Issues

**Problem:** Chat not working, "Reconnecting..." message

**Solutions:**
1. Ensure Redis is running: `docker-compose ps`
2. Check backend logs: `docker-compose logs backend`
3. Verify `CHANNEL_LAYER_BACKEND=redis` in `.env`
4. Restart services: `docker-compose restart`

### File Upload Failures

**Problem:** File upload rejected

**Solutions:**
1. Check file type (allowed: images, PDF, text, CSV, DOCX, XLSX)
2. Verify file size under 5MB
3. Ensure extension matches file type
4. SVG files are blocked for security

### Authentication Issues

**Problem:** Token expired errors

**Solutions:**
1. Token expires after 30 minutes - refresh or re-login
2. Clear browser localStorage and login again
3. Check backend is running

### Docker Build Failures

**Solutions:**
1. Clean Docker cache: `docker system prune -a`
2. Remove volumes: `docker-compose down -v`
3. Rebuild: `docker-compose up --build -d`

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m "feat: add your feature"`
4. Push to branch: `git push origin feature/your-feature`
5. Open a Pull Request

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Code style
- `refactor:` - Code refactoring
- `test:` - Tests
- `chore:` - Build/tooling

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Your Name**

- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your Name](https://linkedin.com/in/yourprofile)
- Email: your.email@example.com
- Portfolio: [yourportfolio.com](https://yourportfolio.com)

---

## 🙏 Acknowledgments

This project was built to demonstrate modern full-stack development capabilities using industry-standard technologies and best practices.

### Technologies & Tools
- [Django](https://www.djangoproject.com/) - High-level Python web framework
- [React](https://react.dev/) - JavaScript library for building user interfaces
- [Redux Toolkit](https://redux-toolkit.js.org/) - State management
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Django Channels](https://channels.readthedocs.io/) - WebSocket support for Django
- [Docker](https://www.docker.com/) - Containerization platform

### Learning Resources
- Django REST Framework documentation
- React and Redux official guides
- WebSocket and real-time communication patterns
- Docker and containerization best practices

---

## 📝 Project Status

**Status:** ✅ Active Development

This is a portfolio project demonstrating full-stack development skills. While functional and feature-complete for demonstration purposes, it would require additional hardening, testing, and optimization for production deployment at scale.

### Future Enhancements (Potential)
- [ ] PostgreSQL/MySQL database support
- [ ] Email notification system
- [ ] Advanced analytics and reporting
- [ ] Multi-tenant architecture
- [ ] SSO/OAuth integration
- [ ] Comprehensive test coverage
- [ ] CI/CD pipeline
- [ ] Performance optimization
- [ ] Mobile responsive improvements
- [ ] Internationalization (i18n)

---

## 💡 What I Learned

Building this project helped me develop and demonstrate:

1. **Full-Stack Architecture** - Designing and implementing a complete system from database to UI
2. **Real-Time Communication** - WebSocket implementation with reliability features
3. **State Management** - Complex state handling with Redux Toolkit
4. **Authentication & Authorization** - JWT-based security with role-based access
5. **API Design** - RESTful API principles and OpenAPI documentation
6. **DevOps Practices** - Containerization, orchestration, and deployment
7. **Problem Solving** - Handling edge cases, error recovery, and user experience
8. **Code Organization** - Modular architecture and separation of concerns

---

<div align="center">

### ⭐ If you find this project interesting, please give it a star!

**Thank you for checking out WorkForce Hub!**

Made with ❤️ and ☕ by [Your Name]

[⬆ Back to Top](#-workforce-hub)

</div>
