from datetime import date, timedelta

from django.db.models import Count, Sum, Avg, Q
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from accounts.permissions import IsAdmin, IsAdminOrHR, IsManagerOrAbove
from employees.models import Employee, Department
from leaves.models import LeaveRequest, LeaveType, LeaveBalance
from payroll.models import Salary
from .models import AuditLog, Attendance

from .serializers import (
    DashboardEmployeeSerializer,
    DepartmentCountSerializer,
    PendingLeaveSerializer,
    SalaryOverviewItemSerializer,
    AuditLogSerializer,
    NotificationSerializer,
)

User = get_user_model()


# ───────────────────────────── Pagination ─────────────────────────────
class DashboardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


# ─────────────── Helper: compute present_today correctly ─────────────
def _compute_present_today(today=None):
    """
    Priority-based present_today calculation:
      1. If Attendance records exist for today → count is_present=True entries.
      2. Fallback (no attendance records yet) → total_active minus those on
         approved leave today. This matches the old logic but is clearly labeled
         as a fallback.
    Returns (present_count, used_attendance_model: bool)
    """
    if today is None:
        today = date.today()

    has_attendance_today = Attendance.objects.filter(date=today).exists()
    if has_attendance_today:
        present_count = Attendance.objects.filter(date=today, is_present=True).count()
        return present_count, True

    # Fallback: active employees who don't have an approved leave today
    total_active = Employee.objects.filter(user__is_active=True).count()
    on_leave_ids = (
        LeaveRequest.objects
        .filter(status="approved", start_date__lte=today, end_date__gte=today)
        .values_list("employee_id", flat=True)
        .distinct()
    )
    present_count = max(0, total_active - len(set(on_leave_ids)))
    return present_count, False


# ───────────────────────────── 1. SUMMARY ────────────────────────────
class DashboardSummaryView(APIView):
    """
    GET /api/dashboard/summary/
    Returns all card-level data in one optimised call.
    Designed for live polling — includes last_updated timestamp.
    Accessible to: Admin, HR
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

        # ── FIX: Use proper attendance-based present_today ──
        present_today, using_attendance = _compute_present_today(today)

        # Upcoming leaves (next 7 days)
        upcoming_leaves = LeaveRequest.objects.filter(
            status="approved",
            start_date__gt=today,
            start_date__lte=today + timedelta(days=7)
        ).count()

        # Pending leave requests count
        pending_leave_requests = LeaveRequest.objects.filter(status="pending").count()

        # ── FIX: Audit log ordered by -created_at ──
        recent_audit = AuditLogSerializer(
            AuditLog.objects.select_related("actor", "target_user").order_by("-created_at")[:15],
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
            "present_today_source": "attendance" if using_attendance else "leave_fallback",
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
                .values("id", "user__username", "user__role", "department__name", "user__date_joined", "profile_picture")[:5]
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
    Ordered by -created_at (newest first).
    """
    permission_classes = [IsAdminOrHR]

    def get(self, request):
        # ── FIX: Explicit order_by ensures newest entries always come first ──
        logs = AuditLog.objects.select_related("actor", "target_user").order_by("-created_at")[:30]
        serializer = AuditLogSerializer(logs, many=True)
        return Response(serializer.data)


# ──────────────── 9. MANAGER DASHBOARD ──────────────────────────────
class ManagerDashboardView(APIView):
    """
    GET /api/dashboard/manager/
    Real team data for the logged-in manager:
      - Team members in the same department
      - Their leave balances (current year)
      - Today's attendance records (or approved leave status if no attendance)
    """
    permission_classes = [IsManagerOrAbove]

    def get(self, request):
        today = date.today()
        current_year = today.year

        try:
            manager_employee = request.user.employee
            dept = manager_employee.department
        except Exception:
            return Response({"detail": "No employee profile linked to your account."}, status=400)

        if not dept:
            return Response({"detail": "You are not assigned to any department."}, status=400)

        # All employees in this department
        team_employees = (
            Employee.objects
            .filter(department=dept, user__is_active=True)
            .select_related("user", "department")
            .order_by("user__username")
        )

        team_data = []
        for emp in team_employees:
            # Leave balance summary for current year
            balances = LeaveBalance.objects.filter(employee=emp, year=current_year)
            total_allocated = sum(b.allocated_days for b in balances)
            total_used = sum(b.used_days for b in balances)

            # Attendance for today
            try:
                attendance = Attendance.objects.get(employee=emp, date=today)
                check_in_str = attendance.check_in.strftime("%I:%M %p") if attendance.check_in else "—"
                check_out_str = attendance.check_out.strftime("%I:%M %p") if attendance.check_out else "—"
                hours_worked = attendance.hours_worked
                is_present = attendance.is_present
                attendance_source = "attendance"
            except Attendance.DoesNotExist:
                # Fallback: check if employee has approved leave today
                on_leave = LeaveRequest.objects.filter(
                    employee=emp,
                    status="approved",
                    start_date__lte=today,
                    end_date__gte=today,
                ).exists()
                check_in_str = "—"
                check_out_str = "—"
                hours_worked = 0.0
                is_present = not on_leave
                attendance_source = "leave_fallback"

            team_data.append({
                "id": emp.id,
                "name": emp.user.get_full_name() or emp.user.username,
                "username": emp.user.username,
                "role": emp.user.role,
                "designation": emp.designation or "—",
                "profile_picture": emp.profile_picture.url if emp.profile_picture else None,
                "employee_code": emp.employee_code or "—",
                # Leave
                "assigned_leaves": total_allocated,
                "used_leaves": total_used,
                "remaining_leaves": max(0, total_allocated - total_used),
                # Attendance
                "login": check_in_str,
                "logout": check_out_str,
                "hours_worked": hours_worked,
                "is_present": is_present,
                "attendance_source": attendance_source,
            })

        return Response({
            "last_updated": timezone.now().isoformat(),
            "department": {
                "id": dept.id,
                "name": dept.name,
            },
            "team": team_data,
            "team_count": len(team_data),
            "present_count": sum(1 for m in team_data if m["is_present"]),
        })


