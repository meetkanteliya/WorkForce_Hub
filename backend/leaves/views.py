from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from .models import LeaveType, LeaveRequest, LeaveBalance
from .serializers import (
    LeaveTypeSerializer,
    LeaveRequestSerializer,
    LeaveBalanceSerializer,
    LeaveBalanceWriteSerializer,
)
from accounts.permissions import IsAdmin, IsAdminOrHR, IsManagerOrAbove
from dashboard.models import AuditLog, Notification
from datetime import datetime


class LeaveTypeViewSet(ModelViewSet):
    queryset = LeaveType.objects.all()
    serializer_class = LeaveTypeSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAdminOrHR()]
        return super().get_permissions()


class LeaveRequestViewSet(ModelViewSet):
    queryset = LeaveRequest.objects.select_related("employee", "leave_type")
    serializer_class = LeaveRequestSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # Return all records — client-side filtering

    def get_queryset(self):
        user = self.request.user
        qs = self.queryset.all()

        if user.role in ["admin", "hr"]:
            return qs

        if user.role == "manager":
            return qs.filter(
                employee__department=user.employee.department
            )

        return qs.filter(employee=user.employee)

    def perform_create(self, serializer):
        try:
            employee = self.request.user.employee
        except Exception:
            raise ValidationError({"detail": "No employee record linked to your account. Contact HR or Admin."})

        leave_type = serializer.validated_data['leave_type']
        start_date = serializer.validated_data['start_date']
        end_date = serializer.validated_data['end_date']

        # Calculate requested days (inclusive)
        days_requested = (end_date - start_date).days + 1
        if days_requested <= 0:
            raise ValidationError({"detail": "End date must be after or equal to start date."})

        # Validate balance exists and has enough days (don't deduct yet — only on approval)
        current_year = start_date.year
        try:
            balance = LeaveBalance.objects.get(employee=employee, leave_type=leave_type, year=current_year)
            available = balance.allocated_days - balance.used_days
            if days_requested > available:
                raise ValidationError({"detail": f"Insufficient leave balance. You have {available} days left for {leave_type.name}."})
        except LeaveBalance.DoesNotExist:
            raise ValidationError({"detail": "Leave balance record not found for this type. Contact HR."})

        instance = serializer.save(employee=employee)

        # Audit log
        AuditLog.objects.create(
            action_type="leave_request",
            actor=self.request.user,
            target_user=employee.user,
            message=f"{employee.user.username} requested {leave_type.name} leave ({start_date} to {end_date})",
            metadata={"leave_request_id": instance.id, "days": days_requested},
        )

    @action(detail=True, methods=["patch"], permission_classes=[IsManagerOrAbove])
    def approve(self, request, pk=None):
        leave = self.get_object()
        if leave.status == "approved":
            return Response({"status": "already approved"})

        # Deduct balance on approval
        days_requested = (leave.end_date - leave.start_date).days + 1
        current_year = leave.start_date.year
        try:
            balance = LeaveBalance.objects.get(
                employee=leave.employee, leave_type=leave.leave_type, year=current_year
            )
            available = balance.allocated_days - balance.used_days
            if days_requested > available:
                return Response(
                    {"detail": f"Insufficient balance. Employee has {available} days left."},
                    status=400,
                )
            balance.used_days += days_requested
            balance.save()
        except LeaveBalance.DoesNotExist:
            pass

        leave.status = "approved"
        leave.approved_by = request.user
        leave.save()

        AuditLog.objects.create(
            action_type="leave_approved",
            actor=request.user,
            target_user=leave.employee.user,
            message=f"{request.user.username} approved {leave.leave_type.name} leave for {leave.employee.user.username}",
            metadata={"leave_request_id": leave.id, "days": days_requested},
        )

        # Send notification to the employee
        Notification.objects.create(
            user=leave.employee.user,
            message=f"Your {leave.leave_type.name} leave ({leave.start_date} to {leave.end_date}) has been approved by {request.user.username}.",
            link="/leaves?tab=my",
        )

        return Response({"status": "approved"})

    @action(detail=True, methods=["patch"], permission_classes=[IsManagerOrAbove])
    def reject(self, request, pk=None):
        leave = self.get_object()
        was_approved = leave.status == "approved"

        if leave.status == "rejected":
            return Response({"status": "already rejected"})

        leave.status = "rejected"
        leave.approved_by = request.user
        leave.save()

        # Refund balance only if it was previously approved (deducted)
        if was_approved:
            days_requested = (leave.end_date - leave.start_date).days + 1
            current_year = leave.start_date.year
            try:
                balance = LeaveBalance.objects.get(
                    employee=leave.employee, leave_type=leave.leave_type, year=current_year
                )
                balance.used_days = max(0, balance.used_days - days_requested)
                balance.save()
            except LeaveBalance.DoesNotExist:
                pass

        AuditLog.objects.create(
            action_type="leave_rejected",
            actor=request.user,
            target_user=leave.employee.user,
            message=f"{request.user.username} rejected {leave.leave_type.name} leave for {leave.employee.user.username}",
            metadata={"leave_request_id": leave.id},
        )

        # Send notification to the employee
        Notification.objects.create(
            user=leave.employee.user,
            message=f"Your {leave.leave_type.name} leave ({leave.start_date} to {leave.end_date}) has been rejected by {request.user.username}.",
            link="/leaves?tab=my",
        )

        return Response({"status": "rejected"})

    @action(detail=False, methods=["get"], url_path="my")
    def my(self, request):
        """View own leave history."""
        leaves = self.queryset.filter(employee=request.user.employee)
        page = self.paginate_queryset(leaves)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(leaves, many=True)
        return Response(serializer.data)

class LeaveBalanceViewSet(ModelViewSet):
    queryset = LeaveBalance.objects.select_related("employee__user", "employee__department", "leave_type")
    serializer_class = LeaveBalanceSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # Return all records — client-side filtering

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update", "adjust"]:
            return LeaveBalanceWriteSerializer
        return LeaveBalanceSerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy", "adjust"]:
            return [IsAdminOrHR()]
        return super().get_permissions()

    def get_queryset(self):
        user = self.request.user
        current_year = datetime.now().year

        queryset = self.queryset.all().filter(year=current_year)

        if user.role in ["admin", "hr"]:
            return queryset

        if user.role == "manager":
            return queryset.filter(employee__department=user.employee.department)

        return queryset.filter(employee=user.employee)

    @action(detail=False, methods=["get"], url_path="my")
    def my(self, request):
        """View own leave balances."""
        current_year = datetime.now().year
        balances = self.queryset.filter(employee=request.user.employee, year=current_year)
        serializer = self.get_serializer(balances, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["patch"], permission_classes=[IsAdminOrHR], url_path="adjust")
    def adjust(self, request, pk=None):
        """Admin/HR adjust allocated_days or used_days for a balance record."""
        balance = self.get_object()
        allocated = request.data.get("allocated_days")
        used = request.data.get("used_days")

        if allocated is not None:
            balance.allocated_days = float(allocated)
        if used is not None:
            balance.used_days = float(used)
        balance.save()

        AuditLog.objects.create(
            action_type="profile_updated",
            actor=request.user,
            target_user=balance.employee.user,
            message=f"{request.user.username} adjusted {balance.leave_type.name} balance for {balance.employee.user.username}",
            metadata={"balance_id": balance.id, "allocated": balance.allocated_days, "used": balance.used_days},
        )
        return Response(LeaveBalanceSerializer(balance).data)