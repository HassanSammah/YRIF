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
            _sarufi_instance = Sarufi(api_key=settings.SARUFI_API_KEY)
        except Exception as exc:
            logger.warning("Sarufi SDK init failed: %s", exc)
    return _sarufi_instance


def send_chatbot_message(chat_id: str, message: str) -> dict:
    """Send a message to the YRIF Chat bot and return the response dict."""
    if not settings.SARUFI_API_KEY:
        return {"reply": "The chatbot is not configured yet.", "actions": []}

    sarufi = _get_sarufi()
    if sarufi is None:
        return {"reply": "Chatbot service is unavailable. Please try again later.", "actions": []}

    try:
        bot_id = int(settings.SARUFI_BOT_ID)
        bot = sarufi.get_bot(id=bot_id)
        response = bot.respond(message=message, chat_id=str(chat_id), message_type="text")

        # Sarufi returns {"message": [{"type": "text", "content": "..."}], ...}
        messages = response.get("message", [])
        if messages:
            text_parts = [
                m.get("content", "") or m.get("text", "")
                for m in messages
                if isinstance(m, dict)
            ]
            reply = " ".join(filter(None, text_parts)) or "I didn't understand that. Please rephrase."
        else:
            reply = response.get("reply", "I didn't understand that. Please rephrase.")

        return {"reply": reply, "raw": response}

    except Exception as exc:
        logger.error("Sarufi chatbot error: %s", exc)
        return {
            "reply": (
                "Sorry, YRIF Chat is unavailable right now. "
                "Please contact us at info@yriftz.org or submit a contact form."
            )
        }
