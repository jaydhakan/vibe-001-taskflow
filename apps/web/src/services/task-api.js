/**
 * Checks the response envelope and returns the unwrapped data payload.
 * Throws an Error with the server's message when success is false.
 * @param {Response} res
 * @returns {Promise<any>}
 */
async function unwrap(res) {
  const body = await res.json();
  if (!body.success) throw new Error(body.error?.message ?? 'Request failed');
  return body.data;
}

/**
 * Fetches all tasks, optionally filtered by status and/or priority.
 * @param {{ status?: string, priority?: string }} [filters]
 * @returns {Promise<object[]>}
 */
export async function getTasks(filters = {}) {
  const params = new URLSearchParams(
    Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
  );
  const res = await fetch(`/api/tasks${params.size ? `?${params}` : ''}`);
  return unwrap(res);
}

/**
 * Creates a new task.
 * @param {{ title: string, description?: string, priority?: string, status?: string }} data
 * @returns {Promise<object>}
 */
export async function createTask(data) {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return unwrap(res);
}

/**
 * Fetches a single task by ID.
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function getTask(id) {
  const res = await fetch(`/api/tasks/${id}`);
  return unwrap(res);
}

/**
 * Updates an existing task's fields.
 * @param {string} id
 * @param {{ title?: string, description?: string, priority?: string, status?: string }} data
 * @returns {Promise<object>}
 */
export async function updateTask(id, data) {
  const res = await fetch(`/api/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return unwrap(res);
}

/**
 * Deletes a task by ID.
 * @param {string} id
 * @returns {Promise<null>}
 */
export async function deleteTask(id) {
  const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
  return unwrap(res);
}

/**
 * Marks an in-progress task as done.
 * The backend rejects tasks that are not in-progress (422).
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function completeTask(id) {
  const res = await fetch(`/api/tasks/${id}/complete`, { method: 'POST' });
  return unwrap(res);
}

/**
 * Returns task counts grouped by status, by priority, and total.
 * @returns {Promise<{ by_status: object, by_priority: object, total: number }>}
 */
export async function getStats() {
  const res = await fetch('/api/tasks/stats');
  return unwrap(res);
}
