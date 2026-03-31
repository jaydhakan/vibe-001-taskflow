# GitHub Copilot Developer Assignment

## Build a Task Management System
> ⏱️ **Time:** 3–4 hours  |  📦 **Submit:** Public GitHub repository link
* * *
## 📋 The Task
Build a **full-stack Task Management System** — a backend REST API + a browser-based frontend — using **any language or framework of your choice**.
**The goal is not just the app. It is to demonstrate how you use GitHub Copilot at every stage.**
* * *
## 📐 What to Build
### Backend REST API

| Method | Endpoint | Description |
| ---| ---| --- |
| `GET` | `/api/tasks` | List all tasks (supports `?status=` and `?priority=` filters) |
| `POST` | `/api/tasks` | Create a new task |
| `GET` | `/api/tasks/stats` | Return task counts grouped by status and priority |
| `GET` | `/api/tasks/:id` | Get a single task by ID |
| `PUT` | `/api/tasks/:id` | Update a task |
| `DELETE` | `/api/tasks/:id` | Delete a task |
| `POST` | `/api/tasks/:id/complete` | Mark a task as done |

**Each task must have:**

```cs
id           - UUID (auto-generated)
title        - string (required, 1–200 chars)
description  - string (optional)
status       - 'todo' | 'in-progress' | 'done'
priority     - 'low' | 'medium' | 'high'
createdAt    - ISO timestamp
updatedAt    - ISO timestamp
```

**Business rules:**
*   Status workflow: `todo → in-progress → done` (no skipping allowed)
*   Return `400` if title is missing, `404` if task not found, `422` for invalid status/priority
*   Persist tasks to a local file (`tasks.json` or equivalent)
* * *
### Frontend (HTML/CSS/JS)
*   Task list table: title, priority badge, status badge, created date
*   "Add Task" button → modal form
*   Edit, Delete, and Complete buttons on each row
*   Filter by status and priority (no page reload)
*   Live search bar (filters as you type)
*   Color-coded badges: priority (red/orange/green), status (gray/blue/green)
*   Loading indicators and error toast notifications
* * *
## 🤖 GitHub Copilot Feature Requirements
You **must** demonstrate all six features below. Evidence goes in `COPILOT-LOG.md`.
* * *
### 1 - Inline Comment Suggestions
Generate your core files by writing only comments and accepting Copilot tab completions.
*   Write a descriptive comment block at the top of each core file (model, business logic, API routes)
*   Press **Tab** to accept Copilot's suggestions — do not type the implementation manually
*   **Log:** At least 3 examples of `[comment written] → [code Copilot generated]` in `COPILOT-LOG.md`
* * *
### 2 - Agent Mode
Use **Agent Mode** for any prompt that spans multiple files.
*   Use it to generate the entire frontend
*   Use it to add a missing route or feature across backend + frontend together
*   **Log:** At least 3 Agent Mode prompts and what they produced
* * *
### 3 - Custom Sub-Agents
Create **3 sub-agent definition files**

| File | Role |
| ---| --- |
| `ui-agent.agent.md` | Frontend specialist — HTML, CSS, vanilla JS, loading states, error toasts |
| `backend-agent.agent.md` | Backend specialist — validation, HTTP status codes, business logic, docs |
| `testing-agent.agent.md` | Testing specialist — unit tests, E2E tests, >80% coverage |

Each file must define: `name`, `description`, `capabilities`, `context` (relevant source files), and `instructions`.
Use each agent **at least once** to generate real code and log the prompts.
* * *
### 4 - [AGENTS.md](http://AGENTS.md)
Create a root-level [`AGENTS.md`](http://AGENTS.md) that documents:
*   Project architecture and chosen tech stack
*   Backend and frontend coding standards
*   API response envelope — all endpoints must return `{ "success": bool, "data": ... }`
*   Description of your 3 sub-agents
*   Patterns to follow and patterns to avoid
* * *
### 5 - Review Agent (`copilot-instructions.md`)
Create `copilot-instructions.md` that instructs Copilot to review code for:
*   Docstrings/JSDoc on all public functions
*   Input validation on every POST/PUT route
*   Correct HTTP status codes (400/404/422/500)
*   No empty catch blocks
*   Frontend loading states and error handling
*   Test coverage >80%
Then run a review in Copilot Chat:

```css
Review [your main API file] according to .github/copilot-instructions.md and list issues
```

Fix the issues Copilot finds, and log what was found and what you fixed in `COPILOT-LOG.md`.
* * *
### 6 - Skills + Playwright MCP
**Skills** — install from the [skills.sh](https://skills.sh/) ecosystem:

```cs
  npx skills add vercel-labs/agent-skills
```

Use a skill in at least one Agent Mode prompt. Apply at least **2 suggestions** to your code and log them.
**Playwright MCP** — add `.vscode/mcp.json`:

```perl
{"servers": {"playwright": {"command": "npx","args": ["@playwright/mcp@latest", "--vision"]}}}


```

Use it in Agent Mode to **take a screenshot** of your running app and **generate at least one E2E test** from browser observation. Log the prompt you used.
* * *
## 🧪 Automated Testing

| Type | Minimum |
| ---| --- |
| Unit tests | \>80% coverage — all CRUD methods, validation errors, edge cases |
| E2E tests (Playwright) | Page load · add task · complete task · delete task · priority filter |

All tests must pass before submission.
* * *
## 📝 [COPILOT-LOG.md](http://COPILOT-LOG.md) (Required)

```less
# Copilot Usage Log## 1. Inline Suggestions- [file]: [comment typed] → [what Copilot generated]

## 2. Agent Mode Prompts- [prompt] → [files changed / result]

## 3. Sub-Agent Usage- @ui-agent: [prompt] → [result]
- @backend-agent: [prompt] → [result]
- @testing-agent: [prompt] → [result]

## 4. Review Agent- Issues found: ...
- Fixes applied: ...

## 5. Skills- Skill: [name] | Prompt: [prompt] | Changes: [what improved]

## 6. Playwright MCP- Screenshot taken: yes/no
- E2E test generated: [filename]
```

* * *
## 📦 Submission
1. Push to a **public GitHub repository**
2. Confirm all tests pass
3. Submit the repository URL
* * *
_Build with AI. Every feature should have a Copilot prompt behind it._
