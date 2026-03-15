"""
Email notification utilities for the accounts module.
In development these print to the console (EMAIL_BACKEND = console).
In production they go through the configured SMTP backend.
"""
from django.core.mail import send_mail
from django.conf import settings


_FROM = "noreply@yriftz.org"
_ADMIN_EMAILS = [settings.DEFAULT_FROM_EMAIL]


def _admin_list():
    return getattr(settings, "ADMIN_EMAIL_LIST", _ADMIN_EMAILS)


def _html_wrapper(content: str) -> str:
    """Wrap content in the standard YRIF email shell."""
    return f"""
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #093344 0%, #0D9488 100%); padding: 40px 32px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">YRIF</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">Youth Research &amp; Innovation Foundation</p>
      </div>
      <div style="padding: 40px 32px; background: #ffffff;">
        {content}
      </div>
      <div style="background: #093344; padding: 20px 32px; text-align: center; border-radius: 0 0 12px 12px;">
        <p style="color: rgba(255,255,255,0.6); font-size: 12px; margin: 0;">© 2024 Youth Research &amp; Innovation Foundation · info@yriftz.org</p>
      </div>
    </div>
    """


def _cta_button(url: str, label: str) -> str:
    return (
        f'<div style="text-align: center; margin: 32px 0;">'
        f'<a href="{url}" style="background: #0D9488; color: #ffffff; text-decoration: none; '
        f'padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; display: inline-block;">'
        f'{label}</a></div>'
    )


def notify_admin_new_registration(user):
    """Notify admin team when a new user registers."""
    content = f"""
        <h2 style="color: #093344; font-size: 22px; margin: 0 0 16px;">New User Registered</h2>
        <p style="color: #4B5563; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
          A new user has registered on the YRIF platform.
        </p>
        <div style="background: #f8fafc; border-radius: 10px; padding: 20px; margin: 0 0 24px;">
          <p style="margin: 0 0 8px; font-size: 14px; color: #374151;"><strong>Name:</strong> {user.get_full_name()}</p>
          <p style="margin: 0 0 8px; font-size: 14px; color: #374151;"><strong>Email:</strong> {user.email}</p>
          <p style="margin: 0; font-size: 14px; color: #374151;"><strong>Role:</strong> {user.get_role_display()}</p>
        </div>
        {_cta_button("https://app.yriftz.org/admin/users", "View in Admin Panel")}
    """
    send_mail(
        subject="[YRIF] New user registered",
        message=(
            f"A new user has registered.\n\n"
            f"Name: {user.get_full_name()}\nEmail: {user.email}\nRole: {user.get_role_display()}\n\n"
            f"View: https://app.yriftz.org/admin/users"
        ),
        from_email=_FROM,
        recipient_list=_admin_list(),
        html_message=_html_wrapper(content),
        fail_silently=False,
    )


def notify_user_approved(user):
    """Notify user that their account has been approved."""
    content = f"""
        <h2 style="color: #0D9488; font-size: 22px; margin: 0 0 16px;">You're Approved!</h2>
        <p style="color: #4B5563; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
          Hi {user.first_name}, your YRIF account has been approved. You now have full access to the platform.
          Welcome to the Youth Research &amp; Innovation Foundation!
        </p>
        {_cta_button("https://app.yriftz.org/dashboard", "Go to Dashboard")}
        <p style="color: #9CA3AF; font-size: 13px; line-height: 1.6;">
          Questions? Contact us at info@yriftz.org
        </p>
    """
    send_mail(
        subject="[YRIF] Your account has been approved",
        message=(
            f"Hi {user.first_name},\n\nYour YRIF account has been approved.\n\n"
            f"Get started: https://app.yriftz.org/dashboard\n\nThe YRIF Team"
        ),
        from_email=_FROM,
        recipient_list=[user.email],
        html_message=_html_wrapper(content),
        fail_silently=False,
    )


