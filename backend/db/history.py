"""Chat session + message storage — backed by Supabase."""
from .supabase_client import get_supabase


def init_db() -> None:
    """No-op — tables are managed by Supabase schema.sql migration."""
    pass


def create_session(email: str | None = None) -> str:
    res = get_supabase().table("sessions").insert({"email": email}).execute()
    return res.data[0]["id"]


def save_message(
    session_id: str,
    role: str,
    content: str,
    file_id: str | None = None,
    file_name: str | None = None,
) -> str:
    res = (
        get_supabase()
        .table("messages")
        .insert(
            {
                "session_id": session_id,
                "role": role,
                "content": content,
                "file_id": file_id,
                "file_name": file_name,
            }
        )
        .execute()
    )
    return res.data[0]["id"]


def get_session_history(session_id: str) -> list[dict]:
    res = (
        get_supabase()
        .table("messages")
        .select("*")
        .eq("session_id", session_id)
        .order("created_at")
        .execute()
    )
    return res.data or []


def list_sessions(email: str | None = None) -> list[dict]:
    q = get_supabase().table("sessions").select("*").order("created_at", desc=True)
    if email:
        q = q.eq("email", email)
    res = q.execute()
    sessions = res.data or []
    if not sessions:
        return []

    session_ids = [s["id"] for s in sessions]
    msgs_res = (
        get_supabase()
        .table("messages")
        .select("session_id")
        .in_("session_id", session_ids)
        .execute()
    )
    counts: dict[str, int] = {}
    for m in msgs_res.data or []:
        counts[m["session_id"]] = counts.get(m["session_id"], 0) + 1

    return [
        {
            "id": s["id"],
            "created_at": s["created_at"],
            "message_count": counts.get(s["id"], 0),
        }
        for s in sessions
    ]
