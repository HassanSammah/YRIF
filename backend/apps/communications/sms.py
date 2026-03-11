"""Briq.tz SMS integration — YRIF-App-Dev."""
import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

BRIQ_SMS_URL = f"{settings.BRIQ_BASE_URL}/v1/sms/outgoing"


def send_sms(phone: str, message: str) -> bool:
    """Send an SMS via Briq.tz. Returns True on success.

    Authentication: X-API-Key header + app_key in body (same pattern as OTP).
    """
    if not settings.BRIQ_API_KEY:
        logger.warning("BRIQ_API_KEY not configured — SMS not sent.")
        return False

    phone_clean = phone.strip()
    if not phone_clean.startswith("+"):
        # Tanzanian numbers: ensure +255 prefix
        if phone_clean.startswith("0"):
            phone_clean = "+255" + phone_clean[1:]
        elif phone_clean.startswith("255"):
            phone_clean = "+" + phone_clean

    payload = {
        "app_key": settings.BRIQ_APP_KEY,
        "to": phone_clean,
        "sender_id": settings.BRIQ_SMS_SENDER,
        "message": message,
    }
    headers = {
        "X-API-Key": settings.BRIQ_API_KEY,
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
    """Send the same SMS to multiple numbers. Returns a summary dict."""
    results = {"sent": 0, "failed": 0}
    for phone in phone_numbers:
        if send_sms(phone, message):
            results["sent"] += 1
        else:
            results["failed"] += 1
    return results
