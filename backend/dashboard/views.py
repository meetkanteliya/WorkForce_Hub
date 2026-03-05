from datetime import date, timedelta

from django.db.models import Count, Sum, Avg, Q
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from accounts.permissions import IsAdmin, IsAdminOrHR
from employees.models import Employee, Department
from leaves.models import LeaveRequest, LeaveType
from payroll.models import Salary
from .models import AuditLog

from .serializers import (
    DashboardEmployeeSerializer,
    DepartmentCountSerializer,
    PendingLeaveSerializer,
    SalaryOverviewItemSerializer,
    AuditLogSerializer,
)

User = get_user_model()


# ───────────────────────────── Pagination ─────────────────────────────
class DashboardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


# ───────────────────────────── 1. SUMMARY ────────────────────────────
class DashboardSummaryView(APIView):
    """
    GET /api/dashboard/summary/
    Returns all card-level data in one optimised call.
    Designed for live polling — includes last_updated timestamp.
    """
    permission_classes = [IsAdminOrHR]

    def get(self, request):
        today = date.today()
        first_of_month = today.replace(day=1)

        # Employee counts
        total_employees = Employee.objects.count()

        # Role distribution  (via User table)
        role_distribution = dict(
            User.objects.values_list("role")
            .annotate(count=Count("id"))
            .values_list("role", "count")
        )

        # Department-wise count  (top 5 by size)
        dept_counts = list(
            Department.objects.annotate(employee_count=Count("employees"))
            .order_by("-employee_count")
            .values("id", "name", "employee_count")[:5]
        )

        # Leaves summary
        leave_summary = (
            LeaveRequest.objects
            .values("status")
            .annotate(count=Count("id"))
        )
        leave_map = {item["status"]: item["count"] for item in leave_summary}

        # New joiners this month
        new_joiners = Employee.objects.filter(
            date_of_joining__gte=first_of_month
        ).count()

        # Active employees (staff whose user account is active)
        active_employees = Employee.objects.filter(user__is_active=True).count()

        # Employees on leave today
        employees_on_leave_today = LeaveRequest.objects.filter(
            status="approved",
            start_date__lte=today,
            end_date__gte=today
        ).values("employee").distinct().count()

        present_today = total_employees - employees_on_leave_today

        # Upcoming leaves (next 7 days)
        upcoming_leaves = LeaveRequest.objects.filter(
            status="approved",
            start_date__gt=today,
            start_date__lte=today + timedelta(days=7)
        ).count()

        # Pending leave requests count
        pending_leave_requests = LeaveRequest.objects.filter(status="pending").count()

        # Recent audit log entries
        recent_audit = AuditLogSerializer(
            AuditLog.objects.select_related("actor", "target_user")[:15],
            many=True,
        ).data

        return Response({
            # Timestamp for live updates
            "last_updated": timezone.now().isoformat(),

            # Top KPI Cards
            "total_employees": total_employees,
            "active_employees": active_employees,
            "employees_on_leave_today": employees_on_leave_today,
            "pending_requests_total": pending_leave_requests,
            "total_departments": Department.objects.count(),

            # Attendance & Leave Overview
            "present_today": present_today,
            "upcoming_leaves": upcoming_leaves,

            # Leave status counts
            "leave_counts": {
                "pending": leave_map.get("pending", 0),
                "approved": leave_map.get("approved", 0),
                "rejected": leave_map.get("rejected", 0),
            },

            # Employee Management Snapshot
            "role_distribution": role_distribution,
            "department_counts": dept_counts,
            "new_joiners_this_month": new_joiners,
            "recently_added_employees": list(
                Employee.objects.select_related("user", "department")
                .order_by("-user__date_joined")
                .values("id", "user__username", "user__role", "department__name", "user__date_joined")[:5]
            ),

            # Real Audit Log
            "recent_activity": recent_audit,
        })


# ────────────────────── 2. EMPLOYEES DRILL-DOWN ──────────────────────
class DashboardEmployeeListView(ListAPIView):
    """
    GET /api/dashboard/employees/
    Paginated, filterable employee list.
    Query params: ?department=ID  &role=admin  &search=keyword
    """
    permission_classes = [IsAdminOrHR]
    serializer_class = DashboardEmployeeSerializer
    pagination_class = DashboardPagination

    def get_queryset(self):
        qs = (
            Employee.objects
            .select_related("user", "department")
            .order_by("-user__date_joined")
        )
        dept = self.request.query_params.get("department")
        role = self.request.query_params.get("role")
        search = self.request.query_params.get("search")

        if dept:
            qs = qs.filter(department_id=dept)
        if role:
            qs = qs.filter(user__role=role)
        if search:
            qs = qs.filter(
                Q(user__username__icontains=search) |
                Q(designation__icontains=search) |
                Q(employee_code__icontains=search)
            )
        return qs


# ──────────────────── 3. DEPARTMENTS DRILL-DOWN ──────────────────────
class DashboardDepartmentListView(ListAPIView):
    """
    GET /api/dashboard/departments/
    All departments with employee counts.
    """
    permission_classes = [IsAdminOrHR]
    serializer_class = DepartmentCountSerializer
    pagination_class = None  # small data set

    def get_queryset(self):
        return (
            Department.objects
            .annotate(employee_count=Count("employees"))
            .order_by("name")
        )


