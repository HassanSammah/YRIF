"""
Email notification utilities for the accounts module.
In development these print to the console (EMAIL_BACKEND = console).
In production they go through the configured SMTP backend.
"""
from django.core.mail import send_mail
from django.conf import settings


_FROM = settings.DEFAULT_FROM_EMAIL
_ADMIN_EMAILS = [settings.DEFAULT_FROM_EMAIL]  # Override via ADMIN_EMAIL_LIST in settings


def _admin_list():
    return getattr(settings, "ADMIN_EMAIL_LIST", _ADMIN_EMAILS)


def notify_admin_new_registration(user):
    """Notify admin team when a new user registers."""
    send_mail(
        subject="[YRIF] New user registration pending approval",
        message=(
            f"A new user has registered on the YRIF platform and is awaiting approval.\n\n"
            f"Name: {user.get_full_name()}\n"
            f"Email: {user.email}\n"
            f"Role: {user.get_role_display()}\n\n"
            f"Log in to the admin panel to approve or reject this account."
        ),
        from_email=_FROM,
        recipient_list=_admin_list(),
        fail_silently=True,
    )


def notify_user_approved(user):
    """Notify user that their account has been approved."""
    send_mail(
        subject="[YRIF] Your account has been approved",
        message=(
            f"Hi {user.first_name},\n\n"
            f"Great news! Your YRIF account has been approved. You can now log in and access all platform features.\n\n"
            f"Get started: https://app.yriftz.org/dashboard\n\n"
            f"Welcome to the Youth Research & Innovation Foundation!\n\n"
            f"The YRIF Team"
        ),
        from_email=_FROM,
        recipient_list=[user.email],
        fail_silently=True,
    )


def notify_user_rejected(user, reason=""):
    """Notify user that their account has been rejected."""
    reason_text = f"\n\nReason: {reason}" if reason else ""
    send_mail(
        subject="[YRIF] Your account application was not approved",
        message=(
            f"Hi {user.first_name},\n\n"
            f"Unfortunately, your YRIF account application could not be approved at this time.{reason_text}\n\n"
            f"If you believe this is a mistake or would like more information, please contact us at info@yriftz.org.\n\n"
            f"The YRIF Team"
        ),
        from_email=_FROM,
        recipient_list=[user.email],
        fail_silently=True,
    )


def notify_user_suspended(user):
    """Notify user that their account has been suspended."""
    send_mail(
        subject="[YRIF] Your account has been suspended",
        message=(
            f"Hi {user.first_name},\n\n"
            f"Your YRIF account has been temporarily suspended. "
            f"Please contact us at info@yriftz.org if you have any questions.\n\n"
            f"The YRIF Team"
        ),
        from_email=_FROM,
        recipient_list=[user.email],
        fail_silently=True,
    )
