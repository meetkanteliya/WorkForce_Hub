import re

with open("leaves/views.py", "r", encoding="utf-8") as f:
    code = f.read()

# 1. Add Pagination & remove pagination_class = None
code = code.replace("from datetime import datetime\n", "from datetime import datetime, timedelta\nfrom rest_framework.pagination import PageNumberPagination\nfrom django.db.models import Q\n\nclass StandardResultsSetPagination(PageNumberPagination):\n    page_size = 50\n    page_size_query_param = 'page_size'\n    max_page_size = 1000\n\n")
code = code.replace("pagination_class = None  # Return all records — client-side filtering", "pagination_class = StandardResultsSetPagination")

# 2. Update LeaveRequestViewSet get_queryset
new_get_queryset_lr = """    def get_queryset(self):
        user = self.request.user
        qs = self.queryset.all().order_by("-created_at")

        # Server-side Filtering
        status = self.request.query_params.get("status")
        if status and status != "all":
            qs = qs.filter(status=status)

        department = self.request.query_params.get("department")
        if department and department != "All":
            qs = qs.filter(employee__department__name=department)

        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(employee__user__username__icontains=search) |
                Q(leave_type__name__icontains=search) |
                Q(reason__icontains=search)
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
            return qs.none()"""

code = re.sub(r'    def get_queryset\(self\):.*?            return qs\.none\(\)', new_get_queryset_lr, code, flags=re.DOTALL, count=1)

# 3. Update LeaveBalanceViewSet get_queryset
new_get_queryset_lb = """    def get_queryset(self):
        user = self.request.user
        current_year = datetime.now().year
        qs = self.queryset.all().filter(year=current_year).order_by("employee__user__username")

        # Server-side Filtering
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
            return qs.none()"""

code = re.sub(r'    def get_queryset\(self\):\n        user = self\.request\.user\n        current_year = datetime\.now\(\)\.year.*?            return queryset\.none\(\)', new_get_queryset_lb, code, flags=re.DOTALL, count=1)


# 4. Update perform_create, approve, reject for cross-year & overlap logic
# I'll replace the block from `    def perform_create(self, serializer):` to the end of `reject` method.

