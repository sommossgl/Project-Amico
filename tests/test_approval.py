import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../backend"))

from deploy.approval import create_approval_request, verify_approval, mark_approved


def test_create_and_verify_approval():
    tasks = [{"name": "Deploy backend", "status": "done"}]
    token = create_approval_request(tasks, "Sprint 1")
    assert token is not None

    approval = verify_approval(token)
    assert approval is not None
    assert approval["sprint"] == "Sprint 1"
    assert approval["approved"] is False


def test_mark_approved():
    tasks = [{"name": "Deploy UI", "status": "done"}]
    token = create_approval_request(tasks, "Sprint 1")
    result = mark_approved(token)
    assert result is True

    approval = verify_approval(token)
    assert approval["approved"] is True


def test_invalid_token_returns_none():
    result = verify_approval("invalid-token-xyz")
    assert result is None
