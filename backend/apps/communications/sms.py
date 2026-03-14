"""Briq.tz SMS integration — YRIF-App-Dev."""
import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

BRIQ_SMS_URL = f"{settings.BRIQ_BASE_URL}/v1/message/send-instant"


def _normalise_phone(phone: str) -> str:
    """Return phone in E.164 format (+255...)."""
    p = phone.strip()
    if p.startswith("0"):
        return "+255" + p[1:]
    if p.startswith("255") and not p.startswith("+"):
        return "+" + p
    return p


def send_sms(phone: str, message: str) -> bool:
    """Send an SMS via Briq.tz. Returns True on success.

    Endpoint: POST /v1/message/send-instant
    Auth: X-API-Key header; X-App-ID header for webhook routing.
    """
    if not settings.BRIQ_API_KEY:
        logger.warning("BRIQ_API_KEY not configured — SMS not sent.")
        return False

    payload = {
        "content": message,
        "recipients": [_normalise_phone(phone)],
        "sender_id": settings.BRIQ_SMS_SENDER,
    }
    headers = {
        "X-API-Key": settings.BRIQ_API_KEY,
        "X-App-ID": settings.BRIQ_APP_KEY,
        "Content-Type": "application/json",
    }
    try:
        resp = requests.post(BRIQ_SMS_URL, json=payload, headers=headers, timeout=15)
        success = resp.status_code in (200, 201)
        if not success:
            logger.warning("Briq SMS failed %s: %s", resp.status_code, resp.text)
        return success
    except requests.RequestException as exc:
        logger.error("Briq SMS request error: %s", exc)
        return False


def send_bulk_sms(phone_numbers: list[str], message: str) -> dict:
    """Send the same SMS to multiple numbers in a single API call. Returns a summary dict."""
    if not settings.BRIQ_API_KEY or not phone_numbers:
        return {"sent": 0, "failed": len(phone_numbers)}

    recipients = [_normalise_phone(p) for p in phone_numbers]
    payload = {
        "content": message,
        "recipients": recipients,
        "sender_id": settings.BRIQ_SMS_SENDER,
    }
    headers = {
        "X-API-Key": settings.BRIQ_API_KEY,
        "X-App-ID": settings.BRIQ_APP_KEY,
        "Content-Type": "application/json",
    }
    try:
        resp = requests.post(BRIQ_SMS_URL, json=payload, headers=headers, timeout=30)
        if resp.status_code in (200, 201):
            return {"sent": len(recipients), "failed": 0}
        logger.warning("Briq bulk SMS failed %s: %s", resp.status_code, resp.text)
        return {"sent": 0, "failed": len(recipients)}
    except requests.RequestException as exc:
        logger.error("Briq bulk SMS request error: %s", exc)
        return {"sent": 0, "failed": len(recipients)}
