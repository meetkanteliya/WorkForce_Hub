"""
dashboard/signals.py
─────────────────────
Post-save signal on AuditLog records.

Whenever a significant audit event is written (leave_approved,
leave_rejected, leave_request, employee_added, …) we push a
lightweight dashboard_update via WebSocket to all connected
admin/hr clients.

This means the dashboard refreshes instantly on state changes
without waiting for the 30-second polling interval.
"""
import logging
from asgiref.sync import async_to_sync
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import AuditLog

logger = logging.getLogger("dashboard_ws")

# Events that should trigger a real-time dashboard refresh
DASHBOARD_TRIGGER_EVENTS = {
    "leave_request",
    "leave_approved",
    "leave_rejected",
    "leave_balance_adjusted",
    "employee_added",
    "salary_paid",
    "profile_updated",
}


@receiver(post_save, sender=AuditLog)
def push_dashboard_update_on_audit(sender, instance, created, **kwargs):
    """
    After any new AuditLog entry is saved, broadcast a dashboard_update
    to all admin/hr WebSocket clients so they see changes immediately.
    Only fires for new records (created=True) to avoid double pushes.
    """
    if not created:
        return

    if instance.action_type not in DASHBOARD_TRIGGER_EVENTS:
        return

    try:
        from channels.layers import get_channel_layer
        from dashboard.consumers import DashboardConsumer

        channel_layer = get_channel_layer()
        if channel_layer is None:
            return  # No channel layer configured (e.g., test environment)

        async_to_sync(channel_layer.group_send)(
            DashboardConsumer.GROUP_NAME,
            {
                "type": "dashboard_update",
                "trigger": instance.action_type,
                "payload": {
                    "audit_log_id": instance.id,
                    "message": instance.message,
                    "actor": instance.actor.username if instance.actor else None,
                },
            },
        )
        logger.debug(
            "dashboard push triggered by AuditLog id=%s action=%s",
            instance.id,
            instance.action_type,
        )
    except Exception as exc:
        # Never crash the main request because of a WebSocket push failure
        logger.warning("Failed to push dashboard update: %s", exc)
