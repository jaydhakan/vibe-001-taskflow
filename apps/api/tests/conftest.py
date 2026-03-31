"""Shared test fixtures — isolates every test with tmp_path."""

import pytest
from httpx import ASGITransport, AsyncClient

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
    """Provide a synchronous-style httpx test client."""
    from httpx import Client

    transport = ASGITransport(app=app)
    with Client(transport=transport, base_url="http://test") as c:
        yield c
