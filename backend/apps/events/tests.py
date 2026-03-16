import pytest
from datetime import timedelta
from django.utils import timezone

from apps.events.models import Event, EventType, EventRegistration


@pytest.fixture
def published_event(db, admin_user):
    now = timezone.now()
    return Event.objects.create(
        title="Test Seminar",
        description="A great seminar",
        event_type=EventType.SEMINAR,
        start_date=now + timedelta(days=7),
        end_date=now + timedelta(days=8),
        is_published=True,
        created_by=admin_user,
    )


@pytest.fixture
def unpublished_event(db, admin_user):
    now = timezone.now()
    return Event.objects.create(
        title="Hidden Event",
        description="Not published yet",
        event_type=EventType.WORKSHOP,
        start_date=now + timedelta(days=14),
        end_date=now + timedelta(days=15),
        is_published=False,
        created_by=admin_user,
    )


# ── Public event endpoints ───────────────────────────────────────────────────

@pytest.mark.django_db
class TestPublicEventEndpoints:
    LIST_URL = "/api/v1/events/"

    def test_public_list_shows_only_published(self, api_client, published_event, unpublished_event):
        response = api_client.get(self.LIST_URL)
        assert response.status_code == 200
        titles = [e["title"] for e in response.data["results"]]
        assert "Test Seminar" in titles
        assert "Hidden Event" not in titles

    def test_published_detail_returns_200(self, api_client, published_event):
        response = api_client.get(f"/api/v1/events/{published_event.pk}/")
        assert response.status_code == 200
        assert response.data["title"] == "Test Seminar"

    def test_unpublished_detail_returns_404(self, api_client, unpublished_event):
        response = api_client.get(f"/api/v1/events/{unpublished_event.pk}/")
        assert response.status_code == 404


# ── Event registration ───────────────────────────────────────────────────────

@pytest.mark.django_db
class TestEventRegistration:
    def test_register_for_event_returns_201(self, auth_client, published_event):
        response = auth_client.post(f"/api/v1/events/{published_event.pk}/register/", {}, format="json")
        assert response.status_code == 201

    def test_double_register_returns_400(self, auth_client, active_user, published_event):
        # Create registration directly
        EventRegistration.objects.create(
            event=published_event,
            participant=active_user,
            status=EventRegistration.Status.REGISTERED,
        )
        response = auth_client.post(f"/api/v1/events/{published_event.pk}/register/", {}, format="json")
        assert response.status_code == 400

    def test_unregister_returns_204(self, auth_client, active_user, published_event):
        EventRegistration.objects.create(
            event=published_event,
            participant=active_user,
            status=EventRegistration.Status.REGISTERED,
        )
        response = auth_client.delete(f"/api/v1/events/{published_event.pk}/unregister/")
        assert response.status_code == 204

    def test_unauthenticated_register_returns_401(self, api_client, published_event):
        response = api_client.post(f"/api/v1/events/{published_event.pk}/register/", {}, format="json")
        assert response.status_code == 401


# ── Admin event management ───────────────────────────────────────────────────

@pytest.mark.django_db
class TestAdminEventManagement:
    def test_admin_creates_event(self, admin_client):
        now = timezone.now()
        response = admin_client.post(
            "/api/v1/events/admin/create/",
            {
                "title": "New Admin Event",
                "description": "Created by admin",
                "event_type": EventType.SEMINAR,
                "start_date": (now + timedelta(days=10)).isoformat(),
                "end_date": (now + timedelta(days=11)).isoformat(),
            },
            format="json",
        )
        assert response.status_code == 201

    def test_non_admin_create_returns_403(self, auth_client):
        now = timezone.now()
        response = auth_client.post(
            "/api/v1/events/admin/create/",
            {
                "title": "Sneaky Event",
                "description": "desc",
                "event_type": EventType.SEMINAR,
                "start_date": (now + timedelta(days=10)).isoformat(),
                "end_date": (now + timedelta(days=11)).isoformat(),
            },
            format="json",
        )
        assert response.status_code == 403
