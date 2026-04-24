"""User + folder access management — backed by Supabase."""
from .supabase_client import get_supabase


# ───── Users ─────

def get_user(email: str) -> dict | None:
    res = get_supabase().table("users").select("*").eq("email", email).limit(1).execute()
    return res.data[0] if res.data else None


def list_users() -> list[dict]:
    res = get_supabase().table("users").select("*").order("created_at").execute()
    return res.data or []


def upsert_user(email: str, is_admin: bool = False) -> dict:
    res = get_supabase().table("users").upsert(
        {"email": email, "is_admin": is_admin},
        on_conflict="email",
    ).execute()
    return res.data[0] if res.data else {"email": email, "is_admin": is_admin}


def delete_user(email: str) -> None:
    get_supabase().table("users").delete().eq("email", email).execute()


def is_allowed(email: str) -> bool:
    return get_user(email) is not None


def is_admin(email: str) -> bool:
    u = get_user(email)
    return bool(u and u.get("is_admin"))


# ───── User-Folder mapping ─────

def user_folders(email: str) -> list[dict]:
    res = get_supabase().table("user_folders").select("*").eq("email", email).execute()
    return res.data or []


def user_folder_ids(email: str) -> list[str]:
    return [f["folder_id"] for f in user_folders(email)]


def all_folders() -> list[dict]:
    res = get_supabase().table("user_folders").select("*").order("email").execute()
    return res.data or []


def grant_folder(email: str, folder_id: str, folder_name: str) -> dict:
    res = get_supabase().table("user_folders").upsert(
        {"email": email, "folder_id": folder_id, "folder_name": folder_name},
        on_conflict="email,folder_id",
    ).execute()
    return res.data[0] if res.data else {}


def revoke_folder(email: str, folder_id: str) -> None:
    (
        get_supabase()
        .table("user_folders")
        .delete()
        .eq("email", email)
        .eq("folder_id", folder_id)
        .execute()
    )
