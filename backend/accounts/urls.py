from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .views import ProfileView, ChangePasswordView, AdminResetPasswordView

urlpatterns = [
    path('login/', TokenObtainPairView.as_view()),
    path('token/refresh/', TokenRefreshView.as_view()),
    path('profile/', ProfileView.as_view()),
    path('change-password/', ChangePasswordView.as_view()),
    path('admin-reset-password/', AdminResetPasswordView.as_view()),
]