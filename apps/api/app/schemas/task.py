"""Pydantic v2 request/response schemas for tasks."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class TaskCreate(BaseModel):
    """Schema for creating a new task."""

    model_config = ConfigDict(extra="forbid")

    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    status: Literal["todo", "in-progress", "done"] = "todo"
    priority: Literal["low", "medium", "high"] = "medium"


class TaskUpdate(BaseModel):
    """Schema for partially updating an existing task."""

    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    status: Literal["todo", "in-progress", "done"] | None = None
    priority: Literal["low", "medium", "high"] | None = None


class TaskResponse(BaseModel):
    """Schema representing a task in API responses."""

    id: str
    title: str
    description: str | None
    status: str
    priority: str
    createdAt: str
    updatedAt: str
