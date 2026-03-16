"""
Email notifications for the accounts module — sent via Brevo Transactional API.
"""
from django.conf import settings

from apps.core.brevo import (
    send_email, _wrap, _cta, _otp_box, _info_card,
    _h2, _p, _small, _alert_block, _feature_list, _divider,
)

_FROM_NAME = "YRIF Mails"


def _admin_list():
    return getattr(settings, "ADMIN_EMAIL_LIST", [settings.DEFAULT_FROM_EMAIL])


# ── Admin notifications ───────────────────────────────────────────────────────

def notify_admin_new_registration(user):
    """Notify admin team when a new user registers."""
    content = (
        _h2("New User Registration")
        + _p("A new user has registered and is awaiting review on the YRIF platform.")
        + _info_card(
            ("Name", user.get_full_name()),
            ("Email", user.email),
            ("Role", user.get_role_display()),
        )
        + _cta("https://app.yriftz.org/admin/users", "Review in Admin Panel")
    )
    for admin_email in _admin_list():
        send_email(
            to_email=admin_email,
            to_name="YRIF Admin",
            subject=f"[YRIF] New registration: {user.get_full_name()}",
            html_content=_wrap(content),
        )


# ── User status notifications ─────────────────────────────────────────────────

def notify_user_approved(user):
    """Notify user that their account has been approved."""
    content = (
        _h2("You're Approved!", color="#0D9488")
        + _p(
            f"Hi {user.first_name}, your YRIF account has been approved. "
            f"You now have full access to Tanzania's national platform for youth "
            f"research and innovation. Welcome aboard!"
        )
        + _feature_list(
            "Submit and publish your research",
            "Connect with expert mentors",
            "Join competitions and earn certificates",
            "Access learning resources and webinars",
        )
        + _cta("https://app.yriftz.org/dashboard", "Get Started")
        + _small("Questions? Contact us at <a href='mailto:info@yriftz.org' "
                 "style='color:#0D9488;'>info@yriftz.org</a>")
    )
    send_email(
        to_email=user.email,
        to_name=user.get_full_name(),
        subject="[YRIF] Your account has been approved",
        html_content=_wrap(content),
    )


def notify_user_rejected(user, reason=""):
    """Notify user that their account application was not approved."""
    reason_block = ""
    if reason:
        reason_block = _alert_block(f"<strong>Reason:</strong> {reason}")

    content = (
        _h2("Application Not Approved")
        + _p(
            f"Hi {user.first_name}, unfortunately your YRIF account application "
            f"could not be approved at this time."
        )
        + reason_block
        + _p(
            "If you believe this is a mistake or would like more information, "
            "please contact us at "
            "<a href='mailto:info@yriftz.org' style='color:#0D9488;'>info@yriftz.org</a>.",
            color="#6B7280",
            size="14px",
        )
    )
    send_email(
        to_email=user.email,
        to_name=user.get_full_name(),
        subject="[YRIF] Your account application was not approved",
        html_content=_wrap(content),
    )


def notify_user_suspended(user):
    """Notify user that their account has been suspended."""
    content = (
        _h2("Account Suspended")
        + _p(
            f"Hi {user.first_name}, your YRIF account has been temporarily suspended. "
            f"If you have any questions or believe this was in error, please reach out."
        )
        + _p(
            "Contact us at "
            "<a href='mailto:info@yriftz.org' style='color:#0D9488;'>info@yriftz.org</a> "
            "and we will assist you as soon as possible.",
            color="#6B7280",
            size="14px",
        )
    )
    send_email(
        to_email=user.email,
        to_name=user.get_full_name(),
        subject="[YRIF] Your account has been suspended",
        html_content=_wrap(content),
    )


# ── Email verification OTPs ───────────────────────────────────────────────────

def send_email_verification_otp(user, otp_code):
    """Send a 6-digit email verification OTP to the user."""
    content = (
        _h2("Verify Your Email Address")
        + _p(
            f"Hi {user.first_name}, welcome to YRIF! "
            f"Use the code below to verify your email address and activate your account."
        )
        + _otp_box(otp_code)
        + _small(
            "If you did not create a YRIF account, you can safely ignore this email. "
            "This code is valid for <strong>15 minutes</strong>."
        )
    )
    send_email(
        to_email=user.email,
        to_name=user.get_full_name(),
        subject="[YRIF] Verify your email address",
        html_content=_wrap(content),
    )


