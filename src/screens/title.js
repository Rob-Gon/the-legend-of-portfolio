import { el } from '../core/dom.js';
import { t } from '../core/i18n.js';
import { menu, moveMenuFocus } from '../components/menu.js';

let root = null;

export function mount(target) {
  root = target;
  root.classList.add('s-title');
  root.replaceChildren(
    el('div', { class: 's-title__center' }, [
      // Live text in the project's own typography; never an imitation of the game logo.
      el('h1', { class: 's-title__heading' }, [
        el('span', { class: 's-title__name', text: 'The Legend Of Roberto' }),
        el('span', { class: 's-title__sub', text: 'Portfolio Of The Wild' }),
      ]),
      el('p', { class: 's-title__tagline', text: t('title.tagline') }),
      menu({
        label: t('a11y.titleMenu'),
        items: [
          { action: 'start', label: t('title.start') },
          { action: 'guide', label: t('title.guide') },
          { action: 'language', label: t('title.languageCurrent', { name: t('meta.langName') }) },
        ],
      }),
    ]),
    el('footer', { class: 's-title__footer' }, [
      el('p', { class: 's-title__disclaimer', text: t('meta.disclaimer') }),
    ]),
  );
  root.querySelector('.c-menu__button').focus();
}

export function update() {}

export function handle(action) {
  if (action.type === 'move' && action.dy) return moveMenuFocus(root, action.dy);
  return false;
}
