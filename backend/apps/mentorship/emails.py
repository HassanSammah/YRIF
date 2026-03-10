"""Email notifications for the mentorship module."""
from django.core.mail import send_mail
from django.conf import settings

_FROM = settings.DEFAULT_FROM_EMAIL


def notify_mentorship_matched(mentor, mentee, topic):
    """Notify both mentor and mentee when a mentorship match is created."""
    send_mail(
        subject="[YRIF] You have been matched as a mentor",
        message=(
            f"Hi {mentor.first_name},\n\n"
            f"You have been matched as a mentor with {mentee.get_full_name()}.\n"
            f"Topic: {topic}\n\n"
            f"Log in to your dashboard to view the match and connect with your mentee.\n\n"
            f"The YRIF Team"
        ),
        from_email=_FROM,
        recipient_list=[mentor.email],
        fail_silently=True,
    )
    send_mail(
        subject="[YRIF] Your mentorship request has been matched",
        message=(
            f"Hi {mentee.first_name},\n\n"
            f"Your mentorship request has been matched with {mentor.get_full_name()}.\n"
            f"Topic: {topic}\n\n"
            f"Log in to your dashboard to view the match and connect with your mentor.\n\n"
            f"The YRIF Team"
        ),
        from_email=_FROM,
        recipient_list=[mentee.email],
        fail_silently=True,
    )


def notify_mentorship_request_declined(mentee, topic):
    """Notify mentee when their mentorship request is declined."""
    send_mail(
        subject="[YRIF] Your mentorship request was not approved",
        message=(
            f"Hi {mentee.first_name},\n\n"
            f"Unfortunately your mentorship request for '{topic}' could not be matched at this time.\n\n"
            f"You are welcome to submit a new request or contact us at info@yriftz.org.\n\n"
            f"The YRIF Team"
        ),
        from_email=_FROM,
        recipient_list=[mentee.email],
        fail_silently=True,
    )


def notify_match_completed(mentor, mentee, topic):
    """Notify both parties when a mentorship match is marked completed."""
    for user in (mentor, mentee):
        send_mail(
            subject="[YRIF] Mentorship match completed",
            message=(
                f"Hi {user.first_name},\n\n"
                f"Your mentorship match on '{topic}' has been marked as completed.\n"
                f"We hope it was a valuable experience!\n\n"
                f"Please take a moment to submit feedback via your dashboard.\n\n"
                f"The YRIF Team"
            ),
            from_email=_FROM,
            recipient_list=[user.email],
            fail_silently=True,
        )
