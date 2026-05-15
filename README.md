# WorkForce Hub

A full-stack employee management system built with Django and React. This project includes employee records, leave management, payroll tracking, and real-time chat functionality.

![Django](https://img.shields.io/badge/Django-5.0-092E20?style=flat-square&logo=django)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![Redux](https://img.shields.io/badge/Redux_Toolkit-2.11-764ABC?style=flat-square&logo=redux)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker)

---

## What This Project Does

This is a learning project I built to practice full-stack development. It's a basic HR management system where you can:

- Manage employee records and departments
- Handle leave requests with approval workflow
- Track salary records
- Chat in real-time using WebSockets
- View dashboard analytics
- Control access based on user roles (Admin, HR, Manager, Employee)

**Note:** This is a portfolio project for learning purposes. It uses SQLite and isn't meant for actual production use without significant changes.

---

## Tech Stack

### Backend
- **Django 5.0** - Main web framework
- **Django REST Framework** - For building the API
- **Django Channels** - WebSocket support for chat
- **Redis** - Channel layer for WebSocket messages
- **Simple JWT** - Token-based authentication
- **SQLite** - Database (default, not recommended for production)
- **Drf-spectacular** - Auto-generated API docs

### Frontend
- **React 19** - UI library
- **Redux Toolkit** - State management
- **React Router 7** - Client-side routing
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Axios** - HTTP requests
- **Day.js** - Date formatting

### Deployment
- **Docker & Docker Compose** - Containerization
- **Nginx** - Serves frontend static files
- **Daphne** - ASGI server for Django

---

## Features

### Authentication & Authorization
- JWT-based login with token refresh
- 4 user roles: Admin, HR, Manager, Employee
- Role-based route protection
- Password change functionality

### Employee Management
- Create, view, update, delete employees
- Assign employees to departments
- Upload profile pictures with cropping
- Search and filter employees
- Different views based on user role

### Department Management
- Create and manage departments
- View employees by department
- Admin-only access

### Leave Management
- Multiple leave types (sick, casual, etc.)
- Leave balance tracking per employee
- Apply for leave with date range
- Approve/reject leave requests (Admin/HR only)
- Automatic balance calculations
- Leave history view

### Payroll
- Record salary payments
- Automatic net salary calculation (basic + bonus - deductions)
- View salary history
- Employees can view their own salary records

### Dashboard
- Summary cards showing key metrics
- Employee statistics
- Department distribution
- Pending leave requests
- Activity audit log
- Attendance tracking (check-in/check-out)

### Real-Time Chat
- Company-wide chat room
- Department-specific chat rooms
- WebSocket-powered instant messaging
- Message reactions (one emoji per user per message)
- Reply to messages
- File attachments (images, PDFs, docs)
- Typing indicators
- Soft delete messages (audit trail preserved)
- Automatic reconnection on disconnect

### Notifications
- In-app notifications for leave approvals/rejections
- Mark as read functionality
- Notification clearing

### UI Features
- Dark mode toggle
- Responsive design
- Loading states
- Error handling
- Optimistic UI updates for chat

---

## Project Structure

```
WorkForce_Hub/
├── backend/
│   ├── accounts/          # User model, auth, JWT
│   ├── employees/         # Employee & department models/views
│   ├── leaves/            # Leave management
│   ├── payroll/           # Salary records
│   ├── dashboard/         # Analytics, audit logs, notifications
│   ├── chat/              # WebSocket consumers, chat models
│   ├── config/            # Django settings, ASGI config
│   ├── media/             # Uploaded files
│   ├── manage.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── api/           # Axios setup
│   │   ├── store/         # Redux slices (8 slices)
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
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

## Getting Started

### Option 1: Docker (Recommended)

**Prerequisites:**
- Docker and Docker Compose installed

**Steps:**

```bash
# 1. Clone the repository
git clone https://github.com/meetkanteliya/WorkForce_Hub.git
cd WorkForce_Hub

# 2. Start all services
docker-compose up --build -d

# 3. Access the application
# Frontend: http://localhost
# Backend: http://localhost:8000
# API Docs: http://localhost:8000/api/docs/
```

**Default login:**
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

### Option 2: Manual Setup

**Prerequisites:**
- Python 3.11+
- Node.js 20+
- Redis server

**Backend:**

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

# Start Redis (in another terminal)
redis-server

# Start Django server
daphne -b 0.0.0.0 -p 8000 config.asgi:application
```

**Frontend:**

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev

# Access at http://localhost:5173
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Django
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost

# Redis
REDIS_URL=redis://redis:6379/0
CHANNEL_LAYER_BACKEND=redis

# Auto-created admin user
DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_EMAIL=admin@workforcehub.com
DJANGO_SUPERUSER_PASSWORD=Admin@123

# Frontend
VITE_API_URL=http://localhost:8000
```

---

## API Documentation

Once the backend is running, you can access interactive API documentation:

- **Swagger UI:** http://localhost:8000/api/docs/
- **ReDoc:** http://localhost:8000/api/redoc/
- **OpenAPI Schema:** http://localhost:8000/api/schema/

### Main API Endpoints

```
Authentication:
  POST   /api/auth/login/
  POST   /api/auth/token/refresh/
  GET    /api/auth/profile/
  POST   /api/auth/change-password/

Employees:
  GET    /api/employees/
  POST   /api/employees/
  GET    /api/employees/{id}/
  PUT    /api/employees/{id}/
  DELETE /api/employees/{id}/

Departments:
  GET    /api/departments/
  POST   /api/departments/

Leaves:
  GET    /api/leave-types/
  GET    /api/leave-requests/
  POST   /api/leave-requests/
  PATCH  /api/leave-requests/{id}/

Payroll:
  GET    /api/salaries/
  POST   /api/salaries/
  GET    /api/my-salary/

Dashboard:
  GET    /api/dashboard/summary/
  GET    /api/dashboard/employees/
  GET    /api/dashboard/activity/
  GET    /api/dashboard/notifications/

WebSocket:
  ws://localhost:8000/ws/company-chat/?token=<jwt>
  ws://localhost:8000/ws/chat/<dept_id>/?token=<jwt>
```

---

## Role-Based Access

Different features are available based on user role:

| Feature | Admin | HR | Manager | Employee |
|---------|:-----:|:--:|:-------:|:--------:|
| View Dashboard Analytics | ✅ | ✅ | ❌ | ❌ |
| View All Employees | ✅ | ✅ | ✅ (dept only) | ❌ |
| Add/Edit Employees | ✅ | ✅ | ❌ | ❌ |
| Manage Departments | ✅ | ❌ | ❌ | ❌ |
| Apply for Leave | ✅ | ✅ | ✅ | ✅ |
| Approve/Reject Leaves | ✅ | ✅ | ❌ | ❌ |
| Manage Payroll | ✅ | ✅ | ❌ | ❌ |
| View Own Salary | ✅ | ✅ | ✅ | ✅ |
| Company Chat | ✅ | ✅ | ✅ | ✅ |
| Department Chat | ✅ | ✅ | ✅ | ✅ |

---

## WebSocket Chat

The chat system uses Django Channels with Redis as the channel layer.

### How it works:
1. Client connects to WebSocket with JWT token in query params
2. Server validates token and checks permissions
3. Messages are broadcast to all connected clients in the room
4. Frontend handles optimistic updates and reconnection

### Features:
- Real-time message delivery
- Automatic reconnection with exponential backoff
- Offline message queue
- Typing indicators
- Message reactions (one per user per message)
- Reply to messages
- File attachments (5MB limit)
- Soft delete (messages hidden but preserved in DB)

### Connection URLs:
```
Company Chat: ws://localhost:8000/ws/company-chat/?token=YOUR_JWT_TOKEN
Department Chat: ws://localhost:8000/ws/chat/DEPT_ID/?token=YOUR_JWT_TOKEN
```

---

## Known Limitations

This is a learning project, so there are some limitations:

- **SQLite database** - Not suitable for concurrent users or production
- **No email notifications** - Only in-app notifications
- **Basic error handling** - Could be more comprehensive
- **Limited test coverage** - Needs more unit and integration tests
- **No CI/CD pipeline** - Manual deployment only
- **Single-tenant** - Not designed for multiple organizations
- **No advanced analytics** - Basic aggregations only
- **File uploads not validated thoroughly** - Basic MIME type checking only

---

## What I Learned

Building this project helped me learn:

1. **Django REST Framework** - Building a RESTful API with proper serializers and viewsets
2. **WebSocket with Django Channels** - Real-time communication and handling connections
3. **JWT Authentication** - Token-based auth with refresh mechanism
4. **Redux Toolkit** - Managing complex state in React
5. **Role-based permissions** - Implementing access control at API and UI level
6. **Docker** - Containerizing applications and using Docker Compose
7. **Database relationships** - Foreign keys, one-to-one, many-to-many relationships
8. **File uploads** - Handling multipart form data and image processing

---

## Troubleshooting

### Chat not working
- Make sure Redis is running: `docker-compose ps`
- Check backend logs: `docker-compose logs backend`
- Verify `CHANNEL_LAYER_BACKEND=redis` in `.env`

### Token expired errors
- Tokens expire after 30 minutes
- Frontend should auto-refresh, but you can manually re-login

### Docker build fails
- Clean Docker cache: `docker system prune -a`
- Remove volumes: `docker-compose down -v`
- Rebuild: `docker-compose up --build -d`

### File upload rejected
- Check file size (5MB limit)
- Verify file type is allowed
- Check backend logs for specific error

---

## Future Improvements

If I continue working on this, I'd add:

- [ ] Switch to PostgreSQL
- [ ] Add comprehensive test suite
- [ ] Email notifications
- [ ] Better error handling and validation
- [ ] Performance optimization (query optimization, caching)
- [ ] Mobile responsive improvements
- [ ] Export reports (PDF, Excel)
- [ ] Advanced analytics and charts
- [ ] Bulk operations
- [ ] Search improvements

---

## License

This project is open source and available under the MIT License.

---

## Contact

**Meet Kanteliya**
- GitHub: [@meetkanteliya](https://github.com/meetkanteliya)
- LinkedIn: [Meet Kanteliya](https://www.linkedin.com/in/meet-kanteliya-880411257/)
- Email: meetbhai520@gmail.com

---

## Acknowledgments

Built as a learning project to practice full-stack development with Django and React. Thanks to the open-source community for the amazing tools and documentation.

---

*This is a portfolio/learning project. While functional, it's not production-ready and would need significant changes for real-world use.*
