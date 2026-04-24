"""Google OAuth 2.0 — with email whitelist check against users table."""
import os
import secrets
import httpx
from fastapi import HTTPException

from db import access

CLIENT_ID = os.getenv("GOOGLE_OAUTH_CLIENT_ID", "")
CLIENT_SECRET = os.getenv("GOOGLE_OAUTH_CLIENT_SECRET", "")
REDIRECT_URI = os.getenv(
    "GOOGLE_OAUTH_REDIRECT_URI",
    "http://localhost:3000/auth/callback",
)

# in-memory session store (OK for demo — resets on restart, user just logs in again)
_sessions: dict[str, dict] = {}


def get_auth_url(state: str) -> str:
    params = (
        f"client_id={CLIENT_ID}"
        f"&redirect_uri={REDIRECT_URI}"
        f"&response_type=code"
        f"&scope=openid%20email%20profile"
        f"&state={state}"
        f"&access_type=online"
        f"&prompt=select_account"
    )
    return f"https://accounts.google.com/o/oauth2/v2/auth?{params}"


async def exchange_code(code: str) -> dict:
    async with httpx.AsyncClient(timeout=15) as client:
        token_res = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
                "redirect_uri": REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )
        tokens = token_res.json()
        if "error" in tokens:
            raise HTTPException(status_code=400, detail=tokens["error"])

        user_res = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
        )
        profile = user_res.json()

    email = profile.get("email", "").lower()
    if not email:
        raise HTTPException(status_code=400, detail="No email in Google profile")

    # ── Whitelist check ─────────────────────────
    db_user = access.get_user(email)
    if not db_user:
        raise HTTPException(
            status_code=403,
            detail=f"อีเมล {email} ไม่มีสิทธิ์เข้าใช้งาน Amico — โปรดติดต่อ admin",
        )

    session_token = secrets.token_urlsafe(32)
    _sessions[session_token] = {
        "email": email,
        "name": profile.get("name", ""),
        "picture": profile.get("picture"),
        "is_admin": bool(db_user.get("is_admin")),
    }
    return {"session_token": session_token, "user": _sessions[session_token]}


def get_user(session_token: str) -> dict | None:
    return _sessions.get(session_token)


def logout(session_token: str) -> None:
    _sessions.pop(session_token, None)
