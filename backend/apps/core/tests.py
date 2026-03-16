import pytest


@pytest.mark.django_db
class TestHealthCheck:
    URL = "/health/"

    def test_health_returns_200_with_ok_status(self, api_client):
        response = api_client.get(self.URL)
        assert response.status_code == 200
        assert response.json()["status"] == "ok"

    def test_health_response_has_database_key(self, api_client):
        response = api_client.get(self.URL)
        assert "database" in response.json()
        assert response.json()["database"] == "ok"
