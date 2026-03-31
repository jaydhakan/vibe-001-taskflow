import { escapeHtml } from '../utils/dom.js';

const COLUMNS = [
  { key: 'todo', label: 'TODO', cssClass: 'board-col-todo' },
  { key: 'in-progress', label: 'IN PROGRESS', cssClass: 'board-col-in-progress' },
  { key: 'done', label: 'DONE', cssClass: 'board-col-done' },
];

/** Only forward transitions are valid for drag */
const VALID_DROP = { 'todo': ['in-progress'], 'in-progress': ['done'], 'done': [] };

const ICON_PENCIL = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 2.5l2.5 2.5L5 13.5H2.5V11z"/></svg>';
const ICON_TRASH = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4.5h10M6 4.5V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5m2 0V13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4.5"/></svg>';
const ICON_DESC = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 4.5h10M3 8h7"/></svg>';
const ICON_CALENDAR = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="12" height="11" rx="1.5"/><path d="M5 1.5v3M11 1.5v3M2 7h12"/></svg>';
const ICON_FLAG = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 14V2l9.5 4.5L3 9"/></svg>';

const PRIORITY_LABELS = { low: 'Low', medium: 'Med', high: 'High' };

const board = document.getElementById('board-view');

/** @param {string} iso */
function shortDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function renderCard(task) {
  const done = task.status === 'done';
  const draggable = !done && VALID_DROP[task.status]?.length > 0;
  return `
    <div class="board-card ${done ? 'board-card-done' : ''}"
         data-task-id="${escapeHtml(task.id)}"
         data-status="${escapeHtml(task.status)}"
         ${draggable ? 'draggable="true"' : ''}>
      <div class="board-card-top">
        <div class="board-card-title ${done ? 'board-card-title-done' : ''}">${escapeHtml(task.title)}</div>
        <div class="board-card-actions">
          ${done ? '' : `<button type="button" class="btn-icon" data-action="edit" aria-label="Edit task" title="Edit">${ICON_PENCIL}</button>`}
          <button type="button" class="btn-icon btn-icon-danger" data-action="delete" aria-label="Delete task" title="Delete">${ICON_TRASH}</button>
        </div>
      </div>
      ${task.description ? `<div class="board-card-desc-indicator">${ICON_DESC}</div>` : ''}
      <div class="board-card-meta">
        <span class="board-card-meta-item board-card-priority board-card-priority-${escapeHtml(task.priority)}">
          ${ICON_FLAG} ${PRIORITY_LABELS[task.priority] ?? escapeHtml(task.priority)}
        </span>
        ${task.createdAt ? `<span class="board-card-meta-item">${ICON_CALENDAR} ${shortDate(task.createdAt)}</span>` : ''}
      </div>
    </div>`;
}

/**
 * Renders a ClickUp-style Kanban board with drag-and-drop.
 * @param {object[]} tasks
 * @param {{ onEdit: (id: string) => void, onComplete: (id: string) => void, onDelete: (id: string) => void, onDrop: (id: string, newStatus: string) => void }} handlers
 */
export function renderBoard(tasks, { onEdit, onComplete, onDelete, onDrop }) {
  const grouped = { todo: [], 'in-progress': [], done: [] };
  for (const task of tasks) {
    if (grouped[task.status]) grouped[task.status].push(task);
  }

  board.innerHTML = COLUMNS.map(col => `
    <div class="board-column ${col.cssClass}" data-column="${col.key}">
      <div class="board-column-header">
        <div class="board-column-label">
          <span class="board-column-dot"></span>
          <span class="board-column-title">${col.label}</span>
        </div>
        <span class="board-column-count">${grouped[col.key].length}</span>
      </div>
      <div class="board-column-cards" data-drop-zone="${col.key}">
        ${grouped[col.key].length
          ? grouped[col.key].map(renderCard).join('')
          : '<div class="board-empty">No tasks</div>'}
      </div>
    </div>`).join('');

  // ── Click delegation (edit / delete) ──
  board.onclick = (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const card = btn.closest('[data-task-id]');
    if (!card) return;
    const id = card.dataset.taskId;
    const action = btn.dataset.action;
    if (action === 'edit') onEdit(id);
    else if (action === 'delete') onDelete(id);
  };

  // ── Drag and drop (property assignments — safe to call on re-render) ──
  let draggedId = null;
  let draggedStatus = null;

  board.ondragstart = (e) => {
    const card = e.target.closest('.board-card[draggable="true"]');
    if (!card) return;
    draggedId = card.dataset.taskId;
    draggedStatus = card.dataset.status;
    card.classList.add('board-card-dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedId);

    // Highlight valid drop columns
    const validTargets = VALID_DROP[draggedStatus] || [];
    for (const status of validTargets) {
      const zone = board.querySelector(`[data-drop-zone="${status}"]`);
      if (zone) zone.closest('.board-column').classList.add('board-column-drop-valid');
    }
  };

  board.ondragend = (e) => {
    const card = e.target.closest('.board-card');
    if (card) card.classList.remove('board-card-dragging');
    for (const col of board.querySelectorAll('.board-column')) {
      col.classList.remove('board-column-drop-valid', 'board-column-drop-over');
    }
    draggedId = null;
    draggedStatus = null;
  };

  board.ondragover = (e) => {
    const zone = e.target.closest('[data-drop-zone]');
    if (!zone || !draggedStatus) return;
    const targetStatus = zone.dataset.dropZone;
    const valid = (VALID_DROP[draggedStatus] || []).includes(targetStatus);
    if (!valid) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    zone.closest('.board-column').classList.add('board-column-drop-over');
  };

  board.ondragleave = (e) => {
    const zone = e.target.closest('[data-drop-zone]');
    if (!zone) return;
    const col = zone.closest('.board-column');
    if (!col.contains(e.relatedTarget)) {
      col.classList.remove('board-column-drop-over');
    }
  };

  board.ondrop = (e) => {
    e.preventDefault();
    const zone = e.target.closest('[data-drop-zone]');
    if (!zone || !draggedId || !draggedStatus) return;
    const targetStatus = zone.dataset.dropZone;
    const valid = (VALID_DROP[draggedStatus] || []).includes(targetStatus);
    if (!valid || targetStatus === draggedStatus) return;
    onDrop(draggedId, targetStatus);
  };
}

