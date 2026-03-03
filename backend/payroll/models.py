from django.db import models
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
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "salaries"
        ordering = ["-pay_date"]

    def save(self, *args, **kwargs):
        self.net_salary = self.basic_salary + self.bonus - self.deductions
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.employee} - {self.pay_date} - {self.net_salary}"
