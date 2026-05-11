"""
dashboard/consumers.py
──────────────────────
WebSocket consumer for real-time dashboard sync.

All connected admin/hr clients join the "dashboard_updates" group.
When leave or attendance events fire, the group receives a push that
includes the updated summary payload so the frontend can refresh
immediately without waiting for the next 30-second poll.

URL: ws/dashboard/
Token auth via ?token=<JWT_ACCESS_TOKEN>
"""
import json
import logging
import urllib.parse
from datetime import date, timedelta

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken

logger = logging.getLogger("dashboard_ws")


class DashboardConsumer(AsyncWebsocketConsumer):
    GROUP_NAME = "dashboard_updates"

    # ─────────────────────── lifecycle ───────────────────────
    async def connect(self):
        # Parse JWT from query string
        qs = self.scope.get("query_string", b"").decode()
        params = urllib.parse.parse_qs(qs)
        token = params.get("token", [None])[0]

        self.user = await self._get_user(token)
        if not self.user or not self.user.is_active:
            logger.debug("DashboardConsumer: rejected — invalid/inactive user")
            await self.close()
            return

        # Only admin and hr may subscribe to dashboard WS updates
        if self.user.role not in ("admin", "hr"):
            logger.debug("DashboardConsumer: rejected — insufficient role (%s)", self.user.role)
            await self.close()
            return

        await self.channel_layer.group_add(self.GROUP_NAME, self.channel_name)
        await self.accept()
        logger.debug("DashboardConsumer: %s connected", self.user.username)

        # Send a snapshot immediately on connect so the UI is always fresh
        snapshot = await self._build_summary_payload()
        await self.send(text_data=json.dumps({
            "type": "dashboard_snapshot",
            "payload": snapshot,
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.GROUP_NAME, self.channel_name)

    async def receive(self, text_data):
        """
        Clients can send { "type": "ping" } to keep the connection alive.
        Any other message is silently ignored.
        """
        try:
            data = json.loads(text_data or "{}")
        except json.JSONDecodeError:
            return

        if data.get("type") == "ping":
            await self.send(text_data=json.dumps({"type": "pong"}))

    # ─────────────── group message handlers ──────────────────
    async def dashboard_update(self, event):
        """
        Receives broadcasts from leave/attendance signal helpers and
        forwards a lightweight 'dashboard_update' event to the browser.
        The frontend can either use the embedded payload or trigger a
        fresh REST poll.
        """
        await self.send(text_data=json.dumps({
            "type": "dashboard_update",
            "trigger": event.get("trigger", "unknown"),
            "payload": event.get("payload", {}),
        }))

    async def dashboard_snapshot(self, event):
        await self.send(text_data=json.dumps({
            "type": "dashboard_snapshot",
            "payload": event.get("payload", {}),
        }))

    # ─────────────────── helpers ─────────────────────────────
    @database_sync_to_async
    def _get_user(self, token):
        if not token:
            return None
        try:
            access = AccessToken(token)
            user_id = access.get("user_id")
            if not user_id:
                return None
            from accounts.models import User
            return User.objects.get(id=user_id)
        except (TokenError, InvalidToken) as exc:
            logger.debug("DashboardConsumer JWT error: %s", exc)
            return None
        except Exception as exc:
            logger.debug("DashboardConsumer user lookup error: %s", exc)
            return None

    @database_sync_to_async
    def _build_summary_payload(self):
        """
        Lightweight summary used for the on-connect snapshot and pushed
        updates. Mirrors the key fields from DashboardSummaryView but runs
        inside an async-safe wrapper.
        """
        from django.utils import timezone
        from django.db.models import Count
        from employees.models import Employee, Department
        from leaves.models import LeaveRequest
        from dashboard.models import Attendance
        from dashboard.views import _compute_present_today

        today = date.today()
        first_of_month = today.replace(day=1)

        total_employees = Employee.objects.count()
        total_departments = Department.objects.count()

        leave_map = {
            item["status"]: item["count"]
            for item in LeaveRequest.objects.values("status").annotate(count=Count("id"))
        }

        employees_on_leave_today = (
            LeaveRequest.objects
            .filter(status="approved", start_date__lte=today, end_date__gte=today)
            .values("employee").distinct().count()
        )

        present_today, using_attendance = _compute_present_today(today)

        upcoming_leaves = LeaveRequest.objects.filter(
            status="approved",
            start_date__gt=today,
            start_date__lte=today + timedelta(days=7),
        ).count()

        pending_requests = LeaveRequest.objects.filter(status="pending").count()
        new_joiners = Employee.objects.filter(date_of_joining__gte=first_of_month).count()

        return {
            "last_updated": timezone.now().isoformat(),
            "total_employees": total_employees,
            "total_departments": total_departments,
            "present_today": present_today,
            "present_today_source": "attendance" if using_attendance else "leave_fallback",
            "employees_on_leave_today": employees_on_leave_today,
            "upcoming_leaves": upcoming_leaves,
            "pending_requests_total": pending_requests,
            "new_joiners_this_month": new_joiners,
            "leave_counts": {
                "pending": leave_map.get("pending", 0),
                "approved": leave_map.get("approved", 0),
                "rejected": leave_map.get("rejected", 0),
            },
        }


# ─────────────────────────────────────────────────────────────────────
# Public helper: broadcast a dashboard_update to all connected clients.
# Call this from signals or views after any significant state change.
# ─────────────────────────────────────────────────────────────────────
async def broadcast_dashboard_update(trigger: str, payload: dict | None = None):
    """
    Async helper to push a dashboard_update message to all admin/hr
    WebSocket clients.

    Usage (in an async context):
        await broadcast_dashboard_update("leave_approved", {"leave_id": 5})

    Usage (from a synchronous Django signal / view):
        from asgiref.sync import async_to_sync
        from channels.layers import get_channel_layer
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            DashboardConsumer.GROUP_NAME,
            {
                "type": "dashboard_update",
                "trigger": trigger,
                "payload": payload or {},
            }
        )
    """
    from channels.layers import get_channel_layer
    channel_layer = get_channel_layer()
    await channel_layer.group_send(
        DashboardConsumer.GROUP_NAME,
        {
            "type": "dashboard_update",
            "trigger": trigger,
            "payload": payload or {},
        },
    )
