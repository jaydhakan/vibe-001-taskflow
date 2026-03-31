const statusSelect = document.getElementById('status-filter');
const prioritySelect = document.getElementById('priority-filter');

/**
 * Attaches change listeners to the status and priority filter selects.
 * Should be called once during app init.
 * @param {(filters: { status: string, priority: string }) => void} onChange
 */
export function initFilters(onChange) {
  const emit = () => onChange({ status: statusSelect.value, priority: prioritySelect.value });
  statusSelect.addEventListener('change', emit);
  prioritySelect.addEventListener('change', emit);
}