def send_email_change_otp(user, new_email, otp_code):
    """Send a 6-digit OTP to verify a new email address."""
    content = (
        _h2("Verify Your New Email Address")
        + _p(
            f"Hi {user.first_name}, use the code below to confirm "
            f"<strong>{new_email}</strong> as your new email address on YRIF."
        )
        + _otp_box(otp_code)
        + _small(
            "If you did not request this change, please contact us immediately at "
            "<a href='mailto:info@yriftz.org' style='color:#0D9488;'>info@yriftz.org</a>. "
            "This code expires in <strong>15 minutes</strong>."
        )
    )
    send_email(
        to_email=new_email,
        to_name=user.get_full_name(),
        subject="[YRIF] Verify your new email address",
        html_content=_wrap(content),
    )


# ── Welcome emails ────────────────────────────────────────────────────────────

def send_welcome_email(user):
    """Welcome email for users who sign up via phone (BRIQ auth)."""
    content = (
        _h2("Welcome to YRIF!", color="#0D9488")
        + _p(
            f"Hi {user.first_name}, your account has been created and your phone number "
            f"has been verified. You're now part of Tanzania's national platform for "
            f"youth research and innovation!"
        )
        + _feature_list(
            "Submit and publish your research",
            "Connect with expert mentors and research assistants",
            "Join national competitions and earn certificates",
            "Access curated learning resources and webinars",
        )
        + _cta("https://app.yriftz.org/dashboard", "Go to Your Dashboard")
        + _small(
            "Need help getting started? Email us at "
            "<a href='mailto:info@yriftz.org' style='color:#0D9488;'>info@yriftz.org</a>"
        )
    )
    send_email(
        to_email=user.email,
        to_name=user.get_full_name(),
        subject="[YRIF] Welcome to the Youth Research & Innovation Foundation",
        html_content=_wrap(content),
    )


def send_post_verification_welcome_email(user):
    """Welcome email sent after successful email OTP verification."""
    content = (
        _h2("Your Account is Ready!", color="#0D9488")
        + _p(
            f"Hi {user.first_name}, your email has been verified and your YRIF account "
            f"is now active. Welcome to Tanzania's national platform for youth research "
            f"and innovation!"
        )
        + _feature_list(
            "Submit and publish your research",
            "Connect with expert mentors and research assistants",
            "Join national competitions and earn certificates",
            "Access curated learning resources and webinars",
        )
        + _cta("https://app.yriftz.org/dashboard", "Get Started")
        + _small(
            "Questions? We're here at "
            "<a href='mailto:info@yriftz.org' style='color:#0D9488;'>info@yriftz.org</a>"
        )
    )
    send_email(
        to_email=user.email,
        to_name=user.get_full_name(),
        subject="[YRIF] Welcome — your account is ready!",
        html_content=_wrap(content),
    )


# ── Account deletion ──────────────────────────────────────────────────────────

def send_deletion_approved_email(user):
    """Farewell email when admin approves account deletion."""
    content = (
        _h2("Account Deleted")
        + _p(
            f"Hi {user.first_name}, your request to delete your YRIF account has been "
            f"approved and your account has been permanently removed from the platform."
        )
        + _p(
            "We're sorry to see you go. You made a real contribution to the YRIF "
            "community and you're always welcome to create a new account in the future.",
            color="#6B7280",
            size="14px",
        )
        + _small("Thank you for being part of YRIF. — The YRIF Team")
    )
    send_email(
        to_email=user.email,
        to_name=user.get_full_name(),
        subject="[YRIF] Your account has been deleted",
        html_content=_wrap(content),
    )


def send_deletion_rejected_email(user):
    """Email when admin rejects an account deletion request."""
    content = (
        _h2("Deletion Request Not Approved")
        + _p(
            f"Hi {user.first_name}, your request to delete your YRIF account has been "
            f"reviewed and was not approved. Your account remains fully active."
        )
        + _p(
            "If you have questions or would like more information, please contact us at "
            "<a href='mailto:info@yriftz.org' style='color:#0D9488;'>info@yriftz.org</a>.",
            color="#6B7280",
            size="14px",
        )
        + _cta("https://app.yriftz.org/dashboard", "Go to Dashboard")
    )
    send_email(
        to_email=user.email,
        to_name=user.get_full_name(),
        subject="[YRIF] Your account deletion request was not approved",
        html_content=_wrap(content),
    )
