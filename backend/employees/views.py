from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import Employee, Department
from .serializers import EmployeeSerializer, DepartmentSerializer
from accounts.permissions import IsAdmin, IsAdminOrHR
from dashboard.models import AuditLog, Notification
from django.utils import timezone
from django.db.models import Exists, OuterRef, Q
from leaves.models import LeaveRequest


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
        qs = self.queryset.all()

        today = timezone.localdate()
        on_leave_qs = LeaveRequest.objects.filter(
            employee_id=OuterRef("pk"),
            status="approved",
            start_date__lte=today,
            end_date__gte=today,
        )
        qs = qs.annotate(is_on_leave_today=Exists(on_leave_qs))

        search_query = self.request.query_params.get('search', None)
        if search_query:
            qs = qs.filter(
                Q(user__username__icontains=search_query) |
                Q(department__name__icontains=search_query) |
                Q(employee_code__icontains=search_query) |
                Q(designation__icontains=search_query) |
                Q(user__email__icontains=search_query)
            ).distinct()

        department = (self.request.query_params.get("department") or "").strip()
        if department:
            if department.isdigit():
                qs = qs.filter(department_id=int(department))
            else:
                qs = qs.filter(department__name__iexact=department)

        role = (self.request.query_params.get("role") or "").strip()
        if role:
            qs = qs.filter(user__role__iexact=role)

        designation = (self.request.query_params.get("designation") or "").strip()
        if designation:
            qs = qs.filter(designation__icontains=designation)

        date_from = (self.request.query_params.get("date_from") or "").strip()
        if date_from:
            qs = qs.filter(date_of_joining__gte=date_from)

        date_to = (self.request.query_params.get("date_to") or "").strip()
        if date_to:
            qs = qs.filter(date_of_joining__lte=date_to)

        status = (self.request.query_params.get("status") or "").strip().lower()
        if status == "active":
            qs = qs.filter(user__is_active=True)
        elif status == "inactive":
            qs = qs.filter(user__is_active=False)
        elif status == "present":
            qs = qs.filter(user__is_active=True).filter(is_on_leave_today=False)

        if user.role in ["admin", "hr"]:
            return qs

        if user.role == "manager":
            try:
                return qs.filter(department=user.employee.department)
            except Exception:
                return qs.none()

        return qs.filter(user=user)

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

        # Welcome Notification for new employee
        Notification.objects.create(
            user=instance.user,
            message="Welcome to WorkForce Hub! Please complete your profile.",
            link="/profile",
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

    @action(detail=False, methods=["patch"], url_path="me/update", parser_classes=[MultiPartParser, FormParser, JSONParser])
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