import pytest
from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework_simplejwt.tokens import RefreshToken
from apps.accounts.models import UserRole, UserStatus, Profile

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


# ── User status lifecycle ────────────────────────────────────────────────────

@pytest.mark.django_db
class TestUserStatus:
    def test_activate_sets_status_and_is_active(self, active_user):
        active_user.suspend()
        active_user.activate()
        assert active_user.status == UserStatus.ACTIVE
        assert active_user.is_active is True
        assert active_user.is_approved is True

    def test_reject_sets_status_and_disables_login(self, active_user):
        active_user.reject()
        assert active_user.status == UserStatus.REJECTED
        assert active_user.is_active is False
        assert active_user.is_approved is False

    def test_suspend_sets_status_and_disables_login(self, active_user):
        active_user.suspend()
        assert active_user.status == UserStatus.SUSPENDED
        assert active_user.is_active is False
        assert active_user.is_approved is False

    def test_is_approved_true_only_when_active(self, db):
        for s in (UserStatus.PENDING_EMAIL_VERIFICATION, UserStatus.PENDING_APPROVAL,
                  UserStatus.REJECTED, UserStatus.SUSPENDED):
            u = User.objects.create_user(
                email=f"u_{s}@example.com", password="pass", status=s, is_active=False
            )
            assert u.is_approved is False

    def test_auto_approved_for_program_manager_role(self, db):
        u = User.objects.create_user(
            email="pm@example.com", password="pass",
            first_name="PM", last_name="User",
            role=UserRole.PROGRAM_MANAGER,
        )
        assert u.status == UserStatus.ACTIVE
        assert u.is_approved is True


# ── Login ────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestLoginEndpoint:
    URL = "/api/v1/auth/login/"

    def test_login_success_returns_tokens(self, api_client, active_user):
        response = api_client.post(
            self.URL,
            {"email": active_user.email, "password": "SecurePass123!"},
            format="json",
        )
        assert response.status_code == 200
        assert "access" in response.data
        assert "refresh" in response.data

    def test_login_wrong_password_returns_400(self, api_client, active_user):
        response = api_client.post(
            self.URL,
            {"email": active_user.email, "password": "WrongPassword!"},
            format="json",
        )
        assert response.status_code == 400

    def test_login_pending_email_user_blocked(self, api_client, create_user):
        # create_user fixture has status=pending_email, is_active=False
        response = api_client.post(
            self.URL,
            {"email": create_user.email, "password": "SecurePass123!"},
            format="json",
        )
        assert response.status_code == 400

    def test_login_suspended_user_blocked(self, api_client, active_user):
        active_user.suspend()
        response = api_client.post(
            self.URL,
            {"email": active_user.email, "password": "SecurePass123!"},
            format="json",
        )
        assert response.status_code == 400


# ── Email verification ───────────────────────────────────────────────────────

@pytest.mark.django_db
class TestEmailVerification:
    SEND_URL = "/api/v1/auth/verify-email/send/"
    VERIFY_URL = "/api/v1/auth/verify-email/"

    def test_correct_otp_activates_user(self, api_client, create_user):
        cache.set(f"email_otp:{create_user.email}", "123456", timeout=900)
        response = api_client.post(
            self.VERIFY_URL,
            {"email": create_user.email, "code": "123456"},
            format="json",
        )
        assert response.status_code == 200
        assert "access" in response.data
        create_user.refresh_from_db()
        assert create_user.status == UserStatus.ACTIVE

    def test_wrong_otp_returns_400(self, api_client, create_user):
        cache.set(f"email_otp:{create_user.email}", "123456", timeout=900)
        response = api_client.post(
            self.VERIFY_URL,
            {"email": create_user.email, "code": "000000"},
            format="json",
        )
        assert response.status_code == 400

    def test_missing_otp_returns_400(self, api_client, create_user):
        # No cache entry set — OTP expired/missing
        response = api_client.post(
            self.VERIFY_URL,
            {"email": create_user.email, "code": "123456"},
            format="json",
        )
        assert response.status_code == 400

    def test_unknown_email_resend_returns_200(self, api_client):
        response = api_client.post(
            self.SEND_URL,
            {"email": "nobody@example.com"},
            format="json",
        )
        # Must not leak whether email exists
        assert response.status_code == 200


# ── Current user view ────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestCurrentUserView:
    URL = "/api/v1/auth/me/"

    def test_me_returns_user_data(self, auth_client, active_user):
        response = auth_client.get(self.URL)
        assert response.status_code == 200
        assert response.data["email"] == active_user.email

    def test_me_unauthenticated_returns_401(self, api_client):
        response = api_client.get(self.URL)
        assert response.status_code == 401


# ── Profile endpoints ────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestProfileEndpoints:
    URL = "/api/v1/auth/profile/"

    def test_get_profile_auto_creates_if_missing(self, auth_client):
        response = auth_client.get(self.URL)
        assert response.status_code == 200

    def test_patch_profile_bio(self, auth_client):
        response = auth_client.patch(self.URL, {"bio": "Hello world"}, format="json")
        assert response.status_code == 200
        assert response.data["bio"] == "Hello world"

    def test_profile_unauthenticated_returns_401(self, api_client):
        response = api_client.get(self.URL)
        assert response.status_code == 401


# ── Admin user management ────────────────────────────────────────────────────

@pytest.mark.django_db
class TestAdminUserManagement:
    USERS_URL = "/api/v1/auth/users/"

    def test_admin_lists_users(self, admin_client):
        response = admin_client.get(self.USERS_URL)
        assert response.status_code == 200

    def test_non_admin_user_list_returns_403(self, auth_client):
        response = auth_client.get(self.USERS_URL)
        assert response.status_code == 403

    def test_admin_approve_user(self, admin_client, create_user):
        url = f"/api/v1/auth/users/{create_user.pk}/status/"
        response = admin_client.patch(url, {"status": "active"}, format="json")
        assert response.status_code == 200
        create_user.refresh_from_db()
        assert create_user.status == UserStatus.ACTIVE

    def test_admin_suspend_user(self, admin_client, active_user):
        url = f"/api/v1/auth/users/{active_user.pk}/status/"
        response = admin_client.patch(url, {"status": "suspended"}, format="json")
        assert response.status_code == 200
        active_user.refresh_from_db()
        assert active_user.status == UserStatus.SUSPENDED

    def test_admin_change_role(self, admin_client, active_user):
        url = f"/api/v1/auth/users/{active_user.pk}/role/"
        response = admin_client.patch(url, {"role": "researcher"}, format="json")
        assert response.status_code == 200
        active_user.refresh_from_db()
        assert active_user.role == UserRole.RESEARCHER


# ── Logout ───────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestLogout:
    URL = "/api/v1/auth/logout/"

    def test_logout_requires_auth(self, api_client):
        response = api_client.post(self.URL, {}, format="json")
        assert response.status_code == 401

    def test_logout_blacklists_refresh_token(self, auth_client, active_user):
        refresh = RefreshToken.for_user(active_user)
        response = auth_client.post(self.URL, {"refresh": str(refresh)}, format="json")
        assert response.status_code == 204
        # Second attempt with same token should fail
        response2 = auth_client.post(self.URL, {"refresh": str(refresh)}, format="json")
        assert response2.status_code == 400
