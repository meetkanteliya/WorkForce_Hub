from django.db import models
from django.conf import settings
from employees.models import Department

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

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender.username} - {self.created_at}"
