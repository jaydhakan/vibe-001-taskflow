"""Shared test fixtures — isolates every test with tmp_path."""

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app


@pytest.fixture(autouse=True)
def _isolate_data(tmp_path):
    """Point DATA_FILE at a temp directory before each test."""
    original = settings.DATA_FILE
    settings.DATA_FILE = str(tmp_path / "tasks.json")
    yield
    settings.DATA_FILE = original


@pytest.fixture
def client():
    """Synchronous TestClient wired to the FastAPI app."""
    with TestClient(app) as c:
        yield c


@pytest.fixture
def task(client):
    """Seed a todo task via HTTP and return its data dict."""
    res = client.post("/api/tasks", json={"title": "Test task"})
    return res.json()["data"]


@pytest.fixture
def in_progress_task(client, task):
    """Seed an in-progress task via HTTP and return its data dict."""
    res = client.put(f"/api/tasks/{task['id']}", json={"status": "in-progress"})
    return res.json()["data"]
