# WorkForce Hub 🚀

**WorkForce Hub** is a modern, all-in-one Human Resource Management System (HRMS) and Collaboration Platform designed to streamline organizational workflows. From real-time communication to automated payroll and leave management, it empowers employees and management with a centralized, role-based dashboard.

---

## 🌟 Key Features

### 🏢 Organization & Employee Management
- **Role-Based Access**: Specialized interfaces for Admin, HR, Manager, and Employee roles.
- **Dynamic Profiles**: Manage employee data, designations, and department affiliations with ease.
- **Departmental Structure**: Organize your workforce into logical units for better management.

### 💬 Real-Time Communication
- **Company-Wide Chat**: A unified channel for organization-wide announcements and discussions.
- **Departmental Channels**: Private, real-time chat spaces for specific teams.
- **Interactive Messaging**: Includes typing indicators, presence tracking (join/leave), and file sharing.

### 📅 Advanced Leave Management
- **Seamless Requests**: Employees can request various leave types (Sick, Casual, Paid, etc.) directly.
- **Automated Balances**: Real-time tracking of allocated vs. used leave days.
- **Approval Workflow**: Managers and HR can review, approve, or reject requests with instant notifications.

### 💰 Payroll & Salary Management
- **Automated Slip Generation**: Monthly salary slips based on basic pay, bonuses, and deductions.
- **Net Salary Calculation**: Accurate, automated math for payroll processing.
- **Pay History**: Secure access for employees to view and download their past salary records.

### 📊 Dashboard & Monitoring
- **Audit Logs**: Transparent tracking of critical actions (profile updates, leave approvals, salary payments).
- **Global Notifications**: Stay updated with real-time alerts for messages, approvals, and system updates.

---

## 💎 Project Benefits

- **Boosted Productivity**: Eliminates administrative bottlenecks by automating repetitive tasks like leave tracking and payroll.
- **Enhanced Collaboration**: Integrated chat tools keep teams connected without switching between external apps.
- **Data Integrity & Security**: Role-based permissions and audit logging ensure that sensitive information is only accessible by authorized personnel.
- **Improved Employee Experience**: Self-service portals allow employees to manage their own profiles, leaves, and payroll records independently.
- **Scalability**: Designed with a modular architecture (Django + React) to grow alongside your organization.

---

## 🛠️ Technology Stack

### Backend
- **Core**: Django 5.0
- **API**: Django REST Framework (DRF)
- **Real-Time**: Django Channels (WebSockets) + Redis
- **Auth**: Simple JWT (JSON Web Tokens)
- **Documentation**: drf-spectacular (Swagger/ReDoc)

### Frontend
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS 4.0
- **Routing**: React Router 7
- **Icons**: Lucide React & React Icons

---

## ⚙️ Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- Redis (for WebSockets)

### Backend Setup
1. Navigate to the `backend` directory.
2. Create and activate a virtual environment.
3. Install dependencies: `pip install -r requirements.txt`.
4. Setup environment variables in a `.env` file.
5. Run migrations: `python manage.py migrate`.
6. Start the server: `python manage.py runserver`.

### Frontend Setup
1. Navigate to the `frontend` directory.
2. Install dependencies: `npm install`.
3. Start the development server: `npm run dev`.

---

## 📁 Project Structure

```text
WorkForce_Hub/
├── backend/            # Django project and apps
│   ├── accounts/       # Authentication & User models
│   ├── employees/      # Employee & Department logic
│   ├── chat/           # WebSocket consumers & messaging
│   ├── leaves/         # Leave balance & request management
│   ├── payroll/        # Salary and payroll processing
│   └── dashboard/      # Audit logs and global notifications
├── frontend/           # React application
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Full-page views
│   │   ├── context/    # Global state (Auth, Notification)
│   │   └── api/        # Axios configurations
└── docker-compose.yml  # Docker orchestration (optional)
```

---

*WorkForce Hub – Efficiency, Transparency, and Connectivity.*
