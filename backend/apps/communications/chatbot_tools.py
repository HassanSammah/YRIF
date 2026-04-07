"""Tools exposed to YRIF Chat via Claude tool use.

Each tool is a pure, read-only function that queries the Django ORM and
returns a small JSON-serialisable dict / list. The chatbot loop in
`chatbot.py` passes TOOLS to Claude and dispatches `tool_use` blocks
through `dispatch_tool(name, arguments, user)`.

Safety rules (enforced here, NOT trusted from the LLM):
- No create / update / delete anywhere.
- Published / active filters are hardcoded and cannot be overridden.
- Every list tool caps results at MAX_LIMIT regardless of requested limit.
- Only non-sensitive fields are returned (no emails/phones of other users).
- Every implementation is wrapped in try/except and returns
  {"error": "<message>"} instead of raising — the loop must keep running.
- User-scoped tools return {"error": "login_required"} if user is None.
"""
from __future__ import annotations

import logging
from typing import Any, Callable

from django.db.models import Q
from django.utils import timezone

logger = logging.getLogger(__name__)

MAX_LIMIT = 10


# ── Anthropic tool schemas ────────────────────────────────────────────────────

TOOLS: list[dict[str, Any]] = [
    # Public tools
    {
        "name": "get_platform_stats",
        "description": (
            "Get high-level YRIF platform statistics: total active members, "
            "published research projects, published events, and partner "
            "organisations. Use this whenever the user asks 'how many', "
            "'total', or about the size/scale of YRIF."
        ),
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "search_research",
        "description": (
            "Search published research papers on the YRIF platform. Returns "
            "title, author name, category, abstract snippet, and id. Use "
            "whenever the user asks about research topics, papers, or "
            "specific authors' published work."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Keywords to match against title, abstract, keywords.",
                },
                "category": {
                    "type": "string",
                    "enum": [
                        "natural_sciences",
                        "social_sciences",
                        "arts",
                        "technology",
                    ],
                    "description": "Optional category filter.",
                },
                "limit": {
                    "type": "integer",
                    "description": f"Max results (capped at {MAX_LIMIT}).",
                },
            },
            "required": [],
        },
    },
    {
        "name": "get_research_detail",
        "description": "Get full details for one published research paper by id.",
        "input_schema": {
            "type": "object",
            "properties": {
                "research_id": {"type": "string", "description": "UUID of the research."},
            },
            "required": ["research_id"],
        },
    },
    {
        "name": "list_upcoming_events",
        "description": (
            "List upcoming published YRIF events (start_date in the future). "
            "Returns title, type, start_date, end_date, location, is_online, "
            "registration_deadline."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "event_type": {
                    "type": "string",
                    "enum": ["seminar", "workshop", "bonanza", "competition", "webinar"],
                    "description": "Optional filter by event type.",
                },
                "limit": {"type": "integer"},
            },
            "required": [],
        },
    },
    {
        "name": "get_event_detail",
        "description": "Get full details for one published event by id.",
        "input_schema": {
            "type": "object",
            "properties": {
                "event_id": {"type": "string", "description": "UUID of the event."},
            },
            "required": ["event_id"],
        },
    },
    {
        "name": "search_mentors",
        "description": (
            "Search the YRIF mentor directory. Returns mentor names, "
            "institution, bio snippet, and expertise areas. Use when the user "
            "asks about finding a mentor or mentors in a specific field."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "expertise": {
                    "type": "string",
                    "description": "Keywords to match against expertise areas, bio, name.",
                },
                "limit": {"type": "integer"},
            },
            "required": [],
        },
    },
    {
        "name": "list_partners",
        "description": (
            "List verified YRIF partner organisations (industry/community partners). "
            "Returns org name, partner type, sector."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "partner_type": {
                    "type": "string",
                    "enum": ["industry", "community"],
                    "description": "Optional filter by partner type.",
                },
                "limit": {"type": "integer"},
            },
            "required": [],
        },
    },
    {
        "name": "list_research_assistants",
        "description": "List research assistants in the YRIF directory.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Keywords to match against skills or name.",
                },
                "limit": {"type": "integer"},
            },
            "required": [],
        },
    },
    {
        "name": "search_resources",
        "description": (
            "Search published learning resources (guides, templates, datasets, "
            "recordings). Returns title, description snippet, type, tags."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string"},
                "resource_type": {
                    "type": "string",
                    "enum": ["guide", "template", "dataset", "webinar", "recording", "other"],
                },
                "limit": {"type": "integer"},
            },
            "required": [],
        },
    },
    {
        "name": "list_webinars",
        "description": "List published webinars, filter by upcoming or past.",
        "input_schema": {
            "type": "object",
            "properties": {
                "when": {
                    "type": "string",
                    "enum": ["upcoming", "past"],
                    "description": "Whether to list upcoming or past webinars.",
                },
                "limit": {"type": "integer"},
            },
            "required": [],
        },
    },
    {
        "name": "list_vacancies",
        "description": "List active YRIF job/internship/volunteer vacancies.",
        "input_schema": {
            "type": "object",
            "properties": {"limit": {"type": "integer"}},
            "required": [],
        },
    },
    {
        "name": "list_announcements",
        "description": "List the latest published announcements from the YRIF admin team.",
        "input_schema": {
            "type": "object",
            "properties": {"limit": {"type": "integer"}},
            "required": [],
        },
    },
    {
        "name": "list_news",
        "description": "List the latest published news / blog posts from YRIF.",
        "input_schema": {
            "type": "object",
            "properties": {"limit": {"type": "integer"}},
            "required": [],
        },
    },
    # User-scoped tools (require authenticated user)
    {
        "name": "get_my_profile",
        "description": (
            "Get the currently logged-in user's profile summary (name, role, "
            "status, institution, education level). Requires the user to be "
            "logged in."
        ),
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "get_my_research",
        "description": (
            "Get the logged-in user's own research submissions (any status). "
            "Requires login."
        ),
        "input_schema": {
            "type": "object",
            "properties": {"limit": {"type": "integer"}},
            "required": [],
        },
    },
    {
        "name": "get_my_events",
        "description": (
            "Get the logged-in user's event registrations (past and upcoming). "
            "Requires login."
        ),
        "input_schema": {
            "type": "object",
            "properties": {"limit": {"type": "integer"}},
            "required": [],
        },
    },
    {
        "name": "get_my_certificates",
        "description": "Get the logged-in user's earned certificates. Requires login.",
        "input_schema": {
            "type": "object",
            "properties": {"limit": {"type": "integer"}},
            "required": [],
        },
    },
    {
        "name": "get_my_mentorship_matches",
        "description": (
            "Get the logged-in user's mentorship matches (as mentor or mentee). "
            "Requires login."
        ),
        "input_schema": {
            "type": "object",
            "properties": {"limit": {"type": "integer"}},
            "required": [],
        },
    },
    {
        "name": "get_my_notifications",
        "description": (
            "Get the logged-in user's unread in-app notifications. Requires login."
        ),
        "input_schema": {
            "type": "object",
            "properties": {"limit": {"type": "integer"}},
            "required": [],
        },
    },
]


