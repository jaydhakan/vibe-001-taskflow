"""Task API routes — thin handlers that delegate to the service layer."""

from fastapi import APIRouter

from app.schemas.task import TaskCreate, TaskUpdate
from app.services import task_service
from app.utils.response import ok

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.get("")
async def list_tasks(
    status: str | None = None, priority: str | None = None
) -> dict:
    """List all tasks, optionally filtered by status and/or priority."""
    return ok(task_service.list_tasks(status=status, priority=priority))


@router.post("", status_code=201)
async def create_task(data: TaskCreate) -> dict:
    """Create a new task."""
    return ok(task_service.create_task(data))


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


@router.post("/{task_id}/complete")
async def complete_task(task_id: str) -> dict:
    """Advance task from in-progress to done."""
    return ok(task_service.complete_task(task_id))
