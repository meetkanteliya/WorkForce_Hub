from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Employee, Department
from .serializers import EmployeeSerializer, DepartmentSerializer
from accounts.permissions import IsAdmin, IsAdminOrHR
from dashboard.models import AuditLog


class DepartmentViewSet(ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAdmin]


class EmployeeViewSet(ModelViewSet):
    queryset = Employee.objects.select_related("user", "department")
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role in ["admin", "hr"]:
            return self.queryset

        if user.role == "manager":
            return self.queryset.filter(department=user.employee.department)

        return self.queryset.filter(user=user)

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update"]:
            return [IsAdminOrHR()]
        if self.action == "destroy":
            return [IsAdmin()]
        return super().get_permissions()

    def perform_create(self, serializer):
        instance = serializer.save()
        AuditLog.objects.create(
            action_type="employee_added",
            actor=self.request.user,
            target_user=instance.user,
            message=f"{self.request.user.username} added new employee {instance.user.username}",
            metadata={"employee_id": instance.id},
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        AuditLog.objects.create(
            action_type="profile_updated",
            actor=self.request.user,
            target_user=instance.user,
            message=f"{self.request.user.username} updated employee {instance.user.username}",
            metadata={"employee_id": instance.id},
        )

    def perform_destroy(self, instance):
        username = instance.user.username
        employee_id = instance.id
        AuditLog.objects.create(
            action_type="profile_updated",
            actor=self.request.user,
            target_user=instance.user,
            message=f"{self.request.user.username} removed employee {username}",
            metadata={"employee_id": employee_id},
        )
        instance.delete()

    @action(detail=False, methods=["get"], url_path="me")
    def me(self, request):
        employee = Employee.objects.get(user=request.user)
        serializer = self.get_serializer(employee)
        return Response(serializer.data)

    @action(detail=False, methods=["patch"], url_path="me/update")
    def me_update(self, request):
        employee = Employee.objects.get(user=request.user)
        from .serializers import EmployeeProfileUpdateSerializer
        serializer = EmployeeProfileUpdateSerializer(
            employee, data=request.data, partial=True, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        AuditLog.objects.create(
            action_type="profile_updated",
            actor=request.user,
            target_user=request.user,
            message=f"{request.user.username} updated their profile",
            metadata={"fields": list(request.data.keys())},
        )

        # Return fully serialized updated profile
        return Response(self.get_serializer(employee).data)