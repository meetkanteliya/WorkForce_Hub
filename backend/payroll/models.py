from django.db import models
from django.core.exceptions import ValidationError
from employees.models import Employee

class Salary(models.Model):
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name="salaries"
    )
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2)
    bonus = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_salary = models.DecimalField(max_digits=12, decimal_places=2, editable=False)
    pay_date = models.DateField()
    salary_month = models.IntegerField(null=True, blank=True)
    salary_year = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "salaries"
        ordering = ["-pay_date"]
        constraints = [
            models.UniqueConstraint(fields=["employee", "salary_month", "salary_year"], name="unique_employee_payroll_period")
        ]

    def clean(self):
        super().clean()
        if self.basic_salary is not None and self.bonus is not None and self.deductions is not None:
            if self.basic_salary < 0 or self.bonus < 0 or self.deductions < 0:
                raise ValidationError("Salary components cannot be negative.")
            net = self.basic_salary + self.bonus - self.deductions
            if net < 0:
                raise ValidationError("Net salary cannot be negative. Deductions exceed gross pay.")

    def save(self, *args, **kwargs):
        if self.pay_date:
            self.salary_month = self.pay_date.month
            self.salary_year = self.pay_date.year
        self.net_salary = self.basic_salary + self.bonus - self.deductions
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.employee} - {self.pay_date} - {self.net_salary}"
