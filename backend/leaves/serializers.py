from rest_framework import serializers
from .models import LeaveType, LeaveRequest, LeaveBalance


class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = "__all__"


class LeaveBalanceSerializer(serializers.ModelSerializer):
    leave_type = LeaveTypeSerializer(read_only=True)
    employee_name = serializers.CharField(source="employee.user.username", read_only=True)
    employee_code = serializers.CharField(source="employee.employee_code", read_only=True)
    department_name = serializers.CharField(source="employee.department.name", read_only=True, default="Unassigned")
    employee_profile_picture = serializers.ImageField(source="employee.profile_picture", read_only=True)
    remaining_days = serializers.SerializerMethodField()

    class Meta:
        model = LeaveBalance
        fields = (
            "id",
            "employee_name",
            "employee_code",
            "department_name",
            "employee_profile_picture",
            "leave_type",
            "year",
            "used_days",
            "allocated_days",
            "remaining_days",
        )

    def get_remaining_days(self, obj):
        return max(0, obj.allocated_days - obj.used_days)


class LeaveBalanceWriteSerializer(serializers.ModelSerializer):
    """Used by Admin/HR to create or update balance records."""

    class Meta:
        model = LeaveBalance
        fields = ("id", "employee", "leave_type", "year", "allocated_days", "used_days")


class LeaveRequestSerializer(serializers.ModelSerializer):
    employee = serializers.StringRelatedField(read_only=True)
    leave_type_name = serializers.CharField(source="leave_type.name", read_only=True)
    employee_profile_picture = serializers.ImageField(source="employee.profile_picture", read_only=True)

    class Meta:
        model = LeaveRequest
        fields = (
            "id",
            "employee",
            "employee_profile_picture",
            "leave_type",
            "leave_type_name",
            "start_date",
            "end_date",
            "reason",
            "status",
            "approved_by",
            "created_at",
        )
        read_only_fields = ("status", "approved_by", "created_at")