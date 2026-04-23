import os
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
import io

SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]
CREDENTIALS_FILE = os.getenv("GOOGLE_CREDENTIALS_FILE", "credentials.json")
TOKEN_FILE = "token.json"


def get_drive_service():
    creds = None
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
            creds = flow.run_local_server(port=0)
        with open(TOKEN_FILE, "w") as f:
            f.write(creds.to_json())
    return build("drive", "v3", credentials=creds)


def list_files(page_size: int = 20) -> list[dict]:
    service = get_drive_service()
    results = (
        service.files()
        .list(
            pageSize=page_size,
            fields="files(id, name, mimeType, modifiedTime, size)",
            orderBy="modifiedTime desc",
        )
        .execute()
    )
    return results.get("files", [])


def read_file_content(file_id: str, mime_type: str) -> str:
    service = get_drive_service()

    # Google Docs → export as plain text
    export_types = {
        "application/vnd.google-apps.document": "text/plain",
        "application/vnd.google-apps.spreadsheet": "text/csv",
        "application/vnd.google-apps.presentation": "text/plain",
    }

    if mime_type in export_types:
        response = service.files().export(
            fileId=file_id, mimeType=export_types[mime_type]
        ).execute()
        return response.decode("utf-8") if isinstance(response, bytes) else response

    # Binary files → download
    request = service.files().get_media(fileId=file_id)
    buffer = io.BytesIO()
    downloader = MediaIoBaseDownload(buffer, request)
    done = False
    while not done:
        _, done = downloader.next_chunk()
    return buffer.getvalue().decode("utf-8", errors="ignore")


def search_files(query: str, page_size: int = 20) -> list[dict]:
    service = get_drive_service()
    results = (
        service.files()
        .list(
            q=f"name contains '{query}' and trashed=false",
            pageSize=page_size,
            fields="files(id, name, mimeType, modifiedTime)",
        )
        .execute()
    )
    return results.get("files", [])
