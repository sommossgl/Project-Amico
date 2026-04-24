"""Auth guard dependencies — for FastAPI routes."""
from fastapi import Header, HTTPException

from auth import get_user as get_session_user


def _extract(authorization: str) -> dict:
    token = (authorization or "").replace("Bearer ", "").strip()
    if not token:
        raise HTTPException(status_code=401, detail="Missing authorization token")
    user = get_session_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    return user


def require_user(authorization: str = Header(default="")) -> dict:
    return _extract(authorization)


def require_admin(authorization: str = Header(default="")) -> dict:
    user = _extract(authorization)
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user
