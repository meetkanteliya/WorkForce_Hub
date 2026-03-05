from django.db import models
from django.conf import settings


class AuditLog(models.Model):
    """
    Central audit log that records every significant event in the system.
    """
    ACTION_TYPES = (
        ("leave_request", "Leave Requested"),
        ("leave_approved", "Leave Approved"),
        ("leave_rejected", "Leave Rejected"),
        ("employee_added", "Employee Added"),
        ("salary_paid", "Salary Paid"),
        ("profile_updated", "Profile Updated"),
    )

    action_type = models.CharField(max_length=30, choices=ACTION_TYPES, db_index=True)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="audit_actions",
        help_text="The user who performed the action.",
    )
    target_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_targets",
        help_text="The user affected by the action (optional).",
    )
    message = models.TextField()
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Audit Log"
        verbose_name_plural = "Audit Logs"

    def __str__(self):
        return f"[{self.action_type}] {self.message} ({self.created_at:%Y-%m-%d %H:%M})"
