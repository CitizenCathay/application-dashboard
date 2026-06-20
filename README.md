# Application Dashboard

A job application tracker with LLM-powered auto-enrichment. Paste a job posting and Application Dashboard automatically extracts the company, role, tech stack, salary, and deadlines — no manual data entry needed.

## Features

- **AI auto-enrichment**: Paste job posting text or a URL and a local LLM (Llama 3.2 via Ollama) extracts structured fields automatically
- **Status tracking**: Move applications through Saved, Applied, OA, Interview, Offer, and Rejected stages
- **Search and filter**: Find jobs by company, role, or tech stack instantly
- **Edit postings**: Update any field after saving
- **Notes**: Track interview prep, contacts, and follow-ups per application
- **GPU acceleration**: Automatically uses your NVIDIA GPU if available for faster inference, falls back to CPU otherwise
- **Fully local**: No cloud API keys required — the LLM runs on your own machine via Ollama

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Python + FastAPI + SQLAlchemy
- **Database**: SQLite
- **LLM**: Llama 3.2 running locally via Ollama (no API key needed)
- **Containerization**: Docker Compose (one command runs everything)

## Quick Start

The only prerequisite is [Docker](https://docs.docker.com/get-docker/).

```bash
git clone https://github.com/CitizenCathay/application-dashboard
cd application-dashboard
./setup.sh
```

Then open `http://localhost:5173`.

The setup script handles everything: detecting your GPU, installing the NVIDIA Container Toolkit if needed, pulling the Llama 3.2 model (~2GB, one-time download), and launching all three services (Ollama, backend, frontend).

> **Note:** The first run takes a few minutes while Docker downloads the Ollama image and the Llama 3.2 model. Subsequent runs start in seconds.

## How It Works

When you add a job, you can paste raw job posting text or a URL. The frontend sends it to the FastAPI backend, which scrapes the URL if needed and passes the text to Ollama running Llama 3.2 locally. The model returns structured JSON (company, role, location, salary, tech stack, deadline, summary), which gets stored in SQLite and displayed in the UI.

```
Browser → FastAPI → Ollama (Llama 3.2) → structured fields → SQLite
```

All inference happens on your machine. No data is sent to any external API.

## Project Structure

```
application-dashboard/
├── setup.sh                  # One-click setup with GPU auto-detection
├── docker-compose.yml        # Orchestrates Ollama, backend, and frontend
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app
│   │   ├── models/job.py     # SQLAlchemy ORM model
│   │   ├── schemas/job.py    # Pydantic request/response schemas
│   │   ├── routers/jobs.py   # CRUD + enrichment endpoints
│   │   └── services/
│   │       ├── enrichment.py # Ollama LLM extraction
│   │       └── scraper.py    # URL scraping
│   └── requirements.txt
└── frontend/
    └── src/
        ├── App.tsx            # Main UI
        ├── api/client.ts      # Typed API wrapper
        ├── hooks/useJobs.ts   # Data fetching and mutations
        └── types/index.ts     # TypeScript types
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jobs/` | List all jobs (supports `?status=` and `?search=` filters) |
| POST | `/api/jobs/` | Create a job |
| PATCH | `/api/jobs/{id}` | Update a job |
| DELETE | `/api/jobs/{id}` | Delete a job |
| POST | `/api/jobs/enrich` | Extract fields from job posting text via LLM |
| POST | `/api/jobs/scrape` | Scrape a URL and extract fields via LLM |

Interactive API docs available at `http://localhost:8000/docs` when running.

## GPU Acceleration

The `setup.sh` script automatically detects an NVIDIA GPU and installs the NVIDIA Container Toolkit so Ollama can use it inside Docker. On a GPU the model runs significantly faster (2-5 seconds per extraction vs 20-40 seconds on CPU).

To enable GPU manually, uncomment the `deploy` block in `docker-compose.yml` after installing the toolkit:

```yaml
deploy:
  resources:
    reservations:
      devices:
        - driver: nvidia
          count: all
          capabilities: [gpu]
```

## Known Limitations

- **URL scraping**: Sites that render content via JavaScript (LinkedIn, Workday, Jobstreet) block the scraper. For those, copy and paste the job description text directly instead of the URL. Greenhouse and Ashby job boards work reliably.
- **No stage history**: The application funnel reflects current status only, not the full history of stage transitions. A future version will log each status change with a timestamp for accurate funnel analytics.
- **Local only**: There is no hosted version. Your data lives in a local SQLite file and never leaves your machine.

## License

MIT