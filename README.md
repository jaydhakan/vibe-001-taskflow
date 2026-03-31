# TaskFlow

A full-stack task management app — FastAPI backend + Vite/Vanilla JS frontend. Create, edit, filter, complete, and delete tasks with status/priority tracking.

---

## Stack

| Layer | Tech |
|---|---|
| Backend | FastAPI, Pydantic v2, Python 3.12, uv |
| Frontend | Vite, Vanilla JS (ES modules), Node 20 |
| Persistence | Local JSON file |

---

## Getting started

### Backend

```bash
cd apps/api
uv sync
uv run uvicorn app.main:app --reload
# API available at http://localhost:8000
```

### Frontend

```bash
cd apps/web
npm install
npm run dev
# App available at http://localhost:5173
```

The Vite dev server proxies `/api` requests to `http://localhost:8000` — no CORS setup needed.

---

## Tests

```bash
# Backend unit + integration (from apps/api/)
uv run pytest

# E2E — requires both servers running (from apps/api/)
uv run playwright install chromium   # first time only
uv run pytest tests/e2e
```

