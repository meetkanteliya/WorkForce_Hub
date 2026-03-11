from django.db import models
from django.conf import settings
from employees.models import Department
from django.utils import timezone

class ChatMessage(models.Model):
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='chat_messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    read_by = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='read_messages', blank=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.sender.username} - {self.department.name} - {self.timestamp}"


class CompanyChatMessage(models.Model):
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='company_sent_messages',
    )
    content = models.TextField(blank=True)
    attachment = models.FileField(upload_to="chat_uploads/", null=True, blank=True)
    attachment_name = models.CharField(max_length=255, blank=True)
    attachment_mime = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    deleted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="company_deleted_messages",
    )
    deleted_reason = models.CharField(max_length=255, blank=True)
    read_by = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through="CompanyChatMessageRead",
        related_name="company_read_messages",
        blank=True,
    )

    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=["created_at"]),
            models.Index(fields=["sender", "created_at"]),
        ]

    def __str__(self):
        return f"{self.sender.username} - {self.created_at}"

    @property
    def is_deleted(self):
        return self.deleted_at is not None

    def soft_delete(self, actor, reason=""):
        if self.deleted_at:
            return
        self.deleted_at = timezone.now()
        self.deleted_by = actor
        self.deleted_reason = reason or ""
        # Preserve attachment for audit, but hide message body
        self.content = ""
        self.save(update_fields=["deleted_at", "deleted_by", "deleted_reason", "content"])


class CompanyChatMessageRead(models.Model):
    message = models.ForeignKey(CompanyChatMessage, on_delete=models.CASCADE, related_name="read_receipts")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="company_message_reads")
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("message", "user")
        indexes = [
            models.Index(fields=["message", "read_at"]),
            models.Index(fields=["user", "read_at"]),
        ]
