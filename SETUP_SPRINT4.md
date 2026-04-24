# Amico v0.4.0 — Sprint 4 Setup Guide

> จัดทำโดย สมหมาย (EA) — 24 เมษายน 2026

---

## ⚡ สรุปสิ่งที่เปลี่ยน

**Sprint 4 เพิ่ม:**
- 🔐 Google OAuth login + email whitelist (3 emails)
- 📁 Folder-based access control (แต่ละ user เห็นเฉพาะ folder ที่ตนมีสิทธิ์)
- ⚙️ Settings page (admin เท่านั้น) — เพิ่ม/ลบ user, จัดการ folder mapping
- 🗄 Supabase (แทน SQLite — chat history ไม่หายอีก)
- 🛡 Security — service account JSON ย้ายจาก file → env var

---

## 📝 Setup Checklist — ทำตามลำดับ

### 1. สร้าง Supabase project (ฟรี)

1. ไป https://supabase.com → "New project"
2. Name: `amico-prod` | Region: **Singapore** | Plan: **Free**
3. ตั้ง database password (จดไว้)
4. รอ provision ~2 นาที

### 2. รัน Schema + Seed data

1. ใน Supabase: **SQL Editor → New query**
2. Copy ไฟล์ `backend/db/schema.sql` ทั้งหมด → paste → **Run**
3. ตรวจใน **Table Editor**: ต้องมี 4 tables — `users`, `user_folders`, `sessions`, `messages`
4. ดู seed data: `users` ต้องมี 3 แถว, `user_folders` ต้องมี 4 แถว

### 3. เอา Credentials จาก Supabase

1. **Settings → API**
2. Copy:
   - **Project URL** (เช่น `https://xxxxx.supabase.co`)
   - **service_role key** (ไม่ใช่ anon key)

### 4. Set Env Vars ใน Render

ไปที่ Render Dashboard → project-amico-api → **Environment** → เพิ่ม:

```
SUPABASE_URL=<Project URL>
SUPABASE_SERVICE_KEY=<service_role key>
GOOGLE_SERVICE_ACCOUNT_JSON=<paste JSON ทั้งไฟล์>
FRONTEND_URL=<URL ของ Vercel>
```

**สำหรับ GOOGLE_SERVICE_ACCOUNT_JSON:**
- เปิดไฟล์ `backend/rugged-future-*.json`
- Copy เนื้อหาทั้งหมด paste ลงใน env var value
- บันทึก

### 5. Google OAuth Setup (ถ้ายังไม่ทำ)

1. ไป https://console.cloud.google.com
2. เลือก project ที่ใช้กับ Amico
3. **APIs & Services → Credentials**
4. ถ้ายังไม่มี OAuth Client ID → **+ Create Credentials → OAuth client ID**
   - Type: **Web application**
   - Authorized JavaScript origins: `http://localhost:3000`, `<Vercel URL>`
   - Authorized redirect URIs: `http://localhost:3000/auth/callback`, `<Vercel URL>/auth/callback`
5. Copy **Client ID** และ **Client secret**
6. Set ใน Render Environment:
   ```
   GOOGLE_OAUTH_CLIENT_ID=<client id>
   GOOGLE_OAUTH_CLIENT_SECRET=<client secret>
   GOOGLE_OAUTH_REDIRECT_URI=<Vercel URL>/auth/callback
   ```

### 6. Share Folders กับ Service Account

Service Account email อยู่ในไฟล์ `rugged-future-*.json` — field `client_email`
(เช่น `amico-drive@rugged-future-xxxxx.iam.gserviceaccount.com`)

1. เปิด Google Drive
2. Click ขวาที่ Folder A → Share → paste service account email → Viewer
3. ทำเหมือนกันกับ Folder B

### 7. Deploy

**Backend (Render):**
```bash
git push origin main
# Render auto-deploy เมื่อมี push
```

**Frontend (Vercel):**
- Environment variable: `NEXT_PUBLIC_API_URL=<Render backend URL>`
- Push code → Vercel auto-deploy

---

## 🧪 Test Flow หลัง Deploy

1. เปิดหน้าเว็บ → redirect ไป `/login`
2. Click **Sign in with Google**
3. Login ด้วย `meekeaw77@gmail.com` → เห็นเฉพาะ Folder A files
4. Logout → Login ด้วย `somprasonkgbl1993@gmail.com` → เห็นเฉพาะ Folder B files
5. Logout → Login ด้วย `somprasonk.g@themather.asia` → เห็นทั้ง A+B + มีเมนู **ตั้งค่า (Admin)**
6. เข้า Settings → CRUD users / folder mapping ได้

---

## 👥 Email ↔ Folder Mapping (seed)

| Email | Folders | Admin |
|---|---|---|
| meekeaw77@gmail.com | Folder A | ❌ |
| somprasonkgbl1993@gmail.com | Folder B | ❌ |
| somprasonk.g@themather.asia | Folder A + B | ✅ |

เปลี่ยนได้ผ่าน Settings page (admin เท่านั้น)

---

## 📞 ถ้าติดปัญหา

ติดต่อทีม BU1 (Oat + Steve + First) หรือถามสมหมาย
