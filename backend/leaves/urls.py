from rest_framework.routers import DefaultRouter
from .views import LeaveTypeViewSet, LeaveRequestViewSet, LeaveBalanceViewSet

router = DefaultRouter()
router.register("leaves/types", LeaveTypeViewSet, basename="leave-types")
router.register("leaves/requests", LeaveRequestViewSet, basename="leave-requests")
router.register("leaves/balances", LeaveBalanceViewSet, basename="leave-balances")

urlpatterns = router.urls