# ── Helpers ───────────────────────────────────────────────────────────────────

def _clamp_limit(value: Any) -> int:
    try:
        n = int(value)
    except (TypeError, ValueError):
        return MAX_LIMIT
    if n <= 0:
        return MAX_LIMIT
    return min(n, MAX_LIMIT)


def _snippet(text: str, length: int = 200) -> str:
    if not text:
        return ""
    text = " ".join(text.split())
    return text if len(text) <= length else text[: length - 1] + "…"


def _require_user(user) -> dict | None:
    if user is None or not getattr(user, "is_authenticated", False):
        return {"error": "login_required"}
    return None


# ── Public tool implementations ───────────────────────────────────────────────

def _get_platform_stats(args, user):
    from apps.accounts.models import User, UserStatus, PartnerProfile
    from apps.research.models import Research, ResearchStatus
    from apps.events.models import Event

    return {
        "total_members": User.objects.filter(status=UserStatus.ACTIVE).count(),
        "research_projects": Research.objects.filter(
            status=ResearchStatus.PUBLISHED
        ).count(),
        "events_hosted": Event.objects.filter(is_published=True).count(),
        "partner_organizations": PartnerProfile.objects.filter(
            user__status=UserStatus.ACTIVE
        ).count(),
    }


def _search_research(args, user):
    from apps.research.models import Research, ResearchStatus

    query = (args.get("query") or "").strip()
    category = args.get("category")
    limit = _clamp_limit(args.get("limit"))

    qs = Research.objects.filter(status=ResearchStatus.PUBLISHED).select_related("author")
    if query:
        qs = qs.filter(
            Q(title__icontains=query)
            | Q(abstract__icontains=query)
            | Q(keywords__icontains=query)
        )
    if category:
        qs = qs.filter(category=category)

    results = []
    for r in qs.order_by("-published_at", "-created_at")[:limit]:
        results.append(
            {
                "id": str(r.id),
                "title": r.title,
                "category": r.get_category_display(),
                "author": r.author.get_full_name() if r.author else "",
                "abstract_snippet": _snippet(r.abstract, 240),
                "keywords": r.keywords,
                "views_count": r.views_count,
                "downloads_count": r.downloads_count,
                "published_at": r.published_at.isoformat() if r.published_at else None,
            }
        )
    return {"count": len(results), "results": results}


