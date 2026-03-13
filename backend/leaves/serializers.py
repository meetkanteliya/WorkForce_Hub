from rest_framework import serializers
from .models import LeaveType, LeaveRequest, LeaveBalance


DEFAULT_LEAVE_ALLOCATIONS = {
    "sick leave": 12,
    "casual leave": 10,
    "earned leave": 15,
    "work from home": 20,
}


def _normalize_leave_type_name(name: str) -> str:
    return " ".join((name or "").strip().lower().split())


def get_base_allocation_for_type(leave_type: LeaveType) -> float:
    """
    Base allocation used for extra-leave cap validation.

    For known leave types, use the fixed defaults from product requirements.
    Otherwise, fall back to the LeaveType.max_days_per_year configured in DB.
    """
    normalized = _normalize_leave_type_name(getattr(leave_type, "name", ""))
    if normalized in DEFAULT_LEAVE_ALLOCATIONS:
        return float(DEFAULT_LEAVE_ALLOCATIONS[normalized])
    return float(getattr(leave_type, "max_days_per_year", 0) or 0)


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

    def validate(self, attrs):
        attrs = super().validate(attrs)

        instance = getattr(self, "instance", None)
        leave_type = attrs.get("leave_type") or (getattr(instance, "leave_type", None) if instance else None)

        # Only validate allocated_days when it's being set/changed.
        if "allocated_days" in attrs and leave_type is not None:
            base_allocation = get_base_allocation_for_type(leave_type)
            max_allowed = base_allocation + 5
            allocated_days = float(attrs.get("allocated_days") or 0)

            if allocated_days > max_allowed:
                raise serializers.ValidationError(
                    {"detail": "Maximum extra leave limit exceeded. Only +5 additional leaves allowed."}
                )

        # Basic sanity: used_days shouldn't exceed allocated_days when both are known.
        used_days = attrs.get("used_days", getattr(instance, "used_days", None) if instance else None)
        allocated_days = attrs.get("allocated_days", getattr(instance, "allocated_days", None) if instance else None)
        if used_days is not None and allocated_days is not None and float(used_days) > float(allocated_days):
            raise serializers.ValidationError({"detail": "Used days cannot exceed allocated days."})

        return attrs


class LeaveRequestSerializer(serializers.ModelSerializer):
    employee = serializers.StringRelatedField(read_only=True)
    employee_department = serializers.CharField(source="employee.department.name", read_only=True, default="Unassigned")
    leave_type_name = serializers.CharField(source="leave_type.name", read_only=True)
    employee_profile_picture = serializers.ImageField(source="employee.profile_picture", read_only=True)

    class Meta:
        model = LeaveRequest
        fields = (
            "id",
            "employee",
            "employee_department",
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