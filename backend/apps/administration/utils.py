"""Utility helpers for the administration module."""
from .models import AuditLog


def log_action(actor, action, target_type='', target_id=None, target_repr='', details=None):
    """
    Record an admin/platform action to the AuditLog.

    Usage:
        log_action(request.user, 'user.approved', 'user', user.id, str(user))
        log_action(request.user, 'research.published', 'research', research.id, research.title)
    """
    AuditLog.objects.create(
        actor=actor,
        action=action,
        target_type=target_type,
        target_id=target_id,
        target_repr=target_repr[:300] if target_repr else '',
        details=details or {},
    )
