import pytest
from unittest.mock import patch

from apps.communications.models import FAQ, Notification, Conversation


# ── Notification endpoints ───────────────────────────────────────────────────

@pytest.mark.django_db
class TestNotificationEndpoints:
    URL = "/api/v1/communications/notifications/"

    def test_list_notifications_returns_users_own(self, auth_client, active_user, db):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        other = User.objects.create_user(
            email="other2@example.com", password="pass", status="active", is_active=True
        )
        # 2 for active_user, 1 for other
        Notification.objects.create(
            recipient=active_user, channel=Notification.Channel.IN_APP,
            subject="Msg 1", body="Body 1", status=Notification.Status.SENT,
        )
        Notification.objects.create(
            recipient=active_user, channel=Notification.Channel.IN_APP,
            subject="Msg 2", body="Body 2", status=Notification.Status.SENT,
        )
        Notification.objects.create(
            recipient=other, channel=Notification.Channel.IN_APP,
            subject="Other's msg", body="Body", status=Notification.Status.SENT,
        )
        response = auth_client.get(self.URL)
        assert response.status_code == 200
        # Response may be paginated or plain list
        results = response.data.get("results", response.data) if isinstance(response.data, dict) else response.data
        assert len(results) == 2

    def test_mark_all_read(self, auth_client, active_user):
        Notification.objects.create(
            recipient=active_user, channel=Notification.Channel.IN_APP,
            subject="Unread", body="Body", status=Notification.Status.SENT, is_read=False,
        )
        response = auth_client.post("/api/v1/communications/notifications/read/")
        assert response.status_code == 200
        assert Notification.objects.filter(recipient=active_user, is_read=False).count() == 0

    def test_unauthenticated_notifications_returns_401(self, api_client):
        response = api_client.get(self.URL)
        assert response.status_code == 401


# ── FAQ endpoints ────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestFAQEndpoints:
    URL = "/api/v1/communications/faqs/"

    def test_public_list_only_shows_published(self, api_client, db):
        FAQ.objects.create(question="Published Q?", answer="Yes.", is_published=True)
        FAQ.objects.create(question="Hidden Q?", answer="No.", is_published=False)
        response = api_client.get(self.URL)
        assert response.status_code == 200
        items = response.data.get("results", response.data) if isinstance(response.data, dict) else response.data
        questions = [f["question"] for f in items]
        assert "Published Q?" in questions
        assert "Hidden Q?" not in questions


# ── Contact form ─────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestContactInquiry:
    URL = "/api/v1/communications/contact/"

    def test_valid_contact_form_creates_inquiry(self, api_client):
        with (
            patch("apps.communications.views.notify_contact_received"),
            patch("apps.communications.views.notify_contact_auto_reply"),
        ):
            response = api_client.post(
                self.URL,
                {
                    "name": "John Doe",
                    "email": "john@example.com",
                    "subject": "Test Subject",
                    "message": "Hello, this is a test message.",
                },
                format="json",
            )
        assert response.status_code == 201

    def test_missing_fields_returns_400(self, api_client):
        response = api_client.post(self.URL, {"name": "John"}, format="json")
        assert response.status_code == 400


# ── Chatbot ───────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestChatbotEndpoint:
    URL = "/api/v1/communications/chatbot/"

    def test_chatbot_returns_reply_when_unconfigured(self, api_client):
        # autouse fast_settings sets SARUFI_API_KEY="", so chatbot returns canned response
        response = api_client.post(self.URL, {"message": "Hello"}, format="json")
        assert response.status_code == 200
        assert "reply" in response.data

    def test_chatbot_missing_message_returns_400(self, api_client):
        response = api_client.post(self.URL, {}, format="json")
        assert response.status_code == 400


# ── Conversations ─────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestConversationEndpoints:
    LIST_URL = "/api/v1/communications/conversations/"

    def test_create_conversation_returns_201(self, auth_client):
        response = auth_client.post(
            self.LIST_URL,
            {"subject": "Test Conversation"},
            format="json",
        )
        assert response.status_code == 201

    def test_list_conversations_shows_participant_only(self, auth_client, active_user, db):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        other = User.objects.create_user(
            email="other3@example.com", password="pass", status="active", is_active=True
        )
        # Conversation that active_user is in
        conv_mine = Conversation.objects.create(subject="My Conv", conv_type="peer")
        conv_mine.participants.add(active_user)
        # Conversation that only other is in
        conv_other = Conversation.objects.create(subject="Other Conv", conv_type="peer")
        conv_other.participants.add(other)

        response = auth_client.get(self.LIST_URL)
        assert response.status_code == 200
        items = response.data.get("results", response.data) if isinstance(response.data, dict) else response.data
        subjects = [c["subject"] for c in items]
        assert "My Conv" in subjects
        assert "Other Conv" not in subjects

    def test_send_message_returns_201(self, auth_client, active_user):
        conv = Conversation.objects.create(subject="Chat", conv_type="peer")
        conv.participants.add(active_user)
        url = f"/api/v1/communications/conversations/{conv.pk}/messages/"
        response = auth_client.post(url, {"text": "Hello!"}, format="json")
        assert response.status_code == 201
