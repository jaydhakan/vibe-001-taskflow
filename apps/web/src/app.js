import * as taskApi from './services/task-api.js';
import { getState, setState } from './state/store.js';
import { renderTable } from './components/task-table.js';
import { renderPagination } from './components/pagination.js';
import { renderBoard } from './components/board.js';
import { openModal, closeModal } from './components/task-modal.js';
import { initFilters } from './components/filters.js';
import { initSearchBar } from './components/search-bar.js';
import { initTheme } from './components/theme-toggle.js';
import * as loader from './components/loader.js';
import { showToast } from './components/toast.js';

const addBtn = document.getElementById('add-task-btn');
const cancelBtn = document.getElementById('cancel-btn');
const listViewBtn = document.getElementById('view-list-btn');
const boardViewBtn = document.getElementById('view-board-btn');
const mainEl = document.querySelector('main');
const boardEl = document.getElementById('board-view');

/** Re-renders the active view from current state. */
function render() {
  const { tasks, pagination, query, view } = getState();
  const hasActiveQuery = !!(query.search || query.status || query.priority);
  const handlers = { onEdit: handleEditTask, onComplete: handleCompleteTask, onDelete: handleDeleteTask };

  if (view === 'board') {
    mainEl.hidden = true;
    boardEl.hidden = false;
    renderBoard(tasks, { ...handlers, onDrop: handleBoardDrop });
  } else {
    mainEl.hidden = false;
    boardEl.hidden = true;
    renderTable(tasks, handlers, hasActiveQuery);
    renderPagination(pagination, query, { onPageChange: handlePageChange, onPageSizeChange: handlePageSizeChange });
  }
}

/** Fetches tasks using current query state and re-renders. */
async function refreshTasks() {
  const { query, view } = getState();
  // Board view needs all tasks (no pagination, no status filter) to fill all 3 columns
  const boardQuery = view === 'board'
    ? { ...query, limit: 200, page: 1, status: '' }
    : query;
  const result = await taskApi.getTasks(boardQuery);
  setState({
    tasks: result.items,
    pagination: {
      total: result.total,
      totalPages: result.totalPages,
      hasNext: result.hasNext,
      hasPrevious: result.hasPrevious,
    },
  });
  render();
}

/** Wraps refreshTasks with loader and error handling. */
async function handleRefresh() {
  loader.show();
  try {
    await refreshTasks();
  } catch (err) {
    showToast(err.message || 'Failed to load tasks', 'error');
  } finally {
    loader.hide();
  }
}

function handleAddTask() {
  openModal(null, {
    onSubmit: async (data) => {
      loader.show();
      try {
        await taskApi.createTask(data);
        closeModal();
        showToast('Task created', 'success');
        await refreshTasks();
      } catch (err) {
        showToast(err.message || 'Failed to create task', 'error');
      } finally {
        loader.hide();
      }
    },
  });
}

/** @param {string} taskId */
function handleEditTask(taskId) {
  const task = getState().tasks.find(t => t.id === taskId);
  if (!task) { showToast('Task not found', 'error'); return; }

  openModal(task, {
    onSubmit: async (data) => {
      if (data.status === task.status) delete data.status;
      loader.show();
      try {
        await taskApi.updateTask(taskId, data);
        closeModal();
        showToast('Task updated', 'success');
        await refreshTasks();
      } catch (err) {
        showToast(err.message || 'Failed to update task', 'error');
      } finally {
        loader.hide();
      }
    },
  });
}

/** @param {string} taskId */
async function handleCompleteTask(taskId) {
  // Immediate visual feedback — flash the row/card before the API call
  const row = document.querySelector(`[data-task-id="${taskId}"]`);
  if (row) row.classList.add(getState().view === 'board' ? 'board-card-completing' : 'row-completing');

  try {
    await taskApi.completeTask(taskId);
    showToast('Task completed', 'success');
    await refreshTasks();
  } catch (err) {
    showToast(err.message || 'Failed to complete task', 'error');
    // Remove animation class on failure so it looks normal again
    if (row) row.classList.remove('row-completing', 'board-card-completing');
  }
}

