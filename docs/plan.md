# vibe-001-taskflow — Project Plan

## 1. Overview

Full-stack task management system — FastAPI backend + Vite/Vanilla JS frontend — monorepo architecture, local JSON persistence, automated tests, and full GitHub Copilot feature evidence.

---

## 2. Tech Stack

| Layer | Choice | Version |
|---|---|---|
| Backend | FastAPI + Pydantic v2 + Uvicorn | Python 3.12 + uv |
| Frontend | Vite + Vanilla JS + HTML + CSS | Node 20 LTS |
| Backend tests | pytest + pytest-cov + httpx | latest |
| E2E tests | pytest-playwright (Python Playwright) | 0.5+ |
| Linting | ruff | optional |

`apps/api/pyproject.toml` (managed by `uv`):
```toml
[project]
name = "taskflow-api"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.111",
    "uvicorn[standard]>=0.29",
    "pydantic>=2.7",
]

[dependency-groups]
dev = [
    "pytest>=8",
    "pytest-cov>=5",
    "httpx>=0.27",
    "ruff>=0.4",
]
```

**Setup with uv:**
```bash
uv sync               # install all deps (creates .venv automatically)
uv run uvicorn app.main:app --reload   # run API
uv run pytest         # run tests
```

---

## 3. Project Structure

```
vibe-001-taskflow/
├─ apps/
│  ├─ api/
│  │  ├─ app/
│  │  │  ├─ api/routes/tasks.py       ← all 7 routes (thin)
│  │  │  ├─ core/config.py            ← DATA_FILE path (env-overridable)
│  │  │  ├─ models/task.py            ← domain model
│  │  │  ├─ schemas/task.py           ← TaskCreate, TaskUpdate, TaskResponse
│  │  │  ├─ repositories/task_repo.py ← JSON read/write only
│  │  │  ├─ services/task_service.py  ← all business logic + transitions
│  │  │  ├─ utils/file_store.py       ← atomic JSON persistence
│  │  │  ├─ utils/response.py         ← ok(data) / err(msg) envelope
│  │  │  ├─ middleware/error_handler.py
│  │  │  └─ main.py                   ← app, CORS, router mount
│  │  ├─ data/tasks.json
│  │  ├─ data/.gitkeep
│  │  ├─ tests/
│  │  │  ├─ conftest.py               ← tmp_path isolation fixture
│  │  │  ├─ unit/test_service.py
│  │  │  ├─ unit/test_repository.py
│  │  │  ├─ unit/test_validation.py
│  │  │  └─ integration/test_routes.py
│  │  ├─ pyproject.toml
│  │  └─ pytest.ini
│  └─ web/
│     ├─ src/
│     │  ├─ components/
│     │  │  ├─ task-table.js
│     │  │  ├─ task-modal.js
│     │  │  ├─ filters.js
│     │  │  ├─ search-bar.js
│     │  │  ├─ badge.js
│     │  │  ├─ loader.js
│     │  │  └─ toast.js
│     │  ├─ services/task-api.js
│     │  ├─ state/store.js
│     │  ├─ utils/{constants,format-date,dom}.js
│     │  ├─ styles/{variables,main,components}.css
│     │  ├─ app.js
│     │  └─ main.js
│     ├─ tests/  (no e2e here — E2E lives in apps/api/tests/e2e/)
│     ├─ index.html
│     ├─ package.json
│     └─ vite.config.js               ← proxy /api → :8000
├─ .github/
│  ├─ agents/
│  │  ├─ ui-agent.agent.md
│  │  ├─ backend-agent.agent.md
│  │  └─ testing-agent.agent.md
│  ├─ copilot-instructions.md
│  └─ workflows/ci.yml
├─ .vscode/mcp.json
├─ AGENTS.md
├─ COPILOT-LOG.md
├─ README.md
├─ PLAN.md
└─ .gitignore
```

> **Note:** Agent files go in `.github/agents/` for VS Code Copilot auto-discovery.

---

## 4. Backend Implementation

### 4.1 Schemas — `app/schemas/task.py`

- `TaskCreate`: `title` = `Field(min_length=1, max_length=200)`, `description` optional, `priority` default `"medium"`, `status` default `"todo"`
- `TaskUpdate`: all fields optional; status change validated against transition map
- `TaskResponse`: all 7 fields (id, title, description, status, priority, createdAt, updatedAt)
- `TaskStatsResponse`: `{ by_status, by_priority, total }`

### 4.2 File Store — `app/utils/file_store.py`

- `load_tasks(path)` — create file if missing, return `[]` on empty
- `save_tasks(path, tasks)` — write to `.tmp` then `os.replace()` for **atomic writes**

### 4.3 Repository — `app/repositories/task_repo.py`

