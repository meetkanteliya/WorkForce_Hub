from django.urls import path
from .views import (
    DashboardSummaryView,
    DashboardEmployeeListView,
    DashboardDepartmentListView,
    DashboardDepartmentDetailView,
    DashboardPendingLeavesView,
    DashboardLeaveOverviewView,
    DashboardPayrollOverviewView,
    DashboardActivityView,
    ManagerDashboardView,
    EmployeeDashboardView,
    NotificationListView,
    NotificationMarkReadView,
    NotificationMarkAllReadView,
    NotificationClearAllView,
)

urlpatterns = [
    # 1. Summary card (all-in-one) — Admin / HR
    path("summary/", DashboardSummaryView.as_view(), name="dashboard-summary"),

    # 2. Employees drill-down — Admin / HR
    path("employees/", DashboardEmployeeListView.as_view(), name="dashboard-employees"),

    # 3. Departments drill-down — Admin / HR
    path("departments/", DashboardDepartmentListView.as_view(), name="dashboard-departments"),

    # 4. Department detail — Admin / HR
    path("departments/<int:pk>/", DashboardDepartmentDetailView.as_view(), name="dashboard-department-detail"),

    # 5. Pending leaves — Admin / HR
    path("leaves/pending/", DashboardPendingLeavesView.as_view(), name="dashboard-leaves-pending"),

    # 6. Leave overview — Admin / HR
    path("leaves/overview/", DashboardLeaveOverviewView.as_view(), name="dashboard-leaves-overview"),

    # 7. Payroll overview — Admin / HR
    path("payroll/overview/", DashboardPayrollOverviewView.as_view(), name="dashboard-payroll-overview"),

    # 8. Activity feed — Admin / HR
    path("activity/", DashboardActivityView.as_view(), name="dashboard-activity"),

    # 9. Manager dashboard (real team data) — Manager and above
    path("manager/", ManagerDashboardView.as_view(), name="dashboard-manager"),

    # 10. Employee self-dashboard (real leave + attendance) — Authenticated
    path("employee/", EmployeeDashboardView.as_view(), name="dashboard-employee"),

    # 11. Notifications
    path("notifications/", NotificationListView.as_view(), name="notifications-list"),
    path("notifications/<int:pk>/read/", NotificationMarkReadView.as_view(), name="notification-mark-read"),
    path("notifications/read-all/", NotificationMarkAllReadView.as_view(), name="notifications-read-all"),
    path("notifications/clear-all/", NotificationClearAllView.as_view(), name="notifications-clear-all"),
]
