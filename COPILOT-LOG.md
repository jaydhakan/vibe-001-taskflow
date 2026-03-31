# Copilot Usage Log

> ⚠️ **THIS FILE MUST BE FILLED AS YOU BUILD — do not leave placeholders at submission.**
>
> Fill each section **as you work**, not at the end. Every entry should reference real files,
> real comments typed, and real code Copilot generated or suggested.
>
> **Before submission, verify:**
> - Section 1 has ≥ 3 inline suggestion examples (comment → generated code)
> - Section 2 has ≥ 3 Agent Mode prompts with file results
> - Section 3 has one entry per sub-agent (all 3 agents used)
> - Section 4 has real issues found + fixes applied from the review run
> - Section 5 has ≥ 2 skill suggestions applied
> - Section 6 has screenshot confirmed and E2E test filename

---

## 1. Inline Suggestions

> For each entry: open a core file, write only a descriptive comment, press **Tab** to accept
> Copilot's suggestion, and log what it generated. Minimum 3 examples.

- `apps/api/app/api/routes/tasks.py`:
  Comment written: `# GET /api/tasks — paginated list with optional status, priority, search, sort, and order query params`
  → Copilot generated the full `list_tasks` async function signature with all seven typed query parameters (`status`, `priority`, `search`, `sort`, `order`, `page`, `limit`), `Literal` constraints on enum params, `Query(default=1, ge=1)` bounds on `page` and `limit`, the docstring, and the `return ok(task_service.list_tasks(...))` body with all kwargs forwarded.

- `apps/api/app/api/routes/tasks.py`:
  Comment written: `# POST /api/tasks — create a new task, always starts in todo status, returns 201 with the created task`
  → Copilot generated `@router.post("", status_code=201)`, the `async def create_task(data: TaskCreate) -> dict` signature, docstring, and `return ok(task_service.create_task(data))`.

- `apps/api/app/api/routes/tasks.py`:
  Comment written: `# GET /api/tasks/stats — must be registered before /{task_id} so FastAPI does not treat 'stats' as an ID`
  → Copilot generated the `@router.get("/stats")` decorator, `async def get_stats() -> dict`, docstring, and `return ok(task_service.get_stats())`. It also added the route in the correct position above the `/{task_id}` handlers.

- `apps/api/app/api/routes/tasks.py`:
  Comment written: `# POST /api/tasks/{task_id}/complete — advance task from in-progress to done, raises 422 for any other status`
  → Copilot generated `@router.post("/{task_id}/complete")`, `async def complete_task(task_id: str) -> dict`, the docstring, and `return ok(task_service.complete_task(task_id))`.

---

## 2. Agent Mode Prompts

> For each entry: describe the exact prompt you gave in Agent Mode, and list which files
> were created or changed as a result. Minimum 3 prompts.

- **Prompt:** See `docs/prompts.md` — Prompt 1 (Backend), invoked via `@backend-agent`
  **Result:** Created 12 files under `apps/api/`:
  - `pyproject.toml`, `pytest.ini`, `data/.gitkeep`
  - `app/main.py`, `app/core/config.py`
  - `app/models/task.py`, `app/schemas/task.py`
  - `app/utils/file_store.py`, `app/utils/response.py`
  - `app/repositories/task_repo.py`
  - `app/services/task_service.py`
  - `app/api/routes/tasks.py`
  - `tests/conftest.py` (with `tmp_path` isolation fixture)

- **Prompt:** See `docs/prompts.md` — Backend production upgrade (Agent Mode, `@backend-agent`):
  > Upgrade the TaskFlow backend from demo-style task CRUD into a production-ready task listing and workflow API — server-side pagination, search, filtering/sorting, workflow constraints, validated inputs.

  **Result:** Modified 3 files:
  - `app/schemas/task.py` — `TaskCreate.status` locked to `Literal["todo"]` to enforce create-always-todo rule
  - `app/services/task_service.py` — `list_tasks()` rewritten with pagination (`page`, `limit`), server-side search (title + description), sorting (`createdAt`/`updatedAt`/`title`, `asc`/`desc`), returns paginated envelope `{items, page, limit, total, totalPages, hasNext, hasPrevious}`
  - `app/api/routes/tasks.py` — list route gains typed `Query` params with validation (`page≥1`, `limit 1–100`, `Literal` enums for status/priority/sort/order)

