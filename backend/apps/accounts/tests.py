import pytest
from django.contrib.auth import get_user_model
from apps.accounts.models import UserRole, Profile

User = get_user_model()


@pytest.mark.django_db
class TestUserModel:
    def test_create_user(self, user_data):
        user = User.objects.create_user(**user_data)
        assert user.email == user_data["email"]
        assert user.first_name == user_data["first_name"]
        assert user.check_password(user_data["password"])
        assert user.role == UserRole.YOUTH
        assert user.is_approved is False
        assert user.is_staff is False

    def test_create_user_without_email_raises(self):
        with pytest.raises(ValueError, match="Email is required"):
            User.objects.create_user(email="", password="pass")

    def test_create_superuser(self):
        admin = User.objects.create_superuser(
            email="admin@example.com",
            password="AdminPass123!",
            first_name="Admin",
            last_name="User",
        )
        assert admin.is_staff is True
        assert admin.is_superuser is True
        assert admin.is_approved is True
        assert admin.role == UserRole.ADMIN

    def test_user_str(self, create_user):
        assert str(create_user) == "Test User <test@example.com>"


@pytest.mark.django_db
class TestProfileModel:
    def test_profile_creation(self, create_user):
        profile = Profile.objects.create(user=create_user, bio="A test bio")
        assert profile.user == create_user
        assert profile.bio == "A test bio"
        assert str(profile.user) == "Test User <test@example.com>"


@pytest.mark.django_db
class TestAccountEndpoints:
    def test_register_user(self, client):
        response = client.post(
            "/api/v1/auth/register/",
            data={
                "email": "new@example.com",
                "first_name": "New",
                "last_name": "User",
                "password": "SecurePass123!",
            },
            content_type="application/json",
        )
        assert response.status_code in (200, 201)
        assert User.objects.filter(email="new@example.com").exists()

    def test_current_user_requires_auth(self, client):
        response = client.get("/api/v1/auth/me/")
        assert response.status_code in (401, 403)
