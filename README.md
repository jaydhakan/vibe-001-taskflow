# TaskFlow

A full-stack task management app — FastAPI backend + Vite/Vanilla JS frontend. Create, edit, filter, complete, and delete tasks with status/priority tracking, local JSON persistence, and full automated test coverage.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Backend | FastAPI + Pydantic v2 + Uvicorn | Python 3.12 (uv) |
| Frontend | Vite + Vanilla JS (ES modules) | Node 20 LTS |
| Persistence | Local JSON file (`data/tasks.json`) | — |
| Unit / Integration Tests | pytest + pytest-cov + httpx | pytest 8+ |
| E2E Tests | pytest-playwright (Python Playwright) | 0.5+ |
| Linting | Ruff | 0.4+ |

---

## Project Structure

```
vibe-001-taskflow/
├─ apps/
│  ├─ api/                          ← FastAPI backend
│  │  ├─ app/
│  │  │  ├─ api/routes/tasks.py     ← HTTP endpoints (thin routes)
│  │  │  ├─ services/task_service.py← Business logic + transitions
│  │  │  ├─ repositories/task_repo.py ← JSON persistence
│  │  │  ├─ schemas/task.py         ← Pydantic request/response models
│  │  │  ├─ utils/file_store.py     ← Atomic file I/O
│  │  │  ├─ utils/response.py       ← ok() / err() envelope helpers
│  │  │  ├─ core/config.py          ← Settings (DATA_FILE path)
│  │  │  └─ main.py                 ← FastAPI app + CORS
│  │  ├─ tests/
│  │  │  ├─ conftest.py             ← Shared fixtures (tmp_path isolation)
│  │  │  ├─ unit/                   ← Service, repo, schema tests
│  │  │  ├─ integration/            ← Full HTTP round-trip tests
│  │  │  └─ e2e/                    ← Playwright browser tests
│  │  └─ pytest.ini
│  └─ web/                          ← Vite + Vanilla JS frontend
│     ├─ src/
│     │  ├─ components/             ← UI modules (table, modal, filters…)
│     │  ├─ services/task-api.js    ← All fetch wrappers
│     │  ├─ state/store.js          ← Single source of truth
│     │  └─ app.js                  ← Orchestration
│     └─ index.html
├─ .github/
│  ├─ agents/                       ← 3 sub-agent definitions
│  └─ copilot-instructions.md       ← Review agent rules
├─ .vscode/mcp.json                 ← Playwright MCP config
├─ AGENTS.md                        ← Architecture + coding standards
├─ COPILOT-LOG.md                   ← Copilot usage evidence
└─ README.md
```

---

## Getting Started

### Backend

```bash
cd apps/api
uv sync                                     # install dependencies
uv run uvicorn app.main:app --reload        # API at http://localhost:8000
```

### Frontend

```bash
cd apps/web
npm install                                 # install dependencies
npm run dev                                 # App at http://localhost:5173
```

The Vite dev server proxies `/api` requests to `http://localhost:8000` — no CORS setup needed in dev.

---

## API Endpoints

| Method | Endpoint | Description | Success Code |
|---|---|---|---|
| `GET` | `/api/tasks` | List tasks (supports `?status=`, `?priority=`, `?search=` filters) | 200 |
| `POST` | `/api/tasks` | Create a new task | 201 |
| `GET` | `/api/tasks/stats` | Task counts by status and priority | 200 |
| `GET` | `/api/tasks/:id` | Get a single task | 200 |
| `PUT` | `/api/tasks/:id` | Update a task | 200 |
| `DELETE` | `/api/tasks/:id` | Delete a task | 200 |
| `POST` | `/api/tasks/:id/complete` | Mark in-progress task as done | 200 |

All responses use the envelope: `{"success": true, "data": ...}` or `{"success": false, "error": {"message": "..."}}`

**Status workflow:** `todo → in-progress → done` (no skipping).

---

## Tests

All commands run from `apps/api/`.

### Run All Tests (Unit + Integration + Coverage)

```bash
uv run pytest
```

This runs all unit and integration tests with coverage enforced at ≥ 80% (configured in `pytest.ini`).

### Run by Layer

```bash
uv run pytest tests/unit                    # schema, service, repository tests
uv run pytest tests/integration             # full HTTP round-trip tests
uv run pytest tests/unit tests/integration  # both (no browser needed)
```

### Run E2E Tests (Playwright)

E2E tests require both servers to be running. The test fixture starts them automatically:

```bash
uv run playwright install chromium          # first time only
uv run pytest tests/e2e                     # runs 5 browser scenarios
uv run pytest tests/e2e --headed            # headed mode for debugging
```

Screenshots are captured during E2E runs and saved to `tests/e2e/screenshots/`.

### Coverage Report

```bash
uv run pytest --cov=app --cov-report=html   # generate HTML report
open htmlcov/index.html
```

### Test Summary

| Layer | File | Scenarios |
|---|---|---|
| Schema validation | `unit/test_validation.py` | Title bounds, invalid enums, extra fields, optional fields |
| Service logic | `unit/test_service.py` | Create, complete, transitions, filters, stats |
| Repository | `unit/test_repository.py` | Insert, get, update, delete |
| HTTP contract | `integration/test_routes.py` | All endpoints: status codes, envelope shape, data fields |
| Browser E2E | `e2e/test_taskflow.py` | Page load, add task, complete, delete, priority filter |

---

## Copilot Features

This project demonstrates all 6 required GitHub Copilot features:

1. **Inline Comment Suggestions** — Core files generated via comment-driven tab completions
2. **Agent Mode** — Multi-file generation (frontend, features spanning backend + frontend)
3. **Custom Sub-Agents** — 3 agent definitions in `.github/agents/` (ui, backend, testing)
4. **AGENTS.md** — Architecture, standards, and patterns documented at project root
5. **Review Agent** — `copilot-instructions.md` with review rules; issues found and fixed
6. **Skills + Playwright MCP** — Skills from skills.sh ecosystem; `.vscode/mcp.json` for browser observation

See [COPILOT-LOG.md](COPILOT-LOG.md) for full evidence.