Thin CRUD around file_store. Path sourced from `core/config.py` via `DATA_FILE` env var (allows test override).

### 4.4 Service — `app/services/task_service.py`

All business logic lives here:

```python
VALID_TRANSITIONS = {
    "todo": ["in-progress"],
    "in-progress": ["done"],
    "done": []
}
```

- `complete_task(id)` — task **must** be `in-progress`; raises 422 if `todo` or `done`
- `update_task(id, data)` — if status in payload, validates against `VALID_TRANSITIONS`
- `list_tasks(status, priority)` — filter logic
- `get_stats()` — returns counts by status, by priority, and total

### 4.5 Routes — `app/api/routes/tasks.py`

**CRITICAL — register in this exact order** (prevents FastAPI matching `/stats` as an `{id}`):

```
1. GET    /api/tasks
2. POST   /api/tasks
3. GET    /api/tasks/stats     ← must be before /{id}
4. GET    /api/tasks/{id}
5. PUT    /api/tasks/{id}
6. DELETE /api/tasks/{id}
7. POST   /api/tasks/{id}/complete
```

### 4.6 Response Envelope — `app/utils/response.py`

```python
def ok(data):  return {"success": True,  "data": data}
def err(msg):  return {"success": False, "error": {"message": msg}}
```

Every route returns one of these. `HTTPException` detail uses `err(msg)`.

### 4.7 CORS — `app/main.py`

```python
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 4.8 HTTP Status Code Reference

| Situation | Code |
|---|---|
| Success — create | 201 |
| Success — read / update | 200 |
| Success — delete | 200 `{"success":true,"data":null}` |
| Missing / invalid title | 400 |
| Task not found | 404 |
| Invalid enum or status transition | 422 |
| Unexpected server error | 500 |

### 4.9 Stats Response Shape

```json
{
  "success": true,
  "data": {
    "by_status":   { "todo": 3, "in-progress": 2, "done": 1 },
    "by_priority": { "low": 1, "medium": 3, "high": 2 },
    "total": 6
  }
}
```

---

## 5. Frontend Implementation

### 5.1 Scaffold

```bash
cd apps/web && npm create vite@latest . -- --template vanilla
```

### 5.2 Vite Proxy — `vite.config.js`

```js
export default {
  server: {
    proxy: { '/api': { target: 'http://localhost:8000', changeOrigin: true } }
  }
}
```

Eliminates CORS issues in dev. Frontend always calls `/api/tasks`, Vite forwards to FastAPI.

### 5.3 Module Build Order

1. `styles/variables.css` — CSS custom properties for badge colors, spacing
2. `styles/main.css` + `styles/components.css`
3. `utils/constants.js` — `API_BASE`, badge color maps
4. `utils/format-date.js` — ISO → readable string
5. `services/task-api.js` — all 7 fetch wrappers, each catches and rethrows with message
6. `state/store.js` — `tasks[]`, `filters`, `searchText`, `loading`, `selectedTask`
7. `components/badge.js` — `priorityBadge(p)` / `statusBadge(s)` → HTML string
8. `components/loader.js` — `show()` / `hide()`
9. `components/toast.js` — `showToast(msg, type)` auto-dismiss 3 s
10. `components/task-table.js` — render rows + empty state + action buttons
11. `components/task-modal.js` — open(task?) / close / validate / submit
12. `components/filters.js` — status + priority dropdowns → server-side query params
13. `components/search-bar.js` — 300 ms debounced input → client-side filter
14. `app.js` — orchestration, event wiring, re-render cycle
15. `main.js` — `import './app.js'`

### 5.4 Key Behavior Rules

| Concern | Rule |
|---|---|
| Search | Client-side, title field only, 300 ms debounce |
| Filters | Server-side via `?status=` / `?priority=` query params |
| Loading | Disable all action buttons + show spinner on every API call |
| Toasts | Success (green) for create/update/delete/complete; error (red) on any catch |
| Complete button | Hidden / disabled when task status is already `"done"` |
| Badge colors | priority: high=`#ef4444`, medium=`#f97316`, low=`#22c55e`; status: todo=`#6b7280`, in-progress=`#3b82f6`, done=`#22c55e` |
| Empty state | Show "No tasks found" message when list is empty |

---

## 6. Testing

### 6.1 Test Isolation — `tests/conftest.py`

```python
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core import config

@pytest.fixture
def client(tmp_path):
    config.DATA_FILE = str(tmp_path / "tasks.json")
    with TestClient(app) as c:
        yield c
```

Each test gets a fresh, isolated JSON file — never touches real `data/tasks.json`.

### 6.2 Unit Test Coverage Requirements

`tests/unit/test_service.py` must cover:

