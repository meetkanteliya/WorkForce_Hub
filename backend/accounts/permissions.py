from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"


class IsHR(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "hr"


class IsManager(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "manager"


class IsEmployee(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "employee"


class IsAdminOrHR(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ["admin", "hr"]


class IsManagerOrAbove(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in [
            "admin", "hr", "manager"
        ]


class IsOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        return request.user.role == "admin" or obj.user == request.user