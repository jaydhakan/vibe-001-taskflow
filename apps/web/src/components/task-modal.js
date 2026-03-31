const dialog = document.getElementById('task-modal');
const form = document.getElementById('task-form');
const modalHeading = document.getElementById('modal-heading');
const titleInput = document.getElementById('title-input');
const descInput = document.getElementById('description-input');
const prioritySelect = document.getElementById('priority-select');
const statusSelect = document.getElementById('status-select');

// Reset form and clear handler whenever the dialog closes (including Escape key).
dialog.addEventListener('close', () => {
  form.reset();
  form.onsubmit = null;
});

/**
 * Opens the task modal for creating or editing a task.
 * Focuses the title input after opening.
 * @param {object | null} task - Existing task to edit, or null to create a new one.
 * @param {{ onSubmit: (data: object) => Promise<void> }} options
 */
export function openModal(task, { onSubmit }) {
  modalHeading.textContent = task ? 'Edit Task' : 'Add Task';

  if (task) {
    titleInput.value = task.title;
    descInput.value = task.description ?? '';
    prioritySelect.value = task.priority;
    statusSelect.value = task.status;
  } else {
    form.reset();
    prioritySelect.value = 'medium';
    statusSelect.value = 'todo';
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

    const data = {
      title,
      priority: prioritySelect.value,
      status: statusSelect.value,
    };
    const desc = descInput.value.trim();
    if (desc) data.description = desc;

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
