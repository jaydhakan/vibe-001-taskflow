const statusSelect = document.getElementById('status-filter');
const prioritySelect = document.getElementById('priority-filter');
const sortSelect = document.getElementById('sort-select');

/**
 * Attaches change listeners to status, priority, and sort controls.
 * Should be called once during app init.
 * @param {(filters: { status: string, priority: string, sort: string, order: string }) => void} onChange
 */
export function initFilters(onChange) {
  const emit = () => {
    const [sort, order] = sortSelect.value.split(':');
    onChange({ status: statusSelect.value, priority: prioritySelect.value, sort, order });
  };
  statusSelect.addEventListener('change', emit);
  prioritySelect.addEventListener('change', emit);
  sortSelect.addEventListener('change', emit);
}
