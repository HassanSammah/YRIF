"""Unit tests for the chatbot tool dispatcher (backend/apps/communications/chatbot_tools.py).

These tests verify that tools query the ORM correctly, enforce published/
active filters, cap result sizes, and refuse user-scoped tools for anonymous
callers. They do NOT invoke Claude — the dispatcher is called directly.
"""
from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.communications.chatbot_tools import MAX_LIMIT, TOOLS, dispatch_tool

User = get_user_model()


@pytest.mark.django_db
class TestDispatcher:
    def test_unknown_tool_returns_error(self):
        result = dispatch_tool("does_not_exist", {}, None)
        assert "error" in result
        assert "unknown_tool" in result["error"]

    def test_tools_list_has_unique_names(self):
        names = [t["name"] for t in TOOLS]
        assert len(names) == len(set(names)), "Duplicate tool names in TOOLS"

    def test_every_tool_has_implementation(self):
        from apps.communications.chatbot_tools import _IMPLEMENTATIONS
        for t in TOOLS:
            assert t["name"] in _IMPLEMENTATIONS, f"No impl for tool {t['name']}"


@pytest.mark.django_db
class TestPlatformStats:
    def test_counts_only_active_and_published(self):
        User.objects.create_user(
            email="active1@example.com", first_name="A", last_name="Active",
            password="x", status="active", is_active=True,
        )
        User.objects.create_user(
            email="pending1@example.com", first_name="P", last_name="Pending",
            password="x", status="pending_approval", is_active=True,
        )
        result = dispatch_tool("get_platform_stats", {}, None)
        assert result["total_members"] == 1  # only the active user
        assert result["research_projects"] == 0
        assert result["events_hosted"] == 0


@pytest.mark.django_db
class TestSearchResearch:
    def test_returns_only_published(self, active_user):
        from apps.research.models import Research, ResearchStatus, ResearchCategory

        Research.objects.create(
            title="Climate in Tanzania",
            abstract="A study on climate change impacts.",
            category=ResearchCategory.NATURAL_SCIENCES,
            status=ResearchStatus.PUBLISHED,
            author=active_user,
            document="research/documents/pub.pdf",
            published_at=timezone.now(),
        )
        Research.objects.create(
            title="Draft climate paper",
            abstract="A draft.",
            category=ResearchCategory.NATURAL_SCIENCES,
            status=ResearchStatus.DRAFT,
            author=active_user,
            document="research/documents/draft.pdf",
        )
        result = dispatch_tool("search_research", {"query": "climate"}, None)
        titles = [r["title"] for r in result["results"]]
        assert "Climate in Tanzania" in titles
        assert "Draft climate paper" not in titles

    def test_limit_is_capped(self, active_user):
        from apps.research.models import Research, ResearchStatus, ResearchCategory

        for i in range(15):
            Research.objects.create(
                title=f"Paper {i}",
                abstract="x",
                category=ResearchCategory.TECHNOLOGY,
                status=ResearchStatus.PUBLISHED,
                author=active_user,
                document=f"research/documents/p{i}.pdf",
                published_at=timezone.now(),
            )
        # Ask for 100 — should be clamped to MAX_LIMIT
        result = dispatch_tool("search_research", {"limit": 100}, None)
        assert len(result["results"]) == MAX_LIMIT


@pytest.mark.django_db
class TestListUpcomingEvents:
    def test_excludes_past_events_and_unpublished(self, active_user):
        from apps.events.models import Event, EventType

        now = timezone.now()
        Event.objects.create(
            title="Future event",
            description="x",
            event_type=EventType.SEMINAR,
            start_date=now + timedelta(days=5),
            end_date=now + timedelta(days=5, hours=2),
            is_published=True,
            created_by=active_user,
        )
        Event.objects.create(
            title="Past event",
            description="x",
            event_type=EventType.SEMINAR,
            start_date=now - timedelta(days=5),
            end_date=now - timedelta(days=5, hours=-2),
            is_published=True,
            created_by=active_user,
        )
        Event.objects.create(
            title="Unpublished future",
            description="x",
            event_type=EventType.SEMINAR,
            start_date=now + timedelta(days=5),
            end_date=now + timedelta(days=5, hours=2),
            is_published=False,
            created_by=active_user,
        )
        result = dispatch_tool("list_upcoming_events", {}, None)
        titles = [e["title"] for e in result["results"]]
        assert "Future event" in titles
        assert "Past event" not in titles
        assert "Unpublished future" not in titles


@pytest.mark.django_db
class TestUserScopedTools:
    @pytest.mark.parametrize(
        "tool_name",
        [
            "get_my_profile",
            "get_my_research",
            "get_my_events",
            "get_my_certificates",
            "get_my_mentorship_matches",
            "get_my_notifications",
        ],
    )
    def test_anonymous_user_is_rejected(self, tool_name):
        result = dispatch_tool(tool_name, {}, None)
        assert result == {"error": "login_required"}

    def test_get_my_research_returns_only_own(self, active_user):
        from apps.research.models import Research, ResearchStatus, ResearchCategory

        other = User.objects.create_user(
            email="other_ra@example.com", first_name="O", last_name="Ther",
            password="x", status="active", is_active=True,
        )
        Research.objects.create(
            title="Mine",
            abstract="a",
            category=ResearchCategory.TECHNOLOGY,
            status=ResearchStatus.DRAFT,
            author=active_user,
            document="research/documents/mine.pdf",
        )
        Research.objects.create(
            title="Theirs",
            abstract="a",
            category=ResearchCategory.TECHNOLOGY,
            status=ResearchStatus.PUBLISHED,
            author=other,
            document="research/documents/theirs.pdf",
            published_at=timezone.now(),
        )
        result = dispatch_tool("get_my_research", {}, active_user)
        titles = [r["title"] for r in result["results"]]
        assert "Mine" in titles
        assert "Theirs" not in titles

    def test_get_my_profile_works_for_authed(self, active_user):
        from apps.accounts.models import Profile

        Profile.objects.create(user=active_user, institution="UDSM")
        result = dispatch_tool("get_my_profile", {}, active_user)
        assert "error" not in result
        assert result["institution"] == "UDSM"
