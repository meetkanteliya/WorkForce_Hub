from rest_framework import serializers
from .models import Salary
from decimal import Decimal

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
            "salary_month",
            "salary_year",
            "created_at",
        )
        read_only_fields = ("net_salary", "salary_month", "salary_year", "created_at")

    def validate(self, data):
        basic = data.get("basic_salary", getattr(self.instance, "basic_salary", Decimal("0.00")))
        bonus = data.get("bonus", getattr(self.instance, "bonus", Decimal("0.00")))
        deductions = data.get("deductions", getattr(self.instance, "deductions", Decimal("0.00")))
        
        if basic < 0 or bonus < 0 or deductions < 0:
            raise serializers.ValidationError({"detail": "Financial components cannot be negative."})
            
        if (basic + bonus - deductions) < 0:
            raise serializers.ValidationError({"detail": "Deductions cannot exceed total earnings (basic + bonus)."})
            
        return data
