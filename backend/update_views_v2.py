import re

with open("leaves/views.py", "r", encoding="utf-8") as f:
    code = f.read()

split_leave_function = """import datetime as dt

def split_leave_by_year(start_date, end_date):
    years = {}
    current_year = start_date.year
    end_year = end_date.year
    
    for y in range(current_year, end_year + 1):
        if current_year == end_year:
            years[y] = (end_date - start_date).days + 1
        elif y == current_year:
            end_of_year = dt.date(y, 12, 31)
            years[y] = (end_of_year - start_date).days + 1
        elif y == end_year:
            start_of_year = dt.date(y, 1, 1)
            years[y] = (end_date - start_of_year).days + 1
        else:
            start_of_year = dt.date(y, 1, 1)
            end_of_year = dt.date(y, 12, 31)
            years[y] = (end_of_year - start_of_year).days + 1
    return years

"""

if "def split_leave_by_year" not in code:
    code = code.replace("class LeaveRequestViewSet", split_leave_function + "class LeaveRequestViewSet")

new_logic = """    def perform_create(self, serializer):
        from employees.models import Employee
        with transaction.atomic():
            try:
                employee = self.request.user.employee
                if not employee.user.is_active:
                    raise ValidationError({"detail": "Inactive employees cannot request leave."})
            except Exception:
                raise ValidationError({"detail": "No employee record linked to your account. Contact HR or Admin."})

            leave_type = serializer.validated_data['leave_type']
            start_date = serializer.validated_data['start_date']
            end_date = serializer.validated_data['end_date']

            days_requested = (end_date - start_date).days + 1
            if days_requested <= 0:
                raise ValidationError({"detail": "End date must be after or equal to start date."})

            # Lock employee record to serialize request creation and prevent race conditions
            Employee.objects.select_for_update().get(id=employee.id)

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
            years_requested = split_leave_by_year(start_date, end_date)

            # Sum pending days for each year to prevent fake balance abuse
            pending_requests = LeaveRequest.objects.filter(
                employee=employee, leave_type=leave_type, status="pending"
            )
            pending_days_map = {}
            for pr in pending_requests:
                pr_years = split_leave_by_year(pr.start_date, pr.end_date)
                for y, d in pr_years.items():
                    pending_days_map[y] = pending_days_map.get(y, 0) + d

            # Validate balance exists and has enough days
            for y, days in years_requested.items():
                try:
                    balance = LeaveBalance.objects.get(employee=employee, leave_type=leave_type, year=y)
                    pending_days = pending_days_map.get(y, 0)
                    available = balance.allocated_days - balance.used_days - pending_days
                    if days > available:
                        raise ValidationError({"detail": f"Insufficient leave balance for {y}. You have {available} days available (accounting for pending requests)."})
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
            
            if leave.employee.user == request.user:
                return Response({"detail": "Self-approval is prohibited by business rules."}, status=403)
            if not leave.employee.user.is_active:
                return Response({"detail": "Cannot approve leave for inactive employee."}, status=400)
            if leave.status == "approved":
                return Response({"status": "already approved"})
            if leave.status == "rejected":
                return Response({"detail": "Cannot approve a rejected leave. Employee must re-apply."}, status=400)

            years_to_deduct = split_leave_by_year(leave.start_date, leave.end_date)

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
            
            if leave.employee.user == request.user:
                return Response({"detail": "Self-rejection is prohibited by business rules."}, status=403)
            
            was_approved = leave.status == "approved"

            if leave.status == "rejected":
                return Response({"status": "already rejected"})

            leave.status = "rejected"
            leave.approved_by = request.user
            leave.save()

            if was_approved:
                years_to_refund = split_leave_by_year(leave.start_date, leave.end_date)
                
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
