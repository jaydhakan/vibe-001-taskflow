import { escapeHtml } from '../utils/dom.js';
import { priorityBadge, statusBadge } from './badge.js';

const tbody = document.querySelector('[data-testid="task-tbody"]');

const ICON_CHECK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 8.5 6.5 11.5 12.5 5"/></svg>';
const ICON_PENCIL = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 2.5l2.5 2.5L5 13.5H2.5V11z"/></svg>';
const ICON_TRASH = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4.5h10M6 4.5V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5m2 0V13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4.5"/></svg>';
const EMPTY_ICON = '<svg class="empty-state-icon" width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="10" width="32" height="28" rx="3"/><path d="M16 20h16M16 26h10"/></svg>';

/** @param {string} iso */
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Re-renders the task list. Replaces tbody.onclick each call — no duplicate listeners.
 * @param {object[]} tasks
 * @param {{ onEdit: (id: string) => void, onComplete: (id: string) => void, onDelete: (id: string) => void }} handlers
 * @param {boolean} hasActiveQuery - True when search/filters are active.
 */
export function renderTable(tasks, { onEdit, onComplete, onDelete }, hasActiveQuery) {
  if (tasks.length === 0) {
    const msg = hasActiveQuery
      ? 'No tasks match your filters'
      : 'No tasks yet — add one to get started';
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state-cell" data-testid="empty-state">
          ${EMPTY_ICON}
          <div class="empty-state-text">${msg}</div>
        </td>
      </tr>`;
    tbody.onclick = null;
    return;
  }

  const isDone = (s) => s === 'done';

  tbody.innerHTML = tasks.map(task => {
    const done = isDone(task.status);
    const completeBtn = task.status === 'in-progress'
      ? `<button type="button" class="btn-icon btn-icon-complete" data-action="complete" data-testid="complete-btn" aria-label="Mark as done" title="Complete">${ICON_CHECK}</button>`
      : '';
    return `
      <tr data-task-id="${escapeHtml(task.id)}" class="${done ? 'row-done' : ''}">
        <td>
          <div class="task-title">${escapeHtml(task.title)}</div>
          ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
        </td>
        <td>${statusBadge(task.status)}</td>
        <td>${priorityBadge(task.priority)}</td>
        <td>${formatDate(task.createdAt)}</td>
        <td class="row-actions">
          ${done ? '' : `<button type="button" class="btn-icon" data-action="edit" data-testid="edit-btn" aria-label="Edit task" title="Edit">${ICON_PENCIL}</button>`}
          ${completeBtn}
          <button type="button" class="btn-icon btn-icon-danger" data-action="delete" data-testid="delete-btn" aria-label="Delete task" title="Delete">${ICON_TRASH}</button>
        </td>
      </tr>`;
  }).join('');

  tbody.onclick = (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const row = btn.closest('[data-task-id]');
    if (!row) return;
    const id = row.dataset.taskId;
    const action = btn.dataset.action;
    if (action === 'edit') onEdit(id);
    else if (action === 'complete') onComplete(id);
    else if (action === 'delete') onDelete(id);
  };
}
