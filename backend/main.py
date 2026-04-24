import os
import secrets
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from gdrive.client import list_files, read_file_content, search_files, file_in_folders
from ai.claude import chat_with_file, chat_with_files, summarize_file
from deploy.approval import (
    create_approval_request, send_approval_email,
    verify_approval, mark_approved,
)
from db import init_db, create_session, save_message, get_session_history, list_sessions, access
from logger import log_requests, logger
from middleware.rate_limit import rate_limit
from middleware.auth_guard import require_user, require_admin
from auth import get_auth_url, exchange_code, logout as logout_session

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

app = FastAPI(title="Project Amico API", version="0.4.0")
app.middleware("http")(log_requests)
app.middleware("http")(rate_limit)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()


# ───── Pydantic models ─────

class ChatRequest(BaseModel):
    file_id: str
    file_name: str
    mime_type: str
    message: str
    session_id: str | None = None


class MultiChatRequest(BaseModel):
    files: list[dict]
    message: str
    session_id: str | None = None


class DeployRequest(BaseModel):
    sprint: str
    tasks: list[dict]


class UserUpsertRequest(BaseModel):
    email: str
    is_admin: bool = False


class GrantFolderRequest(BaseModel):
    email: str
    folder_id: str
    folder_name: str


# ───── Health ─────

@app.get("/health")
def health():
    return {"status": "ok", "project": "Amico", "version": "0.4.0"}


# ───── Auth ─────

@app.get("/auth/login")
def login():
    state = secrets.token_urlsafe(16)
    return {"url": get_auth_url(state)}


@app.get("/auth/callback")
async def callback(code: str, state: str | None = None):
    result = await exchange_code(code)
    logger.info(f"Login success: {result['user']['email']}")
    return result


@app.get("/auth/me")
def me(user: dict = Depends(require_user)):
    return user


@app.post("/auth/logout")
def do_logout(authorization: str = Header(default="")):
    token = (authorization or "").replace("Bearer ", "").strip()
    if token:
        logout_session(token)
    return {"ok": True}


# ───── Drive files (user-scoped) ─────

@app.get("/files")
def get_files(user: dict = Depends(require_user)):
    folder_ids = access.user_folder_ids(user["email"])
    try:
        files = list_files(folder_ids=folder_ids)
        folders = access.user_folders(user["email"])
        return {
            "files": files,
            "accessible_folders": [
                {"folder_id": f["folder_id"], "folder_name": f["folder_name"]}
                for f in folders
            ],
        }
    except Exception as e:
        logger.error(f"list_files error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/files/search")
