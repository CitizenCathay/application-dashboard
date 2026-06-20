"""Basic tests for the jobs CRUD API.

Run with: pytest app/tests/ -v
"""
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app

# Use an in-memory SQLite database for tests
TEST_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def setup_module():
    Base.metadata.create_all(bind=engine)


def teardown_module():
    Base.metadata.drop_all(bind=engine)


def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_create_and_list_job():
    payload = {
        "company": "TestCorp",
        "role": "SWE Intern",
        "tech_stack": ["Python", "FastAPI"],
        "status": "Saved",
    }
    resp = client.post("/api/jobs/", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["company"] == "TestCorp"
    assert data["tech_stack"] == ["Python", "FastAPI"]
    assert "id" in data

    # List should include it
    resp = client.get("/api/jobs/")
    assert resp.status_code == 200
    assert any(j["company"] == "TestCorp" for j in resp.json())


def test_update_job():
    # Create first
    resp = client.post("/api/jobs/", json={"company": "UpdateCo", "role": "Dev"})
    job_id = resp.json()["id"]

    # Update status
    resp = client.patch(f"/api/jobs/{job_id}", json={"status": "Applied"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "Applied"


def test_delete_job():
    resp = client.post("/api/jobs/", json={"company": "DeleteMe", "role": "QA"})
    job_id = resp.json()["id"]

    resp = client.delete(f"/api/jobs/{job_id}")
    assert resp.status_code == 204

    resp = client.get(f"/api/jobs/{job_id}")
    assert resp.status_code == 404


def test_invalid_status():
    resp = client.post(
        "/api/jobs/",
        json={"company": "Bad", "role": "Dev", "status": "NotAStatus"},
    )
    assert resp.status_code == 400
