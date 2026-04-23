from unittest.mock import MagicMock, patch
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../backend"))


def test_chat_with_file_returns_text():
    mock_response = MagicMock()
    mock_response.content = [MagicMock(text="ไฟล์นี้พูดถึงการขาย Q1")]

    with patch("ai.claude.client") as mock_client:
        mock_client.messages.create.return_value = mock_response
        from ai.claude import chat_with_file
        result = chat_with_file("เนื้อหาไฟล์", "report.docx", "สรุปให้หน่อย")
        assert result == "ไฟล์นี้พูดถึงการขาย Q1"
        mock_client.messages.create.assert_called_once()


def test_chat_passes_correct_model():
    mock_response = MagicMock()
    mock_response.content = [MagicMock(text="ok")]

    with patch("ai.claude.client") as mock_client:
        mock_client.messages.create.return_value = mock_response
        from ai.claude import chat_with_file, MODEL
        chat_with_file("content", "file.txt", "test")
        call_kwargs = mock_client.messages.create.call_args[1]
        assert call_kwargs["model"] == MODEL
