from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.job import Job, StatusChange
from app.schemas.job import (
    JobCreate,
    JobUpdate,
    JobResponse,
    EnrichRequest,
    EnrichResponse,
    VALID_STATUSES,
)
from app.services.enrichment import extract_job_details
from app.services.scraper import scrape_job_posting

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


# ── List / Search ────────────────────────────────────────────────
@router.get("/", response_model=list[JobResponse])
def list_jobs(
    status: str | None = Query(None),
    search: str | None = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Job)

    if status and status != "All":
        query = query.filter(Job.status == status)

    if search:
        pattern = f"%{search}%"
        query = query.filter(
            Job.company.ilike(pattern)
            | Job.role.ilike(pattern)
            | Job._tech_stack.ilike(pattern)
        )

    return query.order_by(Job.updated_at.desc()).all()


# ── Create ───────────────────────────────────────────────────────
@router.post("/", response_model=JobResponse, status_code=201)
def create_job(payload: JobCreate, db: Session = Depends(get_db)):
    if payload.status not in VALID_STATUSES:
        raise HTTPException(400, f"Invalid status. Must be one of: {VALID_STATUSES}")

    job = Job(
        company=payload.company,
        role=payload.role,
        location=payload.location,
        salary=payload.salary,
        job_type=payload.job_type,
        deadline=payload.deadline,
        summary=payload.summary,
        url=payload.url,
        notes=payload.notes,
        status=payload.status,
    )
    job.tech_stack = payload.tech_stack

    db.add(job)
    db.flush()

    if job.status != "Saved":
        db.add(
            StatusChange(
                job_id=job.id,
                from_status=None,
                to_status=job.status,
            )
        )

    db.commit()
    db.refresh(job)
    return job


# ── Status Transition Flow / Sankey ──────────────────────────────
@router.get("/status-transitions")
def get_status_transitions(db: Session = Depends(get_db)):
    rows = (
        db.query(
            StatusChange.from_status,
            StatusChange.to_status,
            func.count(StatusChange.id).label("value"),
        )
        .filter(StatusChange.to_status != "Saved")
        .group_by(StatusChange.from_status, StatusChange.to_status)
        .all()
    )

    return [
        {
            "source": row.from_status or "Applications",
            "target": row.to_status,
            "value": row.value,
        }
        for row in rows
    ]


# ── Read ─────────────────────────────────────────────────────────
@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    return job


# ── Update ───────────────────────────────────────────────────────
@router.patch("/{job_id}", response_model=JobResponse)
def update_job(job_id: int, payload: JobUpdate, db: Session = Depends(get_db)):
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(404, "Job not found")

    old_status = job.status

    update_data = payload.model_dump(exclude_unset=True)

    if "status" in update_data and update_data["status"] not in VALID_STATUSES:
        raise HTTPException(400, f"Invalid status. Must be one of: {VALID_STATUSES}")

    if "tech_stack" in update_data:
        job.tech_stack = update_data.pop("tech_stack")

    for field, value in update_data.items():
        setattr(job, field, value)

    if "status" in update_data:
        new_status = update_data["status"]

        if new_status != old_status:
            db.add(
                StatusChange(
                    job_id=job.id,
                    from_status=None if old_status == "Saved" else old_status,
                    to_status=new_status,
                )
            )

    db.commit()
    db.refresh(job)
    return job


# ── Delete ───────────────────────────────────────────────────────
@router.delete("/{job_id}", status_code=204)
def delete_job(job_id: int, db: Session = Depends(get_db)):
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    db.delete(job)
    db.commit()


# ── Enrich (LLM extraction) ─────────────────────────────────────
@router.post("/enrich", response_model=EnrichResponse)
async def enrich_job(payload: EnrichRequest):
    """Send raw job posting text to the LLM for field extraction."""
    result = await extract_job_details(payload.text)
    if not result:
        raise HTTPException(502, "Enrichment failed. Check your API key or try again.")
    return result


# ── Scrape + Enrich (URL) ───────────────────────────────────────
@router.post("/scrape", response_model=EnrichResponse)
async def scrape_and_enrich(url: str = Query(...)):
    """Scrape a job posting URL, then extract fields with the LLM."""
    text = await scrape_job_posting(url)
    if not text:
        raise HTTPException(502, "Failed to fetch that URL")

    result = await extract_job_details(text)
    if not result:
        raise HTTPException(502, "Enrichment failed after scraping")
    return result