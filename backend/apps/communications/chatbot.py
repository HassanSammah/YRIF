"""YRIF Chat — powered by Claude (Anthropic) with live tool access.

The bot maintains conversation history per session in Redis (1h idle) and
uses Claude tool use to query the Django ORM for real platform data
(research, events, mentors, resources, stats, etc.) via the helpers in
`chatbot_tools.py`.
"""
import logging

from django.conf import settings
from django.core.cache import cache

from .chatbot_tools import TOOLS, dispatch_tool

logger = logging.getLogger(__name__)

# Keep last 20 text messages per session (user+assistant only — tool
# interactions are not persisted to the cache to keep it compact).
_MAX_HISTORY = 20
_SESSION_TTL = 3600  # 1 hour
_MAX_TOOL_ITERATIONS = 5
_MODEL = "claude-haiku-4-5-20251001"
_MAX_TOKENS = 1536

# ── YRIF system prompt ───────────────────────────────────────────────────────
# Trimmed: we now instruct the model to PREFER live tools for any concrete
# facts (counts, events, mentors, research, etc.) instead of guessing.
_SYSTEM_PROMPT = """You are YRIF Chat, the official AI assistant for the Youth Research & Innovation Foundation (YRIF) Tanzania — yriftz.org.

You are friendly, warm, professional, and bilingual. Always respond in the same language the user writes in (Swahili or English). If the user mixes languages, mirror that mix. Keep answers concise and focused on YRIF. Use emojis sparingly for warmth.

━━━━━━━━━━━━━━━━━━━━━━━━━━━
USING YOUR TOOLS (IMPORTANT)
━━━━━━━━━━━━━━━━━━━━━━━━━━━
You have live tools that query the YRIF platform database. Whenever the user asks about anything concrete — numbers, specific events, specific research, mentors, partners, resources, webinars, vacancies, announcements, news, or their own data — CALL A TOOL. Do not guess, do not invent titles, counts, dates, or names. If a tool returns no results, say so plainly.

User-scoped tools (names starting with `get_my_`) require the user to be logged in. If a tool returns `{"error": "login_required"}`, politely tell the user they need to log in first.

━━━━━━━━━━━━━━━━━━━━━━━━━━━
ABOUT YRIF
━━━━━━━━━━━━━━━━━━━━━━━━━━━
YRIF is Tanzania's national platform for youth-led research and innovation, connecting young researchers, mentors, academic institutions, and private sector partners.

- Vision: "To become the world's centre of Research and Innovation."
- Mission: Engage youth potential by addressing global challenges through research-based solutions.
- Values: Professionalism, Integrity, Adherence, Innovation.
- Aligned with Tanzania Vision 2050, National Research Agenda, SDGs 4/8/9.
- Contact: info@yriftz.org — Dar es Salaam, Tanzania — yriftz.org

━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOW THE PLATFORM WORKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Registration is FREE. Sign up via email+password, Google, or BRIQ phone OTP. Admin approval usually takes 1–2 business days.
- User roles: Youth/Student, Young Researcher, Mentor, Research Assistant, Industry/Community Partner, plus Judge and Admin roles.
- Research workflow: Draft → Submitted → Under Review → Approved → Published.
- Events: seminars, workshops, competitions (including the flagship Youth Bonanza), and webinars. Certificates are issued after attendance or winning.
- Mentorship: users browse mentors, send requests with a topic, and admins match them — a private conversation opens once matched.
- Dashboard modules: Research, Events, Mentorship, Messages, Notifications, Profile, Resources.

━━━━━━━━━━━━━━━━━━━━━━━━━━━
ESCALATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━
If the user wants to speak with a human, they can say "talk to human" or "niongee na mtu" and the request will be forwarded to the YRIF team. They can also email info@yriftz.org (response within 24 business hours).

━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Answer ONLY about YRIF and topics directly relevant to yriftz.org users. Politely redirect unrelated questions.
- Never make up information. Prefer tool calls over guessing. If a tool fails or returns no data, say so honestly and point to info@yriftz.org.
- Never ask users for passwords or sensitive data.
- Keep replies under ~300 words unless detailed steps are genuinely needed.
"""


def _extract_text(response) -> str:
    """Concatenate all text blocks from a Claude response."""
    chunks = []
    for block in response.content:
        if getattr(block, "type", None) == "text":
            chunks.append(block.text)
    return "".join(chunks).strip()


