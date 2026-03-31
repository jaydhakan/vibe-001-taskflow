let state = {
  tasks: [],
  pagination: { total: 0, totalPages: 1, hasNext: false, hasPrevious: false },
  query: { page: 1, limit: 20, search: '', status: '', priority: '', sort: 'createdAt', order: 'desc' },
  selectedTask: null,
  view: localStorage.getItem('taskflow-view') || 'list',
};

/**
 * Returns a shallow copy of the current state.
 * @returns {typeof state}
 */
export function getState() {
  return { ...state };
}

/**
 * Merges a partial patch into state. All state changes must go through this function.
 * @param {Partial<typeof state>} patch
 */
export function setState(patch) {
  state = { ...state, ...patch };
}
