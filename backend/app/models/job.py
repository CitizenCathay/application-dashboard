from __future__ import annotations

import json
from datetime import datetime, timezone

from sqlalchemy import String, Text, DateTime, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    company: Mapped[str] = mapped_column(String(200), nullable=False)
    role: Mapped[str] = mapped_column(String(300), nullable=False)
    location: Mapped[str | None] = mapped_column(String(200), nullable=True)
    salary: Mapped[str | None] = mapped_column(String(100), nullable=True)
    job_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    deadline: Mapped[str | None] = mapped_column(String(50), nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="Saved")

    status_changes: Mapped[list["StatusChange"]] = relationship(
        "StatusChange",
        back_populates="job",
        cascade="all, delete-orphan",
    )

    # Tech stack stored as JSON array string
    _tech_stack: Mapped[str | None] = mapped_column(
        "tech_stack", Text, nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    @property
    def tech_stack(self) -> list[str]:
        if not self._tech_stack:
            return []
        return json.loads(self._tech_stack)

    @tech_stack.setter
    def tech_stack(self, value: list[str]):
        self._tech_stack = json.dumps(value) if value else None


class StatusChange(Base):
    __tablename__ = "status_changes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    job_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("jobs.id", ondelete="CASCADE"),
        nullable=False,
    )

    from_status: Mapped[str | None] = mapped_column(String(20), nullable=True)
    to_status: Mapped[str] = mapped_column(String(20), nullable=False)

    changed_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    job: Mapped["Job"] = relationship(
        "Job",
        back_populates="status_changes",
    )