def _get_research_detail(args, user):
    from apps.research.models import Research, ResearchStatus

    rid = args.get("research_id")
    if not rid:
        return {"error": "research_id is required"}
    try:
        r = Research.objects.select_related("author").get(
            id=rid, status=ResearchStatus.PUBLISHED
        )
    except Research.DoesNotExist:
        return {"error": "not_found"}
    return {
        "id": str(r.id),
        "title": r.title,
        "abstract": r.abstract,
        "category": r.get_category_display(),
        "author": r.author.get_full_name() if r.author else "",
        "keywords": r.keywords,
        "views_count": r.views_count,
        "downloads_count": r.downloads_count,
        "open_for_collaboration": r.open_for_collaboration,
        "collaboration_description": r.collaboration_description,
        "published_at": r.published_at.isoformat() if r.published_at else None,
    }


def _list_upcoming_events(args, user):
    from apps.events.models import Event

    event_type = args.get("event_type")
    limit = _clamp_limit(args.get("limit"))
    now = timezone.now()

    qs = Event.objects.filter(is_published=True, start_date__gte=now)
    if event_type:
        qs = qs.filter(event_type=event_type)

    results = []
    for e in qs.order_by("start_date")[:limit]:
        results.append(
            {
                "id": str(e.id),
                "title": e.title,
                "event_type": e.get_event_type_display(),
                "description_snippet": _snippet(e.description, 240),
                "start_date": e.start_date.isoformat(),
                "end_date": e.end_date.isoformat(),
                "registration_deadline": (
                    e.registration_deadline.isoformat() if e.registration_deadline else None
                ),
                "location": e.location,
                "is_online": e.is_online,
            }
        )
    return {"count": len(results), "results": results}


def _get_event_detail(args, user):
    from apps.events.models import Event

    eid = args.get("event_id")
    if not eid:
        return {"error": "event_id is required"}
    try:
        e = Event.objects.get(id=eid, is_published=True)
    except Event.DoesNotExist:
        return {"error": "not_found"}
    return {
        "id": str(e.id),
        "title": e.title,
        "description": e.description,
        "event_type": e.get_event_type_display(),
        "start_date": e.start_date.isoformat(),
        "end_date": e.end_date.isoformat(),
        "registration_deadline": (
            e.registration_deadline.isoformat() if e.registration_deadline else None
        ),
        "location": e.location,
        "is_online": e.is_online,
        "online_link": e.online_link if e.is_online else "",
        "max_participants": e.max_participants,
    }


