"""Email notifications for the mentorship module."""
from django.core.mail import send_mail
from django.conf import settings

_FROM = settings.DEFAULT_FROM_EMAIL


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


def _dashboard_btn():
    return (
        '<div style="text-align: center; margin: 32px 0;">'
        '<a href="https://app.yriftz.org/mentorship" style="background: #0D9488; color: #ffffff; '
        'text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; '
        'font-weight: 600; display: inline-block;">View My Mentorship</a></div>'
    )


def notify_mentorship_matched(mentor, mentee, topic):
    """Notify both mentor and mentee when a mentorship match is created."""
    mentor_content = f"""
        <h2 style="color: #0D9488; font-size: 22px; margin: 0 0 16px;">You Have a New Mentee!</h2>
        <p style="color: #4B5563; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
          Hi {mentor.first_name}, you have been matched as a mentor with <strong>{mentee.get_full_name()}</strong>.
        </p>
        <div style="background: #f8fafc; border-radius: 10px; padding: 16px; margin: 0 0 24px;">
          <p style="margin: 0; font-size: 14px; color: #374151;"><strong>Topic:</strong> {topic}</p>
        </div>
        {_dashboard_btn()}
    """
    send_mail(
        subject="[YRIF] You have been matched as a mentor",
        message=(
            f"Hi {mentor.first_name},\n\nYou have been matched as a mentor with {mentee.get_full_name()}.\n"
            f"Topic: {topic}\n\nhttps://app.yriftz.org/mentorship\n\nThe YRIF Team"
        ),
        from_email=_FROM,
        recipient_list=[mentor.email],
        html_message=_html_wrapper(mentor_content),
        fail_silently=True,
    )

    mentee_content = f"""
        <h2 style="color: #0D9488; font-size: 22px; margin: 0 0 16px;">Mentorship Match Found!</h2>
        <p style="color: #4B5563; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
          Hi {mentee.first_name}, your mentorship request has been matched with <strong>{mentor.get_full_name()}</strong>.
        </p>
        <div style="background: #f8fafc; border-radius: 10px; padding: 16px; margin: 0 0 24px;">
          <p style="margin: 0; font-size: 14px; color: #374151;"><strong>Topic:</strong> {topic}</p>
        </div>
        {_dashboard_btn()}
    """
    send_mail(
        subject="[YRIF] Your mentorship request has been matched",
        message=(
            f"Hi {mentee.first_name},\n\nYour mentorship request has been matched with {mentor.get_full_name()}.\n"
            f"Topic: {topic}\n\nhttps://app.yriftz.org/mentorship\n\nThe YRIF Team"
        ),
        from_email=_FROM,
        recipient_list=[mentee.email],
        html_message=_html_wrapper(mentee_content),
        fail_silently=True,
    )


def notify_mentorship_request_declined(mentee, topic):
    """Notify mentee when their mentorship request is declined."""
    content = f"""
        <h2 style="color: #093344; font-size: 22px; margin: 0 0 16px;">Mentorship Request Update</h2>
        <p style="color: #4B5563; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
          Hi {mentee.first_name}, unfortunately your mentorship request for
          <strong>{topic}</strong> could not be matched at this time.
        </p>
        <p style="color: #4B5563; font-size: 14px; line-height: 1.6;">
          You are welcome to submit a new request or contact us at
          <a href="mailto:info@yriftz.org" style="color: #0D9488;">info@yriftz.org</a>.
        </p>
    """
    send_mail(
        subject="[YRIF] Your mentorship request was not approved",
        message=(
            f"Hi {mentee.first_name},\n\nYour mentorship request for '{topic}' could not be matched at this time.\n\n"
            f"Contact: info@yriftz.org\n\nThe YRIF Team"
        ),
        from_email=_FROM,
        recipient_list=[mentee.email],
        html_message=_html_wrapper(content),
        fail_silently=True,
    )


def notify_match_completed(mentor, mentee, topic):
    """Notify both parties when a mentorship match is marked completed."""
    for user in (mentor, mentee):
        content = f"""
            <h2 style="color: #0D9488; font-size: 22px; margin: 0 0 16px;">Mentorship Completed!</h2>
            <p style="color: #4B5563; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
              Hi {user.first_name}, your mentorship match on <strong>{topic}</strong> has been marked as completed.
              We hope it was a valuable experience!
            </p>
            <p style="color: #4B5563; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
              Please take a moment to submit feedback via your dashboard.
            </p>
            {_dashboard_btn()}
        """
        send_mail(
            subject="[YRIF] Mentorship match completed",
            message=(
                f"Hi {user.first_name},\n\nYour mentorship match on '{topic}' has been marked as completed.\n\n"
                f"Please submit feedback: https://app.yriftz.org/mentorship\n\nThe YRIF Team"
            ),
            from_email=_FROM,
            recipient_list=[user.email],
            html_message=_html_wrapper(content),
            fail_silently=True,
        )
