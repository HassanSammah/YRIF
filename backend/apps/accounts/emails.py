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


def send_email_verification_otp(user, otp_code):
    """Send a 6-digit email verification OTP to the user."""
    html = f"""
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #093344 0%, #0D9488 100%); padding: 40px 32px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">YRIF</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">Youth Research &amp; Innovation Foundation</p>
      </div>
      <div style="padding: 40px 32px; background: #ffffff;">
        <h2 style="color: #093344; font-size: 22px; margin: 0 0 16px;">Verify Your Email</h2>
        <p style="color: #4B5563; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
          Hi {user.first_name}, welcome to YRIF! Use the code below to verify your email address.
        </p>
        <div style="background: #f0fdfa; border: 2px solid #0D9488; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
          <p style="color: #6B7280; font-size: 13px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.05em;">Your verification code</p>
          <p style="color: #093344; font-size: 40px; font-weight: 800; letter-spacing: 0.15em; margin: 0;">{otp_code}</p>
          <p style="color: #9CA3AF; font-size: 12px; margin: 8px 0 0;">Expires in 15 minutes</p>
        </div>
        <p style="color: #6B7280; font-size: 13px; line-height: 1.6;">If you didn't create a YRIF account, you can safely ignore this email.</p>
      </div>
      <div style="background: #093344; padding: 20px 32px; text-align: center; border-radius: 0 0 12px 12px;">
        <p style="color: rgba(255,255,255,0.6); font-size: 12px; margin: 0;">© 2024 Youth Research &amp; Innovation Foundation · info@yriftz.org</p>
      </div>
    </div>
    """
    send_mail(
        subject="[YRIF] Verify your email address",
        message=f"Your YRIF verification code is: {otp_code}. It expires in 15 minutes.",
        from_email="noreply@yriftz.org",
        recipient_list=[user.email],
        html_message=html,
        fail_silently=True,
    )


def send_welcome_email(user):
    """Welcome email for users who sign up via phone (BRIQ auth) — email OTP skipped."""
    html = f"""
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #093344 0%, #0D9488 100%); padding: 40px 32px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">YRIF</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">Youth Research &amp; Innovation Foundation</p>
      </div>
      <div style="padding: 40px 32px; background: #ffffff;">
        <h2 style="color: #093344; font-size: 22px; margin: 0 0 16px;">Welcome to YRIF!</h2>
        <p style="color: #4B5563; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
          Hi {user.first_name}, your account has been created successfully. Your phone number has been verified
          and your account is now active.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://app.yriftz.org/dashboard"
             style="background: #0D9488; color: #ffffff; text-decoration: none; padding: 14px 32px;
                    border-radius: 8px; font-size: 15px; font-weight: 600; display: inline-block;">
            Go to Dashboard
          </a>
        </div>
        <p style="color: #6B7280; font-size: 13px; line-height: 1.6;">
          If you have any questions, contact us at info@yriftz.org.
        </p>
      </div>
      <div style="background: #093344; padding: 20px 32px; text-align: center; border-radius: 0 0 12px 12px;">
        <p style="color: rgba(255,255,255,0.6); font-size: 12px; margin: 0;">© 2024 Youth Research &amp; Innovation Foundation · info@yriftz.org</p>
      </div>
    </div>
    """
    send_mail(
        subject="[YRIF] Welcome to the Youth Research & Innovation Foundation",
        message=(
            f"Hi {user.first_name},\n\n"
            f"Your YRIF account has been created and your phone has been verified. "
            f"You can now log in at https://app.yriftz.org/dashboard.\n\n"
            f"The YRIF Team"
        ),
        from_email="noreply@yriftz.org",
        recipient_list=[user.email],
        html_message=html,
        fail_silently=True,
    )
