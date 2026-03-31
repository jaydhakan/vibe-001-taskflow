const el = document.getElementById('loader');

/**
 * Shows the loading overlay and disables all [data-action] buttons.
 */
export function show() {
  el.hidden = false;
  document.querySelectorAll('[data-action]').forEach(btn => { btn.disabled = true; });
}

/**
 * Hides the loading overlay and re-enables all [data-action] buttons.
 */
export function hide() {
  el.hidden = true;
  document.querySelectorAll('[data-action]').forEach(btn => { btn.disabled = false; });
}
