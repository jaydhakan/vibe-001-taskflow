const container = document.getElementById('toast-container');

const ICONS = {
  success: '<svg viewBox="0 0 16 16" fill="none" stroke-linecap="round"><circle cx="8" cy="8" r="6" fill="currentColor" opacity=".15"/><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M5.5 8.5 7 10l3.5-4" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  error:   '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8" cy="8" r="6" fill="currentColor" opacity=".15"/><circle cx="8" cy="8" r="6"/><path stroke-width="2" d="M10 6 6 10M6 6l4 4"/></svg>',
  info:    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8" cy="8" r="6" fill="currentColor" opacity=".15"/><circle cx="8" cy="8" r="6"/><path stroke-width="2" d="M8 7v4M8 5v.01"/></svg>',
};

const TOAST_DURATION = 3500;

function dismissToast(toast) {
  toast.classList.add('toast-out');
  toast.addEventListener('animationend', () => toast.remove(), { once: true });
}

/**
 * Displays a toast notification with entry/exit animation and a timed progress bar.
 * @param {string} message
 * @param {'success' | 'error' | 'info'} [type='info']
 * @param {{ duration?: number, action?: { label: string, onClick: () => void } }} [options]
 */
export function showToast(message, type = 'info', options = {}) {
  const duration = options.duration ?? TOAST_DURATION;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  // Icon
  const iconWrap = document.createElement('span');
  iconWrap.className = 'toast-icon';
  iconWrap.innerHTML = ICONS[type] ?? '';
  toast.appendChild(iconWrap);

  // Message text
  const text = document.createElement('span');
  text.className = 'toast-message';
  text.textContent = message;
  toast.appendChild(text);

  // Optional action button (e.g. "Undo")
  if (options.action) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'toast-action';
    btn.textContent = options.action.label;
    btn.addEventListener('click', () => {
      options.action.onClick();
      dismissToast(toast);
    });
    toast.appendChild(btn);
  }

  // Progress bar
  const bar = document.createElement('div');
  bar.className = 'toast-progress';
  bar.style.animationDuration = `${duration}ms`;
  toast.appendChild(bar);

  container.appendChild(toast);

  const timer = setTimeout(() => dismissToast(toast), duration);

  // Pause timer on hover
  toast.addEventListener('mouseenter', () => {
    clearTimeout(timer);
    bar.style.animationPlayState = 'paused';
  });
  toast.addEventListener('mouseleave', () => {
    bar.style.animationPlayState = 'running';
    // Restart with remaining visual time (approximate — good enough)
    setTimeout(() => dismissToast(toast), 1500);
  });
}