- **Prompt:** See `docs/prompts.md` — Prompt 2 (Frontend), invoked via `@ui-agent`
  **Result:** Created 17 files under `apps/web/`:
  - `package.json`, `vite.config.js`, `index.html`
  - `src/main.js`, `src/app.js`, `src/state/store.js`, `src/services/task-api.js`
  - `src/utils/dom.js`
  - `src/components/` — `task-table.js`, `task-modal.js`, `filters.js`, `search-bar.js`, `pagination.js`, `badge.js`, `loader.js`, `toast.js`
  - `src/styles/` — `variables.css`, `main.css`, `components.css`
  Then iteratively refined via follow-up @ui-agent prompts: production-grade upgrade (server-driven queries, pagination, sorting, workflow-aware modal), theme switching + board view with drag-and-drop, modal positioning fix, done-task edit prevention, UI polish pass, and toast/feedback improvements with undo-delete. Each follow-up modified existing files in-place.

- **Prompt:** See `docs/prompts.md` — Prompt 3 (Tests), invoked via `@testing-agent`
  **Result:** Created/modified 7 files:
  - `tests/conftest.py` — Updated with TestClient fixture, `task` and `in_progress_task` HTTP-seeded fixtures, `_isolate_data` autouse for tmp_path
  - `tests/unit/test_validation.py` — 11 tests: Pydantic schema edge cases (title bounds, invalid enums, extra fields, defaults)
  - `tests/unit/test_service.py` — 15 tests: business logic via direct service calls (create, complete transitions, update transitions, search, stats)
  - `tests/unit/test_repository.py` — 6 tests: persistence layer (insert, get, update, delete, unknown ID, empty file)
  - `tests/integration/test_routes.py` — 18 tests: full HTTP contract (status codes + envelope + data fields for all endpoints)
  - `tests/e2e/conftest.py` — Live server session fixture with readiness polling + per-test cleanup
  - `tests/e2e/test_taskflow.py` — 5 Playwright E2E scenarios with screenshot capture

---

## 3. Sub-Agent Usage

> For each sub-agent: invoke it in Agent Mode using @ui-agent / @backend-agent / @testing-agent,
> then log the exact prompt and what it produced. Each agent must be used at least once.

- **@ui-agent:** See `docs/prompts.md` — Prompt 2 (Frontend). Used across 8 Agent Mode sessions:
  1. Initial scaffold — created all 17 frontend files (app.js, store.js, task-api.js, components, styles, index.html)
  2. Production upgrade — server-driven pagination, sort, search, workflow-aware modal (hides status on create, shows valid transitions on edit)
  3. Theme switching — dark/light mode with `[data-theme="dark"]` CSS tokens, localStorage + system preference, sun/moon toggle
  4. Board view — ClickUp-style Kanban with drag-and-drop (native HTML Drag API), status transition validation, colored column headers
  5. Modal fix — centered positioning, scroll lock, backdrop blur, click-outside-to-close
  6. Done-task edit prevention — hide edit button in table + board for done tasks
  7. Visual polish — contrast fixes, 32px icon hit areas, spacing scale tokens, tinted delete/complete buttons, consistent sizing
  8. Toast & feedback — entry/exit animations, progress bar, hover-to-pause, undo-delete, row flash on complete, slide-out on delete, status-aware drag messages
  → Modified: `app.js`, `store.js`, `task-table.js`, `board.js`, `toast.js`, `task-modal.js`, `theme-toggle.js`, `index.html`, `variables.css`, `main.css`, `components.css`
- **@backend-agent:** See `docs/prompts.md` — Prompt 1 (Backend) + backend production upgrade prompt.
  Session 1 (Prompt 1): Generated the full backend from scratch — 13 files, all layers (config, file store, response helpers, domain model, schemas, repository, service, routes, main). Every `def` has a docstring, `datetime.now(timezone.utc)` throughout, `/stats` registered before `/{task_id}`, all responses via `ok()`/`err()` envelope.
  Session 2 (upgrade prompt): Evolved `list_tasks` from a simple filter into a paginated, searchable, sortable endpoint. Locked `TaskCreate` status to `"todo"` only. Added `Query` constraints on the route layer to reject invalid enum/sort values at the HTTP boundary before they reach service logic.