# ──────────────── 4. SINGLE DEPARTMENT DETAIL ────────────────────────
class DashboardDepartmentDetailView(APIView):
    """
    GET /api/dashboard/departments/{id}/
    Department info + its employees.
    """
    permission_classes = [IsAdminOrHR]

    def get(self, request, pk):
        try:
            dept = Department.objects.annotate(
                employee_count=Count("employees")
            ).get(pk=pk)
        except Department.DoesNotExist:
            return Response({"detail": "Department not found."}, status=404)

        employees = (
            Employee.objects
            .filter(department=dept)
            .select_related("user")
            .order_by("user__username")
        )

        return Response({
            "id": dept.id,
            "name": dept.name,
            "description": dept.description,
            "employee_count": dept.employee_count,
            "employees": DashboardEmployeeSerializer(employees, many=True).data,
        })


# ──────────────── 5. PENDING LEAVES DRILL-DOWN ───────────────────────
class DashboardPendingLeavesView(ListAPIView):
    """
    GET /api/dashboard/leaves/pending/
    All pending leave requests with employee + department info.
    """
    permission_classes = [IsAdminOrHR]
    serializer_class = PendingLeaveSerializer
    pagination_class = DashboardPagination

    def get_queryset(self):
        return (
            LeaveRequest.objects
            .filter(status="pending")
            .select_related("employee__user", "employee__department", "leave_type")
            .order_by("-created_at")
        )


# ──────────────── 6. LEAVE OVERVIEW DRILL-DOWN ───────────────────────
class DashboardLeaveOverviewView(APIView):
    """
    GET /api/dashboard/leaves/overview/
    Status breakdown + per-leave-type statistics.
    """
    permission_classes = [IsAdminOrHR]

    def get(self, request):
        # Status counts
        status_counts = dict(
            LeaveRequest.objects
            .values_list("status")
            .annotate(count=Count("id"))
            .values_list("status", "count")
        )

        # Per leave-type breakdown
        by_type = list(
            LeaveType.objects
            .annotate(
                total_requests=Count("requests"),
                pending=Count("requests", filter=Q(requests__status="pending")),
                approved=Count("requests", filter=Q(requests__status="approved")),
                rejected=Count("requests", filter=Q(requests__status="rejected")),
            )
            .values("id", "name", "max_days_per_year",
                    "total_requests", "pending", "approved", "rejected")
        )

        # Recent requests
        recent = PendingLeaveSerializer(
            LeaveRequest.objects
            .select_related("employee__user", "employee__department", "leave_type")
            .order_by("-created_at")[:10],
            many=True,
        ).data

        return Response({
            "status_counts": {
                "pending": status_counts.get("pending", 0),
                "approved": status_counts.get("approved", 0),
                "rejected": status_counts.get("rejected", 0),
            },
            "by_type": by_type,
            "recent_requests": recent,
        })


# ──────────────── 7. PAYROLL OVERVIEW DRILL-DOWN ─────────────────────
class DashboardPayrollOverviewView(APIView):
    """
    GET /api/dashboard/payroll/overview/
    Aggregated payroll data + salary distribution + recent payouts.
    """
    permission_classes = [IsAdminOrHR]

    def get(self, request):
        # Aggregated totals
        agg = Salary.objects.aggregate(
            total_basic=Sum("basic_salary"),
            total_bonus=Sum("bonus"),
            total_deductions=Sum("deductions"),
            total_net=Sum("net_salary"),
            avg_net=Avg("net_salary"),
            record_count=Count("id"),
        )

        # Per-department salary totals
        dept_salary = list(
            Salary.objects
            .values("employee__department__name")
            .annotate(
                total=Sum("net_salary"),
                avg=Avg("net_salary"),
                headcount=Count("id"),
            )
            .order_by("-total")
        )
        dept_salary = [
            {
                "department": item["employee__department__name"] or "Unassigned",
                "total": float(item["total"] or 0),
                "average": round(float(item["avg"] or 0), 2),
                "headcount": item["headcount"],
            }
            for item in dept_salary
        ]

        # Recent payouts
        recent = SalaryOverviewItemSerializer(
            Salary.objects
            .select_related("employee__user", "employee__department")
            .order_by("-pay_date", "-created_at")[:10],
            many=True,
        ).data

        return Response({
            "totals": {
                "basic": float(agg["total_basic"] or 0),
                "bonus": float(agg["total_bonus"] or 0),
                "deductions": float(agg["total_deductions"] or 0),
                "net": float(agg["total_net"] or 0),
                "average_net": round(float(agg["avg_net"] or 0), 2),
                "record_count": agg["record_count"],
            },
            "by_department": dept_salary,
            "recent_payouts": recent,
        })


# ──────────────── 8. AUDIT LOG / ACTIVITY FEED ──────────────────────
class DashboardActivityView(APIView):
    """
    GET /api/dashboard/activity/
    Full audit log feed (last 30 events) from the AuditLog model.
    """
    permission_classes = [IsAdminOrHR]

    def get(self, request):
        logs = AuditLog.objects.select_related("actor", "target_user")[:30]
        serializer = AuditLogSerializer(logs, many=True)
        return Response(serializer.data)
