"""
Email notifications for the communications module — sent via Brevo Transactional API.
"""
from django.conf import settings

from apps.core.brevo import (
    send_email, _wrap, _cta, _info_card, _h2, _p, _small,
)

CONTACT_EMAIL = getattr(settings, "CONTACT_EMAIL", "info@yriftz.org")


# ── Contact Form ──────────────────────────────────────────────────────────────

def notify_contact_received(name: str, email: str, subject: str, message: str) -> None:
    """Forward a contact form submission to the YRIF info mailbox."""
    content = (
        _h2("New Contact Form Submission")
        + _p("A new message has been received via the YRIF contact form.")
        + _info_card(
            ("From", f"{name} &lt;{email}&gt;"),
            ("Subject", subject),
        )
        + f"""
<table width="100%" cellpadding="0" cellspacing="0" border="0"
       style="background-color:#f8fafc;border-radius:10px;margin:16px 0 24px;">
  <tr>
    <td style="padding:16px 24px;">
      <p style="font-size:13px;color:#6B7280;text-transform:uppercase;
                letter-spacing:0.08em;margin:0 0 10px;">Message</p>
      <p style="font-size:14px;color:#374151;line-height:1.7;margin:0;
                white-space:pre-wrap;">{message}</p>
    </td>
  </tr>
</table>"""
        + _p(
            f"Reply directly to: "
            f"<a href='mailto:{email}' style='color:#0D9488;'>{email}</a>",
            color="#6B7280",
            size="14px",
        )
    )
    send_email(
        to_email=CONTACT_EMAIL,
        to_name="YRIF Team",
        subject=f"[YRIF Contact] {subject}",
        html_content=_wrap(content),
        reply_to_email=email,
    )


def notify_contact_auto_reply(name: str, email: str, subject: str) -> None:
    """Send an auto-reply to the person who submitted the contact form."""
    content = (
        _h2("We Received Your Message!", color="#0D9488")
        + _p(
            f"Dear {name}, thank you for reaching out to the Youth Research &amp; "
            f"Innovation Foundation."
        )
        + _info_card(("Your subject", subject))
        + _p(
            "Our team will review your message and get back to you within "
            "<strong>2–3 business days</strong>. If your matter is urgent, you can "
            "also reach us directly at "
            f"<a href='mailto:{CONTACT_EMAIL}' style='color:#0D9488;'>{CONTACT_EMAIL}</a>."
        )
        + _small(
            "Please do not reply to this email — it is sent from an unmonitored address. "
            f"Use <a href='mailto:{CONTACT_EMAIL}' style='color:#0D9488;'>{CONTACT_EMAIL}</a> "
            "for direct communication."
        )
    )
    send_email(
        to_email=email,
        to_name=name,
        subject="[YRIF] We received your message",
        html_content=_wrap(content),
    )


# ── Research notifications ────────────────────────────────────────────────────

def notify_research_submitted(user, title: str) -> None:
    content = (
        _h2("Research Submission Received", color="#0D9488")
        + _p(f"Hi {user.first_name}, your research has been received and is now under review.")
        + _info_card(("Title", title))
        + _p(
            "You will be notified as soon as a decision is made. "
            "You can track the status of your submission in your dashboard.",
            color="#6B7280",
            size="14px",
        )
        + _cta("https://app.yriftz.org/research/my", "Track Submission")
    )
    send_email(
        to_email=user.email,
        to_name=user.get_full_name(),
        subject="[YRIF] Research submission received",
        html_content=_wrap(content),
    )


def notify_research_status_changed(user, title: str, new_status: str) -> None:
    status_labels = {
        "under_review": "Under Review",
        "approved": "Approved",
        "rejected": "Not Accepted",
        "published": "Published",
    }
    label = status_labels.get(new_status, new_status.replace("_", " ").title())
    content = (
        _h2(f"Research Status Update: {label}")
        + _p(f"Hi {user.first_name}, the status of your research submission has been updated.")
        + _info_card(("Title", title), ("New Status", label))
        + _cta("https://app.yriftz.org/research/my", "View Details")
    )
    send_email(
        to_email=user.email,
        to_name=user.get_full_name(),
        subject=f"[YRIF] Research status update: {label}",
        html_content=_wrap(content),
    )


# ── Event notifications ───────────────────────────────────────────────────────

def notify_event_registration_confirmed(user, event_title: str, event_date: str) -> None:
    content = (
        _h2("Registration Confirmed!", color="#0D9488")
        + _p(f"Hi {user.first_name}, your event registration has been confirmed.")
        + _info_card(("Event", event_title), ("Date", event_date))
        + _cta("https://app.yriftz.org/events", "View Event")
    )
    send_email(
        to_email=user.email,
        to_name=user.get_full_name(),
        subject=f"[YRIF] Registration confirmed: {event_title}",
        html_content=_wrap(content),
    )


def notify_competition_results(user, competition_title: str, result: str) -> None:
    content = (
        _h2("Competition Results Published", color="#0D9488")
        + _p(f"Hi {user.first_name}, the results for <strong>{competition_title}</strong> are in.")
        + _info_card(("Your result", result))
        + _cta("https://app.yriftz.org/competitions", "View Full Results")
    )
    send_email(
        to_email=user.email,
        to_name=user.get_full_name(),
        subject=f"[YRIF] Competition results: {competition_title}",
        html_content=_wrap(content),
    )


# ── Mentorship notifications ──────────────────────────────────────────────────

def notify_mentorship_request_received(mentor, mentee_name: str, topic: str) -> None:
    content = (
        _h2("New Mentorship Request")
        + _p(
            f"Hi {mentor.first_name}, you have received a new mentorship request "
            f"on the YRIF platform."
        )
        + _info_card(("From", mentee_name), ("Topic", topic))
        + _cta("https://app.yriftz.org/mentorship", "Review Request")
    )
    send_email(
        to_email=mentor.email,
        to_name=mentor.get_full_name(),
        subject="[YRIF] New mentorship request received",
        html_content=_wrap(content),
    )


# ── In-app notification helper ────────────────────────────────────────────────

def create_in_app_notification(recipient, subject: str, body: str) -> None:
    """Create an in-app Notification record (not an email)."""
    from apps.communications.models import Notification
    Notification.objects.create(
        recipient=recipient,
        channel=Notification.Channel.IN_APP,
        subject=subject,
        body=body,
        status=Notification.Status.SENT,
    )
