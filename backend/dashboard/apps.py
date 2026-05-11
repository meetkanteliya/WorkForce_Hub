from django.apps import AppConfig


class DashboardConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "dashboard"

    def ready(self):
        # Register post_save signals for real-time WebSocket broadcasts
        import dashboard.signals  # noqa: F401