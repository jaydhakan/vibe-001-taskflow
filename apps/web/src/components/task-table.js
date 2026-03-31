import { escapeHtml } from '../utils/dom.js';
import { priorityBadge, statusBadge } from './badge.js';

const tbody = document.querySelector('[data-testid="task-tbody"]');

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
 * Re-renders the task list into the table body and wires action delegation.
 * tbody.onclick is replaced on each render — no duplicate listeners accumulate.
 * @param {object[]} tasks - Tasks to display.
 * @param {{ onEdit: (id: string) => void, onComplete: (id: string) => void, onDelete: (id: string) => void }} handlers
 * @param {boolean} hasActiveQuery - True when search/filters are active (changes empty state message).
 */
export function renderTable(tasks, { onEdit, onComplete, onDelete }, hasActiveQuery) {
  if (tasks.length === 0) {
    const msg = hasActiveQuery
      ? 'No tasks match your filters'
      : 'No tasks yet — add one to get started';
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state-cell" data-testid="empty-state">
          ${msg}
        </td>
      </tr>`;
    tbody.onclick = null;
    return;
  }

  tbody.innerHTML = tasks.map(task => {
    const completeBtn = task.status === 'in-progress'
      ? `<button type="button" class="btn btn-sm btn-primary" data-action="complete" data-testid="complete-btn">Complete</button>`
      : '';
    return `
      <tr data-task-id="${escapeHtml(task.id)}">
        <td>
          <div class="task-title">${escapeHtml(task.title)}</div>
          ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
        </td>
        <td>${statusBadge(task.status)}</td>
        <td>${priorityBadge(task.priority)}</td>
        <td>${formatDate(task.createdAt)}</td>
        <td class="row-actions">
          <button type="button" class="btn btn-sm" data-action="edit" data-testid="edit-btn">Edit</button>
          ${completeBtn}
          <button type="button" class="btn btn-sm btn-danger" data-action="delete" data-testid="delete-btn">Delete</button>
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
