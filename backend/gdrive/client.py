import io
import json
import os

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]


def get_drive_service():
    sa_json = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
    if sa_json:
        info = json.loads(sa_json)
    else:
        creds_file = os.getenv("GOOGLE_CREDENTIALS_FILE", "service-account.json")
        with open(creds_file) as f:
            info = json.load(f)
    creds = service_account.Credentials.from_service_account_info(info, scopes=SCOPES)
    return build("drive", "v3", credentials=creds)


def list_files(page_size: int = 50) -> list[dict]:
    service = get_drive_service()
    results = (
        service.files()
        .list(
            pageSize=page_size,
            fields="files(id, name, mimeType, modifiedTime, size)",
            orderBy="modifiedTime desc",
            q="trashed=false",
        )
        .execute()
    )
    return results.get("files", [])


def read_file_content(file_id: str, mime_type: str) -> str:
    service = get_drive_service()

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
