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

- `apps/api/app/schemas/task.py`:
  `# Pydantic v2 model for creating a new task — title required 1–200 chars, priority defaults to medium`
  → _[TODO: paste what Copilot generated here]_

- `apps/api/app/services/task_service.py`:
  `# Enforce valid status transitions — todo can only go to in-progress, in-progress to done`
  → _[TODO: paste what Copilot generated here]_

- `apps/api/app/api/routes/tasks.py`:
  `# GET endpoint returning all tasks, supports optional ?status and ?priority query filters`
  → _[TODO: paste what Copilot generated here]_

---

## 2. Agent Mode Prompts

> For each entry: describe the exact prompt you gave in Agent Mode, and list which files
> were created or changed as a result. Minimum 3 prompts.

- **Prompt:** _[TODO: paste Agent Mode prompt]_
  **Result:** _[TODO: list files created/modified]_

- **Prompt:** _[TODO: paste Agent Mode prompt]_
  **Result:** _[TODO: list files created/modified]_

- **Prompt:** _[TODO: paste Agent Mode prompt]_
  **Result:** _[TODO: list files created/modified]_

---

## 3. Sub-Agent Usage

> For each sub-agent: invoke it in Agent Mode using @ui-agent / @backend-agent / @testing-agent,
> then log the exact prompt and what it produced. Each agent must be used at least once.

- **@ui-agent:** _[TODO: prompt]_ → _[TODO: result]_
- **@backend-agent:** _[TODO: prompt]_ → _[TODO: result]_
- **@testing-agent:** _[TODO: prompt]_ → _[TODO: result]_

---

## 4. Review Agent

> Run this exact prompt in Copilot Chat after the backend routes file is complete:
> `Review apps/api/app/api/routes/tasks.py according to .github/copilot-instructions.md and list issues`
> Then fix every issue and log both what was found and what was changed.

**Issues found:**
- _[TODO: list each issue Copilot identified]_

**Fixes applied:**
- _[TODO: describe each fix made]_

---

## 5. Skills

> Install: `npx skills add vercel-labs/agent-skills`
> Use the skill in at least one Agent Mode prompt and apply ≥ 2 of its suggestions.

- **Skill:** vercel-labs/agent-skills
  **Prompt:** _[TODO: paste the Agent Mode prompt that used the skill]_
  **Suggestion 1 applied:** _[TODO: describe change]_
  **Suggestion 2 applied:** _[TODO: describe change]_

---

## 6. Playwright MCP

> Requires both the app running (`npm run dev` + `uv run uvicorn ...`) and `.vscode/mcp.json` present.
> In Agent Mode: `Use Playwright MCP to take a screenshot of http://localhost:5173 and generate an E2E test`

- **Screenshot taken:** _[yes / no]_
- **E2E test generated:** `apps/api/tests/e2e/test_taskflow.py`
- **Prompt used:** _[TODO: paste exact Agent Mode prompt]_
