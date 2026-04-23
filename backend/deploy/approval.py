import secrets
import smtplib
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional
import os

# In-memory store (replace with Redis/DB in production)
_pending_approvals: dict[str, dict] = {}

APPROVE_EMAIL = "meekeaw77@gmail.com"
BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")


def create_approval_request(tasks: list[dict], sprint: str) -> str:
    token = secrets.token_urlsafe(32)
    _pending_approvals[token] = {
        "tasks": tasks,
        "sprint": sprint,
        "created_at": datetime.utcnow().isoformat(),
        "expires_at": (datetime.utcnow() + timedelta(hours=24)).isoformat(),
        "approved": False,
    }
    return token


def verify_approval(token: str) -> Optional[dict]:
    approval = _pending_approvals.get(token)
    if not approval:
        return None
    if datetime.utcnow() > datetime.fromisoformat(approval["expires_at"]):
        return None
    return approval


def mark_approved(token: str) -> bool:
    if token in _pending_approvals:
        _pending_approvals[token]["approved"] = True
        return True
    return False


def send_approval_email(token: str, tasks: list[dict], sprint: str) -> bool:
    approve_url = f"{BASE_URL}/deploy/approve/{token}"

    task_rows = "".join(
        f"<tr><td style='padding:8px;border-bottom:1px solid #eee'>{t['name']}</td>"
        f"<td style='padding:8px;border-bottom:1px solid #eee;color:#16a34a'>✅ {t['status']}</td></tr>"
        for t in tasks
    )

    html = f"""
    <div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#1e40af">🚀 Project Amico — ขอ Approve การ Deploy</h2>
      <p><strong>Sprint:</strong> {sprint}</p>
      <p>งานต่อไปนี้เสร็จสมบูรณ์และพร้อม deploy:</p>
      <table style="width:100%;border-collapse:collapse">
        <tr style="background:#f1f5f9">
          <th style="padding:8px;text-align:left">งาน</th>
          <th style="padding:8px;text-align:left">สถานะ</th>
        </tr>
        {task_rows}
      </table>
      <br>
      <a href="{approve_url}"
         style="background:#16a34a;color:white;padding:14px 28px;border-radius:8px;
                text-decoration:none;font-size:16px;font-weight:bold;display:inline-block">
        ✅ Approve &amp; Deploy
      </a>
      <p style="color:#6b7280;font-size:12px;margin-top:24px">
        ลิงก์นี้หมดอายุใน 24 ชั่วโมง · ส่งโดย SompenTech CI/CD
      </p>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"[Project Amico] ขอ Approve Deploy — {sprint}"
    msg["From"] = SMTP_USER
    msg["To"] = APPROVE_EMAIL
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_USER, APPROVE_EMAIL, msg.as_string())

    return True
