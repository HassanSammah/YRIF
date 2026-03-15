"""
Email notification triggers for the communications module.
These complement accounts/emails.py by covering events, research,
mentorship, and contact form routing.
"""
from django.core.mail import send_mail
from django.conf import settings


_FROM = settings.DEFAULT_FROM_EMAIL
CONTACT_EMAIL = getattr(settings, "CONTACT_EMAIL", "info@yriftz.org")


# ── Contact Form ──────────────────────────────────────────────────────────────

def notify_contact_received(name: str, email: str, subject: str, message: str) -> None:
    """Forward a contact form submission to the YRIF info mailbox."""
    send_mail(
        subject=f"[YRIF Contact] {subject}",
        message=(
            f"New contact form submission received on the YRIF platform.\n\n"
            f"From: {name} <{email}>\n"
            f"Subject: {subject}\n\n"
            f"Message:\n{message}\n\n"
            f"---\n"
            f"Please reply directly to: {email}\n"
            f"Or log in to the admin panel to manage this inquiry."
        ),
        from_email=_FROM,
        recipient_list=[CONTACT_EMAIL],
        fail_silently=False,
    )


def notify_contact_auto_reply(name: str, email: str, subject: str) -> None:
    """Send an auto-reply to the person who submitted the contact form."""
    send_mail(
        subject="[YRIF] We received your message",
        message=(
            f"Dear {name},\n\n"
            f"Thank you for contacting the Youth Research & Innovation Foundation.\n\n"
            f"We have received your message regarding \"{subject}\" and our team "
            f"will get back to you within 2–3 business days.\n\n"
            f"If your matter is urgent, you can also reach us at {CONTACT_EMAIL}.\n\n"
            f"Best regards,\n"
            f"The YRIF Team\n"
            f"https://yriftz.org"
        ),
        from_email=_FROM,
        recipient_list=[email],
        fail_silently=False,
    )


# ── Research notifications ────────────────────────────────────────────────────

def notify_research_submitted(user, title: str) -> None:
    send_mail(
        subject="[YRIF] Research submission received",
        message=(
            f"Hi {user.first_name},\n\n"
            f"Your research submission \"{title}\" has been received and is now under review.\n\n"
            f"You will be notified once a decision is made. You can track the status in your dashboard.\n\n"
            f"The YRIF Team"
        ),
        from_email=_FROM,
        recipient_list=[user.email],
        fail_silently=False,
    )


def notify_research_status_changed(user, title: str, new_status: str) -> None:
    status_labels = {
        "under_review": "Under Review",
        "approved": "Approved",
        "rejected": "Rejected — Not Accepted",
        "published": "Published",
    }
    label = status_labels.get(new_status, new_status.replace("_", " ").title())
    send_mail(
        subject=f"[YRIF] Research status update: {label}",
        message=(
            f"Hi {user.first_name},\n\n"
            f"The status of your research submission \"{title}\" has been updated to: {label}.\n\n"
            f"Log in to your dashboard to view details: https://app.yriftz.org/research/my\n\n"
            f"The YRIF Team"
        ),
        from_email=_FROM,
        recipient_list=[user.email],
        fail_silently=False,
    )


# ── Event notifications ───────────────────────────────────────────────────────

def notify_event_registration_confirmed(user, event_title: str, event_date: str) -> None:
    send_mail(
        subject=f"[YRIF] Registration confirmed: {event_title}",
        message=(
            f"Hi {user.first_name},\n\n"
            f"Your registration for \"{event_title}\" has been confirmed!\n\n"
            f"Date: {event_date}\n\n"
            f"View event details: https://app.yriftz.org/events\n\n"
            f"We look forward to seeing you there!\n\n"
            f"The YRIF Team"
        ),
        from_email=_FROM,
        recipient_list=[user.email],
        fail_silently=False,
    )


def notify_competition_results(user, competition_title: str, result: str) -> None:
    send_mail(
        subject=f"[YRIF] Competition results: {competition_title}",
        message=(
            f"Hi {user.first_name},\n\n"
            f"The results for \"{competition_title}\" have been published.\n\n"
            f"Your result: {result}\n\n"
            f"View full results: https://app.yriftz.org/competitions\n\n"
            f"Thank you for participating!\n\n"
            f"The YRIF Team"
        ),
        from_email=_FROM,
        recipient_list=[user.email],
        fail_silently=False,
    )


# ── Mentorship notifications ──────────────────────────────────────────────────

def notify_mentorship_request_received(mentor, mentee_name: str, topic: str) -> None:
    send_mail(
        subject="[YRIF] New mentorship request",
        message=(
            f"Hi {mentor.first_name},\n\n"
            f"{mentee_name} has submitted a mentorship request with topic: \"{topic}\".\n\n"
            f"Log in to review and respond: https://app.yriftz.org/mentorship\n\n"
            f"The YRIF Team"
        ),
        from_email=_FROM,
        recipient_list=[mentor.email],
        fail_silently=False,
    )


# ── In-app notification helper ────────────────────────────────────────────────

def create_in_app_notification(recipient, subject: str, body: str) -> None:
    """Create an in-app Notification record."""
    from apps.communications.models import Notification
    Notification.objects.create(
        recipient=recipient,
        channel=Notification.Channel.IN_APP,
        subject=subject,
        body=body,
        status=Notification.Status.SENT,
    )
