# TaskFlow — Agent & Project Guidelines

> **Status:** Mostly complete. After project code is implemented, update:
> - Architecture section if folder structure changes
> - Build/test commands if they differ from what's listed here
> - Sub-agent context paths once final file names are confirmed

---

## Architecture

TaskFlow is a **monorepo** with two independent apps:

```
vibe-001-taskflow/
├─ apps/api/        ← FastAPI backend (Python 3.12, uv)
│  ├─ app/
│  │  ├─ api/routes/tasks.py       ← HTTP layer (thin routes only)
│  │  ├─ services/task_service.py  ← all business logic
│  │  ├─ repositories/task_repo.py ← JSON persistence
│  │  ├─ schemas/task.py           ← Pydantic request/response models
│  │  ├─ utils/file_store.py       ← atomic file I/O
│  │  ├─ utils/response.py         ← ok() / err() envelope helpers
│  │  └─ main.py                   ← FastAPI app + CORS
│  └─ tests/
│     ├─ conftest.py               ← tmp_path test isolation
│     ├─ unit/
│     └─ integration/
└─ apps/web/        ← Vite + Vanilla JS frontend (Node 20)
   ├─ src/
   │  ├─ components/               ← task-table, task-modal, filters, search-bar, badge, loader, toast
   │  ├─ services/task-api.js      ← all fetch wrappers
   │  ├─ state/store.js            ← single source of truth
   │  └─ app.js                    ← orchestration
   └─ tests/e2e/test_taskflow.py ← Playwright E2E (Python)
```

**Communication:** Frontend calls `/api/*` — proxied to `http://localhost:8000` by Vite in dev. Backend sets `CORSMiddleware` for `localhost:5173` for production/other clients.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Backend runtime | Python + uv | 3.12 |
| Backend framework | FastAPI + Pydantic v2 | 0.111+ / 2.7+ |
| Backend server | Uvicorn | 0.29+ |
| Frontend build | Vite | 5+ |
| Frontend language | Vanilla JS (ES modules) | Node 20 LTS |
| Backend tests | pytest + pytest-cov + httpx + pytest-playwright | 8+ / 5+ / 0.27+ / 0.5+ |

---

## API Response Envelope

**Every endpoint — success and error — must return this shape:**

```json
{ "success": true, "data": <payload> }
```

```json
{ "success": false, "error": { "message": "<reason>" } }
```

- `data` is an object, array, or `null` (never omitted)
- `error.message` is always a human-readable string
- HTTP status codes are set correctly alongside the envelope
- Use `utils/response.py` helpers `ok(data)` and `err(msg)` — never construct dicts manually in routes

**Status Response Shape:**
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

## Backend Coding Standards

- **Routes are thin.** Routes call one service method and return the result. No business logic in route files.
- **All business logic is in `task_service.py`.** Status transitions, validation beyond Pydantic, timestamp updates, UUID generation — all live here.
- **Repository handles persistence only.** `task_repo.py` reads/writes JSON. It knows nothing about business rules.
- **Atomic file writes.** `file_store.py` writes to a `.tmp` file then calls `os.replace()`. Never write directly to the live file.
- **Status transitions are enforced via map:**
  ```python
  VALID_TRANSITIONS = {"todo": ["in-progress"], "in-progress": ["done"], "done": []}
  ```
  Both `update_task()` (when status is in payload) and `complete_task()` must use this map.
- **`/complete` specific rule:** only `in-progress → done` is valid. `todo` or `done` input raises 422.
- **Route registration order:** `GET /api/tasks/stats` must be registered **before** `GET /api/tasks/{id}`.
- **Docstrings on all public functions.**
- **No empty `except` blocks.** Log or re-raise.
- **IDs are `str(uuid.uuid4())`** — stored as strings, never UUID objects.
- **Timestamps are UTC ISO strings:** `datetime.now(timezone.utc).isoformat()` — `datetime.utcnow()` is deprecated in Python 3.12

### HTTP Status Code Reference

| Situation | Code |
|---|---|
| Success create | 201 |
| Success read/update | 200 |
| Success delete | 200 with `"data": null` |
| Missing/invalid title | 400 |
| Task not found | 404 |
| Invalid enum or transition | 422 |
| Unexpected error | 500 |

---

## Frontend Coding Standards

- **One source of truth.** `state/store.js` holds all state: tasks, filters, searchText, loading, selectedTask.
- **Re-render from state.** Every mutation (create/update/delete/complete) refetches from the API and re-renders from the new state object.
- **Modular components.** Each file in `components/` exports one function/object. No inline logic in `app.js` beyond orchestration.
- **All API calls go through `task-api.js`.** No direct `fetch()` calls in components.
- **Every API call shows loading state.** Disable buttons + show spinner before request; restore after.
- **Every error shows a toast.** All `catch` blocks call `showToast(msg, 'error')`.
- **JSDoc on all exported functions.**
- **No empty `catch` blocks.**
- **Search is client-side** (title field, 300 ms debounce). Status/priority filters use server-side query params.
- **Complete button is hidden when status is `"done"`.**

