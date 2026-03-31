import * as taskApi from './services/task-api.js';
import { getState, setState } from './state/store.js';
import { renderTable } from './components/task-table.js';
import { renderPagination } from './components/pagination.js';
import { openModal, closeModal } from './components/task-modal.js';
import { initFilters } from './components/filters.js';
import { initSearchBar } from './components/search-bar.js';
import * as loader from './components/loader.js';
import { showToast } from './components/toast.js';

const addBtn = document.getElementById('add-task-btn');
const cancelBtn = document.getElementById('cancel-btn');

/** Re-renders table and pagination from current state. */
function render() {
  const { tasks, pagination, query } = getState();
  const hasActiveQuery = !!(query.search || query.status || query.priority);
  renderTable(tasks, { onEdit: handleEditTask, onComplete: handleCompleteTask, onDelete: handleDeleteTask }, hasActiveQuery);
  renderPagination(pagination, query, { onPageChange: handlePageChange, onPageSizeChange: handlePageSizeChange });
}

/** Fetches tasks using current query state and re-renders. */
async function refreshTasks() {
  const result = await taskApi.getTasks(getState().query);
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
  loader.show();
  try {
    await taskApi.completeTask(taskId);
    showToast('Task completed', 'success');
    await refreshTasks();
  } catch (err) {
    showToast(err.message || 'Failed to complete task', 'error');
  } finally {
    loader.hide();
  }
}

/** @param {string} taskId */
async function handleDeleteTask(taskId) {
  loader.show();
  try {
    await taskApi.deleteTask(taskId);
    showToast('Task deleted', 'success');
    await refreshTasks();
  } catch (err) {
    showToast(err.message || 'Failed to delete task', 'error');
  } finally {
    loader.hide();
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

/** Initialises the app. Must be called exactly once. */
export async function init() {
  addBtn.addEventListener('click', handleAddTask);
  cancelBtn.addEventListener('click', closeModal);
  initFilters(handleFiltersChange);
  initSearchBar(handleSearchChange);
  await handleRefresh();
}
