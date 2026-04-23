import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../backend"))

from unittest.mock import MagicMock, patch
from db.history import init_db, create_session, save_message, get_session_history


def test_session_and_history():
    os.makedirs("data", exist_ok=True)
    init_db()
    session_id = create_session()
    assert session_id is not None

    save_message(session_id, "user", "สวัสดี", "file1", "test.docx")
    save_message(session_id, "assistant", "สวัสดีครับ คุณต้องการอะไร")

    history = get_session_history(session_id)
    assert len(history) == 2
    assert history[0]["role"] == "user"
    assert history[1]["role"] == "assistant"


def test_multi_file_chat():
    mock_response = MagicMock()
    mock_response.content = [MagicMock(text="สรุปจาก 2 ไฟล์: ยอดขายเพิ่มขึ้น 20%")]

    with patch("ai.claude.client") as mock_client:
        mock_client.messages.create.return_value = mock_response
        from ai.claude import chat_with_files
        docs = [
            {"name": "q1.xlsx", "content": "ยอดขาย Q1: 1M"},
            {"name": "q2.xlsx", "content": "ยอดขาย Q2: 1.2M"},
        ]
        result = chat_with_files(docs, "เปรียบเทียบยอดขาย Q1 vs Q2")
        assert "20%" in result
