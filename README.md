# WorkForce Hub

Built as the core project during my internship at Fxis.ai, where I implemented the same stack used in production.

---

## What it does

- Manage employees and departments
- Leave requests with approval workflow
- Payroll and salary tracking
- Real-time chat using WebSockets
- Role-based access control (Admin, HR, Manager, Employee)
- Dashboard with analytics and audit logs

---

## Tech Stack

**Backend:** Django 5.0, Django REST Framework, Django Channels, Redis, Simple JWT

**Frontend:** React 19, Redux Toolkit, React Router 7, Tailwind CSS, Axios, Vite

**Deployment:** Docker, Docker Compose, Nginx, Daphne

---

## Getting Started

### With Docker (easiest)

```bash
git clone https://github.com/meetkanteliya/WorkForce_Hub.git
cd WorkForce_Hub
docker-compose up --build -d
```

- Frontend: http://localhost
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/api/docs/

Default login — username: `admin` password: `Admin@123`

### Without Docker

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
redis-server  # in a separate terminal
daphne -b 0.0.0.0 -p 8000 config.asgi:application
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables

Create a `.env` file in the root:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost
REDIS_URL=redis://redis:6379/0
DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_EMAIL=admin@workforcehub.com
DJANGO_SUPERUSER_PASSWORD=Admin@123
VITE_API_URL=http://localhost:8000
```

---

## Role-Based Access

| Feature | Admin | HR | Manager | Employee |
|---------|:-----:|:--:|:-------:|:--------:|
| Dashboard Analytics | ✅ | ✅ | ❌ | ❌ |
| View All Employees | ✅ | ✅ | ✅ dept only | ❌ |
| Add/Edit Employees | ✅ | ✅ | ❌ | ❌ |
| Manage Departments | ✅ | ❌ | ❌ | ❌ |
| Apply for Leave | ✅ | ✅ | ✅ | ✅ |
| Approve/Reject Leaves | ✅ | ✅ | ❌ | ❌ |
| Manage Payroll | ✅ | ✅ | ❌ | ❌ |
| View Own Salary | ✅ | ✅ | ✅ | ✅ |
| Chat | ✅ | ✅ | ✅ | ✅ |

---

## API Endpoints

```
POST   /api/auth/login/
POST   /api/auth/token/refresh/
GET    /api/auth/profile/

GET    /api/employees/
POST   /api/employees/
GET    /api/employees/{id}/
PUT    /api/employees/{id}/
DELETE /api/employees/{id}/

GET    /api/departments/
POST   /api/departments/

GET    /api/leave-requests/
POST   /api/leave-requests/
PATCH  /api/leave-requests/{id}/

GET    /api/salaries/
POST   /api/salaries/
GET    /api/my-salary/

GET    /api/dashboard/summary/

ws://localhost:8000/ws/company-chat/?token=<jwt>
ws://localhost:8000/ws/chat/<dept_id>/?token=<jwt>
```

---

## Contact

**Meet Kanteliya** — [GitHub](https://github.com/meetkanteliya) · [LinkedIn](https://www.linkedin.com/in/meet-kanteliya-880411257/) · meetbhai520@gmail.com
