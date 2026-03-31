"""Pydantic schema edge-case tests — direct model instantiation, no HTTP."""

import pytest
from pydantic import ValidationError

from app.schemas.task import TaskCreate, TaskUpdate


class TestTaskCreate:
    def test_min_length_title(self):
        t = TaskCreate(title="x")
        assert t.title == "x"

    def test_max_length_title(self):
        t = TaskCreate(title="a" * 200)
        assert len(t.title) == 200

    def test_empty_title_rejected(self):
        with pytest.raises(ValidationError):
            TaskCreate(title="")

    def test_over_max_title_rejected(self):
        with pytest.raises(ValidationError):
            TaskCreate(title="a" * 201)

    def test_invalid_priority_rejected(self):
        with pytest.raises(ValidationError):
            TaskCreate(title="ok", priority="urgent")

    def test_invalid_status_rejected(self):
        with pytest.raises(ValidationError):
            TaskCreate(title="ok", status="archived")

    def test_extra_fields_rejected(self):
        with pytest.raises(ValidationError):
            TaskCreate(title="ok", foo="bar")

    def test_defaults(self):
        t = TaskCreate(title="ok")
        assert t.status == "todo"
        assert t.priority == "medium"
        assert t.description is None


class TestTaskUpdate:
    def test_all_fields_optional(self):
        t = TaskUpdate()
        assert t.title is None
        assert t.status is None
        assert t.priority is None
        assert t.description is None

    def test_partial_update(self):
        t = TaskUpdate(title="new")
        assert t.title == "new"
        assert t.status is None

    def test_extra_fields_rejected(self):
        with pytest.raises(ValidationError):
            TaskUpdate(foo="bar")
