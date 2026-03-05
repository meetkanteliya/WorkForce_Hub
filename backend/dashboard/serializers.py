from rest_framework import serializers
from django.contrib.auth import get_user_model
from employees.models import Employee, Department
from leaves.models import LeaveRequest, LeaveType
from payroll.models import Salary
from .models import AuditLog

User = get_user_model()


class DashboardEmployeeSerializer(serializers.ModelSerializer):
    """Lightweight employee serializer for dashboard lists."""
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    role = serializers.CharField(source="user.role", read_only=True)
    department_name = serializers.CharField(
        source="department.name", read_only=True, default="—"
    )
    date_joined = serializers.DateTimeField(source="user.date_joined", read_only=True)

    class Meta:
        model = Employee
        fields = (
            "id", "username", "email", "role", "employee_code",
            "designation", "department", "department_name",
            "phone", "date_of_joining", "date_joined",
        )


class DepartmentCountSerializer(serializers.ModelSerializer):
    """Department with its employee count."""
    employee_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Department
        fields = ("id", "name", "description", "employee_count")


class PendingLeaveSerializer(serializers.ModelSerializer):
    """Leave request serializer for dashboard drill-down."""
    employee_name = serializers.CharField(
        source="employee.user.username", read_only=True
    )
    employee_code = serializers.CharField(
        source="employee.employee_code", read_only=True, default="—"
    )
    department_name = serializers.CharField(
        source="employee.department.name", read_only=True, default="—"
    )
    leave_type_name = serializers.CharField(
        source="leave_type.name", read_only=True
    )

    class Meta:
        model = LeaveRequest
        fields = (
            "id", "employee_name", "employee_code", "department_name",
            "leave_type_name", "start_date", "end_date",
            "reason", "status", "created_at",
        )


class SalaryOverviewItemSerializer(serializers.ModelSerializer):
    """Individual salary record for drill-down."""
    employee_name = serializers.CharField(
        source="employee.user.username", read_only=True
    )
    employee_code = serializers.CharField(
        source="employee.employee_code", read_only=True, default="—"
    )
    department_name = serializers.CharField(
        source="employee.department.name", read_only=True, default="—"
    )

    class Meta:
        model = Salary
        fields = (
            "id", "employee_name", "employee_code", "department_name",
            "basic_salary", "bonus", "deductions", "net_salary", "pay_date",
        )


class AuditLogSerializer(serializers.ModelSerializer):
    """Audit log entry serializer for dashboard activity feed."""
    actor_name = serializers.CharField(
        source="actor.username", read_only=True, default="System"
    )
    target_name = serializers.CharField(
        source="target_user.username", read_only=True, default=None
    )

    class Meta:
        model = AuditLog
        fields = (
            "id", "action_type", "actor_name", "target_name",
            "message", "metadata", "created_at",
        )
