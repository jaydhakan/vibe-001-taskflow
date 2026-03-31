# Agent Mode Prompts

Use these prompts in **separate new Agent Mode threads**, in order 1 → 2 → 3.
Each prompt is self-contained — it tells the agent where to read context from.

---

## Prompt 1 — Backend

```
@backend-agent Read docs/plan.md sections 3–4 and AGENTS.md in full before writing any code.

Implement the complete FastAPI backend for TaskFlow at apps/api/ with the following:

1. pyproject.toml with all dependencies (fastapi, uvicorn, pydantic>=2.7, pytest, pytest-cov, httpx, pytest-playwright, ruff) and requires-python=">=3.12"
2. pytest.ini with --cov=app --cov-report=term-missing --cov-fail-under=80
3. app/core/config.py — pydantic_settings Settings with DATA_FILE path
4. app/utils/file_store.py — load_tasks / save_tasks with atomic .tmp + os.replace()
5. app/utils/response.py — ok(data) and err(msg) helpers only
6. app/models/task.py — domain dict shape (documented, not necessarily a class)
7. app/schemas/task.py — TaskCreate, TaskUpdate, TaskResponse using Pydantic v2 with Field(min_length=1, max_length=200) on title, Literal types for status/priority, model_config = ConfigDict(extra="forbid")
8. app/repositories/task_repo.py — get_all, get_by_id, insert, update, delete — thin, no business logic
9. app/services/task_service.py — all 7 service functions with VALID_TRANSITIONS map, datetime.now(timezone.utc), model_dump(exclude_unset=True), docstrings on every def
10. app/api/routes/tasks.py — @router decorator style, /stats registered BEFORE /{task_id}, status_code=201 on POST, every route has a docstring
11. app/main.py — FastAPI app, CORSMiddleware for localhost:5173 and 127.0.0.1:5173, include_router
12. data/.gitkeep — empty file so data/ directory exists on clone

After generating all files, review every file against .github/copilot-instructions.md and fix any violations before finishing. Run a mental check: every def has a docstring, no datetime.utcnow(), no raw dicts in routes, no empty except blocks, /stats is before /{task_id}.
```

---

## Prompt 2 — Frontend

```
@ui-agent Read docs/plan.md sections 3 and 5 and AGENTS.md in full before writing any code. The backend API is already running at http://localhost:8000 and proxied via Vite at /api.

Implement the complete Vite + Vanilla JS frontend for TaskFlow at apps/web/ with the following:

1. package.json with vite as devDep, scripts: dev / build / preview
2. vite.config.js — proxy /api to http://localhost:8000 with changeOrigin: true
3. index.html — semantic HTML with data-testid on every interactive element: add-task-btn, task-modal, title-input, description-input, priority-select, status-select, submit-btn, cancel-btn, task-tbody, empty-state, status-filter, priority-filter, search-input, loader, toast-container
4. src/styles/variables.css — CSS custom properties: --priority-high #ef4444, --priority-medium #f97316, --priority-low #22c55e, --status-todo #6b7280, --status-in-progress #3b82f6, --status-done #22c55e, plus layout vars
5. src/styles/main.css + src/styles/components.css — full layout, table, modal, badges, buttons, toasts, loader
6. src/utils/constants.js, src/utils/format-date.js, src/utils/dom.js (with escapeHtml)
7. src/services/task-api.js — getTasks, createTask, getTask, updateTask, deleteTask, completeTask, getStats — each checks body.success and throws new Error(body.error.message) on failure, JSDoc on every export
8. src/state/store.js — getState / setState, no direct mutation, JSDoc on exports
9. src/components/badge.js — priorityBadge(p), statusBadge(s), JSDoc
10. src/components/loader.js — showLoader / hideLoader, disables/re-enables all [data-action] buttons
11. src/components/toast.js — showToast(message, type) with auto-dismiss 3s, role=alert, JSDoc
12. src/components/task-table.js — event delegation on tbody, escapeHtml on all task fields, hides Complete button when status=done, data-task-id on every row, JSDoc
13. src/components/task-modal.js — openModal(task, {onSubmit}), closeModal(), front-end validation (title required, ≤200 chars), JSDoc
14. src/components/filters.js — initFilters(onChange), JSDoc
15. src/components/search-bar.js — initSearchBar(onChange) with 300ms debounce, JSDoc
16. src/app.js — full orchestration: init, fetchAndRender, all handlers following showLoader→try→catch(showToast)→finally(hideLoader) pattern, no business logic
17. src/main.js — imports app.js only

After generating all files, review every file against .github/copilot-instructions.md. Confirm: every exported function has JSDoc, every fetch call is in task-api.js only, every API call uses showLoader/hideLoader pattern, no empty catch blocks, all data-testid attributes are present.
```

---

## Prompt 3 — Tests

```
@testing-agent Read docs/plan.md section 6, AGENTS.md, and apps/api/app/ source files in full before writing any tests.

Implement the complete test suite for TaskFlow:

BACKEND TESTS at apps/api/tests/:

1. conftest.py — client(tmp_path) fixture that sets settings.DATA_FILE to a fresh tmp path, plus task() and in_progress_task() convenience fixtures that seed via the API
2. unit/test_service.py — test all scenarios from plan.md §6.2: nominal create, missing title, title boundary (1 char valid / 200 valid / 201 invalid), invalid priority enum, invalid status enum, complete from todo→422, complete from done→422, complete from in-progress→200, update invalid transition→422, update valid transition, update unknown id→404, list with status filter, list with priority filter, stats empty store, stats with tasks (counts by_status and by_priority)
3. unit/test_repository.py — insert/retrieve, get_by_id unknown returns None, update, delete
4. unit/test_validation.py — Pydantic schema edge cases: TaskCreate with extra fields rejected, TaskUpdate all-optional, title exactly 200 chars valid, title 201 chars invalid
5. integration/test_routes.py — all 7 HTTP endpoints via TestClient, asserting both status_code AND body["success"] AND key data fields, including the /stats-before-/{id} regression test
6. e2e/conftest.py — live_servers session fixture that starts both uvicorn and npm run dev, waits for readiness
7. e2e/test_taskflow.py — all 5 required Playwright scenarios using playwright.sync_api: page load, add task via UI, complete task (seed via API → advance to in-progress via API → click Complete in UI → assert done badge), delete task (seed via API → click Delete → assert row gone), priority filter (seed high+low via API → select high filter → assert only high visible). Use data-testid selectors exclusively. No page.wait_for_timeout().

After generating all files, verify: no test touches real data/tasks.json, every test is independent, all scenarios from plan.md §6.2 are covered, uv run pytest would pass with ≥80% coverage.
```