def search(q: str, user: dict = Depends(require_user)):
    folder_ids = access.user_folder_ids(user["email"])
    try:
        return {"files": search_files(q, folder_ids=folder_ids)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/files/{file_id}/summary")
def get_summary(file_id: str, file_name: str, mime_type: str, user: dict = Depends(require_user)):
    _assert_file_access(user["email"], file_id)
    try:
        content = read_file_content(file_id, mime_type)
        return {"file_id": file_id, "file_name": file_name,
                "summary": summarize_file(content, file_name)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _assert_file_access(email: str, file_id: str) -> None:
    folder_ids = access.user_folder_ids(email)
    if not folder_ids or not file_in_folders(file_id, folder_ids):
        raise HTTPException(status_code=403, detail="คุณไม่มีสิทธิ์เข้าถึงไฟล์นี้")


# ───── Chat ─────

@app.post("/chat")
def chat(req: ChatRequest, user: dict = Depends(require_user)):
    _assert_file_access(user["email"], req.file_id)
    session_id = req.session_id or create_session(email=user["email"])
    try:
        content = read_file_content(req.file_id, req.mime_type)
        reply = chat_with_file(content, req.file_name, req.message)
        save_message(session_id, "user", req.message, req.file_id, req.file_name)
        save_message(session_id, "assistant", reply, req.file_id, req.file_name)
        return {"reply": reply, "file_name": req.file_name, "session_id": session_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat/multi")
def chat_multi(req: MultiChatRequest, user: dict = Depends(require_user)):
    for f in req.files:
        _assert_file_access(user["email"], f["id"])
    session_id = req.session_id or create_session(email=user["email"])
    try:
        docs = [
            {"name": f["name"], "content": read_file_content(f["id"], f["mimeType"])}
            for f in req.files
        ]
        reply = chat_with_files(docs, req.message)
        save_message(session_id, "user", req.message)
        save_message(session_id, "assistant", reply)
        return {"reply": reply, "session_id": session_id,
                "files": [f["name"] for f in req.files]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ───── Sessions ─────

@app.post("/sessions")
def new_session(user: dict = Depends(require_user)):
    return {"session_id": create_session(email=user["email"])}


@app.get("/sessions")
def sessions(user: dict = Depends(require_user)):
    return {"sessions": list_sessions(email=user["email"])}


@app.get("/sessions/{session_id}/history")
def history(session_id: str, user: dict = Depends(require_user)):
    return {"messages": get_session_history(session_id)}


# ───── Settings (admin only) ─────

@app.get("/settings/users")
def settings_list_users(admin: dict = Depends(require_admin)):
    return {"users": access.list_users()}


@app.post("/settings/users")
def settings_upsert_user(req: UserUpsertRequest, admin: dict = Depends(require_admin)):
    user = access.upsert_user(req.email.lower().strip(), req.is_admin)
    return {"ok": True, "user": user}


@app.delete("/settings/users/{email}")
def settings_delete_user(email: str, admin: dict = Depends(require_admin)):
    if email.lower() == admin["email"].lower():
        raise HTTPException(status_code=400, detail="ลบตัวเองไม่ได้")
    access.delete_user(email.lower())
    return {"ok": True}


@app.get("/settings/folders")
def settings_list_all_folders(admin: dict = Depends(require_admin)):
    return {"folders": access.all_folders()}


@app.get("/settings/folders/{email}")
def settings_user_folders(email: str, admin: dict = Depends(require_admin)):
    return {"folders": access.user_folders(email.lower())}


@app.post("/settings/folders")
def settings_grant(req: GrantFolderRequest, admin: dict = Depends(require_admin)):
    mapping = access.grant_folder(req.email.lower().strip(), req.folder_id.strip(), req.folder_name.strip())
    return {"ok": True, "mapping": mapping}


@app.delete("/settings/folders")
def settings_revoke(email: str, folder_id: str, admin: dict = Depends(require_admin)):
    access.revoke_folder(email.lower(), folder_id)
    return {"ok": True}


# ───── Deploy Approval ─────

@app.post("/deploy/request")
def request_deploy(req: DeployRequest, admin: dict = Depends(require_admin)):
    token = create_approval_request(req.tasks, req.sprint)
    send_approval_email(token, req.tasks, req.sprint)
    return {"message": "Approval email sent to meekeaw77@gmail.com", "token": token}


@app.get("/deploy/approve/{token}", response_class=HTMLResponse)
def approve_deploy(token: str):
    approval = verify_approval(token)
    if not approval:
        return "<div style='font-family:sans-serif;text-align:center;padding:60px'><h1 style='color:#dc2626'>❌ ลิงก์ไม่ถูกต้องหรือหมดอายุแล้ว</h1></div>"
    mark_approved(token)
    logger.info(f"Deploy approved — token {token[:8]}...")
    return """
    <div style='font-family:sans-serif;text-align:center;padding:60px'>
      <h1 style='color:#16a34a'>✅ Approved!</h1>
      <p style='font-size:18px'>การ deploy ได้รับการยืนยันแล้ว — SompenTech CI/CD กำลังดำเนินการ</p>
    </div>
    """


@app.get("/deploy/status/{token}")
def deploy_status(token: str):
    approval = verify_approval(token)
    if not approval:
        return {"status": "invalid_or_expired"}
    return {"status": "approved" if approval["approved"] else "pending", **approval}