new_logic = """    def perform_create(self, serializer):
        try:
            employee = self.request.user.employee
        except Exception:
            raise ValidationError({"detail": "No employee record linked to your account. Contact HR or Admin."})

        leave_type = serializer.validated_data['leave_type']
        start_date = serializer.validated_data['start_date']
        end_date = serializer.validated_data['end_date']

        days_requested = (end_date - start_date).days + 1
        if days_requested <= 0:
            raise ValidationError({"detail": "End date must be after or equal to start date."})

        # Overlap Validation
        overlapping = LeaveRequest.objects.filter(
            employee=employee,
            status__in=["pending", "approved"],
            start_date__lte=end_date,
            end_date__gte=start_date
        ).exists()
        if overlapping:
            raise ValidationError({"detail": "You already have a pending or approved leave request during this period."})

        # Cross-year deduction calculation
        years_requested = {}
        current_date = start_date
        while current_date <= end_date:
            y = current_date.year
            years_requested[y] = years_requested.get(y, 0) + 1
            current_date += timedelta(days=1)

        # Validate balance exists and has enough days
        for y, days in years_requested.items():
            try:
                balance = LeaveBalance.objects.get(employee=employee, leave_type=leave_type, year=y)
                available = balance.allocated_days - balance.used_days
                if days > available:
                    raise ValidationError({"detail": f"Insufficient leave balance for {y}. You have {available} days left."})
            except LeaveBalance.DoesNotExist:
                raise ValidationError({"detail": f"Leave balance record not found for {y}. Contact HR."})

        instance = serializer.save(employee=employee)

        AuditLog.objects.create(
            action_type="leave_request",
            actor=self.request.user,
            target_user=employee.user,
            message=f"{employee.user.username} requested {leave_type.name} leave ({start_date} to {end_date})",
            metadata={"leave_request_id": instance.id, "days": days_requested},
        )

        users_to_notify = list(User.objects.filter(role__in=["admin", "hr"], is_active=True))
        if employee.department:
            managers = User.objects.filter(role="manager", employee__department=employee.department, is_active=True)
            for manager in managers:
                if manager not in users_to_notify:
                    users_to_notify.append(manager)

        notification_message = f"New leave request from {employee.user.username} for {leave_type.name} ({start_date} to {end_date})."
        for notify_user in users_to_notify:
            Notification.objects.create(user=notify_user, message=notification_message, link="/leaves?tab=all")

    @action(detail=True, methods=["patch"], permission_classes=[IsManagerOrAbove])
    def approve(self, request, pk=None):
        with transaction.atomic():
            leave = LeaveRequest.objects.select_for_update().select_related("employee__user", "leave_type").get(pk=pk)
            if leave.status == "approved":
                return Response({"status": "already approved"})

            # Cross-year logic
            years_to_deduct = {}
            current_date = leave.start_date
            while current_date <= leave.end_date:
                y = current_date.year
                years_to_deduct[y] = years_to_deduct.get(y, 0) + 1
                current_date += timedelta(days=1)

            balances_to_update = []
            for y, days in years_to_deduct.items():
                try:
                    balance = LeaveBalance.objects.select_for_update().get(employee=leave.employee, leave_type=leave.leave_type, year=y)
                    available = balance.allocated_days - balance.used_days
                    if days > available:
                        return Response({"detail": f"Insufficient balance for {y}. Needs {days} days but only {available} available."}, status=400)
                    balances_to_update.append((balance, days))
                except LeaveBalance.DoesNotExist:
                    return Response({"detail": f"No balance record found for year {y}."}, status=400)

            for balance, days in balances_to_update:
                balance.used_days += days
                balance.save()

            leave.status = "approved"
            leave.approved_by = request.user
            leave.save()

        AuditLog.objects.create(
            action_type="leave_approved",
            actor=request.user,
            target_user=leave.employee.user,
            message=f"{request.user.username} approved {leave.leave_type.name} leave for {leave.employee.user.username}",
            metadata={"leave_request_id": leave.id},
        )

        Notification.objects.create(
            user=leave.employee.user,
            message=f"Your {leave.leave_type.name} leave ({leave.start_date} to {leave.end_date}) has been approved by {request.user.username}.",
            link="/leaves?tab=my",
        )
        return Response({"status": "approved"})

    @action(detail=True, methods=["patch"], permission_classes=[IsManagerOrAbove])
    def reject(self, request, pk=None):
        with transaction.atomic():
            leave = LeaveRequest.objects.select_for_update().select_related("employee__user", "leave_type").get(pk=pk)
            was_approved = leave.status == "approved"

            if leave.status == "rejected":
                return Response({"status": "already rejected"})

            leave.status = "rejected"
            leave.approved_by = request.user
            leave.save()

            if was_approved:
                years_to_refund = {}
                current_date = leave.start_date
                while current_date <= leave.end_date:
                    y = current_date.year
                    years_to_refund[y] = years_to_refund.get(y, 0) + 1
                    current_date += timedelta(days=1)
                
                for y, days in years_to_refund.items():
                    try:
                        balance = LeaveBalance.objects.select_for_update().get(employee=leave.employee, leave_type=leave.leave_type, year=y)
                        balance.used_days = max(0, balance.used_days - days)
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

        Notification.objects.create(
            user=leave.employee.user,
            message=f"Your {leave.leave_type.name} leave ({leave.start_date} to {leave.end_date}) has been rejected by {request.user.username}.",
            link="/leaves?tab=my",
        )
        return Response({"status": "rejected"})"""

code = re.sub(r'    def perform_create\(self, serializer\):.*?        return Response\(\{"status": "rejected"\}\)', new_logic, code, flags=re.DOTALL)

with open("leaves/views.py", "w", encoding="utf-8") as f:
    f.write(code)
