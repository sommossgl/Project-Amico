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


def _build_parent_query(folder_ids: list[str]) -> str:
    """'id in parents' — OR'd for multiple folder IDs."""
    if not folder_ids:
        return ""
    parts = [f"'{fid}' in parents" for fid in folder_ids]
    return "(" + " or ".join(parts) + ")"


def list_files(folder_ids: list[str] | None = None, page_size: int = 100) -> list[dict]:
    """List files — optionally restricted to specific parent folder IDs."""
    if folder_ids is not None and len(folder_ids) == 0:
        return []

    service = get_drive_service()
    q_parts = ["trashed=false"]
    if folder_ids:
        q_parts.append(_build_parent_query(folder_ids))
    query = " and ".join(q_parts)

    results = (
        service.files()
        .list(
            pageSize=page_size,
            fields="files(id, name, mimeType, modifiedTime, size, parents)",
            orderBy="modifiedTime desc",
            q=query,
            includeItemsFromAllDrives=True,
            supportsAllDrives=True,
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


def search_files(query: str, folder_ids: list[str] | None = None, page_size: int = 40) -> list[dict]:
    if folder_ids is not None and len(folder_ids) == 0:
        return []

    service = get_drive_service()
    q_parts = [f"name contains '{query}'", "trashed=false"]
    if folder_ids:
        q_parts.append(_build_parent_query(folder_ids))
    q = " and ".join(q_parts)

    results = (
        service.files()
        .list(
            q=q,
            pageSize=page_size,
            fields="files(id, name, mimeType, modifiedTime, parents)",
            includeItemsFromAllDrives=True,
            supportsAllDrives=True,
        )
        .execute()
    )
    return results.get("files", [])


def file_in_folders(file_id: str, folder_ids: list[str]) -> bool:
    """Check a specific file has any of its parents in folder_ids."""
    if not folder_ids:
        return False
    service = get_drive_service()
    try:
        meta = (
            service.files()
            .get(fileId=file_id, fields="parents", supportsAllDrives=True)
            .execute()
        )
    except Exception:
        return False
    parents = set(meta.get("parents", []))
    return bool(parents.intersection(set(folder_ids)))
