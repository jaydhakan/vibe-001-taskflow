import { escapeHtml } from '../utils/dom.js';

const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High' };
const STATUS_LABELS = { todo: 'Todo', 'in-progress': 'In Progress', done: 'Done' };

/**
 * Returns an HTML badge string for a priority value.
 * @param {string} priority - 'low' | 'medium' | 'high'
 * @returns {string}
 */
export function priorityBadge(priority) {
  const label = PRIORITY_LABELS[priority] ?? escapeHtml(priority);
  return `<span class="badge badge-priority-${escapeHtml(priority)}">${label}</span>`;
}

/**
 * Returns an HTML badge string for a status value.
 * @param {string} status - 'todo' | 'in-progress' | 'done'
 * @returns {string}
 */
export function statusBadge(status) {
  const label = STATUS_LABELS[status] ?? escapeHtml(status);
  return `<span class="badge badge-status-${escapeHtml(status)}">${label}</span>`;
}
