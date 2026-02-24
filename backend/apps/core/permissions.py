from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ("admin", "staff", "program_manager")


class IsApproved(BasePermission):
    """Blocks users whose accounts have not yet been approved by admin."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_approved


class IsMentor(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "mentor"


class IsContentManager(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in (
            "admin", "staff", "program_manager", "content_manager"
        )
