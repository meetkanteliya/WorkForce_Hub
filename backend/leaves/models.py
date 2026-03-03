from django.db import models
from django.conf import settings
from employees.models import Employee


class LeaveType(models.Model):
    name = models.CharField(max_length=50)
    max_days_per_year = models.PositiveIntegerField()
    is_paid = models.BooleanField(default=True)
    requires_document = models.BooleanField(default=False)

    def __str__(self):
        return self.name

class LeaveBalance(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='leave_balances')
    leave_type = models.ForeignKey(LeaveType, on_delete=models.CASCADE, related_name='balances')
    year = models.PositiveIntegerField()
    used_days = models.FloatField(default=0.0)
    allocated_days = models.FloatField(default=0.0)

    class Meta:
        unique_together = ('employee', 'leave_type', 'year')
        
    def __str__(self):
        return f"{self.employee.user.username} - {self.leave_type.name} ({self.year}): {self.used_days}/{self.allocated_days}"


class LeaveRequest(models.Model):
    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    )

    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name="leave_requests"
    )
    leave_type = models.ForeignKey(
        LeaveType,
        on_delete=models.CASCADE,
        related_name="requests"
    )
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField(blank=True)
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default="pending"
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="approved_leaves"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.employee} - {self.leave_type} ({self.status})"