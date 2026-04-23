import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../backend"))

from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient


def test_health():
    with patch("gdrive.client.get_drive_service"), \
         patch("ai.claude.client"):
        from main import app
        client = TestClient(app)
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"


def test_approve_invalid_token():
    with patch("gdrive.client.get_drive_service"), \
         patch("ai.claude.client"):
        from main import app
        client = TestClient(app)
        response = client.get("/deploy/approve/badtoken123")
        assert response.status_code == 200
        assert "ไม่ถูกต้อง" in response.text
