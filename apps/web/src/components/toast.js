const container = document.getElementById('toast-container');

/**
 * Displays a toast notification that auto-dismisses after 3 seconds.
 * @param {string} message - User-facing message to display.
 * @param {'success' | 'error' | 'info'} [type='info'] - Visual style of the toast.
 */
export function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
