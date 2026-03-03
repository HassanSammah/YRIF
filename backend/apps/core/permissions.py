from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ("admin", "staff", "program_manager")


class IsApproved(BasePermission):
    """Allows only users whose account status is ACTIVE."""
    def has_permission(self, request, view):
        from apps.accounts.models import UserStatus
        return (
            request.user.is_authenticated
            and request.user.status == UserStatus.ACTIVE
        )


class IsMentor(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "mentor"


class IsContentManager(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in (
            "admin", "staff", "program_manager", "content_manager"
        )
