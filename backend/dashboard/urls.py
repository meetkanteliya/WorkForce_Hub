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
)

urlpatterns = [
    # 1. Summary card (all-in-one)
    path("summary/", DashboardSummaryView.as_view(), name="dashboard-summary"),

    # 2. Employees drill-down
    path("employees/", DashboardEmployeeListView.as_view(), name="dashboard-employees"),

    # 3. Departments drill-down
    path("departments/", DashboardDepartmentListView.as_view(), name="dashboard-departments"),

    # 4. Department detail
    path("departments/<int:pk>/", DashboardDepartmentDetailView.as_view(), name="dashboard-department-detail"),

    # 5. Pending leaves
    path("leaves/pending/", DashboardPendingLeavesView.as_view(), name="dashboard-leaves-pending"),

    # 6. Leave overview
    path("leaves/overview/", DashboardLeaveOverviewView.as_view(), name="dashboard-leaves-overview"),

    # 7. Payroll overview
    path("payroll/overview/", DashboardPayrollOverviewView.as_view(), name="dashboard-payroll-overview"),

    # 8. Activity feed
    path("activity/", DashboardActivityView.as_view(), name="dashboard-activity"),
]