def notify_user_rejected(user, reason=""):
    """Notify user that their account has been rejected."""
    reason_block = ""
    if reason:
        reason_block = (
            f'<div style="background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 6px; '
            f'padding: 16px; margin: 16px 0;">'
            f'<p style="color: #dc2626; font-size: 14px; margin: 0;"><strong>Reason:</strong> {reason}</p>'
            f'</div>'
        )
    content = f"""
        <h2 style="color: #093344; font-size: 22px; margin: 0 0 16px;">Application Not Approved</h2>
        <p style="color: #4B5563; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
          Hi {user.first_name}, unfortunately your YRIF account application could not be approved at this time.
        </p>
        {reason_block}
        <p style="color: #4B5563; font-size: 14px; line-height: 1.6;">
          If you believe this is a mistake or would like more information, please contact us at
          <a href="mailto:info@yriftz.org" style="color: #0D9488;">info@yriftz.org</a>.
        </p>
    """
    send_mail(
        subject="[YRIF] Your account application was not approved",
        message=(
            f"Hi {user.first_name},\n\nUnfortunately your YRIF account application could not be approved."
            + (f"\n\nReason: {reason}" if reason else "")
            + "\n\nContact: info@yriftz.org\n\nThe YRIF Team"
        ),
        from_email=_FROM,
        recipient_list=[user.email],
        html_message=_html_wrapper(content),
        fail_silently=False,
    )


def notify_user_suspended(user):
    """Notify user that their account has been suspended."""
    content = f"""
        <h2 style="color: #093344; font-size: 22px; margin: 0 0 16px;">Account Suspended</h2>
        <p style="color: #4B5563; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
          Hi {user.first_name}, your YRIF account has been temporarily suspended.
        </p>
        <p style="color: #4B5563; font-size: 14px; line-height: 1.6;">
          If you have any questions, please contact us at
          <a href="mailto:info@yriftz.org" style="color: #0D9488;">info@yriftz.org</a>.
        </p>
    """
    send_mail(
        subject="[YRIF] Your account has been suspended",
        message=(
            f"Hi {user.first_name},\n\nYour YRIF account has been temporarily suspended.\n\n"
            f"Contact: info@yriftz.org\n\nThe YRIF Team"
        ),
        from_email=_FROM,
        recipient_list=[user.email],
        html_message=_html_wrapper(content),
        fail_silently=False,
    )


def send_email_verification_otp(user, otp_code):
    """Send a 6-digit email verification OTP to the user."""
    content = f"""
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
    """
    send_mail(
        subject="[YRIF] Verify your email address",
        message=f"Your YRIF verification code is: {otp_code}. It expires in 15 minutes.",
        from_email=_FROM,
        recipient_list=[user.email],
        html_message=_html_wrapper(content),
        fail_silently=False,
    )


def send_email_change_otp(user, new_email, otp_code):
    """Send a 6-digit OTP to verify a new email address."""
    content = f"""
        <h2 style="color: #093344; font-size: 22px; margin: 0 0 16px;">Verify Your New Email</h2>
        <p style="color: #4B5563; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
          Hi {user.first_name}, use the code below to verify <strong>{new_email}</strong> as your new email address.
        </p>
        <div style="background: #f0fdfa; border: 2px solid #0D9488; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
          <p style="color: #6B7280; font-size: 13px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.05em;">Your verification code</p>
          <p style="color: #093344; font-size: 40px; font-weight: 800; letter-spacing: 0.15em; margin: 0;">{otp_code}</p>
          <p style="color: #9CA3AF; font-size: 12px; margin: 8px 0 0;">Expires in 15 minutes</p>
        </div>
        <p style="color: #6B7280; font-size: 13px; line-height: 1.6;">If you did not request this change, please contact us at info@yriftz.org immediately.</p>
    """
    send_mail(
        subject="[YRIF] Verify your new email address",
        message=f"Your YRIF email change verification code is: {otp_code}. It expires in 15 minutes.",
        from_email=_FROM,
        recipient_list=[new_email],
        html_message=_html_wrapper(content),
        fail_silently=False,
    )


def send_welcome_email(user):
    """Welcome email for users who sign up via phone (BRIQ auth) — email OTP skipped."""
    content = f"""
        <h2 style="color: #093344; font-size: 22px; margin: 0 0 16px;">Welcome to YRIF!</h2>
        <p style="color: #4B5563; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
          Hi {user.first_name}, your account has been created successfully. Your phone number has been verified
          and your account is now active. We're thrilled to have you join the national research and innovation community.
        </p>
        {_cta_button("https://app.yriftz.org/dashboard", "Go to Dashboard")}
        <p style="color: #6B7280; font-size: 13px; line-height: 1.6;">
          If you have any questions, contact us at info@yriftz.org.
        </p>
    """
    send_mail(
        subject="[YRIF] Welcome to the Youth Research & Innovation Foundation",
        message=(
            f"Hi {user.first_name},\n\nYour YRIF account has been created and your phone has been verified.\n\n"
            f"Get started: https://app.yriftz.org/dashboard\n\nThe YRIF Team"
        ),
        from_email=_FROM,
        recipient_list=[user.email],
        html_message=_html_wrapper(content),
        fail_silently=False,
    )


