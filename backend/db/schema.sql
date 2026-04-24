-- Project Amico v0.4.0 — Supabase Schema
-- Run this in Supabase SQL Editor (once, on first setup)

-- ───── Users (whitelist) ─────
CREATE TABLE IF NOT EXISTS users (
  email TEXT PRIMARY KEY,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ───── User → Folder mapping ─────
CREATE TABLE IF NOT EXISTS user_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
  folder_id TEXT NOT NULL,
  folder_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(email, folder_id)
);

CREATE INDEX IF NOT EXISTS idx_user_folders_email ON user_folders(email);

-- ───── Chat sessions ─────
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT REFERENCES users(email) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_email ON sessions(email);

-- ───── Chat messages ─────
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  file_id TEXT,
  file_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id, created_at);

-- ───── Seed Data — 3 users + folder mappings ─────
INSERT INTO users (email, is_admin) VALUES
  ('meekeaw77@gmail.com', FALSE),
  ('somprasonkgbl1993@gmail.com', FALSE),
  ('somprasonk.g@themather.asia', TRUE)
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_folders (email, folder_id, folder_name) VALUES
  ('meekeaw77@gmail.com',            '1PItURpqOiHjF_Q7KTGViVCnmXO_5x6OK', 'Folder A'),
  ('somprasonkgbl1993@gmail.com',    '1Ks1i8jTSbLZDudiOgGa4MlHLkvzkrDCH', 'Folder B'),
  ('somprasonk.g@themather.asia',    '1PItURpqOiHjF_Q7KTGViVCnmXO_5x6OK', 'Folder A'),
  ('somprasonk.g@themather.asia',    '1Ks1i8jTSbLZDudiOgGa4MlHLkvzkrDCH', 'Folder B')
ON CONFLICT (email, folder_id) DO NOTHING;