def _search_mentors(args, user):
    from apps.accounts.models import User, UserRole, UserStatus, MentorProfile

    expertise = (args.get("expertise") or "").strip()
    limit = _clamp_limit(args.get("limit"))

    qs = MentorProfile.objects.filter(
        user__role=UserRole.MENTOR, user__status=UserStatus.ACTIVE
    ).select_related("user", "user__profile")

    if expertise:
        qs = qs.filter(
            Q(expertise_areas__icontains=expertise)
            | Q(user__first_name__icontains=expertise)
            | Q(user__last_name__icontains=expertise)
            | Q(user__profile__bio__icontains=expertise)
        )

    results = []
    for mp in qs[:limit]:
        u = mp.user
        profile = getattr(u, "profile", None)
        results.append(
            {
                "id": str(u.id),
                "name": u.get_full_name(),
                "expertise_areas": mp.expertise_areas,
                "is_verified": mp.is_verified,
                "institution": profile.institution if profile else "",
                "bio_snippet": _snippet(profile.bio, 200) if profile else "",
            }
        )
    return {"count": len(results), "results": results}


def _list_partners(args, user):
    from apps.accounts.models import UserStatus, PartnerProfile

    partner_type = args.get("partner_type")
    limit = _clamp_limit(args.get("limit"))

    qs = PartnerProfile.objects.filter(
        user__status=UserStatus.ACTIVE, is_verified=True
    ).select_related("user")
    if partner_type:
        qs = qs.filter(partner_type=partner_type)

    results = []
    for p in qs[:limit]:
        results.append(
            {
                "org_name": p.org_name or p.user.get_full_name(),
                "partner_type": p.get_partner_type_display(),
                "sector": p.sector,
            }
        )
    return {"count": len(results), "results": results}


def _list_research_assistants(args, user):
    from apps.accounts.models import UserRole, UserStatus, ResearchAssistantProfile

    query = (args.get("query") or "").strip()
    limit = _clamp_limit(args.get("limit"))

    qs = ResearchAssistantProfile.objects.filter(
        user__role=UserRole.RESEARCH_ASSISTANT, user__status=UserStatus.ACTIVE
    ).select_related("user", "user__profile")

    if query:
        qs = qs.filter(
            Q(skills__icontains=query)
            | Q(user__first_name__icontains=query)
            | Q(user__last_name__icontains=query)
        )

    results = []
    for ra in qs[:limit]:
        u = ra.user
        profile = getattr(u, "profile", None)
        results.append(
            {
                "id": str(u.id),
                "name": u.get_full_name(),
                "skills": ra.skills,
                "availability": ra.availability,
                "institution": profile.institution if profile else "",
            }
        )
    return {"count": len(results), "results": results}


def _search_resources(args, user):
    from apps.resources.models import Resource

    query = (args.get("query") or "").strip()
    resource_type = args.get("resource_type")
    limit = _clamp_limit(args.get("limit"))

    qs = Resource.objects.filter(is_published=True)
    if query:
        qs = qs.filter(Q(title__icontains=query) | Q(description__icontains=query))
    if resource_type:
        qs = qs.filter(resource_type=resource_type)

    results = []
    for r in qs[:limit]:
        results.append(
            {
                "id": str(r.id),
                "title": r.title,
                "resource_type": r.get_resource_type_display(),
                "description_snippet": _snippet(r.description, 200),
                "tags": r.tags or [],
                "views_count": r.views_count,
                "downloads_count": r.downloads_count,
            }
        )
    return {"count": len(results), "results": results}


