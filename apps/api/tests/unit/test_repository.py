"""Repository persistence tests — direct repo calls, tmp_path-isolated."""

import pytest

from app.core.config import settings
from app.repositories import task_repo


def _make_task(id="t1", title="Test"):
    return {
        "id": id,
        "title": title,
        "description": None,
        "status": "todo",
        "priority": "medium",
        "createdAt": "2024-01-01T00:00:00+00:00",
        "updatedAt": "2024-01-01T00:00:00+00:00",
    }


class TestRepository:
    def test_load_empty_file(self, tmp_path):
        """An existing but empty file returns an empty list."""
        empty_file = tmp_path / "tasks.json"
        empty_file.write_text("")
        settings.DATA_FILE = str(empty_file)
        assert task_repo.get_all() == []

    def test_insert_and_get_by_id(self):
        task_repo.insert(_make_task())
        found = task_repo.get_by_id("t1")
        assert found is not None
        assert found["title"] == "Test"

    def test_get_unknown_id_returns_none(self):
        assert task_repo.get_by_id("nonexistent") is None

    def test_update(self):
        task_repo.insert(_make_task())
        task_repo.update("t1", {"title": "Updated"})
        assert task_repo.get_by_id("t1")["title"] == "Updated"

    def test_delete(self):
        task_repo.insert(_make_task())
        task_repo.delete("t1")
        assert task_repo.get_by_id("t1") is None

    def test_update_unknown_id_raises(self):
        with pytest.raises(KeyError):
            task_repo.update("nonexistent", {"title": "x"})
