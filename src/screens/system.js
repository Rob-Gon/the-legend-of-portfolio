import { el } from '../core/dom.js';
import { t } from '../core/i18n.js';
import { menu, moveMenuFocus } from '../components/menu.js';

// shortcut: only Guide, language and back-to-title for now; volumes, motion and shortcut
// toggles arrive with audio in M6.
let root = null;

export function mount(target) {
  root = target;
  root.replaceChildren(
    menu({
      label: t('a11y.systemMenu'),
      items: [
        { action: 'guide', label: t('system.guide') },
        { action: 'language', label: t('title.languageCurrent', { name: t('meta.langName') }) },
        { action: 'title', label: t('system.backToTitle') },
      ],
    }),
    el('p', { class: 's-system__disclaimer', text: t('meta.disclaimer') }),
  );
}

export function handle(action) {
  if (action.type === 'move' && action.dy) return moveMenuFocus(root, action.dy);
  return false;
}
