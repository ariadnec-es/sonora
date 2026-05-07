from rest_framework import permissions

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.user.is_staff or request.user.is_admin:
            return True
        return request.method in permissions.SAFE_METHODS