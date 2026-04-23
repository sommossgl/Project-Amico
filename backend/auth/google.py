import os
import secrets
import httpx
from fastapi import HTTPException

CLIENT_ID = os.getenv("GOOGLE_OAUTH_CLIENT_ID", "")
CLIENT_SECRET = os.getenv("GOOGLE_OAUTH_CLIENT_SECRET", "")
REDIRECT_URI = os.getenv("GOOGLE_OAUTH_REDIRECT_URI", "http://localhost:3000/api/auth/callback")

_sessions: dict[str, dict] = {}


def get_auth_url(state: str) -> str:
    params = (
        f"client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}"
        f"&response_type=code&scope=openid%20email%20profile&state={state}"
    )
    return f"https://accounts.google.com/o/oauth2/v2/auth?{params}"


async def exchange_code(code: str) -> dict:
    async with httpx.AsyncClient() as client:
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
        user = user_res.json()

    session_token = secrets.token_urlsafe(32)
    _sessions[session_token] = {
        "email": user["email"],
        "name": user["name"],
        "picture": user.get("picture"),
    }
    return {"session_token": session_token, "user": _sessions[session_token]}


def get_user(session_token: str) -> dict | None:
    return _sessions.get(session_token)
