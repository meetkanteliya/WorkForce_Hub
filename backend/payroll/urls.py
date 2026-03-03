from rest_framework.routers import DefaultRouter
from .views import SalaryViewSet

router = DefaultRouter()
router.register("payroll", SalaryViewSet, basename="payroll")

urlpatterns = router.urls
