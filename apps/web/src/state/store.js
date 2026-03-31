/** @type {{ tasks: object[], filters: { status: string, priority: string }, searchText: string, selectedTask: object | null }} */
let state = {
  tasks: [],
  filters: { status: '', priority: '' },
  searchText: '',
  selectedTask: null,
};

/**
 * Returns a shallow copy of the current state.
 * Callers must not mutate the returned object.
 * @returns {typeof state}
 */
export function getState() {
  return { ...state };
}

/**
 * Merges a partial patch into state.
 * All state changes must go through this function.
 * @param {Partial<typeof state>} patch
 */
export function setState(patch) {
  state = { ...state, ...patch };
}
