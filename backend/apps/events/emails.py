"""
Email notifications for the events module — sent via Brevo Transactional API.
"""
from apps.core.brevo import (
    send_email, _wrap, _cta, _info_card, _h2, _p, _small, _divider,
)


def notify_registration_confirmed(registration):
    """Notify participant that their event registration was successful."""
    event = registration.event
    date_str = event.start_date.strftime("%A, %B %d, %Y at %H:%M")

    rows = [
        ("Event", event.title),
        ("Type", event.get_event_type_display()),
        ("Date", date_str),
    ]
    if event.location:
        rows.append(("Location", event.location))
    if event.is_online and event.online_link:
        rows.append(("Online Link", f'<a href="{event.online_link}" '
                                    f'style="color:#0D9488;">{event.online_link}</a>'))

    content = (
        _h2("Registration Confirmed!", color="#0D9488")
        + _p(
            f"Hi {registration.participant.first_name}, you're all set! "
            f"Your registration for the following event has been confirmed."
        )
        + _info_card(*rows)
        + _p(
            "We look forward to seeing you there. Add the date to your calendar "
            "and check your dashboard for any updates.",
            color="#6B7280",
            size="14px",
        )
        + _cta("https://app.yriftz.org/events", "View Event Details")
    )
    send_email(
        to_email=registration.participant.email,
        to_name=registration.participant.get_full_name(),
        subject=f"[YRIF] Registration confirmed: {event.title}",
        html_content=_wrap(content),
    )


def notify_registration_cancelled(registration):
    """Notify participant that their registration was cancelled."""
    content = (
        _h2("Registration Cancelled")
        + _p(
            f"Hi {registration.participant.first_name}, your registration for "
            f"<strong>{registration.event.title}</strong> has been cancelled."
        )
        + _p(
            "If this was a mistake, please re-register or contact us at "
            "<a href='mailto:info@yriftz.org' style='color:#0D9488;'>info@yriftz.org</a>.",
            color="#6B7280",
            size="14px",
        )
        + _cta("https://app.yriftz.org/events", "Browse Events")
    )
    send_email(
        to_email=registration.participant.email,
        to_name=registration.participant.get_full_name(),
        subject=f"[YRIF] Registration cancelled: {registration.event.title}",
        html_content=_wrap(content),
    )


def notify_competition_results(event, winners):
    """Notify all event participants that results have been published."""
    registrations = event.registrations.filter(
        status__in=["registered", "attended"]
    ).select_related("participant")

    winner_ids = {w.registration_id for w in winners}

    for reg in registrations:
        is_winner = reg.id in winner_ids
        winner_obj = next((w for w in winners if w.registration_id == reg.id), None)

        if is_winner and winner_obj:
            content = (
                _h2("Congratulations — Results Published!", color="#0D9488")
                + _p(
                    f"Hi {reg.participant.first_name}, the results for "
                    f"<strong>{event.title}</strong> have been published and "
                    f"you placed:"
                )
                + f"""
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="padding:20px 0 28px;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center"
              style="background-color:#fffbeb;border:2px solid #df8d31;
                     border-radius:12px;padding:24px 48px;">
            <p style="font-size:32px;margin:0;">&#127942;</p>
            <p style="color:#df8d31;font-size:22px;font-weight:800;margin:8px 0 0;
                      letter-spacing:0.02em;">{winner_obj.rank}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>"""
                + _p(
                    "Log in to your YRIF account to download your winner certificate.",
                    color="#6B7280",
                    size="14px",
                )
                + _cta("https://app.yriftz.org/certificates", "Download Certificate")
            )
        else:
            content = (
                _h2("Competition Results Published", color="#0D9488")
                + _p(
                    f"Hi {reg.participant.first_name}, the results for "
                    f"<strong>{event.title}</strong> have been published. "
                    f"Thank you for your participation!"
                )
                + _p(
                    "Your participation certificate is available in your dashboard. "
                    "We hope to see you again in future competitions!",
                    color="#6B7280",
                    size="14px",
                )
                + _cta("https://app.yriftz.org/certificates", "Download Certificate")
            )

        send_email(
            to_email=reg.participant.email,
            to_name=reg.participant.get_full_name(),
            subject=f"[YRIF] Competition results: {event.title}",
            html_content=_wrap(content),
        )
