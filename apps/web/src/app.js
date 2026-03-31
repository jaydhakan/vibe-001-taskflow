import * as taskApi from './services/task-api.js';
import { getState, setState } from './state/store.js';
import { renderTable } from './components/task-table.js';
import { openModal, closeModal } from './components/task-modal.js';
import { initFilters } from './components/filters.js';
import { initSearchBar } from './components/search-bar.js';
import * as loader from './components/loader.js';
import { showToast } from './components/toast.js';

const addBtn = document.getElementById('add-task-btn');
const cancelBtn = document.getElementById('cancel-btn');

/** Re-renders the table from current state, applying the search text filter client-side. */
function render() {
  const { tasks, searchText } = getState();
  const visible = searchText
    ? tasks.filter(t => t.title.toLowerCase().includes(searchText.toLowerCase()))
    : tasks;
  renderTable(visible, {
    onEdit: handleEditTask,
    onComplete: handleCompleteTask,
    onDelete: handleDeleteTask,
  });
}

/** Fetches the current task list from the API and re-renders. */
async function refreshTasks() {
  const tasks = await taskApi.getTasks(getState().filters);
  setState({ tasks });
  render();
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

/** @param {{ status: string, priority: string }} filters */
async function handleFiltersChange(filters) {
  setState({ filters });
  loader.show();
  try {
    await refreshTasks();
  } catch (err) {
    showToast(err.message || 'Failed to load tasks', 'error');
  } finally {
    loader.hide();
  }
}

/** @param {string} text */
function handleSearchChange(text) {
  setState({ searchText: text });
  render();
}

/** Initialises the app. Must be called exactly once. */
export async function init() {
  addBtn.addEventListener('click', handleAddTask);
  cancelBtn.addEventListener('click', closeModal);
  initFilters(handleFiltersChange);
  initSearchBar(handleSearchChange);

  loader.show();
  try {
    await refreshTasks();
  } catch (err) {
    showToast(err.message || 'Failed to load tasks', 'error');
  } finally {
    loader.hide();
  }
}
