from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import os


class Command(BaseCommand):
    help = 'Create default admin user with Employee record'

    def handle(self, *args, **kwargs):
        User = get_user_model()
        from employees.models import Employee, Department

        username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin')
        password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'Admin@123')
        email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@workforcehub.com')

        if not User.objects.filter(username=username).exists():
            user = User.objects.create_superuser(
                username=username,
                password=password,
                email=email,
                first_name='System',
                last_name='Admin',
            )
            user.role = 'admin'
            user.save()
            self.stdout.write(self.style.SUCCESS(
                f"✅ Admin user created! Username: {username} | Role: admin"
            ))
        else:
            user = User.objects.get(username=username)
            self.stdout.write(f"ℹ️ Admin user '{username}' already exists — skipping.")

        # Ensure admin has an Employee record (fixes "Onboarding Incomplete")
        if not hasattr(user, 'employee') or not Employee.objects.filter(user=user).exists():
            admin_dept, _ = Department.objects.get_or_create(
                name='Administration',
                defaults={'description': 'System administration and management'}
            )
            Employee.objects.create(
                user=user,
                department=admin_dept,
                designation='System Administrator',
                employee_code='EMP-ADMIN',
            )
            self.stdout.write(self.style.SUCCESS(
                "✅ Admin Employee record created (Department: Administration)"
            ))
        else:
            self.stdout.write("ℹ️ Admin Employee record already exists — skipping.")