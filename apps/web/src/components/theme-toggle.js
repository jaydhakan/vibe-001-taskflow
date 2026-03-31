const STORAGE_KEY = 'taskflow-theme';
const ICON_SUN = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8" cy="8" r="3"/><path d="M8 1.5v1M8 13.5v1M2.75 2.75l.75.75M12.5 12.5l.75.75M1.5 8h1M13.5 8h1M2.75 13.25l.75-.75M12.5 3.5l.75-.75"/></svg>';
const ICON_MOON = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M13.5 8.5a5.5 5.5 0 0 1-7-7 5.5 5.5 0 1 0 7 7z"/></svg>';

const btn = document.getElementById('theme-toggle');

function getSystemPreference() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  btn.innerHTML = theme === 'dark' ? ICON_SUN : ICON_MOON;
  btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  btn.setAttribute('title', theme === 'dark' ? 'Light mode' : 'Dark mode');
}

/**
 * Initialises the theme from localStorage or system preference and wires the toggle.
 */
export function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  const theme = saved || getSystemPreference();
  applyTheme(theme);

  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  });

  // React to OS-level theme changes when no explicit preference saved
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });
}
