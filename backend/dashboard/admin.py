from django.contrib import admin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("action_type", "actor", "target_user", "message", "created_at")
    list_filter = ("action_type", "created_at")
    search_fields = ("message", "actor__username", "target_user__username")
    readonly_fields = ("action_type", "actor", "target_user", "message", "metadata", "created_at")
    ordering = ("-created_at",)
    