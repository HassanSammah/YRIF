"""
Email notifications for the research module.
"""
from django.core.mail import send_mail
from django.conf import settings

_FROM = settings.DEFAULT_FROM_EMAIL


def _admin_list():
    return getattr(settings, "ADMIN_EMAIL_LIST", [_FROM])


def _html_wrapper(content: str) -> str:
    return f"""
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #093344 0%, #0D9488 100%); padding: 40px 32px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">YRIF</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">Youth Research &amp; Innovation Foundation</p>
      </div>
      <div style="padding: 40px 32px; background: #ffffff;">{content}</div>
      <div style="background: #093344; padding: 20px 32px; text-align: center; border-radius: 0 0 12px 12px;">
        <p style="color: rgba(255,255,255,0.6); font-size: 12px; margin: 0;">© 2024 Youth Research &amp; Innovation Foundation · info@yriftz.org</p>
      </div>
    </div>
    """


def notify_research_submitted(research):
    """Notify admin team when a new research paper is submitted."""
    content = f"""
        <h2 style="color: #093344; font-size: 22px; margin: 0 0 16px;">New Research Submission</h2>
        <p style="color: #4B5563; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
          A new research submission is awaiting reviewer assignment.
        </p>
        <div style="background: #f8fafc; border-radius: 10px; padding: 20px; margin: 0 0 24px;">
          <p style="margin: 0 0 8px; font-size: 14px; color: #374151;"><strong>Title:</strong> {research.title}</p>
          <p style="margin: 0 0 8px; font-size: 14px; color: #374151;"><strong>Author:</strong> {research.author.get_full_name()} ({research.author.email})</p>
          <p style="margin: 0; font-size: 14px; color: #374151;"><strong>Category:</strong> {research.get_category_display()}</p>
        </div>
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://app.yriftz.org/admin/research"
             style="background: #0D9488; color: #ffffff; text-decoration: none; padding: 14px 32px;
                    border-radius: 8px; font-size: 15px; font-weight: 600; display: inline-block;">
            Review Submission
          </a>
        </div>
    """
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
        html_message=_html_wrapper(content),
        fail_silently=False,
    )


def notify_research_status_changed(research):
    """Notify the author when their research status changes."""
    status_configs = {
        "under_review": {
            "label": "Under Review",
            "heading_color": "#d97706",
            "heading": "Your Research is Under Review",
            "body": "Your research submission is now under review by our team. We will notify you once a decision has been made.",
            "extra": "",
        },
        "approved": {
            "label": "Approved",
            "heading_color": "#0D9488",
            "heading": "Research Approved!",
            "body": "Congratulations! Your research has been approved and will be published on the YRIF platform shortly.",
            "extra": "",
        },
        "rejected": {
            "label": "Not Approved",
            "heading_color": "#dc2626",
            "heading": "Research Not Approved",
            "body": "Unfortunately, your research submission was not approved at this time.",
            "extra": (
                f'<div style="background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 6px; '
                f'padding: 16px; margin: 16px 0;">'
                f'<p style="color: #dc2626; font-size: 14px; margin: 0;">'
                f'<strong>Reason:</strong> {research.rejection_reason}</p></div>'
                if research.rejection_reason else ""
            ) + '<p style="color: #4B5563; font-size: 14px;">Questions? Contact us at <a href="mailto:info@yriftz.org" style="color: #0D9488;">info@yriftz.org</a>.</p>',
        },
        "published": {
            "label": "Published",
            "heading_color": "#0D9488",
            "heading": "Research Published!",
            "body": "Your research has been published on the YRIF platform and is now publicly visible. Thank you for contributing to youth research in Tanzania!",
            "extra": (
                '<div style="text-align: center; margin: 32px 0;">'
                '<a href="https://app.yriftz.org/research" style="background: #0D9488; color: #ffffff; text-decoration: none; '
                'padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; display: inline-block;">'
                'View Repository</a></div>'
            ),
        },
    }

    cfg = status_configs.get(research.status)
    if not cfg:
        return

    content = f"""
        <h2 style="color: {cfg['heading_color']}; font-size: 22px; margin: 0 0 16px;">{cfg['heading']}</h2>
        <p style="color: #4B5563; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
          Hi {research.author.first_name},
        </p>
        <div style="background: #f8fafc; border-radius: 10px; padding: 16px; margin: 0 0 16px;">
          <p style="margin: 0; font-size: 14px; color: #374151;"><strong>Research:</strong> {research.title}</p>
        </div>
        <p style="color: #4B5563; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
          {cfg['body']}
        </p>
        {cfg['extra']}
    """

    send_mail(
        subject=f"[YRIF] Research update: {research.title} — {cfg['label']}",
        message=f"Hi {research.author.first_name},\n\n{cfg['body']}\n\nThe YRIF Team",
        from_email=_FROM,
        recipient_list=[research.author.email],
        html_message=_html_wrapper(content),
        fail_silently=False,
    )
