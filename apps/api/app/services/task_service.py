"""Business logic for task management."""

import uuid
from datetime import datetime, timezone

from fastapi import HTTPException

from app.repositories import task_repo
from app.schemas.task import TaskCreate, TaskUpdate
from app.utils.response import err

VALID_TRANSITIONS: dict[str, list[str]] = {
    "todo": ["in-progress"],
    "in-progress": ["done"],
    "done": [],
}

ALLOWED_SORT_FIELDS = {"createdAt", "updatedAt", "title"}


def _check_transition(current: str, new: str) -> None:
    """Raise 422 if the status transition is not allowed."""
    if new not in VALID_TRANSITIONS[current]:
        raise HTTPException(
            status_code=422,
            detail=err(f"Cannot transition from '{current}' to '{new}'"),
        )


def create_task(data: TaskCreate) -> dict:
    """Create a new task. Status is always 'todo' regardless of input."""
    now = datetime.now(timezone.utc).isoformat()
    task = {
        "id": str(uuid.uuid4()),
        "title": data.title,
        "description": data.description,
        "status": "todo",
        "priority": data.priority,
        "createdAt": now,
        "updatedAt": now,
    }
    return task_repo.insert(task)


def get_task(task_id: str) -> dict:
    """Return a task by ID or raise 404."""
    task = task_repo.get_by_id(task_id)
    if task is None:
        raise HTTPException(
            status_code=404, detail=err(f"Task '{task_id}' not found")
        )
    return task


def update_task(task_id: str, data: TaskUpdate) -> dict:
    """Update task fields. Enforces status transition rules when status changes."""
    task = get_task(task_id)
    patch = data.model_dump(exclude_unset=True)

    if "status" in patch:
        _check_transition(task["status"], patch["status"])

    patch["updatedAt"] = datetime.now(timezone.utc).isoformat()
    return task_repo.update(task_id, patch)


def delete_task(task_id: str) -> None:
    """Delete a task or raise 404 if not found."""
    get_task(task_id)  # raises 404 if missing
    task_repo.delete(task_id)


def complete_task(task_id: str) -> dict:
    """Advance an in-progress task to done. Raises 422 otherwise."""
    task = get_task(task_id)
    _check_transition(task["status"], "done")
    now = datetime.now(timezone.utc).isoformat()
    return task_repo.update(task_id, {"status": "done", "updatedAt": now})


def list_tasks(
    *,
    status: str | None = None,
    priority: str | None = None,
    search: str | None = None,
    sort: str = "createdAt",
    order: str = "desc",
    page: int = 1,
    limit: int = 20,
) -> dict:
    """Return paginated tasks with server-side filtering, search, and sorting.

    Search is case-insensitive substring match against title and description.
    Sort must be one of: createdAt, updatedAt, title. Default: createdAt desc.
    """
    tasks = task_repo.get_all()

    if status:
        tasks = [t for t in tasks if t["status"] == status]
    if priority:
        tasks = [t for t in tasks if t["priority"] == priority]

    if search:
        q = search.lower()
        tasks = [
            t
            for t in tasks
            if q in t["title"].lower()
            or (t.get("description") and q in t["description"].lower())
        ]

    total = len(tasks)

    tasks.sort(key=lambda t: t.get(sort) or "", reverse=(order == "desc"))

    total_pages = max(1, -(-total // limit))
    start = (page - 1) * limit
    items = tasks[start : start + limit]

    return {
        "items": items,
        "page": page,
        "limit": limit,
        "total": total,
        "totalPages": total_pages,
        "hasNext": page < total_pages,
        "hasPrevious": page > 1,
    }


def get_stats() -> dict:
    """Return task counts grouped by status and priority."""
    tasks = task_repo.get_all()
    by_status: dict[str, int] = {"todo": 0, "in-progress": 0, "done": 0}
    by_priority: dict[str, int] = {"low": 0, "medium": 0, "high": 0}
    for t in tasks:
        by_status[t["status"]] += 1
        by_priority[t["priority"]] += 1
    return {"by_status": by_status, "by_priority": by_priority, "total": len(tasks)}
