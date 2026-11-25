import { el } from '../core/dom.js';
import { t } from '../core/i18n.js';
import { state } from '../core/store.js';
import { menu, moveMenuFocus, quickModeHref } from '../components/menu.js';
import avatarAvif from '../assets/scenery/avatar-back.avif';
import avatarWebp from '../assets/scenery/avatar-back.webp';

let root = null;

export function mount(target) {
  root = target;
  root.classList.add('s-title');
  root.replaceChildren(
    // Decorative floating lights over the valley (positions and timing live in the SCSS).
    el(
      'div',
      { class: 's-title__motes', 'aria-hidden': 'true' },
      Array.from({ length: 10 }, () => el('span', { class: 's-title__mote' })),
    ),
    // The owner's avatar on the cliff, looking out over the valley (desktop only, decorative).
    el('picture', { class: 's-title__avatar', 'aria-hidden': 'true' }, [
      el('source', { srcset: avatarAvif, type: 'image/avif' }),
      el('img', {
        src: avatarWebp,
        alt: '',
        width: '236',
        height: '720',
        loading: 'lazy',
        decoding: 'async',
      }),
    ]),
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
          { href: quickModeHref(state.lang), label: t('title.quickMode') },
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
