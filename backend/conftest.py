import pytest
from django.contrib.auth import get_user_model

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
