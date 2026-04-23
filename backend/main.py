import os
import secrets
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, RedirectResponse
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from gdrive.client import list_files, read_file_content, search_files
from ai.claude import chat_with_file, chat_with_files, summarize_file
from deploy.approval import (
    create_approval_request, send_approval_email,
    verify_approval, mark_approved,
)
from db import init_db, create_session, save_message, get_session_history, list_sessions
from logger import log_requests, logger
from middleware.rate_limit import rate_limit
from auth import get_auth_url, exchange_code, get_user

app = FastAPI(title="Project Amico API", version="0.3.0")
app.middleware("http")(log_requests)
app.middleware("http")(rate_limit)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

init_db()


# --- Auth helpers ---
def require_user(authorization: str = Header(default="")):
    token = authorization.replace("Bearer ", "")
    user = get_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return user


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


# --- Health ---
@app.get("/health")
def health():
    return {"status": "ok", "project": "Amico", "version": "0.3.0"}


# --- Auth ---
@app.get("/auth/login")
def login():
    state = secrets.token_urlsafe(16)
    return {"url": get_auth_url(state)}


@app.get("/auth/callback")
async def callback(code: str, state: str):
    result = await exchange_code(code)
    logger.info(f"User logged in: {result['user']['email']}")
    return result


@app.get("/auth/me")
def me(user: dict = None):
    return require_user()


# --- Google Drive ---
@app.get("/files")
def get_files():
    try:
        return {"files": list_files()}
    except Exception as e:
        logger.error(f"list_files error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/files/search")
def search(q: str):
    try:
        return {"files": search_files(q)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/files/{file_id}/summary")
def get_summary(file_id: str, file_name: str, mime_type: str):
    try:
        content = read_file_content(file_id, mime_type)
        return {"file_id": file_id, "file_name": file_name,
                "summary": summarize_file(content, file_name)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Single-file Chat ---
@app.post("/chat")
def chat(req: ChatRequest):
    session_id = req.session_id or create_session()
    try:
        content = read_file_content(req.file_id, req.mime_type)
        reply = chat_with_file(content, req.file_name, req.message)
        save_message(session_id, "user", req.message, req.file_id, req.file_name)
        save_message(session_id, "assistant", reply, req.file_id, req.file_name)
        return {"reply": reply, "file_name": req.file_name, "session_id": session_id}
    except Exception as e:
        logger.error(f"chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- Multi-file Chat ---
@app.post("/chat/multi")
def chat_multi(req: MultiChatRequest):
    session_id = req.session_id or create_session()
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- History ---
@app.post("/sessions")
def new_session():
    return {"session_id": create_session()}


@app.get("/sessions")
def sessions():
    return {"sessions": list_sessions()}


@app.get("/sessions/{session_id}/history")
def history(session_id: str):
    return {"messages": get_session_history(session_id)}


# --- Deploy Approval ---
@app.post("/deploy/request")
def request_deploy(req: DeployRequest):
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
