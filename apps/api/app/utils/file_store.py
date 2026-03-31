"""Atomic JSON file persistence for task data."""

import json
import os
import pathlib


def load_tasks(path: str) -> list[dict]:
    """Load tasks from a JSON file. Returns [] if file is missing or empty."""
    p = pathlib.Path(path)
    if not p.exists():
        p.parent.mkdir(parents=True, exist_ok=True)
        return []
    text = p.read_text(encoding="utf-8").strip()
    if not text:
        return []
    return json.loads(text)


def save_tasks(path: str, tasks: list[dict]) -> None:
    """Atomically write tasks to JSON via .tmp + os.replace()."""
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(tasks, f, indent=2, ensure_ascii=False)
    os.replace(tmp, path)
