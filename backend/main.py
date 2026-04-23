from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from gdrive.client import list_files, read_file_content
from ai.claude import chat_with_file, summarize_file
from deploy.approval import (
    create_approval_request,
    send_approval_email,
    verify_approval,
    mark_approved,
)

app = FastAPI(title="Project Amico API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    file_id: str
    file_name: str
    mime_type: str
    message: str


class DeployRequest(BaseModel):
    sprint: str
    tasks: list[dict]


# --- Health ---
@app.get("/health")
def health():
    return {"status": "ok", "project": "Amico"}


# --- Google Drive ---
@app.get("/files")
def get_files():
    """List files from Google Drive"""
    try:
        return {"files": list_files()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/files/{file_id}/summary")
def get_summary(file_id: str, file_name: str, mime_type: str):
    """Auto-summarize a Drive file using Claude"""
    try:
        content = read_file_content(file_id, mime_type)
        summary = summarize_file(content, file_name)
        return {"file_id": file_id, "file_name": file_name, "summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Chat ---
@app.post("/chat")
def chat(req: ChatRequest):
    """Chat with a Google Drive file using Claude"""
    try:
        content = read_file_content(req.file_id, req.mime_type)
        reply = chat_with_file(content, req.file_name, req.message)
        return {"reply": reply, "file_name": req.file_name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Deploy Approval ---
@app.post("/deploy/request")
def request_deploy(req: DeployRequest):
    """ส่ง approval email ก่อน deploy"""
    token = create_approval_request(req.tasks, req.sprint)
    send_approval_email(token, req.tasks, req.sprint)
    return {"message": "Approval email sent to meekeaw77@gmail.com", "token": token}


@app.get("/deploy/approve/{token}", response_class=HTMLResponse)
def approve_deploy(token: str):
    """CEO กดปุ่มใน email เพื่อ approve"""
    approval = verify_approval(token)
    if not approval:
        return "<div style='font-family:sans-serif;text-align:center;padding:60px'><h1 style='color:#dc2626'>❌ ลิงก์ไม่ถูกต้องหรือหมดอายุแล้ว</h1></div>"
    mark_approved(token)
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
