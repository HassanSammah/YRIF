import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone

from apps.research.models import Research, ResearchStatus, ResearchCategory


def _make_pdf():
    return SimpleUploadedFile("paper.pdf", b"%PDF-1.4 test content", content_type="application/pdf")


@pytest.fixture
def published_research(db, active_user):
    return Research.objects.create(
        title="Published Paper",
        abstract="Abstract text",
        category=ResearchCategory.NATURAL_SCIENCES,
        status=ResearchStatus.PUBLISHED,
        author=active_user,
        document=_make_pdf(),
        published_at=timezone.now(),
    )


@pytest.fixture
def draft_research(db, active_user):
    return Research.objects.create(
        title="Draft Paper",
        abstract="Draft abstract",
        category=ResearchCategory.TECHNOLOGY,
        status=ResearchStatus.DRAFT,
        author=active_user,
        document=_make_pdf(),
    )


@pytest.fixture
def submitted_research(db, active_user):
    return Research.objects.create(
        title="Submitted Paper",
        abstract="Submitted abstract",
        category=ResearchCategory.SOCIAL_SCIENCES,
        status=ResearchStatus.SUBMITTED,
        author=active_user,
        document=_make_pdf(),
    )


# ── Public research repository ───────────────────────────────────────────────

@pytest.mark.django_db
class TestPublicResearchEndpoints:
    LIST_URL = "/api/v1/research/"

    def test_public_list_shows_only_published(self, api_client, published_research, draft_research):
        response = api_client.get(self.LIST_URL)
        assert response.status_code == 200
        titles = [r["title"] for r in response.data["results"]]
        assert "Published Paper" in titles
        assert "Draft Paper" not in titles

    def test_published_detail_returns_200(self, api_client, published_research):
        url = f"/api/v1/research/{published_research.pk}/"
        response = api_client.get(url)
        assert response.status_code == 200
        assert response.data["title"] == "Published Paper"

    def test_unauthenticated_create_returns_401(self, api_client):
        response = api_client.post("/api/v1/research/create/", {}, format="multipart")
        assert response.status_code == 401


# ── Author research flow ─────────────────────────────────────────────────────

@pytest.mark.django_db
class TestResearchAuthorFlow:
    def test_author_can_create_draft(self, auth_client):
        response = auth_client.post(
            "/api/v1/research/create/",
            {
                "title": "My New Research",
                "abstract": "This is the abstract.",
                "category": ResearchCategory.TECHNOLOGY,
                "document": _make_pdf(),
            },
            format="multipart",
        )
        assert response.status_code == 201
        assert response.data["status"] == ResearchStatus.DRAFT

    def test_my_research_returns_own_only(self, auth_client, draft_research, db):
        # Create another user's research
        from django.contrib.auth import get_user_model
        User = get_user_model()
        other = User.objects.create_user(
            email="other@example.com", password="pass", status="active", is_active=True
        )
        Research.objects.create(
            title="Other's Research", abstract="Abstract",
            category=ResearchCategory.ARTS, status=ResearchStatus.DRAFT,
            author=other, document=_make_pdf(),
        )
        response = auth_client.get("/api/v1/research/my/")
        assert response.status_code == 200
        titles = [r["title"] for r in response.data["results"]]
        assert "Draft Paper" in titles
        assert "Other's Research" not in titles

    def test_submit_draft_to_review(self, auth_client, draft_research):
        url = f"/api/v1/research/{draft_research.pk}/submit/"
        response = auth_client.post(url)
        assert response.status_code == 200
        draft_research.refresh_from_db()
        assert draft_research.status == ResearchStatus.SUBMITTED


# ── Admin research flow ──────────────────────────────────────────────────────

@pytest.mark.django_db
class TestResearchAdminFlow:
    def test_admin_list_all_research(self, admin_client, draft_research, published_research):
        response = admin_client.get("/api/v1/research/admin/")
        assert response.status_code == 200

    def test_admin_approve_submitted_research(self, admin_client, submitted_research):
        url = f"/api/v1/research/{submitted_research.pk}/decide/"
        response = admin_client.post(url, {"decision": "approve"}, format="json")
        assert response.status_code == 200
        submitted_research.refresh_from_db()
        assert submitted_research.status == ResearchStatus.APPROVED

    def test_non_admin_admin_list_returns_403(self, auth_client):
        response = auth_client.get("/api/v1/research/admin/")
        assert response.status_code == 403
