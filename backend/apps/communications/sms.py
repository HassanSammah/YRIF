"""Briq.tz SMS integration."""
import requests
from django.conf import settings


BRIQ_SMS_URL = "https://api.briq.tz/v1/sms/send"


def send_sms(phone: str, message: str) -> bool:
    """Send an SMS via Briq.tz. Returns True on success."""
    if not settings.BRIQ_API_KEY:
        return False
    payload = {
        "to": phone,
        "from": settings.BRIQ_SMS_SENDER,
        "message": message,
    }
    headers = {"Authorization": f"Bearer {settings.BRIQ_API_KEY}"}
    try:
        resp = requests.post(BRIQ_SMS_URL, json=payload, headers=headers, timeout=10)
        return resp.status_code == 200
    except requests.RequestException:
        return False
