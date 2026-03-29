"""Sarufi AI chatbot integration — YRIF Chat.

Uses the public (no-auth) plugin conversation endpoint on api.sarufi.io.
Endpoint: POST https://api.sarufi.io/plugin/conversation/{bot_id}
"""
import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

_SARUFI_BASE = "https://api.sarufi.io"


def send_chatbot_message(chat_id: str, message: str) -> dict:
    """Send a message to the YRIF Chat bot and return the response dict."""
    bot_id = getattr(settings, "SARUFI_BOT_ID", None)
    if not bot_id:
        return {"reply": "YRIF Chat is not yet configured. Please contact support at info@yriftz.org."}

    try:
        resp = requests.post(
            f"{_SARUFI_BASE}/plugin/conversation/{bot_id}",
            json={
                "chat_id": str(chat_id),
                "message": message,
                "message_type": "text",
                "channel": "general",
            },
            timeout=15,
        )

        if resp.status_code != 200:
            logger.error("Sarufi API error %s: %s", resp.status_code, resp.text)
            return {
                "reply": (
                    "Sorry, YRIF Chat is unavailable right now. "
                    "Please contact us at info@yriftz.org or submit a contact form."
                )
            }

        data = resp.json()
        logger.debug("Sarufi raw response: %s", data)

        # Response format: {"actions": [{"send_message": "..."}], "memory": {...}, ...}
        actions = data.get("actions", [])
        parts = []
        for action in actions:
            if isinstance(action, dict):
                text = action.get("send_message") or action.get("text") or action.get("message")
                if text:
                    if isinstance(text, list):
                        text = "\n\n".join(str(item) for item in text if item)
                    parts.append(str(text))
        reply = "\n\n".join(parts) if parts else "Sijaelewea. Jaribu tena au wasiliana: info@yriftz.org"

        # Detect if Sarufi reached the escalation state so the view can notify staff
        current_state = (
            data.get("memory", {}).get("state")
            or data.get("current_state")
            or ""
        )
        escalated = current_state in {"escalate", "human_handover", "handover"}

        return {"reply": reply, "escalated": escalated}

    except Exception as exc:
        logger.error("Sarufi chatbot error: %s", exc)
        return {
            "reply": (
                "Sorry, YRIF Chat is unavailable right now. "
                "Please contact us at info@yriftz.org or submit a contact form."
            )
        }
