"""Domain model documentation for a Task.

A task is stored as a plain dict with the following shape:

{
    "id": str,              # UUID v4 as a string
    "title": str,           # 1–200 characters
    "description": str | None,
    "status": "todo" | "in-progress" | "done",
    "priority": "low" | "medium" | "high",
    "createdAt": str,       # UTC ISO-8601 timestamp
    "updatedAt": str,       # UTC ISO-8601 timestamp
}

Workflow rules:
- Tasks are always created with status "todo".
- Valid transitions: todo → in-progress → done. No reopening.
- The /complete endpoint only accepts in-progress → done.

No class is needed — Pydantic schemas handle validation,
and the service layer constructs dicts directly.
"""