/** @param {string} taskId */
async function handleDeleteTask(taskId) {
  // Find the task data before deleting (for undo)
  const task = getState().tasks.find(t => t.id === taskId);

  // Immediate visual: animate the row/card out
  const el = document.querySelector(`[data-task-id="${taskId}"]`);
  if (el) {
    el.classList.add(getState().view === 'board' ? 'board-card-deleting' : 'row-deleting');
  }

  try {
    await taskApi.deleteTask(taskId);
    showToast('Task deleted', 'error', {
      duration: 5000,
      action: task ? {
        label: 'Undo',
        onClick: async () => {
          try {
            await taskApi.createTask({
              title: task.title,
              description: task.description || undefined,
              priority: task.priority,
            });
            showToast('Task restored', 'success');
            await refreshTasks();
          } catch (e) {
            showToast(e.message || 'Failed to restore task', 'error');
          }
        },
      } : undefined,
    });
    await refreshTasks();
  } catch (err) {
    showToast(err.message || 'Failed to delete task', 'error');
    if (el) el.classList.remove('row-deleting', 'board-card-deleting');
  }
}

/**
 * Handles a drag-and-drop status transition on the board.
 * @param {string} taskId
 * @param {string} newStatus
 */
/**
 * Human-readable toast messages for status transitions.
 * @type {Record<string, string>}
 */
const STATUS_MESSAGES = {
  'in-progress': 'Task moved to In Progress',
  'done': 'Task completed',
};

/**
 * Handles a drag-and-drop status transition on the board.
 * @param {string} taskId
 * @param {string} newStatus
 */
async function handleBoardDrop(taskId, newStatus) {
  // Immediate visual feedback on the card
  const card = document.querySelector(`[data-task-id="${taskId}"]`);
  if (card && newStatus === 'done') card.classList.add('board-card-completing');

  try {
    if (newStatus === 'done') {
      await taskApi.completeTask(taskId);
    } else {
      await taskApi.updateTask(taskId, { status: newStatus });
    }
    showToast(STATUS_MESSAGES[newStatus] || 'Task updated', 'success');
    await refreshTasks();
  } catch (err) {
    showToast(err.message || 'Failed to move task', 'error');
  }
}

/** @param {{ status: string, priority: string, sort: string, order: string }} filters */
function handleFiltersChange({ status, priority, sort, order }) {
  setState({ query: { ...getState().query, status, priority, sort, order, page: 1 } });
  handleRefresh();
}

/** @param {string} text */
function handleSearchChange(text) {
  setState({ query: { ...getState().query, search: text, page: 1 } });
  handleRefresh();
}

/** @param {number} page */
function handlePageChange(page) {
  setState({ query: { ...getState().query, page } });
  handleRefresh();
}

/** @param {number} limit */
function handlePageSizeChange(limit) {
  setState({ query: { ...getState().query, limit, page: 1 } });
  handleRefresh();
}

/** Switches between list and board views. */
function setView(view) {
  setState({ view });
  localStorage.setItem('taskflow-view', view);
  listViewBtn.setAttribute('aria-pressed', view === 'list');
  boardViewBtn.setAttribute('aria-pressed', view === 'board');
  handleRefresh();
}

/** Initialises the app. Must be called exactly once. */
export async function init() {
  initTheme();

  // Restore view toggle state
  const { view } = getState();
  listViewBtn.setAttribute('aria-pressed', view === 'list');
  boardViewBtn.setAttribute('aria-pressed', view === 'board');

  addBtn.addEventListener('click', handleAddTask);
  cancelBtn.addEventListener('click', closeModal);
  listViewBtn.addEventListener('click', () => setView('list'));
  boardViewBtn.addEventListener('click', () => setView('board'));
  initFilters(handleFiltersChange);
  initSearchBar(handleSearchChange);
  await handleRefresh();
}
