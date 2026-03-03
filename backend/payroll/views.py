from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Salary
from .serializers import SalarySerializer
from accounts.permissions import IsAdmin, IsManagerOrAbove


class SalaryViewSet(ModelViewSet):
    queryset = Salary.objects.select_related(
        "employee__user", "employee__department"
    )
    serializer_class = SalarySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        # Admin & HR can see all salary records
        if user.role in ["admin", "hr"]:
            return self.queryset

        # Manager can see salaries of own department employees
        if user.role == "manager":
            return self.queryset.filter(
                employee__department=user.employee.department
            )

        # Employee can only see their own salary records
        return self.queryset.filter(employee=user.employee)

    def get_permissions(self):
        # Only Admin can create or update salary records
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAdmin()]
        return super().get_permissions()

    @action(detail=False, methods=["get"], url_path="my")
    def my(self, request):
        """View own salary records."""
        salaries = self.queryset.filter(employee=request.user.employee)
        page = self.paginate_queryset(salaries)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(salaries, many=True)
        return Response(serializer.data)
