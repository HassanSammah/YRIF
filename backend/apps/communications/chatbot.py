"""Sarufi AI chatbot integration."""
import requests
from django.conf import settings


SARUFI_BASE_URL = "https://api.sarufi.io"


def send_chatbot_message(chat_id: str, message: str) -> dict:
    """Send a message to the Sarufi bot and return the response."""
    if not settings.SARUFI_API_KEY:
        return {"reply": "Chatbot is not configured."}
    url = f"{SARUFI_BASE_URL}/conversation/respond/{settings.SARUFI_BOT_ID}"
    headers = {"Authorization": f"Bearer {settings.SARUFI_API_KEY}"}
    payload = {"chat_id": chat_id, "message": message}
    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=10)
        resp.raise_for_status()
        return resp.json()
    except requests.RequestException as exc:
        return {"reply": "Sorry, I'm unavailable right now. Please contact support.", "error": str(exc)}
