# Copilot Review Instructions

When reviewing any file in this project, check for **all** of the following. Report each
violation as a numbered issue with the filename and line reference.

---

## 1. Docstrings / JSDoc

- Every public Python function must have a docstring (single-line is fine for simple functions)
- Every exported JavaScript function must have a JSDoc comment (`/** ... */`)
- Violation: a `def` or `export function` with no doc comment above it

## 2. Input Validation

- Every `POST` and `PUT` route must validate:
  - `title` is present and between 1–200 characters
  - `status` (if provided) is one of `todo | in-progress | done`
  - `priority` (if provided) is one of `low | medium | high`
- Validation must happen via Pydantic `Field()` constraints or explicit service-layer checks
- Violation: a route that accepts user input without validating enum values or string length

## 3. HTTP Status Codes

- `201` for successful task creation
- `200` for successful read / update / delete
- `400` when title is missing or blank
- `404` when a task ID is not found
- `422` for invalid enum values or illegal status transitions
- `500` only for genuinely unexpected server errors — never for expected validation failures
- Violation: any mismatch between the situation and the code above

## 4. No Empty Catch Blocks

- Every `except` block (Python) must either log the error or re-raise it
- Every `catch` block (JavaScript) must either call `showToast(msg, 'error')`, log the error, or re-throw
- Violation: `except: pass`, `catch (e) {}`, or `catch (e) { }` with no body

## 5. Frontend Loading States

- Every function that calls the API must:
  1. Show a loading indicator (`loader.show()`) before the `await fetch(...)`
  2. Disable all relevant action buttons during the request
  3. Hide the loading indicator (`loader.hide()`) in a `finally` block
- Violation: an `async` function calling `fetch` without surrounding loading state management

## 6. Frontend Error Handling

- Every `fetch` call must be wrapped in `try/catch`
- The `catch` block must call `showToast(message, 'error')` with a user-friendly message
- Violation: a `fetch` call with no `try/catch`, or a `catch` that swallows the error silently

## 7. Test Coverage

- Backend test coverage must be **≥ 80%** (enforced by `--cov-fail-under=80` in `pytest.ini`)
- Tests must cover: nominal CRUD, missing title, invalid enum, invalid status transition,
  unknown task ID, list filtering, and stats endpoint shape
- Violation: missing test cases for any of the above scenarios

## 8. Response Envelope

- Every endpoint must return `{"success": true/false, "data": ...}` or `{"success": false, "error": {"message": "..."}}`
- Use `utils/response.py` helpers `ok(data)` and `err(msg)` — never construct raw dicts in route handlers
- Violation: a route that returns a plain dict, list, or string instead of the envelope shape
