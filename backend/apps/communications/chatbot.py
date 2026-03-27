"""Sarufi AI chatbot integration — YRIF Chat."""
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

_sarufi_instance = None


def _get_sarufi():
    """Lazy-initialise the Sarufi client (singleton)."""
    global _sarufi_instance
    if _sarufi_instance is None:
        try:
            from sarufi import Sarufi  # type: ignore[import]
            base_url = getattr(settings, "SARUFI_BASE_URL", "")
            if base_url:
                Sarufi._BASE_URL = base_url
            _sarufi_instance = Sarufi(api_key=settings.SARUFI_API_KEY)
        except Exception as exc:
            logger.warning("Sarufi SDK init failed: %s", exc)
    return _sarufi_instance


def send_chatbot_message(chat_id: str, message: str) -> dict:
    """Send a message to the YRIF Chat bot and return the response dict.

    Uses sarufi.chat(bot_id, chat_id, message) — the SDK v0.1.x API.
    """
    if not settings.SARUFI_API_KEY:
        return {"reply": "The chatbot is not configured yet."}

    if not settings.SARUFI_BOT_ID:
        return {"reply": "YRIF Chat is not yet configured. Please contact support at info@yriftz.org."}

    sarufi = _get_sarufi()
    if sarufi is None:
        return {"reply": "Chatbot service is unavailable. Please try again later."}

    try:
        bot_id = int(settings.SARUFI_BOT_ID)
        response = sarufi.chat(
            bot_id=bot_id,
            chat_id=str(chat_id),
            message=message,
            message_type="text",
            channel="general",
        )

        # Response is a dict: {"message": [...], "memory": {...}, ...}
        # or {"message": "reply text"} depending on version
        if isinstance(response, dict):
            logger.debug("Sarufi raw response: %s", response)
            # Detect API error responses — error dicts have "error"/"detail", not "message"
            if "message" not in response:
                error_detail = response.get("error") or response.get("detail") or str(response)
                logger.error("Sarufi API returned error response: %s", error_detail)
                return {
                    "reply": (
                        "Sorry, YRIF Chat is unavailable right now. "
                        "Please contact us at info@yriftz.org or submit a contact form."
                    )
                }
            msg = response["message"]
            if isinstance(msg, list):
                parts = []
                for m in msg:
                    if isinstance(m, dict):
                        parts.append(m.get("content") or m.get("text") or "")
                    elif isinstance(m, str):
                        parts.append(m)
                reply = " ".join(filter(None, parts)) or "I didn't understand that."
            elif isinstance(msg, str):
                reply = msg or "I didn't understand that."
            else:
                reply = str(msg) if msg else "I didn't understand that."
        else:
            logger.debug("Sarufi non-dict response: %s", response)
            reply = str(response)

        return {"reply": reply}

    except Exception as exc:
        logger.error("Sarufi chatbot error: %s", exc)
        return {
            "reply": (
                "Sorry, YRIF Chat is unavailable right now. "
                "Please contact us at info@yriftz.org or submit a contact form."
            )
        }
