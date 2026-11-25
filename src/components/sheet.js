import { el } from '../core/dom.js';
import { icon } from './icon.js';

// Mobile detail: a native modal <dialog> sliding up from the bottom. The browser traps focus and
// closes it with Esc; only one sheet exists at a time.
let current = null;

export function isSheetOpen() {
  return Boolean(current?.open);
}

export function closeSheet() {
  if (current?.open) current.close();
}

/** `labelledBy`: id of the title inside `content`; `onClose` restores focus to the trigger. */
export function openSheet({ content, labelledBy, closeLabel, onClose }) {
  closeSheet();
  const dialog = el('dialog', { class: 'c-sheet', 'aria-labelledby': labelledBy }, [
    el(
      'button',
      {
        class: 'c-sheet__close',
        type: 'button',
        'aria-label': closeLabel,
        onclick: () => dialog.close(),
      },
      icon('close'),
    ),
    el('div', { class: 'c-sheet__body' }, content),
  ]);
  // Tapping the backdrop (the dialog itself, outside its content) closes it too.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    dialog.remove();
    if (current === dialog) current = null;
    onClose?.();
  });
  document.body.append(dialog);
  current = dialog;
  dialog.showModal();
  return dialog;
}
