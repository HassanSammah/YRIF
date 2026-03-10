"""
Email notifications for the research module.
"""
from django.core.mail import send_mail
from django.conf import settings

_FROM = settings.DEFAULT_FROM_EMAIL


def _admin_list():
    return getattr(settings, "ADMIN_EMAIL_LIST", [_FROM])


def notify_research_submitted(research):
    """Notify admin team when a new research paper is submitted."""
    send_mail(
        subject=f"[YRIF] New research submission: {research.title}",
        message=(
            f"A new research submission is awaiting reviewer assignment.\n\n"
            f"Title: {research.title}\n"
            f"Author: {research.author.get_full_name()} ({research.author.email})\n"
            f"Category: {research.get_category_display()}\n\n"
            f"Log in to the admin panel to assign a reviewer."
        ),
        from_email=_FROM,
        recipient_list=_admin_list(),
        fail_silently=True,
    )


def notify_research_status_changed(research):
    """Notify the author when their research status changes."""
    messages = {
        "under_review": (
            "Your research submission is now under review. "
            "We will notify you once a decision has been made."
        ),
        "approved": (
            "Congratulations! Your research has been approved. "
            "It will be published on the YRIF platform shortly."
        ),
        "rejected": (
            "Unfortunately, your research submission was not approved."
            + (f"\n\nReason: {research.rejection_reason}" if research.rejection_reason else "")
            + "\n\nPlease contact us at info@yriftz.org if you have any questions."
        ),
        "published": (
            "Your research has been published on the YRIF platform and is now publicly visible. "
            "Thank you for contributing to youth research in Tanzania!"
        ),
    }
    labels = {
        "under_review": "Under Review",
        "approved": "Approved",
        "rejected": "Not Approved",
        "published": "Published",
    }
    message = messages.get(research.status)
    if not message:
        return

    label = labels.get(research.status, research.status.replace("_", " ").title())
    send_mail(
        subject=f"[YRIF] Research update: {research.title} — {label}",
        message=f"Hi {research.author.first_name},\n\n{message}\n\nThe YRIF Team",
        from_email=_FROM,
        recipient_list=[research.author.email],
        fail_silently=True,
    )
