import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth import get_user_model
from employees.models import Department, Employee
from leaves.models import LeaveType, LeaveRequest, LeaveBalance
from payroll.models import Salary
from datetime import date, timedelta

User = get_user_model()

print("=== Seeding WorkForce Hub ===\n")

# ---------- Departments ----------
departments_data = [
    {"name": "Engineering", "description": "Software development and architecture"},
    {"name": "Human Resources", "description": "Recruitment, onboarding, and employee welfare"},
    {"name": "Finance", "description": "Accounting, payroll, and budgeting"},
    {"name": "Marketing", "description": "Branding, campaigns, and social media"},
    {"name": "Operations", "description": "Day-to-day business operations and logistics"},
]

departments = {}
for d in departments_data:
    dept, created = Department.objects.get_or_create(name=d["name"], defaults=d)
    departments[d["name"]] = dept
    print(f"  {'Created' if created else 'Exists'} department: {dept.name}")

# ---------- Users & Employees ----------
users_data = [
    {"username": "admin1", "email": "admin1@workforce.com", "password": "Admin@123", "role": "admin",
     "emp": {"designation": "CTO", "department": "Engineering", "phone": "+91 98765 43210",
             "employee_code": "EMP-001", "date_of_joining": "2020-01-15",
             "address": "42 Tech Park, Whitefield", "city": "Bangalore",
             "emergency_contact_name": "Priya Sharma", "emergency_contact_phone": "+91 98765 00001"}},

    {"username": "hr_neha", "email": "neha@workforce.com", "password": "Neha@123", "role": "hr",
     "emp": {"designation": "HR Manager", "department": "Human Resources", "phone": "+91 87654 32109",
             "employee_code": "EMP-002", "date_of_joining": "2021-03-20",
             "address": "15 MG Road, Indiranagar", "city": "Bangalore",
             "emergency_contact_name": "Rahul Verma", "emergency_contact_phone": "+91 87654 00002"}},

    {"username": "mgr_rahul", "email": "rahul@workforce.com", "password": "Rahul@123", "role": "manager",
     "emp": {"designation": "Engineering Manager", "department": "Engineering", "phone": "+91 76543 21098",
             "employee_code": "EMP-003", "date_of_joining": "2021-06-10",
             "address": "88 Koramangala 5th Block", "city": "Bangalore",
             "emergency_contact_name": "Sneha Patel", "emergency_contact_phone": "+91 76543 00003"}},

    {"username": "dev_ankit", "email": "ankit@workforce.com", "password": "Ankit@123", "role": "employee",
     "emp": {"designation": "Senior Software Engineer", "department": "Engineering", "phone": "+91 65432 10987",
             "employee_code": "EMP-004", "date_of_joining": "2022-01-10",
             "address": "22 HSR Layout Sector 2", "city": "Bangalore",
             "emergency_contact_name": "Meera Gupta", "emergency_contact_phone": "+91 65432 00004"}},

    {"username": "dev_priya", "email": "priya.dev@workforce.com", "password": "Priya@123", "role": "employee",
     "emp": {"designation": "Frontend Developer", "department": "Engineering", "phone": "+91 54321 09876",
             "employee_code": "EMP-005", "date_of_joining": "2022-06-01",
             "address": "Block C, Prestige Shantiniketan", "city": "Bangalore",
             "emergency_contact_name": "Amit Kumar", "emergency_contact_phone": "+91 54321 00005"}},

    {"username": "fin_sneha", "email": "sneha@workforce.com", "password": "Sneha@123", "role": "employee",
     "emp": {"designation": "Financial Analyst", "department": "Finance", "phone": "+91 43210 98765",
             "employee_code": "EMP-006", "date_of_joining": "2023-02-15",
             "address": "10 Jayanagar 4th Block", "city": "Bangalore",
             "emergency_contact_name": "Ravi Sharma", "emergency_contact_phone": "+91 43210 00006"}},

    {"username": "mkt_arjun", "email": "arjun@workforce.com", "password": "Arjun@123", "role": "employee",
     "emp": {"designation": "Marketing Lead", "department": "Marketing", "phone": "+91 32109 87654",
             "employee_code": "EMP-007", "date_of_joining": "2023-05-01",
             "address": "5 Lavelle Road", "city": "Bangalore",
             "emergency_contact_name": "Kavya Nair", "emergency_contact_phone": "+91 32109 00007"}},

    {"username": "ops_kavya", "email": "kavya@workforce.com", "password": "Kavya@123", "role": "employee",
     "emp": {"designation": "Operations Coordinator", "department": "Operations", "phone": "+91 21098 76543",
             "employee_code": "EMP-008", "date_of_joining": "2023-08-10",
             "address": "30 Malleshwaram 8th Cross", "city": "Bangalore",
             "emergency_contact_name": "Deepak Singh", "emergency_contact_phone": "+91 21098 00008"}},
]

print("\n--- Users & Employees ---")
for u in users_data:
    user, created = User.objects.get_or_create(
        username=u["username"],
        defaults={"email": u["email"], "role": u["role"]}
    )
    if created:
        user.set_password(u["password"])
        user.save()
    print(f"  {'Created' if created else 'Exists'} user: {user.username} ({user.role})")

    emp_data = u["emp"].copy()
    dept_name = emp_data.pop("department")
    emp_data["department"] = departments[dept_name]
    emp_data["user"] = user

    emp, emp_created = Employee.objects.get_or_create(
        user=user,
        defaults=emp_data
    )
    if not emp_created:
        # Update existing with new fields
        for k, v in emp_data.items():
            if k != "user":
                setattr(emp, k, v)
        emp.save()
    print(f"  {'Created' if emp_created else 'Updated'} employee: {emp.employee_code} - {emp.designation}")

