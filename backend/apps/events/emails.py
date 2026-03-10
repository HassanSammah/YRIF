"""Email notifications for the events module."""
from django.core.mail import send_mail
from django.conf import settings

_FROM = settings.DEFAULT_FROM_EMAIL


def notify_registration_confirmed(registration):
    """Notify participant that their event registration was successful."""
    event = registration.event
    send_mail(
        subject=f"[YRIF] Registration confirmed: {event.title}",
        message=(
            f"Hi {registration.participant.first_name},\n\n"
            f"You have successfully registered for:\n\n"
            f"Event: {event.title}\n"
            f"Type: {event.get_event_type_display()}\n"
            f"Date: {event.start_date.strftime('%B %d, %Y at %H:%M')}\n"
            + (f"Location: {event.location}\n" if event.location else "")
            + (f"Online link: {event.online_link}\n" if event.is_online and event.online_link else "")
            + f"\nWe look forward to seeing you there!\n\nThe YRIF Team"
        ),
        from_email=_FROM,
        recipient_list=[registration.participant.email],
        fail_silently=True,
    )


def notify_registration_cancelled(registration):
    """Notify participant that their registration was cancelled."""
    send_mail(
        subject=f"[YRIF] Registration cancelled: {registration.event.title}",
        message=(
            f"Hi {registration.participant.first_name},\n\n"
            f"Your registration for {registration.event.title} has been cancelled.\n\n"
            f"If this was a mistake, please re-register or contact us at info@yriftz.org.\n\n"
            f"The YRIF Team"
        ),
        from_email=_FROM,
        recipient_list=[registration.participant.email],
        fail_silently=True,
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
            message = (
                f"Hi {reg.participant.first_name},\n\n"
                f"Congratulations! The results for {event.title} have been published and you placed:\n\n"
                f"🏆 {winner_obj.rank}\n\n"
                f"Log in to your YRIF account to download your winner certificate.\n\n"
                f"The YRIF Team"
            )
        else:
            message = (
                f"Hi {reg.participant.first_name},\n\n"
                f"The results for {event.title} have been published. "
                f"Thank you for your participation!\n\n"
                f"Log in to your YRIF account to download your participation certificate.\n\n"
                f"The YRIF Team"
            )

        send_mail(
            subject=f"[YRIF] Competition results published: {event.title}",
            message=message,
            from_email=_FROM,
            recipient_list=[reg.participant.email],
            fail_silently=True,
        )
