import datetime
from decimal import Decimal
from django.db import transaction, IntegrityError
from django.db.models import Q
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.exceptions import ValidationError, PermissionDenied
from django.utils import timezone

from .models import Salary
from .serializers import SalarySerializer
from accounts.permissions import IsAdmin, IsManagerOrAbove
from dashboard.models import AuditLog, Notification

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 1000

class SalaryViewSet(ModelViewSet):
    queryset = Salary.objects.select_related("employee__user", "employee__department")
    serializer_class = SalarySerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        user = self.request.user
        qs = self.queryset.all().order_by("-pay_date", "-created_at")

        department = self.request.query_params.get("department")
        if department and department != "All":
            qs = qs.filter(employee__department__name=department)
            
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(employee__user__username__icontains=search) |
                Q(employee__department__name__icontains=search)
            )

        if user.role in ["admin", "hr"]:
            return qs

        if user.role == "manager":
            try:
                return qs.filter(employee__department=user.employee.department)
            except Exception:
                return qs.none()

        try:
            return qs.filter(employee=user.employee)
        except Exception:
            return qs.none()

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAdmin()]
        return super().get_permissions()

    @transaction.atomic
    def perform_create(self, serializer):
        data = serializer.validated_data
        emp = data['employee']
        pay_date = data['pay_date']
        month = pay_date.month
        year = pay_date.year

        from employees.models import Employee
        Employee.objects.select_for_update().get(id=emp.id)

        if Salary.objects.filter(employee=emp, salary_month=month, salary_year=year).exists():
            AuditLog.objects.create(
                action_type="salary_creation_failed",
                actor=self.request.user,
                target_user=emp.user,
                message=f"Failed duplicate payroll creation attempt for {emp.user.username} ({month}/{year})",
                metadata={"reason": "duplicate_period"}
            )
            raise ValidationError({"detail": f"Payroll record already exists for {month}/{year}."})

        instance = serializer.save(salary_month=month, salary_year=year)
        
        AuditLog.objects.create(
            action_type="salary_paid",
            actor=self.request.user,
            target_user=instance.employee.user,
            message=f"{self.request.user.username} processed salary for {instance.employee.user.username} ({month}/{year})",
            metadata={"salary_id": instance.id, "net_salary": str(instance.net_salary)},
        )

        Notification.objects.create(
            user=instance.employee.user,
            message=f"Your salary slip for {pay_date.strftime('%B %Y')} has been generated.",
            link="/my-salary",
        )

    @transaction.atomic
    def perform_update(self, serializer):
        instance = self.get_object()
        
        age = timezone.now() - instance.created_at
        if age.days > 7:
            AuditLog.objects.create(
                action_type="salary_update_blocked",
                actor=self.request.user,
                target_user=instance.employee.user,
                message=f"{self.request.user.username} attempted to edit finalized payroll for {instance.employee.user.username}",
                metadata={"salary_id": instance.id}
            )
            raise PermissionDenied({"detail": "This payroll record is finalized and locked. Create an adjustment record instead."})

        prev_net = str(instance.net_salary)
        prev_basic = str(instance.basic_salary)

        updated_instance = serializer.save()
        
        updated_instance.salary_month = updated_instance.pay_date.month
        updated_instance.salary_year = updated_instance.pay_date.year
        
        try:
            updated_instance.save()
        except IntegrityError:
            raise ValidationError({"detail": "Cannot change date to an already paid payroll period."})

        AuditLog.objects.create(
            action_type="salary_adjusted",
            actor=self.request.user,
            target_user=updated_instance.employee.user,
            message=f"{self.request.user.username} adjusted salary record for {updated_instance.employee.user.username}",
            metadata={
                "salary_id": updated_instance.id, 
                "previous_net": prev_net,
                "new_net": str(updated_instance.net_salary)
            },
        )

    @action(detail=False, methods=["get"], url_path="my")
    def my(self, request):
        try:
            salaries = self.queryset.filter(employee=request.user.employee).order_by("-pay_date", "-created_at")
        except Exception:
            return Response({"detail": "No employee record linked to your account."}, status=400)
        page = self.paginate_queryset(salaries)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(salaries, many=True)
        return Response(serializer.data)
