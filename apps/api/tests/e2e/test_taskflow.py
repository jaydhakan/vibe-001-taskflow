"""E2E Playwright tests — 5 required user-workflow scenarios.

Seeds data via API (httpx), interacts via browser (Playwright sync API).
Uses data-testid selectors exclusively. No arbitrary waits.
Screenshots are saved to tests/e2e/screenshots/ for CI evidence.
"""

from pathlib import Path

import httpx
from playwright.sync_api import Page, expect

API_URL = "http://localhost:8000"
WEB_URL = "http://localhost:5173"

SCREENSHOTS_DIR = Path(__file__).parent / "screenshots"


def _screenshot(page: Page, name: str):
    """Capture a full-page screenshot for evidence/debugging."""
    SCREENSHOTS_DIR.mkdir(exist_ok=True)
    page.screenshot(path=str(SCREENSHOTS_DIR / f"{name}.png"), full_page=True)


def _seed_task(title="Test Task", priority="medium"):
    """Create a task via the live API and return the task dict."""
    with httpx.Client(base_url=API_URL) as http:
        res = http.post("/api/tasks", json={"title": title, "priority": priority})
        return res.json()["data"]


def _advance_to_in_progress(task_id):
    """Move a task to in-progress via the live API."""
    with httpx.Client(base_url=API_URL) as http:
        res = http.put(f"/api/tasks/{task_id}", json={"status": "in-progress"})
        return res.json()["data"]


def test_page_load_shows_table(page: Page):
    """Table body is visible on initial page load."""
    page.goto(WEB_URL)
    expect(page.locator('[data-testid="task-tbody"]')).to_be_visible()
    _screenshot(page, "01-page-load")


def test_add_task_via_modal(page: Page):
    """Add button → modal → fill title → submit → row appears in table."""
    page.goto(WEB_URL)
    page.locator('[data-testid="add-task-btn"]').click()
    _screenshot(page, "02-add-task-modal-open")
    page.locator('[data-testid="title-input"]').fill("E2E New Task")
    page.locator('[data-testid="submit-btn"]').click()
    expect(page.locator('[data-testid="task-tbody"]')).to_contain_text("E2E New Task")
    _screenshot(page, "03-add-task-row-visible")


def test_complete_in_progress_task(page: Page):
    """Seed in-progress task → click Complete → done badge appears, button hidden."""
    task = _seed_task(title="Complete Me")
    task = _advance_to_in_progress(task["id"])
    page.goto(WEB_URL)
    row = page.locator(f'[data-task-id="{task["id"]}"]')
    _screenshot(page, "04-complete-before")
    row.locator('[data-testid="complete-btn"]').click()
    expect(row).to_contain_text("Done")
    expect(row.locator('[data-testid="complete-btn"]')).to_be_hidden()
    _screenshot(page, "05-complete-after")


def test_delete_task(page: Page):
    """Seed task → click Delete → row disappears from table."""
    task = _seed_task(title="Delete Me")
    page.goto(WEB_URL)
    row = page.locator(f'[data-task-id="{task["id"]}"]')
    expect(row).to_be_visible()
    _screenshot(page, "06-delete-before")
    row.locator('[data-testid="delete-btn"]').click()
    expect(row).to_be_hidden()
    _screenshot(page, "07-delete-after")


def test_priority_filter_shows_only_matching(page: Page):
    """Seed high+low tasks → filter by high → only high-priority rows visible."""
    _seed_task(title="High Priority", priority="high")
    _seed_task(title="Low Priority", priority="low")
    page.goto(WEB_URL)
    tbody = page.locator('[data-testid="task-tbody"]')
    expect(tbody).to_contain_text("High Priority")
    _screenshot(page, "08-filter-before")
    page.locator('[data-testid="priority-filter"]').select_option("high")
    expect(tbody).not_to_contain_text("Low Priority")
    _screenshot(page, "09-filter-after")
