import { el } from '../core/dom.js';
import { icon } from './icon.js';

/** Inventory cell. `label` is the accessible name (cells show no visible text besides the badge). */
export function gridCell({
  id,
  iconName,
  image,
  label,
  badge,
  featured = false,
  selected = false,
}) {
  const visual = image
    ? el('img', { class: 'c-cell__icon', src: image.src, alt: '', loading: 'lazy' })
    : iconName && icon(iconName, 'c-icon c-cell__icon');

  return el(
    'div',
    {
      class: `c-cell${featured ? ' c-cell--featured' : ''}${selected ? ' is-selected' : ''}`,
      role: 'gridcell',
      'aria-label': label,
      'aria-selected': String(selected),
      tabindex: selected ? '0' : '-1',
      dataset: { id },
    },
    [
      visual,
      badge != null && el('span', { class: 'c-cell__badge', 'aria-hidden': 'true' }, String(badge)),
    ],
  );
}

export function grid({ label, columns = 5, cells }) {
  const rows = [];
  for (let start = 0; start < cells.length; start += columns) {
    const rowCells = cells.slice(start, start + columns).map(gridCell);
    rows.push(el('div', { class: 'c-grid__row', role: 'row' }, rowCells));
  }
  return el('div', { class: 'c-grid', role: 'grid', 'aria-label': label }, rows);
}

/** Previous/next page arrow shown beside the grid. */
export function pager({ direction, label, disabled = false }) {
  return el(
    'button',
    {
      class: `c-pager c-pager--${direction}`,
      type: 'button',
      'aria-label': label,
      disabled,
      dataset: { action: direction === 'prev' ? 'prevPage' : 'nextPage' },
    },
    icon('chevron'),
  );
}
