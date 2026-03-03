from rest_framework import serializers
from .models import Salary


class SalarySerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(
        source="employee.user.username", read_only=True
    )
    department_name = serializers.CharField(
        source="employee.department.name", read_only=True, default=None
    )

    class Meta:
        model = Salary
        fields = (
            "id",
            "employee",
            "employee_name",
            "department_name",
            "basic_salary",
            "bonus",
            "deductions",
            "net_salary",
            "pay_date",
            "created_at",
        )
        read_only_fields = ("net_salary", "created_at")