# ---------- Leave Types ----------
leave_types_data = [
    {"name": "Sick Leave", "max_days_per_year": 10, "is_paid": True, "requires_document": True},
    {"name": "Casual Leave", "max_days_per_year": 12, "is_paid": True, "requires_document": False},
    {"name": "Earned/Privilege Leave", "max_days_per_year": 15, "is_paid": True, "requires_document": False},
    {"name": "Paid Leave", "max_days_per_year": 20, "is_paid": True, "requires_document": False},
    {"name": "Unpaid Leave (LWP)", "max_days_per_year": 30, "is_paid": False, "requires_document": False},
     {"name": "Paternity Leave", "max_days_per_year": 15, "is_paid": True, "requires_document": True},
    {"name": "Compensatory Off", "max_days_per_year": 10, "is_paid": True, "requires_document": False},
    {"name": "Bereavement Leave", "max_days_per_year": 5, "is_paid": True, "requires_document": False},
    {"name": "Work From Home", "max_days_per_year": 30, "is_paid": True, "requires_document": False},
]

print("\n--- Leave Types ---")
leave_types = {}
for lt in leave_types_data:
    obj, created = LeaveType.objects.get_or_create(name=lt["name"], defaults=lt)
    leave_types[lt["name"]] = obj
    print(f"  {'Created' if created else 'Exists'} leave type: {obj.name} ({obj.max_days_per_year} days)")

print("\n--- Seeding Initial Leave Balances ---")
current_year = date.today().year
for emp_obj in Employee.objects.all():
    for lt_name, type_obj in leave_types.items():
        balance_obj, created = LeaveBalance.objects.get_or_create(
            employee=emp_obj,
            leave_type=type_obj,
            year=current_year,
            defaults={"allocated_days": type_obj.max_days_per_year, "used_days": 0}
        )
        if hasattr(balance_obj, 'allocated_days') and balance_obj.allocated_days != type_obj.max_days_per_year:
             balance_obj.allocated_days = type_obj.max_days_per_year
             balance_obj.save()
print("  Leave balances seeded for all employees.")

# ---------- Leave Requests ----------
print("\n--- Leave Requests ---")
today = date.today()
leave_requests = [
    {"employee": "dev_ankit", "leave_type": "Casual Leave", "start": today + timedelta(days=5), "end": today + timedelta(days=6), "reason": "Family function", "status": "pending"},
    {"employee": "dev_priya", "leave_type": "Sick Leave", "start": today - timedelta(days=3), "end": today - timedelta(days=1), "reason": "Fever and cold", "status": "approved"},
    {"employee": "fin_sneha", "leave_type": "Work From Home", "start": today + timedelta(days=2), "end": today + timedelta(days=2), "reason": "Internet setup at new flat", "status": "pending"},
    {"employee": "mkt_arjun", "leave_type": "Earned/Privilege Leave", "start": today + timedelta(days=10), "end": today + timedelta(days=14), "reason": "Annual vacation", "status": "rejected"},
    {"employee": "ops_kavya", "leave_type": "Casual Leave", "start": today + timedelta(days=1), "end": today + timedelta(days=1), "reason": "Personal work", "status": "pending"},
]

for lr in leave_requests:
    emp = Employee.objects.get(user__username=lr["employee"])
    lt = leave_types[lr["leave_type"]]
    obj, created = LeaveRequest.objects.get_or_create(
        employee=emp, leave_type=lt, start_date=lr["start"],
        defaults={"end_date": lr["end"], "reason": lr["reason"], "status": lr["status"]}
    )
    print(f"  {'Created' if created else 'Exists'} leave: {lr['employee']} - {lr['leave_type']} ({lr['status']})")

# ---------- Salaries ----------
print("\n--- Salary Records ---")
salary_data = [
    {"employee": "admin1", "basic": 150000, "bonus": 20000, "deductions": 12000},
    {"employee": "hr_neha", "basic": 95000, "bonus": 10000, "deductions": 8000},
    {"employee": "mgr_rahul", "basic": 130000, "bonus": 15000, "deductions": 10500},
    {"employee": "dev_ankit", "basic": 110000, "bonus": 12000, "deductions": 9200},
    {"employee": "dev_priya", "basic": 85000, "bonus": 8000, "deductions": 7000},
    {"employee": "fin_sneha", "basic": 90000, "bonus": 9000, "deductions": 7500},
    {"employee": "mkt_arjun", "basic": 80000, "bonus": 7000, "deductions": 6500},
    {"employee": "ops_kavya", "basic": 70000, "bonus": 5000, "deductions": 5500},
]

for s in salary_data:
    emp = Employee.objects.get(user__username=s["employee"])
    obj, created = Salary.objects.get_or_create(
        employee=emp, pay_date=date(today.year, today.month, 1),
        defaults={"basic_salary": s["basic"], "bonus": s["bonus"], "deductions": s["deductions"]}
    )
    print(f"  {'Created' if created else 'Exists'} salary: {s['employee']} - Net: {obj.net_salary}")

print("\n=== Seeding Complete! ===")
print("\n--- Login Credentials ---")
print(f"{'Username':<15} {'Password':<15} {'Role':<10}")
print("-" * 40)
for u in users_data:
    print(f"{u['username']:<15} {u['password']:<15} {u['role']:<10}")