def send_post_verification_welcome_email(user):
    """Welcome email sent after successful email OTP verification."""
    content = f"""
        <h2 style="color: #093344; font-size: 22px; margin: 0 0 16px;">Welcome to YRIF!</h2>
        <p style="color: #4B5563; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
          Hi {user.first_name}, your email has been verified and your account is now active.
          Welcome to Tanzania's national platform for youth research and innovation!
        </p>
        <div style="background: #f0fdfa; border-radius: 10px; padding: 20px; margin: 0 0 24px;">
          <p style="color: #0D9488; font-size: 14px; font-weight: 600; margin: 0 0 8px;">What you can do on YRIF:</p>
          <ul style="color: #4B5563; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li>Submit and publish your research</li>
            <li>Join competitions and earn certificates</li>
            <li>Connect with mentors and research assistants</li>
            <li>Access learning resources and webinars</li>
          </ul>
        </div>
        {_cta_button("https://app.yriftz.org/dashboard", "Get Started")}
        <p style="color: #6B7280; font-size: 13px; line-height: 1.6;">
          Questions? We're here at info@yriftz.org.
        </p>
    """
    send_mail(
        subject="[YRIF] Welcome — your account is ready!",
        message=(
            f"Hi {user.first_name},\n\nYour email has been verified and your YRIF account is now active.\n\n"
            f"Get started: https://app.yriftz.org/dashboard\n\nThe YRIF Team"
        ),
        from_email=_FROM,
        recipient_list=[user.email],
        html_message=_html_wrapper(content),
        fail_silently=False,
    )


def send_deletion_approved_email(user):
    """Farewell email when admin approves account deletion."""
    content = f"""
        <h2 style="color: #093344; font-size: 22px; margin: 0 0 16px;">Account Deleted</h2>
        <p style="color: #4B5563; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
          Hi {user.first_name}, your request to delete your YRIF account has been approved and your account
          has been permanently removed.
        </p>
        <p style="color: #4B5563; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
          We're sorry to see you go. If you ever wish to rejoin, you're always welcome to create a new account.
        </p>
        <p style="color: #9CA3AF; font-size: 13px; line-height: 1.6;">
          Thank you for being part of the YRIF community. — The YRIF Team
        </p>
    """
    send_mail(
        subject="[YRIF] Your account has been deleted",
        message=(
            f"Hi {user.first_name},\n\nYour YRIF account has been permanently deleted as requested.\n\n"
            f"We're sorry to see you go. You're always welcome to rejoin.\n\nThe YRIF Team"
        ),
        from_email=_FROM,
        recipient_list=[user.email],
        html_message=_html_wrapper(content),
        fail_silently=False,
    )


def send_deletion_rejected_email(user):
    """Email when admin rejects an account deletion request."""
    content = f"""
        <h2 style="color: #093344; font-size: 22px; margin: 0 0 16px;">Deletion Request Not Approved</h2>
        <p style="color: #4B5563; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
          Hi {user.first_name}, your request to delete your YRIF account has been reviewed and was not approved.
          Your account remains active.
        </p>
        <p style="color: #4B5563; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
          If you have questions or would like more information, please contact us at
          <a href="mailto:info@yriftz.org" style="color: #0D9488;">info@yriftz.org</a>.
        </p>
        {_cta_button("https://app.yriftz.org/dashboard", "Go to Dashboard")}
    """
    send_mail(
        subject="[YRIF] Your account deletion request was not approved",
        message=(
            f"Hi {user.first_name},\n\nYour account deletion request was not approved. Your account remains active.\n\n"
            f"Questions? Contact: info@yriftz.org\n\nThe YRIF Team"
        ),
        from_email=_FROM,
        recipient_list=[user.email],
        html_message=_html_wrapper(content),
        fail_silently=False,
    )
