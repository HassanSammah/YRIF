"""
Email notifications for the research module — sent via Brevo Transactional API.
"""
from django.conf import settings

from apps.core.brevo import (
    send_email, _wrap, _cta, _info_card, _h2, _p, _small,
    _alert_block, _status_badge, _divider,
)


def _admin_list():
    return getattr(settings, "ADMIN_EMAIL_LIST", [settings.DEFAULT_FROM_EMAIL])


def notify_research_submitted(research):
    """Notify admin team when a new research paper is submitted."""
    content = (
        _h2("New Research Submission")
        + _p(
            "A new research submission has been received and is awaiting "
            "reviewer assignment."
        )
        + _info_card(
            ("Title", research.title),
            ("Author", f"{research.author.get_full_name()} &lt;{research.author.email}&gt;"),
            ("Category", research.get_category_display()),
        )
        + _cta("https://app.yriftz.org/admin/research", "Review Submission")
    )
    for admin_email in _admin_list():
        send_email(
            to_email=admin_email,
            to_name="YRIF Admin",
            subject=f"[YRIF] New research submission: {research.title}",
            html_content=_wrap(content),
        )


def notify_research_status_changed(research):
    """Notify the author when their research status changes."""
    status_configs = {
        "under_review": {
            "subject_label": "Under Review",
            "heading": "Your Research is Under Review",
            "heading_color": "#d97706",
            "badge_bg": "#fef3c7",
            "badge_text": "#92400e",
            "body": (
                "Your submission is now being reviewed by our team. "
                "We will notify you as soon as a decision has been made."
            ),
            "extra": "",
        },
        "approved": {
            "subject_label": "Approved",
            "heading": "Research Approved!",
            "heading_color": "#0D9488",
            "badge_bg": "#d1fae5",
            "badge_text": "#065f46",
            "body": (
                "Congratulations! Your research has been approved and will be "
                "published on the YRIF platform shortly."
            ),
            "extra": "",
        },
        "rejected": {
            "subject_label": "Not Approved",
            "heading": "Research Not Approved",
            "heading_color": "#dc2626",
            "badge_bg": "#fee2e2",
            "badge_text": "#991b1b",
            "body": "Unfortunately your research submission was not approved at this time.",
            "extra": (
                _alert_block(
                    f"<strong>Reason:</strong> {research.rejection_reason}",
                )
                if research.rejection_reason else ""
            ) + _p(
                "Questions? Contact us at "
                "<a href='mailto:info@yriftz.org' style='color:#0D9488;'>info@yriftz.org</a>",
                color="#6B7280",
                size="14px",
            ),
        },
        "published": {
            "subject_label": "Published",
            "heading": "Research Published!",
            "heading_color": "#0D9488",
            "badge_bg": "#d1fae5",
            "badge_text": "#065f46",
            "body": (
                "Your research is now live on the YRIF platform and publicly visible. "
                "Thank you for contributing to youth research and innovation in Tanzania!"
            ),
            "extra": _cta("https://app.yriftz.org/research", "View in Repository"),
        },
    }

    cfg = status_configs.get(research.status)
    if not cfg:
        return

    badge = _status_badge(cfg["subject_label"], cfg["badge_bg"], cfg["badge_text"])

    content = (
        _h2(cfg["heading"], color=cfg["heading_color"])
        + f'<p style="margin:0 0 16px;">{badge}</p>'
        + _p(f"Hi {research.author.first_name},")
        + _info_card(("Research", research.title))
        + _p(cfg["body"])
        + cfg["extra"]
    )
    send_email(
        to_email=research.author.email,
        to_name=research.author.get_full_name(),
        subject=f"[YRIF] Research update: {research.title} — {cfg['subject_label']}",
        html_content=_wrap(content),
    )
