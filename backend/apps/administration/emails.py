"""
Email broadcast utilities for the administration module.
Used to send NewsPost and Announcement emails to all active platform users.
"""
from apps.core.brevo import (
    send_email, _wrap, _cta, _h2, _p, _small, _divider,
)


# ── News blast ────────────────────────────────────────────────────────────────

def _news_blast_html(user, news_post) -> str:
    """Full HTML email for a published news post."""
    cover_block = ""
    if news_post.cover_image:
        cover_block = (
            f'<table width="100%" cellpadding="0" cellspacing="0" border="0"'
            f' style="margin:0 0 28px;">'
            f'<tr><td style="border-radius:10px;overflow:hidden;">'
            f'<img src="{news_post.cover_image.url}" width="520" alt="{news_post.title}"'
            f' style="display:block;width:100%;height:auto;border-radius:10px;">'
            f'</td></tr></table>'
        )

    # Excerpt: first 280 characters of body
    excerpt = news_post.body[:280].rstrip()
    if len(news_post.body) > 280:
        excerpt += "…"

    return _wrap(
        # Gold accent banner
        f'<table width="100%" cellpadding="0" cellspacing="0" border="0"'
        f' style="background-color:#fffbeb;border-left:4px solid #df8d31;'
        f'border-radius:6px;margin:0 0 24px;">'
        f'<tr><td style="padding:10px 16px;">'
        f'<span style="color:#92400e;font-size:12px;font-weight:600;'
        f'text-transform:uppercase;letter-spacing:0.08em;">YRIF News &amp; Updates</span>'
        f'</td></tr></table>'
        + cover_block
        + _h2(news_post.title)
        + _p(f"Hi {user.first_name},")
        + _p(excerpt)
        + _cta("https://app.yriftz.org/", "Read on YRIF")
        + _divider()
        + _small(
            "You are receiving this because you are an active member of the YRIF platform. "
            "Questions? <a href='mailto:info@yriftz.org' style='color:#0D9488;'>info@yriftz.org</a>"
        )
    )


def send_news_blast(news_post) -> int:
    """
    Send a published NewsPost to all active platform users.
    Returns the number of users emailed.
    """
    from apps.accounts.models import User, UserStatus

    users = (
        User.objects.filter(status=UserStatus.ACTIVE, is_active=True)
        .exclude(email="")
    )
    for user in users:
        send_email(
            to_email=user.email,
            to_name=user.get_full_name() or user.first_name,
            subject=f"[YRIF News] {news_post.title}",
            html_content=_news_blast_html(user, news_post),
        )
    return users.count()


# ── Announcement blast ────────────────────────────────────────────────────────

def _announcement_blast_html(user, announcement) -> str:
    """Full HTML email for a published announcement."""
    return _wrap(
        # Navy header with teal left border accent
        f'<table width="100%" cellpadding="0" cellspacing="0" border="0"'
        f' style="background-color:#f0fdfa;border-left:4px solid #0D9488;'
        f'border-radius:6px;margin:0 0 24px;">'
        f'<tr><td style="padding:10px 16px;">'
        f'<span style="color:#0D9488;font-size:12px;font-weight:600;'
        f'text-transform:uppercase;letter-spacing:0.08em;">Platform Announcement</span>'
        f'</td></tr></table>'
        + _h2(announcement.title)
        + _p(f"Hi {user.first_name},")
        + _p(announcement.content)
        + _cta("https://app.yriftz.org/dashboard", "Go to Platform")
        + _divider()
        + _small(
            "You are receiving this because you are an active member of the YRIF platform. "
            "Questions? <a href='mailto:info@yriftz.org' style='color:#0D9488;'>info@yriftz.org</a>"
        )
    )


def send_announcement_blast(announcement) -> int:
    """
    Send a published Announcement to all active platform users.
    Returns the number of users emailed.
    """
    from apps.accounts.models import User, UserStatus

    users = (
        User.objects.filter(status=UserStatus.ACTIVE, is_active=True)
        .exclude(email="")
    )
    for user in users:
        send_email(
            to_email=user.email,
            to_name=user.get_full_name() or user.first_name,
            subject=f"[YRIF] {announcement.title}",
            html_content=_announcement_blast_html(user, announcement),
        )
    return users.count()
