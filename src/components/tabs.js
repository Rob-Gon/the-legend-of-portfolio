import { el } from '../core/dom.js';
import { icon } from './icon.js';

/**
 * Icon tab row. Inactive tab names stay in the DOM (accessible name) but are visually hidden;
 * the active one is shown above its icon, as in the reference.
 * `items`: [{ id, iconName, label, controls? }]. `keys`: { prev, next } keycaps for the hint.
 */
export function tabs({ label, items, activeId, keys }) {
  const tabButtons = items.map(({ id, iconName, label: name, controls }) => {
    const active = id === activeId;
    return el(
      'button',
      {
        class: `c-tabs__tab${active ? ' is-active' : ''}`,
        type: 'button',
        role: 'tab',
        id: `tab-${id}`,
        'aria-selected': String(active),
        'aria-controls': controls,
        tabindex: active ? '0' : '-1',
        dataset: { id },
      },
      [el('span', { class: 'c-tabs__name', text: name }), icon(iconName)],
    );
  });

  return el('div', { class: 'c-tabs' }, [
    keys && el('kbd', { class: 'c-key c-tabs__key', 'aria-hidden': 'true', text: keys.prev }),
    el('div', { class: 'c-tabs__list', role: 'tablist', 'aria-label': label }, tabButtons),
    keys && el('kbd', { class: 'c-key c-tabs__key', 'aria-hidden': 'true', text: keys.next }),
  ]);
}
