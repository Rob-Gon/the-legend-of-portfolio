import { el } from '../core/dom.js';

/** Keycap for keyboard and round glyph for gamepad; CSS shows the one matching `data-input`. */
export function keyGlyph({ keyboard, gamepad }) {
  return [
    keyboard && el('kbd', { class: 'c-key c-key--kb', text: keyboard }),
    gamepad && el('span', { class: 'c-key c-key--pad', text: gamepad }),
  ];
}

/** Bottom-right action hints. `items`: [{ action, label, keys: { keyboard, gamepad } }]. */
export function hints({ label, items }) {
  return el(
    'ul',
    { class: 'c-hints', 'aria-label': label },
    items.map(({ action, label: text, keys }) =>
      el('li', {}, [
        el('button', { class: 'c-hints__button', type: 'button', dataset: { action } }, [
          el('span', { text }),
          ...keyGlyph(keys),
        ]),
      ]),
    ),
  );
}