# ──────────────── 10. EMPLOYEE SELF-DASHBOARD ────────────────────────
class EmployeeDashboardView(APIView):
    """
    GET /api/dashboard/employee/
    Real self-service data for the logged-in employee:
      - Leave balances for current year (all leave types)
      - Today's attendance (check-in, check-out, hours)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = date.today()
        current_year = today.year

        try:
            employee = request.user.employee
        except Exception:
            return Response({"detail": "No employee profile linked to your account."}, status=400)

        # All leave balances for this employee this year
        balances = LeaveBalance.objects.filter(
            employee=employee, year=current_year
        ).select_related("leave_type")

        leave_data = []
        total_allocated = 0
        total_used = 0
        for b in balances:
            allocated = float(b.allocated_days)
            used = float(b.used_days)
            total_allocated += allocated
            total_used += used
            leave_data.append({
                "leave_type": b.leave_type.name,
                "allocated_days": allocated,
                "used_days": used,
                "remaining_days": max(0, allocated - used),
            })

        # Today's attendance
        try:
            attendance = Attendance.objects.get(employee=employee, date=today)
            check_in_str = attendance.check_in.strftime("%I:%M %p") if attendance.check_in else "—"
            check_out_str = attendance.check_out.strftime("%I:%M %p") if attendance.check_out else "—"
            hours_worked = attendance.hours_worked
            is_present = attendance.is_present
            attendance_source = "attendance"
        except Attendance.DoesNotExist:
            on_leave = LeaveRequest.objects.filter(
                employee=employee,
                status="approved",
                start_date__lte=today,
                end_date__gte=today,
            ).first()
            check_in_str = "—"
            check_out_str = "—"
            hours_worked = 0.0
            is_present = on_leave is None
            attendance_source = "leave_fallback"

        # Upcoming approved leaves for this employee
        upcoming = list(
            LeaveRequest.objects
            .filter(
                employee=employee,
                status="approved",
                start_date__gt=today,
                start_date__lte=today + timedelta(days=30),
            )
            .select_related("leave_type")
            .order_by("start_date")
            .values("id", "leave_type__name", "start_date", "end_date", "reason")[:5]
        )

        # Pending leave requests
        pending_count = LeaveRequest.objects.filter(employee=employee, status="pending").count()

        return Response({
            "last_updated": timezone.now().isoformat(),
            "employee": {
                "id": employee.id,
                "name": request.user.get_full_name() or request.user.username,
                "username": request.user.username,
                "role": request.user.role,
                "designation": employee.designation or "—",
                "department": employee.department.name if employee.department else "Unassigned",
                "profile_picture": employee.profile_picture.url if employee.profile_picture else None,
            },
            # Leave summary
            "assigned_leaves": total_allocated,
            "used_leaves": total_used,
            "remaining_leaves": max(0, total_allocated - total_used),
            "leave_breakdown": leave_data,
            "pending_requests": pending_count,
            "upcoming_leaves": upcoming,
            # Today's attendance
            "today": {
                "date": today.isoformat(),
                "login": check_in_str,
                "logout": check_out_str,
                "hours_worked": hours_worked,
                "is_present": is_present,
                "attendance_source": attendance_source,
            },
        })


# ──────────────── 11. NOTIFICATIONS ──────────────────────────────────
from .models import Notification


class NotificationListView(APIView):
    """
    GET /api/dashboard/notifications/
    Returns current user's notifications (last 50).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(user=request.user)[:50]
        unread_count = Notification.objects.filter(user=request.user, is_read=False).count()
        serializer = NotificationSerializer(notifications, many=True)
        return Response({
            "unread_count": unread_count,
            "results": serializer.data,
        })


class NotificationMarkReadView(APIView):
    """
    PATCH /api/dashboard/notifications/<id>/read/
    Marks a single notification as read.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk, user=request.user)
        except Notification.DoesNotExist:
            return Response({"detail": "Not found."}, status=404)
        notification.is_read = True
        notification.save()
        return Response({"status": "read"})


class NotificationMarkAllReadView(APIView):
    """
    PATCH /api/dashboard/notifications/read-all/
    Marks all notifications as read.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"status": "all read"})


class NotificationClearAllView(APIView):
    """
    DELETE /api/dashboard/notifications/clear-all/
    Deletes all notifications for the current user.
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        Notification.objects.filter(user=request.user).delete()
        return Response({"status": "cleared"})
