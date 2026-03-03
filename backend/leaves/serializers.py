from rest_framework import serializers
from .models import LeaveType, LeaveRequest, LeaveBalance


class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = "__all__"

class LeaveBalanceSerializer(serializers.ModelSerializer):
    leave_type = LeaveTypeSerializer(read_only=True)
    
    class Meta:
        model = LeaveBalance
        fields = (
            "id",
            "leave_type",
            "year",
            "used_days",
            "allocated_days"
        )


class LeaveRequestSerializer(serializers.ModelSerializer):
    employee = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = LeaveRequest
        fields = (
            "id",
            "employee",
            "leave_type",
            "start_date",
            "end_date",
            "reason",
            "status",
            "approved_by",
            "created_at",
        )
        read_only_fields = ("status", "approved_by", "created_at")