import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


@pytest.fixture
def user_data():
    return {
        "email": "test@example.com",
        "first_name": "Test",
        "last_name": "User",
        "password": "SecurePass123!",
    }


@pytest.fixture
def create_user(db, user_data):
    return User.objects.create_user(**user_data)


@pytest.fixture(autouse=True)
def fast_settings(settings):
    """Applied to every test: swap Redis → LocMem cache, disable external services."""
    settings.CACHES = {
        "default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}
    }
    settings.BREVO_API_KEY = ""
    settings.BRIQ_API_KEY = ""
    settings.SARUFI_API_KEY = ""
    settings.SARUFI_BOT_ID = ""
    settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
    # Clear cache between tests to prevent OTP/key leakage
    from django.core.cache import cache
    cache.clear()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def active_user(db):
    """ACTIVE user — can log in and access protected endpoints."""
    return User.objects.create_user(
        email="active@example.com",
        first_name="Active",
        last_name="User",
        password="SecurePass123!",
        status="active",
        is_active=True,
    )


@pytest.fixture
def admin_user(db):
    return User.objects.create_superuser(
        email="admin@example.com",
        password="AdminPass123!",
        first_name="Admin",
        last_name="User",
    )


@pytest.fixture
def auth_client(api_client, active_user):
    """APIClient pre-authenticated as active_user."""
    refresh = RefreshToken.for_user(active_user)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")
    return api_client


@pytest.fixture
def admin_client(api_client, admin_user):
    """APIClient pre-authenticated as admin_user."""
    refresh = RefreshToken.for_user(admin_user)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")
    return api_client