- create — nominal
- create — missing title → 400
- create — title > 200 chars → 400
- create — invalid priority enum → 422
- create — invalid status enum → 422
- `complete_task` when `todo` → 422
- `complete_task` when `done` → 422
- `complete_task` when `in-progress` → succeeds, status becomes `done`
- `update_task` with invalid status transition → 422
- list with `status` filter
- list with `priority` filter
- stats returns correct `by_status`, `by_priority`, `total`

### 6.3 Integration Tests — `tests/integration/test_routes.py`

All 7 endpoints tested via `TestClient`, including all edge cases from §6.2.

### 6.4 Coverage Config — `pytest.ini`

```ini
[pytest]
addopts = --cov=app --cov-report=term-missing --cov-fail-under=80
```

### 6.5 Playwright E2E — `apps/api/tests/e2e/test_taskflow.py`

Uses **pytest-playwright** (Python). Add `pytest-playwright>=0.5` to `[dependency-groups.dev]` in `pyproject.toml`. Install browser once with `uv run playwright install chromium`.

Five required scenarios with explicit assertions:

| Test | Action | Assert |
|---|---|---|
| page load | navigate to `/` | table or empty-state visible |
| add task | fill modal, submit | new row appears with title |
| complete task | seed via API, click Complete | status badge shows "done" |
| delete task | seed via API, click Delete | row removed from table |
| priority filter | seed high+low via API, select high filter | only high-priority rows visible |

Seed test data via API in Python (faster than clicking through the UI each time):

```python
from playwright.sync_api import Page, expect
import requests

def test_add_task_appears_in_table(page: Page):
    page.goto("http://localhost:5173")
    page.locator('[data-testid="add-task-btn"]').click()
    page.locator('[data-testid="title-input"]').fill("E2E Task")
    page.locator('[data-testid="submit-btn"]').click()
    expect(page.locator("text=E2E Task")).to_be_visible()
```

---

## 7. Copilot Evidence Files

### 7.1 Agent Files (`.github/agents/*.agent.md`)

Each file uses YAML frontmatter with all 5 required fields:

```yaml
---
name: ui-agent
description: Frontend specialist for HTML, CSS, vanilla JS
capabilities:
  - Generate accessible HTML/CSS component structure
  - Implement loading states and error toasts
  - Write Playwright E2E tests from browser observation
context:
  - apps/web/src/
  - apps/web/index.html
instructions: |
  Use semantic HTML. Use CSS custom properties for all colors.
  Show loading state on every API call. Show success and error toasts.
  No frameworks — vanilla JS ES modules only.
---
```

Create equivalents for `backend-agent.agent.md` (FastAPI, validation, status codes) and `testing-agent.agent.md` (pytest, Playwright, coverage, edge cases). Use each at least once and log the prompt.

### 7.2 `.github/copilot-instructions.md`

```markdown
# Copilot Review Instructions

When reviewing code in this project, check for:

1. **Docstrings/JSDoc** on all public functions
2. **Input validation** on every POST and PUT route (title 1-200 chars, enum values)
3. **HTTP status codes** — 400 bad input, 404 not found, 422 invalid transition, 500 unexpected only
4. **No empty catch blocks** — all catch blocks must log or rethrow
5. **Loading states** — all frontend API calls must show loading indicator and disable buttons
6. **Error handling** — all fetch calls must catch errors and show a toast notification
7. **Test coverage** — backend must be >80% (enforced by `--cov-fail-under=80`)
8. **Response envelope** — all responses must return `{"success": bool, "data": ...}`
```

Run review with:
```
Review apps/api/app/api/routes/tasks.py according to .github/copilot-instructions.md and list issues
```
Fix every issue found and log both issues and fixes in `COPILOT-LOG.md`.

### 7.3 `AGENTS.md` (root)

Must include: architecture overview, tech stack with versions, API response envelope spec, all 3 sub-agent descriptions with file paths, backend coding standards, frontend coding standards, patterns to follow, patterns to avoid.

**Patterns to follow:** thin routes, service layer for logic, repository for persistence, consistent envelope, JSDoc/docstrings on public functions, modular JS, reusable components.

**Patterns to avoid:** business logic in routes, direct file I/O in routes, empty catch blocks, inconsistent response shape, hardcoded DOM logic, putting everything in `app.js`.

### 7.4 `COPILOT-LOG.md` (exact required format)

