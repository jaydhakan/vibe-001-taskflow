"""Thin persistence layer — reads and writes tasks via file_store."""

from app.core.config import settings
from app.utils.file_store import load_tasks, save_tasks


def get_all() -> list[dict]:
    """Return all tasks from the JSON store."""
    return load_tasks(settings.DATA_FILE)


def get_by_id(task_id: str) -> dict | None:
    """Return a single task by ID, or None if not found."""
    return next((t for t in get_all() if t["id"] == task_id), None)


def insert(task: dict) -> dict:
    """Append a new task and persist to disk."""
    tasks = get_all()
    tasks.append(task)
    save_tasks(settings.DATA_FILE, tasks)
    return task


def update(task_id: str, patch: dict) -> dict:
    """Apply a patch dict to an existing task and persist."""
    tasks = get_all()
    for t in tasks:
        if t["id"] == task_id:
            t.update(patch)
            save_tasks(settings.DATA_FILE, tasks)
            return t
    raise KeyError(f"Task {task_id} not found in store")


def delete(task_id: str) -> None:
    """Remove a task by ID and persist."""
    tasks = [t for t in get_all() if t["id"] != task_id]
    save_tasks(settings.DATA_FILE, tasks)