def _list_webinars(args, user):
    from apps.resources.models import Webinar

    when = args.get("when") or "upcoming"
    limit = _clamp_limit(args.get("limit"))
    now = timezone.now()

    qs = Webinar.objects.filter(is_published=True)
    if when == "upcoming":
        qs = qs.filter(scheduled_at__gte=now).order_by("scheduled_at")
    else:
        qs = qs.filter(scheduled_at__lt=now).order_by("-scheduled_at")

    results = []
    for w in qs[:limit]:
        results.append(
            {
                "id": str(w.id),
                "title": w.title,
                "description_snippet": _snippet(w.description, 200),
                "scheduled_at": w.scheduled_at.isoformat(),
                "registration_link": w.registration_link,
                "recording_url": w.recording_url if when == "past" else "",
                "tags": w.tags or [],
            }
        )
    return {"count": len(results), "results": results}


def _list_vacancies(args, user):
    from apps.outreach.models import Vacancy

    limit = _clamp_limit(args.get("limit"))
    today = timezone.now().date()

    qs = Vacancy.objects.filter(is_active=True, deadline__gte=today).order_by("deadline")
    results = []
    for v in qs[:limit]:
        results.append(
            {
                "id": str(v.id),
                "title": v.title,
                "type": v.get_type_display(),
                "location": v.location,
                "deadline": v.deadline.isoformat(),
                "description_snippet": _snippet(v.description, 240),
            }
        )
    return {"count": len(results), "results": results}


def _list_announcements(args, user):
    from apps.administration.models import Announcement

    limit = _clamp_limit(args.get("limit"))
    qs = Announcement.objects.filter(is_published=True).order_by("-published_at", "-created_at")
    results = []
    for a in qs[:limit]:
        results.append(
            {
                "id": str(a.id),
                "title": a.title,
                "content_snippet": _snippet(a.content, 300),
                "published_at": a.published_at.isoformat() if a.published_at else None,
            }
        )
    return {"count": len(results), "results": results}


def _list_news(args, user):
    from apps.administration.models import NewsPost

    limit = _clamp_limit(args.get("limit"))
    qs = NewsPost.objects.filter(is_published=True).order_by("-published_at", "-created_at")
    results = []
    for n in qs[:limit]:
        results.append(
            {
                "id": str(n.id),
                "title": n.title,
                "slug": n.slug,
                "body_snippet": _snippet(n.body, 300),
                "published_at": n.published_at.isoformat() if n.published_at else None,
            }
        )
    return {"count": len(results), "results": results}


# ── User-scoped tool implementations ──────────────────────────────────────────

def _get_my_profile(args, user):
    if (err := _require_user(user)):
        return err
    profile = getattr(user, "profile", None)
    return {
        "name": user.get_full_name(),
        "role": user.get_role_display(),
        "status": user.get_status_display(),
        "institution": profile.institution if profile else "",
        "education_level": profile.get_education_level_display() if profile else "",
        "region": profile.region if profile else "",
    }


def _get_my_research(args, user):
    if (err := _require_user(user)):
        return err
    from apps.research.models import Research

    limit = _clamp_limit(args.get("limit"))
    qs = Research.objects.filter(author=user).order_by("-created_at")
    results = []
    for r in qs[:limit]:
        results.append(
            {
                "id": str(r.id),
                "title": r.title,
                "category": r.get_category_display(),
                "status": r.get_status_display(),
                "views_count": r.views_count,
                "downloads_count": r.downloads_count,
                "published_at": r.published_at.isoformat() if r.published_at else None,
                "created_at": r.created_at.isoformat(),
            }
        )
    return {"count": len(results), "results": results}


def _get_my_events(args, user):
    if (err := _require_user(user)):
        return err
    from apps.events.models import EventRegistration

    limit = _clamp_limit(args.get("limit"))
    qs = (
        EventRegistration.objects.filter(participant=user)
        .select_related("event")
        .order_by("-event__start_date")
    )
    results = []
    for reg in qs[:limit]:
        e = reg.event
        results.append(
            {
                "registration_id": str(reg.id),
                "event_id": str(e.id),
                "event_title": e.title,
                "event_type": e.get_event_type_display(),
                "start_date": e.start_date.isoformat(),
                "location": e.location,
                "is_online": e.is_online,
                "status": reg.get_status_display(),
            }
        )
    return {"count": len(results), "results": results}


