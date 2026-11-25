import { el } from '../core/dom.js';

/**
 * Vertical list of large buttons (title menu, System). `items`: [{ action, label }] for app
 * actions, or [{ href, label }] for a real link (e.g. Quick mode, a separate static page).
 */
export function menu({ label, items }) {
  return el(
    'ul',
    { class: 'c-menu', 'aria-label': label },
    items.map(({ action, href, label: text }) =>
      el('li', {}, [
        href
          ? el('a', { class: 'c-button c-menu__button', href }, text)
          : el(
              'button',
              { class: 'c-button c-menu__button', type: 'button', dataset: { action } },
              text,
            ),
      ]),
    ),
  );
}

/** Quick mode page for the current language (static, generated at build time). */
export const quickModeHref = (lang) =>
  `${import.meta.env.BASE_URL}${lang === 'es' ? '' : `${lang}/`}quick/`;

/**
 * Moves focus up/down the menu buttons (or `selector` matches) inside `container`.
 * Returns false if there are none.
 */
export function moveMenuFocus(container, step, selector = '.c-menu__button') {
  const buttons = [...container.querySelectorAll(selector)];
  if (!buttons.length) return false;
  const current = buttons.indexOf(document.activeElement);
  const next = current === -1 ? 0 : Math.min(Math.max(current + step, 0), buttons.length - 1);
  buttons[next].focus();
  return true;
}
