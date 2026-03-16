"""
Email notifications for the mentorship module — sent via Brevo Transactional API.
"""
from apps.core.brevo import (
    send_email, _wrap, _cta, _info_card, _h2, _p, _small, _divider,
)

_MENTORSHIP_URL = "https://app.yriftz.org/mentorship"


def _mentorship_cta():
    return _cta(_MENTORSHIP_URL, "View My Mentorship")


def notify_mentorship_matched(mentor, mentee, topic):
    """Notify both mentor and mentee when a mentorship match is created."""
    # ── Mentor email ──
    mentor_content = (
        _h2("You Have a New Mentee!", color="#0D9488")
        + _p(
            f"Hi {mentor.first_name}, you have been matched as a mentor on the YRIF platform."
        )
        + _info_card(
            ("Mentee", mentee.get_full_name()),
            ("Topic", topic),
        )
        + _p(
            "Log in to your dashboard to connect with your mentee and get started.",
            color="#6B7280",
            size="14px",
        )
        + _mentorship_cta()
    )
    send_email(
        to_email=mentor.email,
        to_name=mentor.get_full_name(),
        subject="[YRIF] You have been matched as a mentor",
        html_content=_wrap(mentor_content),
    )

    # ── Mentee email ──
    mentee_content = (
        _h2("Mentorship Match Found!", color="#0D9488")
        + _p(
            f"Hi {mentee.first_name}, great news — your mentorship request has been matched!"
        )
        + _info_card(
            ("Mentor", mentor.get_full_name()),
            ("Topic", topic),
        )
        + _p(
            "Log in to your dashboard to connect with your mentor and begin your journey.",
            color="#6B7280",
            size="14px",
        )
        + _mentorship_cta()
    )
    send_email(
        to_email=mentee.email,
        to_name=mentee.get_full_name(),
        subject="[YRIF] Your mentorship request has been matched",
        html_content=_wrap(mentee_content),
    )


def notify_mentorship_request_declined(mentee, topic):
    """Notify mentee when their mentorship request could not be matched."""
    content = (
        _h2("Mentorship Request Update")
        + _p(
            f"Hi {mentee.first_name}, unfortunately your mentorship request "
            f"could not be matched at this time."
        )
        + _info_card(("Topic", topic))
        + _p(
            "You are welcome to submit a new request. If you have questions, "
            "contact us at "
            "<a href='mailto:info@yriftz.org' style='color:#0D9488;'>info@yriftz.org</a>.",
            color="#6B7280",
            size="14px",
        )
        + _cta(_MENTORSHIP_URL, "Submit a New Request")
    )
    send_email(
        to_email=mentee.email,
        to_name=mentee.get_full_name(),
        subject="[YRIF] Your mentorship request could not be matched",
        html_content=_wrap(content),
    )


def notify_match_completed(mentor, mentee, topic):
    """Notify both parties when a mentorship match is marked completed."""
    for user in (mentor, mentee):
        content = (
            _h2("Mentorship Completed!", color="#0D9488")
            + _p(
                f"Hi {user.first_name}, your mentorship match has been marked as completed. "
                f"We hope it was a valuable and rewarding experience!"
            )
            + _info_card(("Topic", topic))
            + _p(
                "Please take a moment to submit feedback via your dashboard — "
                "your input helps us improve the programme.",
                color="#6B7280",
                size="14px",
            )
            + _mentorship_cta()
        )
        send_email(
            to_email=user.email,
            to_name=user.get_full_name(),
            subject="[YRIF] Mentorship match completed",
            html_content=_wrap(content),
        )