### Badge Color Tokens

```css
/* Priority */
--priority-high:   #ef4444;
--priority-medium: #f97316;
--priority-low:    #22c55e;

/* Status */
--status-todo:        #6b7280;
--status-in-progress: #3b82f6;
--status-done:        #22c55e;
```

---

## Build & Test Commands

```bash
# Backend (from apps/api/)
uv sync                                     # install deps
uv run uvicorn app.main:app --reload        # run API on :8000
uv run pytest                               # run all tests with coverage
uv run ruff check app/                      # lint

# Frontend (from apps/web/)
npm install                                 # install deps
npm run dev                                 # run on :5173 with /api proxy
npm run build                               # production build

# E2E (from apps/api/ — Python Playwright via pytest-playwright)
uv run playwright install chromium          # first-time browser install
uv run pytest tests/e2e                     # run E2E tests
uv run pytest tests/e2e --headed            # headed mode for debugging
```

---

## Sub-Agents

Three specialist agents are defined in `.github/agents/`. Use them in Copilot Agent Mode by referencing `@<name>`.

| Agent | File | Responsibility |
|---|---|---|
| `ui-agent` | `.github/agents/ui-agent.agent.md` | All frontend work — HTML, CSS, Vanilla JS, loading states, toasts, Playwright tests |
| `backend-agent` | `.github/agents/backend-agent.agent.md` | All backend work — FastAPI routes, Pydantic schemas, service logic, validation, HTTP codes |
| `testing-agent` | `.github/agents/testing-agent.agent.md` | All testing — pytest unit/integration, Playwright E2E, coverage, edge cases |

---

## Patterns to Follow

- Thin routes → service layer → repository (layered architecture)
- `ok(data)` / `err(msg)` for every response — never raw dicts
- Pydantic models for all request/response shapes
- `Field(min_length=1, max_length=200)` for title validation
- `tmp_path` fixture in `conftest.py` to isolate every test
- CSS custom properties (variables) for all colors and spacing
- `await Promise.all([...])` when multiple independent fetches are needed
- Refetch after every mutation — no optimistic updates needed here

## Patterns to Avoid

- ❌ Business logic inside route handlers
- ❌ Direct `open()` / `json.dump()` calls inside repository or routes — use `file_store.py`
- ❌ Empty `except` / `catch` blocks
- ❌ Inconsistent response shapes — always use the envelope
- ❌ Calling `fetch()` directly in component files
- ❌ Putting all frontend logic into `app.js`
- ❌ Skipping status transition validation when updating via PUT
- ❌ Registering `/{id}` route before `/stats`
- ❌ Writing to `tasks.json` directly in tests — use `tmp_path`

---

## Human-Quality Code Expectations

These apply to all agents producing code for this project.

- Prefer straightforward code over framework-like abstractions
- Do not create helper functions unless they reduce actual repetition or improve clarity
- Avoid repetitive comments and obvious JSDoc that merely restates what the code does
- Avoid generic names (`handleData`, `renderUI`, `processItem`) when a precise name is possible
- Keep modules small, but do not split files purely for the sake of splitting
- Optimize for working software and readability, not prompt compliance

---

## Initialization Discipline (Frontend)

- App initialization is idempotent — `init()` is safe to call once only
- Event listeners on stable DOM roots (filters, search, add-button, modal) are attached once at init, never re-attached on re-render
- Table uses event delegation (`tbody.onclick` replaced on render, not `addEventListener` in a loop)
- Stable DOM roots (modal, tbody) are cached in module scope, not queried inside render functions

---

## Accessibility Requirements (Frontend)

- All form inputs have associated `<label>` elements
- Modal receives focus on open (first input) and restores it sensibly on close
- Toast container uses `aria-live="polite"` for screen reader announcements
- Hidden elements are not keyboard-focusable (`hidden` attribute or `display:none`)
- All `<button>` elements have explicit `type="button"` or `type="submit"`

---

## Frontend Review Checklist

Before finishing any frontend work, verify:

- [ ] All `fetch()` calls are in `task-api.js` only
- [ ] Every exported function has useful (not filler) JSDoc
- [ ] Every API call follows `showLoader → try → catch(showToast) → finally(hideLoader)`
- [ ] No empty `catch` blocks
- [ ] No direct state mutation outside `setState()`
- [ ] All user content is escaped before `innerHTML`
- [ ] All required `data-testid` attributes are present
- [ ] No duplicate event listeners after re-render
- [ ] Modal focuses first input on open; form resets on close
- [ ] `vite build` passes with no errors
