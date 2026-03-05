from django.db.models.signals import post_save
from django.dispatch import receiver
from datetime import datetime

from employees.models import Employee


@receiver(post_save, sender=Employee)
def allocate_default_leave_balances(sender, instance, created, **kwargs):
    """
    When a new Employee is created, automatically allocate
    leave balances for every LeaveType in the current year.
    """
    if not created:
        return

    # Import here to avoid circular imports
    from leaves.models import LeaveType, LeaveBalance

    current_year = datetime.now().year
    leave_types = LeaveType.objects.all()

    for lt in leave_types:
        LeaveBalance.objects.get_or_create(
            employee=instance,
            leave_type=lt,
            year=current_year,
            defaults={"allocated_days": lt.max_days_per_year, "used_days": 0},
        )
