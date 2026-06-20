import json
import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You extract structured data from job postings and return it as JSON.

Return ONLY a valid JSON object with these exact keys, no markdown fences or extra text:
- company: the hiring company name
- role: the job title
- location: city/state/country, or null if not stated
- salary: the pay range if stated, or null
- tech_stack: array of programming languages, frameworks, and tools mentioned (empty array if none)
- deadline: application deadline if stated, or null
- job_type: one of "Full-time", "Part-time", "Internship", or "Contract"
- summary: YOU write a fresh 1-2 sentence description of what this role involves, based on the posting. Do not copy this instruction text.

Example of a good summary value: "Backend engineering role focused on building payment infrastructure and scaling transaction systems for a fintech platform."

Output only the JSON object."""


async def extract_job_details(text: str):
    """Call Ollama's local API to extract structured fields from job posting text."""
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{settings.ollama_url}/api/chat",
                json={
                    "model": settings.ollama_model,
                    "stream": False,
                    "format": "json",
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": text},
                    ],
                },
            )
            response.raise_for_status()

        data = response.json()
        raw = data.get("message", {}).get("content", "")
        cleaned = raw.strip().removeprefix("```json").removesuffix("```").strip()
        parsed = json.loads(cleaned)

        # Guard against the model echoing the instruction text
        summary = parsed.get("summary")
        if summary and "1-2 sentence" in summary.lower():
            summary = None

        from app.schemas.job import EnrichResponse

        return EnrichResponse(
            company=parsed.get("company"),
            role=parsed.get("role"),
            location=parsed.get("location"),
            salary=parsed.get("salary"),
            job_type=parsed.get("job_type"),
            deadline=parsed.get("deadline"),
            summary=summary,
            tech_stack=parsed.get("tech_stack") or [],
        )
    except httpx.ConnectError:
        logger.error("Cannot connect to Ollama. Is it running? Start it with: ollama serve")
        return None
    except json.JSONDecodeError as e:
        logger.error(f"Ollama returned invalid JSON: {e}")
        return None
    except Exception:
        logger.exception("Ollama enrichment failed")
        return None