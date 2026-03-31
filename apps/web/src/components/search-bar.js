const input = document.getElementById('search-input');

/**
 * Attaches a debounced input listener to the search bar.
 * Should be called once during app init.
 * @param {(text: string) => void} onChange - Called 300ms after the user stops typing.
 */
export function initSearchBar(onChange) {
  let timer;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => onChange(input.value), 300);
  });
}
