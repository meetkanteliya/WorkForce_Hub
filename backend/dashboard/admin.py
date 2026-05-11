from django.contrib import admin
from .models import AuditLog, Notification, Attendance


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("action_type", "actor", "target_user", "message", "created_at")
    list_filter = ("action_type",)
    search_fields = ("message", "actor__username", "target_user__username")
    readonly_fields = ("created_at",)
    ordering = ("-created_at",)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("user", "message", "is_read", "created_at")
    list_filter = ("is_read",)
    search_fields = ("user__username", "message")
    readonly_fields = ("created_at",)


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ("employee", "date", "check_in", "check_out", "hours_worked", "is_present")
    list_filter = ("date", "is_present")
    search_fields = ("employee__user__username",)
    ordering = ("-date",)
    date_hierarchy = "date"