def _extract_tool_uses(response) -> list:
    """Return list of tool_use blocks (objects with .id, .name, .input)."""
    return [b for b in response.content if getattr(b, "type", None) == "tool_use"]


def _assistant_blocks_as_dicts(response) -> list[dict]:
    """Convert a Claude response's content blocks into the dict form
    expected when echoing the assistant turn back in `messages`."""
    out: list[dict] = []
    for block in response.content:
        btype = getattr(block, "type", None)
        if btype == "text":
            out.append({"type": "text", "text": block.text})
        elif btype == "tool_use":
            out.append(
                {
                    "type": "tool_use",
                    "id": block.id,
                    "name": block.name,
                    "input": block.input,
                }
            )
    return out


def send_chatbot_message(chat_id: str, message: str, user=None) -> dict:
    """Send a message to YRIF Chat AI and return {"reply": str, "escalated": bool}.

    If `user` is an authenticated Django user, user-scoped tools become
    available. Anonymous calls are fine; only public tools will succeed.
    """
    api_key = getattr(settings, "ANTHROPIC_API_KEY", "")
    if not api_key:
        return {
            "reply": (
                "YRIF Chat is not yet configured. "
                "Please contact us directly at info@yriftz.org or use the contact form."
            ),
            "escalated": False,
        }

    # Load persisted conversation history (text-only turns)
    history_key = f"chat_history:{chat_id}"
    history: list = cache.get(history_key, [])

    # Build the working messages list for this turn
    messages: list = list(history) + [{"role": "user", "content": message}]

    try:
        import anthropic

        client = anthropic.Anthropic(api_key=api_key)

        reply_text = ""
        for _ in range(_MAX_TOOL_ITERATIONS):
            response = client.messages.create(
                model=_MODEL,
                max_tokens=_MAX_TOKENS,
                system=_SYSTEM_PROMPT,
                tools=TOOLS,
                messages=messages,
            )

            if response.stop_reason == "tool_use":
                tool_uses = _extract_tool_uses(response)
                # Echo the assistant turn (including tool_use blocks)
                messages.append(
                    {"role": "assistant", "content": _assistant_blocks_as_dicts(response)}
                )
                # Execute each tool and append results in a single user turn
                tool_results = []
                for tu in tool_uses:
                    result = dispatch_tool(tu.name, tu.input or {}, user)
                    tool_results.append(
                        {
                            "type": "tool_result",
                            "tool_use_id": tu.id,
                            "content": _json_safe(result),
                        }
                    )
                messages.append({"role": "user", "content": tool_results})
                continue

            # end_turn / stop_sequence / max_tokens → take whatever text we have
            reply_text = _extract_text(response)
            break
        else:
            # Loop exhausted without a natural stop — pull whatever text exists
            reply_text = _extract_text(response) or (
                "Samahani, nimeshindwa kumaliza jibu. / "
                "Sorry, I couldn't finish that response. Please try again."
            )

        if not reply_text:
            reply_text = (
                "Samahani, sikuweza kupata jibu sasa hivi. / "
                "Sorry, I couldn't produce a reply just now."
            )

    except Exception as exc:
        logger.error("Claude chatbot error: %s", exc)
        return {
            "reply": (
                "Samahani, YRIF Chat haiwezi kujibu sasa hivi. / "
                "Sorry, YRIF Chat is unavailable right now. "
                "Please contact us at info@yriftz.org."
            ),
            "escalated": False,
        }

    # Persist only the plain text user+assistant turn (strip any tool noise)
    history.append({"role": "user", "content": message})
    history.append({"role": "assistant", "content": reply_text})
    if len(history) > _MAX_HISTORY:
        history = history[-_MAX_HISTORY:]
    cache.set(history_key, history, timeout=_SESSION_TTL)

    # Escalation keyword check on the *user* message (unchanged behaviour)
    escalation_phrases = [
        "talk to human", "speak to human", "talk to admin", "live agent",
        "niongee na mtu", "msaada wa mtu", "zungumza na mtu",
    ]
    msg_lower = message.lower()
    escalated = any(p in msg_lower for p in escalation_phrases)

    return {"reply": reply_text, "escalated": escalated}


def _json_safe(value) -> str:
    """Serialise a tool result for the Anthropic SDK as a JSON string.

    The API accepts either a plain string or a list of content blocks for
    `tool_result.content`. A compact JSON string is simplest and keeps
    token usage predictable.
    """
    import json

    try:
        return json.dumps(value, default=str, ensure_ascii=False)
    except Exception:
        return str(value)
