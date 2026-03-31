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
 * Fetches tasks with server-side pagination, filtering, search, and sorting.
 * @param {{ page?: number, limit?: number, search?: string, status?: string, priority?: string, sort?: string, order?: string }} [query]
 * @returns {Promise<{ items: object[], page: number, limit: number, total: number, totalPages: number, hasNext: boolean, hasPrevious: boolean }>}
 */
export async function getTasks(query = {}) {
  const params = new URLSearchParams(
    Object.entries(query)
      .filter(([, v]) => v !== '' && v != null)
      .map(([k, v]) => [k, String(v)])
  );
  const qs = params.toString();
  const res = await fetch(`/api/tasks${qs ? `?${qs}` : ''}`);
  return unwrap(res);
}

/**
 * Creates a new task. Status is always "todo" (enforced by the backend).
 * @param {{ title: string, description?: string, priority?: string }} data
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
 * Updates an existing task. Only include status when it actually changed.
 * @param {string} id
 * @param {{ title?: string, description?: string | null, priority?: string, status?: string }} data
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
 * Marks an in-progress task as done. The backend rejects other statuses (422).
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