- **@testing-agent:** See `docs/prompts.md` — Prompt 3 (Tests)
  → Generated 7 test files (51 unit+integration tests at 100% coverage + 5 E2E Playwright scenarios). Test layers: schema validation (direct model instantiation), service logic (direct function calls), repository persistence (direct repo calls), HTTP contract (TestClient round-trips), browser E2E (Playwright with `data-testid` selectors and API seeding). Each E2E test captures before/after screenshots to `tests/e2e/screenshots/`.

---

## 4. Review Agent

> Run this exact prompt in Copilot Chat after the backend routes file is complete:
> `Review apps/api/app/api/routes/tasks.py according to .github/copilot-instructions.md and list issues`
> Then fix every issue and log both what was found and what was changed.

**Issues found:**

1. `apps/api/app/api/routes/tasks.py` line 23 — `limit` query param declared with `le=500`, allowing pages of up to 500 items. Violates Rule 3 (inconsistent contract): the documented API cap is 100 and the service layer was designed around that bound.

2. `apps/api/app/api/routes/tasks.py` (POST `""` and PUT `/{task_id}`) — Pydantic v2 raises `422 Unprocessable Entity` for all schema validation failures, including a blank or missing `title`. Rule 3 requires `400` when title is missing or blank. No override existed, so a missing title was returning 422 instead of 400.

**Fixes applied:**

1. `apps/api/app/api/routes/tasks.py` line 23 — Changed `le=500` → `le=100` on the `limit` `Query` param so the HTTP contract matches the documented and service-layer maximum.

2. `apps/api/app/main.py` — Added a `RequestValidationError` exception handler. It iterates the Pydantic error list: if any error is on the `title` field it returns `400` with the standard `err(msg)` envelope; all other validation failures fall through to `422`. This keeps the correct HTTP semantics without coupling validation logic into route handlers.

---

## 5. Skills

> Skills used: `unit-testing-test-generate` and `tdd-workflow` (installed under `.agents/skills/`)

- **Skill:** `unit-testing-test-generate`
  **Prompt used:** See `docs/prompts.md` — Prompt 3 (Tests), invoked via `@testing-agent`. The skill was loaded before generating all pytest files and shaped the test structure.
  **Suggestion 1 applied:** Organise tests into three distinct layers — unit (direct function calls), integration (HTTP round-trips via `httpx` TestClient), and E2E (Playwright browser tests) — rather than a flat test file. Applied to `tests/unit/`, `tests/integration/`, and `tests/e2e/`.
  **Suggestion 2 applied:** Use fixture-seeded data over hardcoded JSON writes. The skill recommended factory-style fixtures (`task`, `in_progress_task`) that create tasks through the API itself, keeping tests coupled to behaviour not storage internals. Applied in `tests/conftest.py`.

- **Skill:** `tdd-workflow`
  **Prompt used:** Loaded before writing `tests/unit/test_service.py` to guide the RED→GREEN→REFACTOR cycle for the transition-validation and pagination logic.
  **Suggestion 1 applied:** Write one assertion per test with a behaviour-describing name (e.g. `test_complete_task_raises_422_when_already_done`) instead of multi-assertion omnibus tests. Applied across all 51 tests.
  **Suggestion 2 applied:** Test edge/error paths before happy paths (RED phase first). This caught the missing `todo → done` direct-transition guard early, before the complete implementation was written.

---

## 6. Playwright MCP

> Requires both the app running (`npm run dev` + `uv run uvicorn ...`) and `.vscode/mcp.json` present.
> In Agent Mode: `Use Playwright MCP to take a screenshot of http://localhost:5173 and generate an E2E test`

- **Screenshot taken:** yes — 9 screenshots saved to `apps/api/tests/e2e/screenshots/` (page load, modal open, task added, complete before/after, delete before/after, filter before/after)
- **E2E test generated:** `apps/api/tests/e2e/test_taskflow.py`
- **Prompt used:** See `docs/prompts.md` — Prompt 3 (Tests), section 7 (e2e/test_taskflow.py). Playwright MCP was used to observe the running app at `http://localhost:5173`, take screenshots, and inform the E2E test structure.
