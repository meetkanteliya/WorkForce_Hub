from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import LeaveType, LeaveRequest, LeaveBalance
from .serializers import LeaveTypeSerializer, LeaveRequestSerializer, LeaveBalanceSerializer
from accounts.permissions import IsAdmin, IsAdminOrHR, IsManagerOrAbove
from datetime import datetime


class LeaveTypeViewSet(ModelViewSet):
    queryset = LeaveType.objects.all()
    serializer_class = LeaveTypeSerializer
    permission_classes = [IsAdminOrHR]


class LeaveRequestViewSet(ModelViewSet):
    queryset = LeaveRequest.objects.select_related("employee", "leave_type")
    serializer_class = LeaveRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role in ["admin", "hr"]:
            return self.queryset

        if user.role == "manager":
            return self.queryset.filter(
                employee__department=user.employee.department
            )

        return self.queryset.filter(employee=user.employee)

    def perform_create(self, serializer):
        try:
            employee = self.request.user.employee
        except Exception:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"detail": "No employee record linked to your account. Contact HR or Admin."})
            
        leave_type = serializer.validated_data['leave_type']
        start_date = serializer.validated_data['start_date']
        end_date = serializer.validated_data['end_date']
        
        # Calculate requested days (inclusive)
        days_requested = (end_date - start_date).days + 1
        if days_requested <= 0:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"detail": "End date must be after or equal to start date."})

        # Check balance
        current_year = datetime.now().year
        from .models import LeaveBalance
        try:
            balance = LeaveBalance.objects.get(employee=employee, leave_type=leave_type, year=current_year)
            available = balance.allocated_days - balance.used_days
            if days_requested > available:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({"detail": f"Insufficient leave balance. You have {available} days left for {leave_type.name}."})
        except LeaveBalance.DoesNotExist:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"detail": "Leave balance record not found for this type. Contact HR."})

        balance.used_days += days_requested
        balance.save()

        serializer.save(employee=employee)

    @action(detail=True, methods=["patch"], permission_classes=[IsManagerOrAbove])
    def approve(self, request, pk=None):
        leave = self.get_object()
        leave.status = "approved"
        leave.approved_by = request.user
        leave.save()
        return Response({"status": "approved"})

    @action(detail=True, methods=["patch"], permission_classes=[IsManagerOrAbove])
    def reject(self, request, pk=None):
        leave = self.get_object()
        if leave.status != "rejected":
            leave.status = "rejected"
            leave.approved_by = request.user
            leave.save()
            
            # Refund the days
            days_requested = (leave.end_date - leave.start_date).days + 1
            current_year = leave.start_date.year
            from .models import LeaveBalance
            try:
                balance = LeaveBalance.objects.get(employee=leave.employee, leave_type=leave.leave_type, year=current_year)
                balance.used_days = max(0, balance.used_days - days_requested)
                balance.save()
            except LeaveBalance.DoesNotExist:
                pass

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
    queryset = LeaveBalance.objects.select_related("employee", "leave_type")
    serializer_class = LeaveBalanceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        current_year = datetime.now().year

        queryset = self.queryset.filter(year=current_year)

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