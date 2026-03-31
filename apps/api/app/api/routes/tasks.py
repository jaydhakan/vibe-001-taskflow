"""Task API routes — thin handlers that delegate to the service layer."""

from typing import Literal

from fastapi import APIRouter, Query

from app.schemas.task import TaskCreate, TaskUpdate
from app.services import task_service
from app.utils.response import ok

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


# GET /api/tasks — paginated list with optional status, priority, search, sort, and order query params
@router.get("")
async def list_tasks(
    status: Literal["todo", "in-progress", "done"] | None = None,
    priority: Literal["low", "medium", "high"] | None = None,
    search: str | None = None,
    sort: Literal["createdAt", "updatedAt", "title"] = "createdAt",
    order: Literal["asc", "desc"] = "desc",
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=500),
) -> dict:
    """List tasks with server-side pagination, filtering, search, and sorting."""
    return ok(
        task_service.list_tasks(
            status=status,
            priority=priority,
            search=search,
            sort=sort,
            order=order,
            page=page,
            limit=limit,
        )
    )


# POST /api/tasks — create a new task, always starts in todo status, returns 201 with the created task
@router.post("", status_code=201)
async def create_task(data: TaskCreate) -> dict:
    """Create a new task."""
    return ok(task_service.create_task(data))


# GET /api/tasks/stats — must be registered before /{task_id} so FastAPI does not treat 'stats' as an ID
@router.get("/stats")
async def get_stats() -> dict:
    """Return task counts grouped by status and priority."""
    return ok(task_service.get_stats())


@router.get("/{task_id}")
async def get_task(task_id: str) -> dict:
    """Get a single task by ID."""
    return ok(task_service.get_task(task_id))


@router.put("/{task_id}")
async def update_task(task_id: str, data: TaskUpdate) -> dict:
    """Update task fields. Status changes enforce transition rules."""
    return ok(task_service.update_task(task_id, data))


@router.delete("/{task_id}")
async def delete_task(task_id: str) -> dict:
    """Delete a task by ID."""
    task_service.delete_task(task_id)
    return ok(None)


# POST /api/tasks/{task_id}/complete — advance task from in-progress to done, raises 422 for any other status
@router.post("/{task_id}/complete")
async def complete_task(task_id: str) -> dict:
    """Advance task from in-progress to done."""
    return ok(task_service.complete_task(task_id))
