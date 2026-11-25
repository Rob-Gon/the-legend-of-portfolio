import { el } from '../core/dom.js';
import { icon } from './icon.js';

/**
 * Quest/project row. `status`: 'active' (tracked, ring marker), 'done' (greyed) or null.
 * Clicking it dispatches the `item` action with its id.
 */
export function listRow({ id, iconName, title, subtitle, status = null, selected = false }) {
  const modifier = status ? ` c-row--${status}` : '';

  return el(
    'li',
    {
      class: `c-row${modifier}${selected ? ' is-selected' : ''}`,
      role: 'option',
      id: `option-${id}`,
      'aria-selected': String(selected),
      tabindex: selected ? '0' : '-1',
      dataset: { action: 'item', id },
    },
    [
      el('span', { class: 'c-row__icon' }, iconName && icon(iconName)),
      el('span', { class: 'c-row__text' }, [
        el('span', { class: 'c-row__title', text: title }),
        subtitle && el('span', { class: 'c-row__subtitle', text: subtitle }),
      ]),
      el('span', { class: 'c-row__status', 'aria-hidden': 'true' }),
    ],
  );
}

export function list({ label, rows }) {
  return el('ul', { class: 'c-list', role: 'listbox', 'aria-label': label }, rows.map(listRow));
}
