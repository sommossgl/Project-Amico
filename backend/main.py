from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Project Amico API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok", "project": "Amico"}


from deploy.approval import (
    create_approval_request,
    send_approval_email,
    verify_approval,
    mark_approved,
)
from fastapi.responses import HTMLResponse


@app.post("/deploy/request")
def request_deploy(sprint: str, tasks: list[dict]):
    """Pre-deploy: สร้าง approval token และส่ง email ให้ CEO"""
    token = create_approval_request(tasks, sprint)
    send_approval_email(token, tasks, sprint)
    return {"message": "Approval email sent", "token": token}


@app.get("/deploy/approve/{token}", response_class=HTMLResponse)
def approve_deploy(token: str):
    """CEO กดลิงก์ใน email เพื่อ approve การ deploy"""
    approval = verify_approval(token)
    if not approval:
        return "<h2>❌ ลิงก์ไม่ถูกต้องหรือหมดอายุแล้ว</h2>"
    mark_approved(token)
    # TODO: trigger actual deployment pipeline here
    return """
    <div style='font-family:sans-serif;text-align:center;padding:60px'>
      <h1 style='color:#16a34a'>✅ Approved!</h1>
      <p>การ deploy ได้รับการยืนยันแล้ว — SompenTech CI/CD กำลังดำเนินการ</p>
    </div>
    """


@app.get("/deploy/status/{token}")
def deploy_status(token: str):
    """ตรวจสอบสถานะ approval"""
    approval = verify_approval(token)
    if not approval:
        return {"status": "invalid_or_expired"}
    return {"status": "approved" if approval["approved"] else "pending", **approval}