def _get_my_certificates(args, user):
    if (err := _require_user(user)):
        return err
    from apps.events.models import Certificate

    limit = _clamp_limit(args.get("limit"))
    qs = (
        Certificate.objects.filter(registration__participant=user)
        .select_related("registration__event")
        .order_by("-issued_at")
    )
    results = []
    for c in qs[:limit]:
        e = c.registration.event
        results.append(
            {
                "id": str(c.id),
                "certificate_type": c.get_certificate_type_display(),
                "position": c.position,
                "event_title": e.title,
                "event_type": e.get_event_type_display(),
                "issued_at": c.issued_at.isoformat(),
            }
        )
    return {"count": len(results), "results": results}


def _get_my_mentorship_matches(args, user):
    if (err := _require_user(user)):
        return err
    from apps.mentorship.models import MentorshipMatch

    limit = _clamp_limit(args.get("limit"))
    qs = (
        MentorshipMatch.objects.filter(Q(mentor=user) | Q(mentee=user))
        .select_related("mentor", "mentee", "request")
        .order_by("-created_at")
    )
    results = []
    for m in qs[:limit]:
        results.append(
            {
                "id": str(m.id),
                "role": "mentor" if m.mentor_id == user.id else "mentee",
                "counterpart_name": (
                    m.mentee.get_full_name() if m.mentor_id == user.id else m.mentor.get_full_name()
                ),
                "topic": m.request.topic if m.request else "",
                "status": m.get_status_display(),
                "start_date": m.start_date.isoformat() if m.start_date else None,
                "end_date": m.end_date.isoformat() if m.end_date else None,
            }
        )
    return {"count": len(results), "results": results}


def _get_my_notifications(args, user):
    if (err := _require_user(user)):
        return err
    from .models import Notification

    limit = _clamp_limit(args.get("limit"))
    qs = Notification.objects.filter(
        recipient=user, channel=Notification.Channel.IN_APP, is_read=False
    ).order_by("-created_at")
    results = []
    for n in qs[:limit]:
        results.append(
            {
                "id": str(n.id),
                "subject": n.subject,
                "body_snippet": _snippet(n.body, 200),
                "created_at": n.created_at.isoformat(),
            }
        )
    return {"count": len(results), "results": results}


# ── Dispatcher ────────────────────────────────────────────────────────────────

_IMPLEMENTATIONS: dict[str, Callable[[dict, Any], dict]] = {
    "get_platform_stats": _get_platform_stats,
    "search_research": _search_research,
    "get_research_detail": _get_research_detail,
    "list_upcoming_events": _list_upcoming_events,
    "get_event_detail": _get_event_detail,
    "search_mentors": _search_mentors,
    "list_partners": _list_partners,
    "list_research_assistants": _list_research_assistants,
    "search_resources": _search_resources,
    "list_webinars": _list_webinars,
    "list_vacancies": _list_vacancies,
    "list_announcements": _list_announcements,
    "list_news": _list_news,
    "get_my_profile": _get_my_profile,
    "get_my_research": _get_my_research,
    "get_my_events": _get_my_events,
    "get_my_certificates": _get_my_certificates,
    "get_my_mentorship_matches": _get_my_mentorship_matches,
    "get_my_notifications": _get_my_notifications,
}


def dispatch_tool(name: str, arguments: dict | None, user) -> dict:
    """Execute a chatbot tool by name. Always returns a dict (never raises)."""
    impl = _IMPLEMENTATIONS.get(name)
    if impl is None:
        return {"error": f"unknown_tool: {name}"}
    try:
        return impl(arguments or {}, user)
    except Exception as exc:  # noqa: BLE001 — tool errors must be caught
        logger.exception("chatbot tool %s failed: %s", name, exc)
        return {"error": "tool_execution_failed"}
