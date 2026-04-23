# Project Amico 🤖

> AI-powered Google Drive chat interface by SompenTech

## Overview
Project Amico ช่วยให้คุณ **chat กับไฟล์ใน Google Drive** โดยใช้ AI (Claude) เพื่อค้นหา สรุป และวิเคราะห์เอกสารได้ทันที

## Tech Stack
- **Backend:** Python (FastAPI)
- **AI:** Claude API (Anthropic)
- **Integration:** Google Drive API
- **Frontend:** TypeScript (Next.js)

## Project Structure
```
project-amico/
├── backend/          # FastAPI + Claude integration
│   ├── main.py
│   ├── gdrive/       # Google Drive connector
│   └── ai/           # Claude AI handler
├── frontend/         # Next.js UI
│   └── src/
├── docs/             # Documentation
└── tests/
```

## Getting Started
```bash
# Clone the repo
git clone https://github.com/sommossgl/Project-Amico.git

# Backend setup
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend setup
cd frontend
npm install
npm run dev
```

## Team
Built by **SompenTech** — AI Solutions & Applications

---
*Powered by Claude AI | Sprint-based Agile development*
