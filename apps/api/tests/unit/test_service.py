"""Service-layer business logic tests — seed through service/repo directly."""

import pytest
from fastapi import HTTPException

from app.schemas.task import TaskCreate, TaskUpdate
from app.services import task_service


class TestCreateTask:
    def test_nominal(self):
        result = task_service.create_task(TaskCreate(title="My task"))
        assert result["title"] == "My task"
        assert result["status"] == "todo"
        assert result["priority"] == "medium"
        assert result["description"] is None
        assert "id" in result
        assert "createdAt" in result
        assert result["createdAt"] == result["updatedAt"]

    def test_with_priority(self):
        result = task_service.create_task(TaskCreate(title="Urgent", priority="high"))
        assert result["priority"] == "high"


class TestCompleteTask:
    def test_from_todo_raises_422(self):
        task = task_service.create_task(TaskCreate(title="t"))
        with pytest.raises(HTTPException) as exc_info:
            task_service.complete_task(task["id"])
        assert exc_info.value.status_code == 422

    def test_from_in_progress_succeeds(self):
        task = task_service.create_task(TaskCreate(title="t"))
        task_service.update_task(task["id"], TaskUpdate(status="in-progress"))
        result = task_service.complete_task(task["id"])
        assert result["status"] == "done"

    def test_from_done_raises_422(self):
        task = task_service.create_task(TaskCreate(title="t"))
        task_service.update_task(task["id"], TaskUpdate(status="in-progress"))
        task_service.complete_task(task["id"])
        with pytest.raises(HTTPException) as exc_info:
            task_service.complete_task(task["id"])
        assert exc_info.value.status_code == 422


class TestUpdateTask:
    def test_valid_transition_todo_to_in_progress(self):
        task = task_service.create_task(TaskCreate(title="t"))
        result = task_service.update_task(task["id"], TaskUpdate(status="in-progress"))
        assert result["status"] == "in-progress"

    def test_edit_done_task_raises_422(self):
        task = task_service.create_task(TaskCreate(title="t"))
        task_service.update_task(task["id"], TaskUpdate(status="in-progress"))
        task_service.complete_task(task["id"])
        with pytest.raises(HTTPException) as exc_info:
            task_service.update_task(task["id"], TaskUpdate(title="nope"))
        assert exc_info.value.status_code == 422

    def test_invalid_transition_todo_to_done(self):
        task = task_service.create_task(TaskCreate(title="t"))
        with pytest.raises(HTTPException) as exc_info:
            task_service.update_task(task["id"], TaskUpdate(status="done"))
        assert exc_info.value.status_code == 422

    def test_unknown_id_raises_404(self):
        with pytest.raises(HTTPException) as exc_info:
            task_service.update_task("nonexistent", TaskUpdate(title="x"))
        assert exc_info.value.status_code == 404

    def test_updated_at_changes(self):
        task = task_service.create_task(TaskCreate(title="t"))
        original = task["updatedAt"]
        result = task_service.update_task(task["id"], TaskUpdate(title="new"))
        assert result["updatedAt"] >= original


class TestListTasks:
    def test_filter_by_status(self):
        task_service.create_task(TaskCreate(title="a"))
        task_service.create_task(TaskCreate(title="b"))
        result = task_service.list_tasks(status="todo")
        assert result["total"] == 2
        assert all(t["status"] == "todo" for t in result["items"])

    def test_filter_by_priority(self):
        task_service.create_task(TaskCreate(title="a", priority="high"))
        task_service.create_task(TaskCreate(title="b", priority="low"))
        result = task_service.list_tasks(priority="high")
        assert result["total"] == 1
        assert result["items"][0]["priority"] == "high"

    def test_search_by_title(self):
        task_service.create_task(TaskCreate(title="Buy groceries"))
        task_service.create_task(TaskCreate(title="Fix bug"))
        result = task_service.list_tasks(search="grocer")
        assert result["total"] == 1
        assert result["items"][0]["title"] == "Buy groceries"

    def test_search_by_description(self):
        task_service.create_task(TaskCreate(title="Task", description="important details"))
        task_service.create_task(TaskCreate(title="Other"))
        result = task_service.list_tasks(search="important")
        assert result["total"] == 1


class TestGetStats:
    def test_empty_store(self):
        stats = task_service.get_stats()
        assert stats["total"] == 0
        assert stats["by_status"] == {"todo": 0, "in-progress": 0, "done": 0}
        assert stats["by_priority"] == {"low": 0, "medium": 0, "high": 0}

    def test_with_tasks(self):
        task_service.create_task(TaskCreate(title="a", priority="high"))
        task_service.create_task(TaskCreate(title="b", priority="low"))
        t = task_service.create_task(TaskCreate(title="c"))
        task_service.update_task(t["id"], TaskUpdate(status="in-progress"))

        stats = task_service.get_stats()
        assert stats["total"] == 3
        assert stats["by_status"]["todo"] == 2
        assert stats["by_status"]["in-progress"] == 1
        assert stats["by_priority"]["high"] == 1
        assert stats["by_priority"]["low"] == 1
