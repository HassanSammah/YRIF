"""Outreach email notifications — donation confirmation."""
from django.conf import settings
from apps.core.brevo import send_email, _wrap, _h2, _p, _small

CONTACT_EMAIL = getattr(settings, "CONTACT_EMAIL", "info@yriftz.org")


def notify_donation_received(name: str, email: str, amount: str, recurring: bool) -> None:
    """Send a confirmation email to the donor and notify YRIF staff."""
    frequency = "monthly recurring" if recurring else "one-time"
    content = (
        _h2("Thank You for Your Support!")
        + _p(f"Dear {name},")
        + _p(
            f"We have received your {frequency} donation of <strong>TZS {amount}</strong>. "
            "Your generosity helps empower Tanzanian youth through research and innovation."
        )
        + _p(
            "Our team will be in touch with further details. If you have any questions, "
            f"please contact us at <a href='mailto:{CONTACT_EMAIL}' style='color:#0D9488;'>{CONTACT_EMAIL}</a>."
        )
        + _small("Youth Research & Innovation Foundation · Dar es Salaam, Tanzania")
    )
    send_email(
        to_email=email,
        to_name=name,
        subject="Thank you for supporting YRIF!",
        html_content=_wrap(content),
    )

    # Notify staff
    staff_content = (
        _h2("New Donation Received")
        + _p(f"<strong>{name}</strong> ({email}) made a {frequency} donation of <strong>TZS {amount}</strong>.")
    )
    send_email(
        to_email=CONTACT_EMAIL,
        to_name="YRIF Team",
        subject=f"New donation: TZS {amount} from {name}",
        html_content=_wrap(staff_content),
    )
