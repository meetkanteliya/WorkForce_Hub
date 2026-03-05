from django.core.management.base import BaseCommand
from datetime import datetime

from employees.models import Employee
from leaves.models import LeaveType, LeaveBalance


class Command(BaseCommand):
    help = "Backfill leave balances for all existing employees for the current year."

    def handle(self, *args, **options):
        current_year = datetime.now().year
        leave_types = LeaveType.objects.all()

        if not leave_types.exists():
            self.stdout.write(self.style.WARNING("No leave types found. Please seed leave types first."))
            return

        employees = Employee.objects.all()
        created_count = 0

        for emp in employees:
            for lt in leave_types:
                _, created = LeaveBalance.objects.get_or_create(
                    employee=emp,
                    leave_type=lt,
                    year=current_year,
                    defaults={"allocated_days": lt.max_days_per_year, "used_days": 0},
                )
                if created:
                    created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. Created {created_count} balance records for {employees.count()} employees "
                f"across {leave_types.count()} leave types (year={current_year})."
            )
        )
