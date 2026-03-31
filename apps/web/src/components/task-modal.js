const dialog = document.getElementById('task-modal');
const form = document.getElementById('task-form');
const modalHeading = document.getElementById('modal-heading');
const titleInput = document.getElementById('title-input');
const descInput = document.getElementById('description-input');
const prioritySelect = document.getElementById('priority-select');
const statusSelect = document.getElementById('status-select');
const statusGroup = document.getElementById('status-group');

const VALID_NEXT = {
  'todo': ['todo', 'in-progress'],
  'in-progress': ['in-progress', 'done'],
  'done': ['done'],
};
const STATUS_LABELS = { 'todo': 'Todo', 'in-progress': 'In Progress', 'done': 'Done' };

dialog.addEventListener('close', () => {
  form.reset();
  form.onsubmit = null;
});

/**
 * Opens the task modal. Create mode hides status (backend forces "todo").
 * Edit mode shows only valid status transitions for the current task.
 * @param {object | null} task - Existing task to edit, or null to create.
 * @param {{ onSubmit: (data: object) => Promise<void> }} options
 */
export function openModal(task, { onSubmit }) {
  const isEdit = task !== null;
  modalHeading.textContent = isEdit ? 'Edit Task' : 'Add Task';
  statusGroup.hidden = !isEdit;

  if (isEdit) {
    titleInput.value = task.title;
    descInput.value = task.description ?? '';
    prioritySelect.value = task.priority;
    const allowed = VALID_NEXT[task.status] ?? [task.status];
    statusSelect.innerHTML = allowed
      .map(s => `<option value="${s}" ${s === task.status ? 'selected' : ''}>${STATUS_LABELS[s] ?? s}</option>`)
      .join('');
  } else {
    form.reset();
    prioritySelect.value = 'medium';
  }

  form.onsubmit = async (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();

    if (!title) {
      titleInput.setCustomValidity('Title is required');
      titleInput.reportValidity();
      return;
    }
    if (title.length > 200) {
      titleInput.setCustomValidity('Title must be 200 characters or fewer');
      titleInput.reportValidity();
      return;
    }
    titleInput.setCustomValidity('');

    const data = { title, priority: prioritySelect.value };

    if (isEdit) {
      data.status = statusSelect.value;
      data.description = descInput.value.trim() || null;
    } else {
      const desc = descInput.value.trim();
      if (desc) data.description = desc;
    }

    await onSubmit(data);
  };

  dialog.showModal();
  titleInput.focus();
}

/**
 * Closes the task modal. The dialog's close event handles form reset.
 */
export function closeModal() {
  dialog.close();
}
