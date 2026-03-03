from rest_framework.routers import DefaultRouter
from .views import EmployeeViewSet, DepartmentViewSet

router = DefaultRouter()
router.register("employees", EmployeeViewSet, basename="employees")
router.register("departments", DepartmentViewSet, basename="departments")

urlpatterns = router.urls