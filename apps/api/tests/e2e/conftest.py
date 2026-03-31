"""E2E test fixtures — live servers with readiness polling."""

import os
import subprocess
import time
from pathlib import Path

import httpx
import pytest

API_DIR = Path(__file__).resolve().parents[2]  # apps/api/
WEB_DIR = API_DIR.parent / "web"  # apps/web/

API_URL = "http://localhost:8000"
WEB_URL = "http://localhost:5173"


def _is_ready(url: str) -> bool:
    """Return True if a single GET to url succeeds without error."""
    try:
        r = httpx.get(url, timeout=2)
        return r.status_code < 500
    except (httpx.ConnectError, httpx.TimeoutException):
        return False


def _wait_for(url: str, timeout: float = 30) -> bool:
    """Poll a URL until it responds 2xx or timeout expires."""
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if _is_ready(url):
            return True
        time.sleep(0.5)
    return False


@pytest.fixture(scope="session", autouse=True)
def live_servers(tmp_path_factory):
    """Start API and frontend servers unless they're already running.

    Polls for readiness with a timeout. Tears down only the processes we spawned.
    """
    procs = []

    # Only start servers if they aren't already reachable
    api_running = _is_ready(f"{API_URL}/api/tasks")
    web_running = _is_ready(WEB_URL)

    if not api_running:
        data_file = str(tmp_path_factory.mktemp("e2e") / "tasks.json")
        env = {**os.environ, "DATA_FILE": data_file}
        api = subprocess.Popen(
            ["uv", "run", "uvicorn", "app.main:app", "--port", "8000"],
            cwd=str(API_DIR),
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        procs.append(api)

    if not web_running:
        web = subprocess.Popen(
            ["npm", "run", "dev", "--", "--port", "5173", "--strictPort"],
            cwd=str(WEB_DIR),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        procs.append(web)

    try:
        if not _wait_for(f"{API_URL}/api/tasks"):
            raise RuntimeError("API server did not become ready within 30 s")
        if not _wait_for(WEB_URL):
            raise RuntimeError("Web server did not become ready within 30 s")
        yield
    finally:
        for proc in procs:
            proc.terminate()
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()
                proc.wait()


@pytest.fixture(autouse=True)
def _clean_tasks():
    """Delete all tasks via API before each E2E test for isolation."""
    with httpx.Client(base_url=API_URL) as http:
        res = http.get("/api/tasks", params={"limit": 500})
        for task in res.json()["data"]["items"]:
            http.delete(f"/api/tasks/{task['id']}")
    yield
