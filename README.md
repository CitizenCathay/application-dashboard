# Application Dashboard

A job application tracker with LLM-powered auto-enrichment. Paste a job posting, and Application Dashboard extracts company, role, tech stack, salary, and deadlines automatically.

## Features

- **Auto-enrichment**: Paste job posting text and an LLM extracts structured fields
- **Kanban board**: Track jobs through Saved, Applied, OA, Interview, Offer, Rejected
- **Search and filter**: Find jobs by company, role, or tech stack
- **Notes**: Track interview prep, contacts, and follow-ups per application

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Python + FastAPI + SQLAlchemy
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **LLM**: Anthropic Claude API for field extraction

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env       # add your Anthropic API key
uvicorn app.main:app --reload
```

API at `http://localhost:8000` with docs at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## License

MIT
