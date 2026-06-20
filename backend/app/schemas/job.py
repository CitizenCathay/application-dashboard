from datetime import datetime

from pydantic import BaseModel


VALID_STATUSES = {"Saved", "Applied", "OA", "Interview", "Offer", "Rejected"}


class JobCreate(BaseModel):
    company: str
    role: str
    location: str | None = None
    salary: str | None = None
    job_type: str | None = None
    deadline: str | None = None
    summary: str | None = None
    url: str | None = None
    notes: str | None = None
    status: str = "Saved"
    tech_stack: list[str] = []


class JobUpdate(BaseModel):
    company: str | None = None
    role: str | None = None
    location: str | None = None
    salary: str | None = None
    job_type: str | None = None
    deadline: str | None = None
    summary: str | None = None
    url: str | None = None
    notes: str | None = None
    status: str | None = None
    tech_stack: list[str] | None = None


class JobResponse(BaseModel):
    id: int
    company: str
    role: str
    location: str | None
    salary: str | None
    job_type: str | None
    deadline: str | None
    summary: str | None
    url: str | None
    notes: str | None
    status: str
    tech_stack: list[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EnrichRequest(BaseModel):
    """Raw text from a job posting for LLM extraction."""
    text: str


class EnrichResponse(BaseModel):
    company: str | None = None
    role: str | None = None
    location: str | None = None
    salary: str | None = None
    job_type: str | None = None
    deadline: str | None = None
    summary: str | None = None
    tech_stack: list[str] = []
