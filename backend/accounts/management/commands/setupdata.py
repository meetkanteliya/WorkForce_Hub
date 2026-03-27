from django.core.management.base import BaseCommand
from datetime import datetime


class Command(BaseCommand):
    help = 'Seed default departments, leave types, and backfill leave balances'

    def handle(self, *args, **kwargs):
        from employees.models import Department, Employee
        from leaves.models import LeaveType, LeaveBalance

        # ── Departments ──
        departments_data = [
            {'name': 'Administration', 'description': 'System administration and management'},
            {'name': 'Engineering', 'description': 'Software development and architecture'},
            {'name': 'Human Resources', 'description': 'Recruitment, onboarding, and employee welfare'},
            {'name': 'Finance', 'description': 'Accounting, payroll, and budgeting'},
            {'name': 'Marketing', 'description': 'Branding, campaigns, and social media'},
            {'name': 'Operations', 'description': 'Day-to-day business operations and logistics'},
        ]
        dept_created = 0
        for d in departments_data:
            _, created = Department.objects.get_or_create(name=d['name'], defaults=d)
            if created:
                dept_created += 1
        self.stdout.write(f"📂 Departments: {dept_created} created, {len(departments_data) - dept_created} already existed")

        # ── Leave Types ──
        leave_types_data = [
            {'name': 'Sick Leave', 'max_days_per_year': 10, 'is_paid': True, 'requires_document': True},
            {'name': 'Casual Leave', 'max_days_per_year': 12, 'is_paid': True, 'requires_document': False},
            {'name': 'Earned/Privilege Leave', 'max_days_per_year': 15, 'is_paid': True, 'requires_document': False},
            {'name': 'Paid Leave', 'max_days_per_year': 20, 'is_paid': True, 'requires_document': False},
            {'name': 'Unpaid Leave (LWP)', 'max_days_per_year': 30, 'is_paid': False, 'requires_document': False},
            {'name': 'Maternity Leave', 'max_days_per_year': 180, 'is_paid': True, 'requires_document': True},
            {'name': 'Paternity Leave', 'max_days_per_year': 15, 'is_paid': True, 'requires_document': True},
            {'name': 'Compensatory Off', 'max_days_per_year': 10, 'is_paid': True, 'requires_document': False},
            {'name': 'Bereavement Leave', 'max_days_per_year': 5, 'is_paid': True, 'requires_document': False},
            {'name': 'Work From Home', 'max_days_per_year': 30, 'is_paid': True, 'requires_document': False},
        ]
        lt_created = 0
        for lt in leave_types_data:
            _, created = LeaveType.objects.get_or_create(name=lt['name'], defaults=lt)
            if created:
                lt_created += 1
        self.stdout.write(f"🏷️  Leave Types: {lt_created} created, {len(leave_types_data) - lt_created} already existed")

        # ── Backfill Leave Balances for ALL employees ──
        current_year = datetime.now().year
        leave_types = LeaveType.objects.all()
        employees = Employee.objects.all()
        bal_created = 0

        for emp in employees:
            for lt in leave_types:
                _, created = LeaveBalance.objects.get_or_create(
                    employee=emp,
                    leave_type=lt,
                    year=current_year,
                    defaults={'allocated_days': lt.max_days_per_year, 'used_days': 0},
                )
                if created:
                    bal_created += 1

        self.stdout.write(f"📊 Leave Balances: {bal_created} created for {employees.count()} employees")
        self.stdout.write(self.style.SUCCESS("✅ Setup data complete!"))
