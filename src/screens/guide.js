import { el } from '../core/dom.js';
import { t } from '../core/i18n.js';
import { CONTROLS, KEY_HINTS, TRANSLATED_KEYS } from '../core/input.js';
import { GUIDE, SECTIONS } from '../core/sections.js';
import { set, state } from '../core/store.js';
import { HOME } from '../core/router.js';
import { fairy } from '../components/fairy.js';
import { hints } from '../components/hints.js';
import { icon } from '../components/icon.js';
import { tabs } from '../components/tabs.js';

const PANEL_ID = 'guide-panel';
const HUD_LEGEND = [
  { key: 'hearts', iconName: 'heart' },
  { key: 'gems', iconName: 'gem' },
  { key: 'available', iconName: null },
];

let root = null;
// Where Back goes: the screen that opened the Guide (title or System); deep links go to title.
let returnTo = HOME;

export function setReturn(route) {
  returnTo = route;
}

const keyLabel = (key) => (TRANSLATED_KEYS.includes(key) ? t(`guide.keys.${key}`) : key);
const keycaps = (keys, className) =>
  keys.map((key) => el('kbd', { class: `c-key ${className}`, text: keyLabel(key) }));

function controlsTable() {
  return [
    el('table', { class: 's-guide__table' }, [
      el('caption', { class: 'u-visually-hidden', text: t('guide.tabs.controls') }),
      el('thead', {}, [
        el(
          'tr',
          {},
          ['action', 'keyboard', 'gamepad', 'pointer'].map((column) =>
            el('th', { scope: 'col', text: t(`guide.columns.${column}`) }),
          ),
        ),
      ]),
      el(
        'tbody',
        {},
        CONTROLS.map(({ action, keyboard, gamepad }) =>
          el('tr', {}, [
            el('th', { scope: 'row', text: t(`guide.actions.${action}`) }),
            el('td', {}, keycaps(keyboard, 'c-key--kb')),
            el('td', {}, keycaps(gamepad, 's-guide__pad')),
            el('td', { text: t(`guide.pointer.${action}`) }),
          ]),
        ),
      ),
    ]),
    el('p', { class: 's-guide__note', text: t('guide.shortcutsNote') }),
  ];
}

function legendEntry(iconName, term, description) {
  return el('div', { class: 's-guide__entry' }, [
    el('dt', {}, [
      iconName && icon(iconName, 'c-icon s-guide__entry-icon'),
      el('span', { text: term }),
    ]),
    el('dd', { text: description }),
  ]);
}

function legend() {
  const sections = SECTIONS.map((section) =>
    el('section', { class: 's-guide__group' }, [
      el('h2', { class: 's-guide__group-title', text: t(`sections.${section.id}`) }),
      el('p', { class: 's-guide__group-text', text: t(`guide.legend.${section.id}`) }),
      section.tabs.length > 0 &&
        el(
          'dl',
          {},
          section.tabs.map((tab) =>
            legendEntry(tab.icon, t(`tabs.${tab.key}`), t(`guide.legend.${tab.key}`)),
          ),
        ),
    ]),
  );
  const hud = el('section', { class: 's-guide__group' }, [
    el('h2', { class: 's-guide__group-title', text: t('guide.legend.hud') }),
    el(
      'dl',
      {},
      HUD_LEGEND.map(({ key, iconName }) =>
        legendEntry(iconName, t(`guide.legend.${key}Term`), t(`guide.legend.${key}`)),
      ),
    ),
  ]);
  return [...sections, hud];
}

function tabRow() {
  return tabs({
    label: t('guide.title'),
    activeId: state.tab,
    keys: { prev: KEY_HINTS.prevTab.keyboard, next: KEY_HINTS.nextTab.keyboard },
    items: GUIDE.tabs.map((tab) => ({
      id: tab.id,
      iconName: tab.icon,
      label: t(`guide.tabs.${tab.key}`),
      controls: PANEL_ID,
    })),
  });
}

function panelContent() {
  return state.tab === 'legend' ? legend() : controlsTable();
}

export function mount(target) {
  root = target;
  root.classList.add('s-guide');
  root.replaceChildren(
    el('header', { class: 's-guide__header' }, [
      el('h1', { class: 's-guide__title', text: t('guide.title') }),
    ]),
    el('div', { class: 's-guide__tabs' }, tabRow()),
    el('div', { class: 's-guide__fairy' }, fairy({ message: t(`guide.fairy.${state.tab}`) })),
    el(
      'div',
      {
        class: 'c-panel s-guide__panel',
        id: PANEL_ID,
        role: 'tabpanel',
        'aria-labelledby': `tab-${state.tab}`,
        tabindex: '0',
      },
      panelContent(),
    ),
    el('footer', { class: 's-guide__footer' }, [
      hints({
        label: t('a11y.actions'),
        items: [{ action: 'back', label: t('hints.back'), keys: KEY_HINTS.back }],
      }),
    ]),
  );
}

/** Tab changes swap the panel and the bubble in place, so the fairy keeps flying. */
export function update(keys) {
  if (!keys.includes('tab')) return;
  root.querySelector('.s-guide__tabs').replaceChildren(tabRow());
  const panel = root.querySelector('.s-guide__panel');
  panel.setAttribute('aria-labelledby', `tab-${state.tab}`);
  panel.replaceChildren(...panelContent());
  panel.scrollTop = 0;
  root.querySelector('.c-fairy__bubble').textContent = t(`guide.fairy.${state.tab}`);
  root.querySelector('[role="tab"][aria-selected="true"]').focus();
}

function goTab(tabId) {
  if (tabId && tabId !== state.tab && GUIDE.tabs.some((tab) => tab.id === tabId)) {
    set({ tab: tabId, selection: null });
  }
  return true;
}

function stepTab(step) {
  const index = GUIDE.tabs.findIndex((tab) => tab.id === state.tab);
  return goTab(GUIDE.tabs[index + step]?.id);
}

export function handle(action) {
  switch (action.type) {
    case 'back':
      set(returnTo);
      return true;
    case 'prevTab':
      return stepTab(-1);
    case 'nextTab':
      return stepTab(1);
    case 'tab':
      return goTab(action.id);
    default:
      // Arrows stay with the browser so the focused panel scrolls natively.
      return false;
  }
}
