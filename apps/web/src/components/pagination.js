const container = document.getElementById('pagination');

/**
 * Renders pagination controls below the task table.
 * Replaces onclick/onchange each call — no duplicate listeners.
 * @param {{ total: number, totalPages: number, hasNext: boolean, hasPrevious: boolean }} pagination
 * @param {{ page: number, limit: number }} query
 * @param {{ onPageChange: (page: number) => void, onPageSizeChange: (limit: number) => void }} handlers
 */
export function renderPagination(pagination, query, { onPageChange, onPageSizeChange }) {
  const { total, totalPages, hasNext, hasPrevious } = pagination;
  const { page, limit } = query;

  if (total === 0) {
    container.innerHTML = '';
    return;
  }

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  container.innerHTML = `
    <span class="pagination-info">${start}–${end} of ${total}</span>
    <div class="pagination-controls">
      <select class="page-size-select" aria-label="Page size">
        ${[10, 20, 50].map(n =>
          `<option value="${n}" ${n === limit ? 'selected' : ''}>${n} / page</option>`
        ).join('')}
      </select>
      <button type="button" class="btn btn-sm" ${hasPrevious ? '' : 'disabled'} data-page="${page - 1}" aria-label="Previous page">&#8249; Prev</button>
      <span class="page-indicator">${page} / ${totalPages}</span>
      <button type="button" class="btn btn-sm" ${hasNext ? '' : 'disabled'} data-page="${page + 1}" aria-label="Next page">Next &#8250;</button>
    </div>`;

  container.onclick = (e) => {
    const btn = e.target.closest('[data-page]');
    if (btn && !btn.disabled) onPageChange(Number(btn.dataset.page));
  };

  const sizeSelect = container.querySelector('.page-size-select');
  sizeSelect.onchange = () => onPageSizeChange(Number(sizeSelect.value));
}
