import sqlite3
import uuid
from datetime import datetime
from contextlib import contextmanager

DB_PATH = "data/amico.db"


@contextmanager
def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    import os
    os.makedirs("data", exist_ok=True)
    with get_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                created_at TEXT NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                file_id TEXT,
                file_name TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (session_id) REFERENCES sessions(id)
            )
        """)


def create_session() -> str:
    session_id = str(uuid.uuid4())
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO sessions VALUES (?, ?)",
            (session_id, datetime.utcnow().isoformat()),
        )
    return session_id


def save_message(session_id: str, role: str, content: str,
                 file_id: str = None, file_name: str = None) -> str:
    msg_id = str(uuid.uuid4())
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO messages VALUES (?, ?, ?, ?, ?, ?, ?)",
            (msg_id, session_id, role, content, file_id, file_name,
             datetime.utcnow().isoformat()),
        )
    return msg_id


def get_session_history(session_id: str) -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM messages WHERE session_id=? ORDER BY created_at",
            (session_id,),
        ).fetchall()
    return [dict(r) for r in rows]


def list_sessions() -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT s.id, s.created_at, COUNT(m.id) as message_count "
            "FROM sessions s LEFT JOIN messages m ON s.id=m.session_id "
            "GROUP BY s.id ORDER BY s.created_at DESC"
        ).fetchall()
    return [dict(r) for r in rows]
