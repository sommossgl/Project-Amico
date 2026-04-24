# Project Amico — CLAUDE.md

> Parent: /SompenTechLMT/BU1_Tech/CLAUDE.md | Company + BU1 hard rules apply

---

## Overview
| Field | Value |
|---|---|
| Project | Amico — AI-powered Google Drive chat |
| Type | B2B SaaS subscription |
| Owner BU | BU1 — Tech & IT |
| Status | In Development — Sprint 4 (multi-tenant demo) |
| Version | v0.4.0 |
| Backend | project-amico-api.onrender.com |

---

## Tech Stack
| Layer | Tech |
|---|---|
| Frontend | Next.js 14 + TailwindCSS (Vercel) |
| Backend | Python FastAPI (Render) |
| AI | Claude API (ดู Model Policy ด้านล่าง) |
| DB | SQLite (ชั่วคราว — จะย้าย Supabase) |
| Drive | Google Drive API v3 + Service Account |
| Auth | Google OAuth 2.0 (ยังไม่สมบูรณ์) |

---

## Model Policy (อ้างอิง company + BU1 policy)
| Model | ใช้ที่ไหนใน Amico |
|---|---|
| **claude-opus-4-7** | - Multi-file cross-document reasoning<br>- Deep document analysis เมื่อ user ต้อง insight ซับซ้อน<br>- Vision (OCR screenshot, PDF figures)<br>- Internal dev tools / code review |
| **claude-sonnet-4-6** | - Chat ปกติกับไฟล์ (production default)<br>- Summarize เอกสาร<br>- Multi-file chat ระดับพื้นฐาน<br>- Suggested questions |

> **Production default:** `claude-sonnet-4-6` — cost-sensitive (SaaS margin)
> **Upsell feature:** "Deep Analysis Mode" → switch เป็น `claude-opus-4-7` (Business/Enterprise plan เท่านั้น)
> ปัจจุบัน `backend/ai/claude.py` ใช้ `claude-sonnet-4-6` — ถูกต้องตาม policy

---

## Key Files
| Path | Purpose |
|---|---|
| `backend/main.py` | FastAPI app, routes |
| `backend/ai/claude.py` | Claude API integration — ต้องเลือก model ตาม Model Policy |
| `backend/gdrive/client.py` | Google Drive client |
| `backend/auth/google.py` | OAuth (incomplete) |
| `backend/db/history.py` | Session + message history (SQLite → Supabase) |
| `backend/deploy/approval.py` | Email approval flow → CEO |
| `backend/middleware/rate_limit.py` | 30 req/min/IP |
| `frontend/src/app/page.tsx` | Main chat UI |

---

## Active Sprint Focus (Sprint 4)
Critical path ก่อน pilot launch — see Notion GTM Report for details:
1. 🔴 **Multi-tenant foundation** (Org / Dept / User / Membership)
2. 🔴 **Supabase migration** (persistent storage)
3. 🔴 **Google OAuth** proper integration
4. 🔴 **Security** — remove service-account JSON from repo
5. 🟡 **Admin console** basic
6. 🟡 **Missing pages** — Settings, Drive, Reports

---

## Approval Gates (inherit from company)
- DESIGN → CEO approve ✋
- DEPLOY → QA sign-off → DevOps email → CEO approve ✋
- SECURITY issues → CEO only ✋

---

## Team (BU1 roster serving Amico)
Oat (Head) · Peter (PM) · Mijung (BA) · Steve (TL) · Cap (Dev) · Luiz (AI) · Kwuan (UX) · Somjai (QA) · First (DevOps)

---

## Action Attribution
ทุก action สำคัญต้องระบุคนทำ — ตาม company rule:
```
[<emoji> <Name> (<Role>, BU1)] — <กำลังทำอะไร>
```
ดูรายละเอียดใน company CLAUDE.md
