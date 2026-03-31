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

Write this frontend as a careful human engineer would: minimal, readable, production-quality. Avoid unnecessary abstractions, boilerplate, or filler comments. Choose precise names; don't split files for the sake of it.

Implement the complete Vite + Vanilla JS frontend for TaskFlow at apps/web/:

1. package.json — vite as devDep, scripts: dev / build / preview
2. vite.config.js — proxy /api → http://localhost:8000 with changeOrigin: true
3. index.html — semantic HTML; every interactive element has a data-testid: add-task-btn, task-modal, title-input, description-input, priority-select, status-select, submit-btn, cancel-btn, task-tbody, empty-state, status-filter, priority-filter, search-input, loader, toast-container; all inputs have associated <label> elements; all buttons have explicit type attribute
4. src/styles/variables.css — CSS custom properties: --priority-high #ef4444, --priority-medium #f97316, --priority-low #22c55e, --status-todo #6b7280, --status-in-progress #3b82f6, --status-done #22c55e, plus layout/spacing vars
5. src/styles/main.css + src/styles/components.css — full layout, table, modal, badges, buttons, toasts, loader
6. src/utils/dom.js — escapeHtml() to sanitize all user-generated content before innerHTML
7. src/services/task-api.js — getTasks, createTask, getTask, updateTask, deleteTask, completeTask, getStats; each throws Error(body.error.message) when body.success is false; JSDoc on every export; no direct fetch() calls anywhere else
8. src/state/store.js — getState / setState; single source of truth; no direct mutation; JSDoc on exports
9. src/components/badge.js — priorityBadge(priority), statusBadge(status); JSDoc
10. src/components/loader.js — show() / hide(); disables/re-enables all [data-action] buttons; JSDoc
11. src/components/toast.js — showToast(message, type) with auto-dismiss at 3s; toast container has aria-live="polite"; JSDoc
12. src/components/task-table.js — renders tbody via event delegation (replace tbody.onclick, never addEventListener in a loop); escapeHtml on every task field in innerHTML; Complete button hidden when status=done; data-task-id on every row; JSDoc
13. src/components/task-modal.js — openModal(task, {onSubmit}), closeModal(); focuses first input on open, resets form on close; front-end validation (title required, ≤200 chars); JSDoc
14. src/components/filters.js — initFilters(onChange); event listeners attached once; JSDoc
15. src/components/search-bar.js — initSearchBar(onChange) with 300ms debounce; event listener attached once; JSDoc
16. src/app.js — orchestration only: init() called once; stable DOM roots cached at module scope; every mutation handler follows showLoader → try → catch(showToast) → finally(hideLoader); no business logic
17. src/main.js — imports and calls app.js init only

After generating all files, self-review against .github/copilot-instructions.md and AGENTS.md "Frontend Review Checklist". Fix before finishing:
- All fetch() calls are in task-api.js only
- Every exported function has meaningful JSDoc (not just a restatement of the function name)
- Every API call uses loader.show() before await, loader.hide() in finally
- No empty catch blocks
- No duplicate event listeners (none registered inside render loops)
- All user content escaped before innerHTML
- All data-testid attributes present
- Modal focuses first input on open, resets on close
- vite build passes with no errors
```

---

## Prompt 3 — Tests

```
@testing-agent Read docs/plan.md section 6, AGENTS.md, and apps/api/app/ source files in full before writing any tests.

Write tests like a careful human engineer maintaining a real codebase: readable, deterministic, minimal, and production-quality. Prefer behavior and API contract validation over implementation-coupled assertions. Avoid brittle selectors, duplicated coverage across layers, excessive fixture magic, and repetitive boilerplate.

Implement a production-quality, maintainable test suite for TaskFlow that covers all required scenarios without unnecessary duplication:

BACKEND TESTS at apps/api/tests/:

1. conftest.py — Provide isolated fixtures for TestClient and seeded task states using tmp_path-backed storage. Never touch real data/tasks.json. Service/repo unit tests should seed through their own layer; HTTP-seeded fixtures (task, in_progress_task) are for integration tests.

2. unit/test_validation.py — Pydantic schema edge cases: TaskCreate valid title (1 char, 200 chars), invalid title (empty, 201 chars), invalid enum values, extra fields rejected. TaskUpdate all-optional. Use direct model instantiation, no HTTP.

3. unit/test_service.py — Business logic via service functions directly (not HTTP): nominal create, complete from todo→422, complete from in-progress→done, complete from done→422, valid transition todo→in-progress, invalid transition todo→done→422, unknown id→404, updatedAt changes on mutation, list filter by status, list filter by priority, stats empty store, stats with tasks. Seed through service/repository calls.

4. unit/test_repository.py — Persistence behavior: insert/retrieve, get unknown ID returns None, update, delete.

5. integration/test_routes.py — Full HTTP contract via TestClient. Assert status code AND body["success"] AND key data fields for all endpoints: POST create (201), missing/blank title (400/422), invalid enum (422), GET by id (200), GET unknown (404), PUT update (200), PUT invalid transition (422), PUT unknown (404), DELETE (200 with null data), DELETE unknown (404), POST complete from todo (422), complete from in-progress (200), complete from done (422), GET stats shape and route-ordering regression, GET list with status/priority filters.

6. e2e/conftest.py — Live server session fixture that starts both uvicorn and npm run dev. Poll for readiness with a timeout — no arbitrary sleeps. Fail fast with a clear message if startup fails. Clean up child processes robustly in teardown.

7. e2e/test_taskflow.py — 5 required Playwright scenarios using playwright.sync_api: page load (table or empty-state visible), add task via UI (modal→fill→submit→row appears), complete task (seed in-progress via API→click Complete→done badge, Complete button hidden), delete task (seed via API→click Delete→row gone), priority filter (seed high+low via API→filter high→only high visible). Use data-testid selectors exclusively. Scope row actions by data-task-id. No page.wait_for_timeout(). No order dependence between tests.

After generating all files, verify:
- No test touches real data/tasks.json
- Every test is independent — no shared mutable state
- All scenarios from plan.md §6.2 are covered
- Backend coverage for app/ is ≥80% (E2E is required but not relied on for backend coverage)
- E2E tests are deterministic — no arbitrary sleeps, no animation-timing dependence
- Server startup/teardown is robust with readiness polling
- No duplicate assertions testing the same contract at multiple layers
- The suite feels maintainable rather than prompt-shaped
```