```markdown
# Copilot Usage Log

## 1. Inline Suggestions
- [file]: [comment typed] → [what Copilot generated]
- [file]: [comment typed] → [what Copilot generated]
- [file]: [comment typed] → [what Copilot generated]

## 2. Agent Mode Prompts
- [prompt] → [files changed / result]
- [prompt] → [files changed / result]
- [prompt] → [files changed / result]

## 3. Sub-Agent Usage
- @ui-agent: [prompt] → [result]
- @backend-agent: [prompt] → [result]
- @testing-agent: [prompt] → [result]

## 4. Review Agent
- Issues found: ...
- Fixes applied: ...

## 5. Skills
- Skill: [name] | Prompt: [prompt] | Changes: [what improved]

## 6. Playwright MCP
- Screenshot taken: yes/no
- E2E test generated: [filename]
- Prompt used: [prompt]
```

### 7.5 `.vscode/mcp.json`

```json
{
  "servers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest", "--vision"]
    }
  }
}
```

### 7.6 Skills

```bash
npx skills add vercel-labs/agent-skills
```

Use the installed skill in at least one Agent Mode prompt. Apply at least **2 suggestions** it produces and log both in `COPILOT-LOG.md` §5.

---

## 8. Development Order

```
Phase 1 — Backend
  main.py → schemas → file_store → repository → service → response.py → routes → tests

Phase 2 — Frontend
  scaffold → vite.config.js → styles → constants → task-api.js → store.js
  → components (badge → loader → toast → table → modal → filters → search-bar)
  → app.js → E2E tests

Phase 3 — Copilot files
  AGENTS.md → .github/agents/*.agent.md → copilot-instructions.md
  → .vscode/mcp.json → COPILOT-LOG.md (fill as you go)

Phase 4 — Polish
  README → ci.yml → verify all tests pass → push public repo
```

---

## 9. Critical Implementation Notes

> These are non-obvious issues that will cause failures if missed.

1. **Route order**: `/api/tasks/stats` must be registered *before* `/api/tasks/{id}` in the FastAPI router
2. **CORS**: add `CORSMiddleware` in `main.py` targeting `localhost:5173` or all frontend requests fail
3. **Vite proxy**: configure `/api` proxy in `vite.config.js` to avoid CORS issues in dev
4. **Test isolation**: `conftest.py` must override `DATA_FILE` with `tmp_path` — never let tests touch real `data/tasks.json`
5. **Atomic writes**: `file_store.py` must use `.tmp` + `os.replace()` to prevent data corruption
6. **`/complete` semantics**: only `in-progress → done` is valid; `todo → done` must return 422
7. **PUT + status**: `PUT /api/tasks/{id}` can update status but must pass through the same `VALID_TRANSITIONS` guard
8. **`data/tasks.json` in `.gitignore`**: add it but keep `data/.gitkeep` so directory exists on clone
9. **Playwright uses Python**: use `pytest-playwright` — E2E tests live in `apps/api/tests/e2e/` alongside the pytest suite. The `.vscode/mcp.json` Playwright MCP is a separate Node tool used only for AI screenshot/generation; it does not affect test language choice.
10. **`uuid4()` for IDs**: use `str(uuid.uuid4())` — store as string, never as UUID object

---

## 10. Build Checklist

### Backend
- [ ] All 7 endpoints respond correctly
- [ ] `GET /api/tasks?status=X&priority=Y` filters correctly
- [ ] `GET /api/tasks/stats` returns `by_status`, `by_priority`, `total`
- [ ] `POST /api/tasks` → 400 missing title, 422 bad enum
- [ ] `PUT /api/tasks/{id}` enforces status transition with 422
- [ ] `POST /api/tasks/{id}/complete` → 422 if todo/done, 200 if in-progress
- [ ] All responses use `{"success": bool, "data": ...}` envelope

### Frontend
- [ ] Table: title, priority badge, status badge, created date, 3 action buttons
- [ ] Add Task modal with title validation (required, 1–200 chars)
- [ ] Edit modal pre-populates all fields
- [ ] Filters work without page reload
- [ ] Live search filters as you type (300 ms debounce)
- [ ] Loading indicator on every API call, buttons disabled during flight
- [ ] Error toasts on API failure; success toasts on mutations
- [ ] Color-coded badges (priority and status)

### Tests
- [ ] `pytest` passes with ≥80% coverage (`--cov-fail-under=80`)
- [ ] All 5 Playwright E2E scenarios pass

### Copilot Evidence
- [ ] `COPILOT-LOG.md` — 3+ inline suggestions, 3+ agent prompts, 3 sub-agent uses, review log, skills log, MCP log
- [ ] 3 `.agent.md` files in `.github/agents/` with all 5 YAML frontmatter fields
- [ ] `AGENTS.md` with architecture, stack, envelope spec, sub-agent descriptions, patterns
- [ ] `.github/copilot-instructions.md` covering all 8 review criteria
- [ ] `.vscode/mcp.json` present with Playwright MCP config
- [ ] Skills installed (`npx skills add vercel-labs/agent-skills`) and 2+ suggestions applied
