import { el } from '../core/dom.js';
import { emit } from '../core/bus.js';
import { peek } from '../core/data.js';
import { totalExperience } from '../core/experience.js';
import { t } from '../core/i18n.js';
import { KEY_HINTS } from '../core/input.js';
import { HOME } from '../core/router.js';
import { SECTIONS } from '../core/sections.js';
import { set, state } from '../core/store.js';
import { hints } from '../components/hints.js';
import { hud } from '../components/hud.js';
import { tabs } from '../components/tabs.js';
import * as inventory from './inventory.js';
import * as journal from './journal.js';
import * as system from './system.js';

const PANEL_ID = 'hub-panel';
// Content screen for each section.
const PANELS = { journal, inventory, system };

let root = null;
let shownIndex = -1;
// Each section remembers its last tab, as the pause menu does.
const lastTab = {};

const sectionIndex = () => SECTIONS.findIndex((section) => section.id === state.section);

function neighbour(section, keys) {
  return section && { label: t(`sections.${section.id}`), keys };
}

/** HUD values from the preloaded data; each one is left out if its file failed to load. */
function hudStatus() {
  const profile = peek(state.lang, 'profile')?.data;
  const quests = peek(state.lang, 'quests')?.data.items;
  const projects = peek(state.lang, 'projects')?.data.items;
  return {
    hearts: profile &&
      quests && { value: profile.hud.hearts, label: t('hud.hearts', totalExperience(quests)) },
    gems: projects && {
      value: projects.length,
      label: t('hud.gems', { count: projects.length }),
    },
    available: profile?.available ? t('availability') : null,
  };
}

function view(enter) {
  const index = sectionIndex();
  const section = SECTIONS[index];
  const name = t(`sections.${section.id}`);
  const hasTabs = section.tabs.length > 0;

  return [
    hud({
      title: name,
      sections: { index, count: SECTIONS.length },
      prev: neighbour(SECTIONS[index - 1], KEY_HINTS.prevSection),
      next: neighbour(SECTIONS[index + 1], KEY_HINTS.nextSection),
      ...hudStatus(),
    }),
    el(
      'div',
      { class: `s-hub__section s-hub__section--${section.id}`, dataset: enter && { enter } },
      [
        hasTabs &&
          el(
            'div',
            { class: 's-hub__tabs' },
            tabs({
              label: name,
              activeId: state.tab,
              keys: { prev: KEY_HINTS.prevTab.keyboard, next: KEY_HINTS.nextTab.keyboard },
              items: section.tabs.map((tab) => ({
                id: tab.id,
                iconName: tab.icon,
                label: t(`tabs.${tab.key}`),
                controls: PANEL_ID,
              })),
            }),
          ),
        el('div', {
          class: 's-hub__panel',
          id: PANEL_ID,
          role: hasTabs ? 'tabpanel' : 'region',
          'aria-labelledby': hasTabs ? `tab-${state.tab}` : null,
          'aria-label': hasTabs ? null : name,
          tabindex: '-1',
        }),
      ],
    ),
    el('footer', { class: 's-hub__footer' }, [
      hints({
        label: t('a11y.actions'),
        items: [{ action: 'back', label: t('hints.back'), keys: KEY_HINTS.back }],
      }),
    ]),
  ];
}

function render({ focus }) {
  const index = sectionIndex();
  const enter =
    shownIndex === -1 || index === shownIndex ? null : index > shownIndex ? 'next' : 'prev';
  shownIndex = index;
  root.replaceChildren(...view(enter));
  PANELS[state.section]?.mount(root.querySelector('.s-hub__panel'));
  // After a section or tab change, focus follows to the active tab (or the panel if none).
  if (focus) root.querySelector('[role="tab"][aria-selected="true"], .s-hub__panel').focus();
}

export function mount(target) {
  root = target;
  shownIndex = -1;
  root.classList.add('s-hub');
  render({ focus: false });
}

export function update(keys) {
  // Leaving the hub (title, Guide) is handled by main.js swapping screens.
  if (sectionIndex() === -1) return;
  if (keys.includes('section') || keys.includes('tab')) render({ focus: true });
  else if (keys.includes('selection')) PANELS[state.section]?.update?.(keys);
}

function goSection(step) {
  const target = SECTIONS[sectionIndex() + step];
  // At the first/last section the key does nothing, but it is still consumed.
  if (!target) return true;
  lastTab[state.section] = state.tab;
  set({
    section: target.id,
    tab: lastTab[target.id] ?? target.tabs[0]?.id ?? null,
    selection: null,
  });
  emit('ui:sfx', 'section');
  return true;
}

function goTab(tabId) {
  const { tabs: sectionTabs } = SECTIONS[sectionIndex()];
  if (!tabId || tabId === state.tab || !sectionTabs.some((tab) => tab.id === tabId)) return true;
  set({ tab: tabId, selection: null });
  emit('ui:sfx', 'tab');
  return true;
}

function stepTab(step) {
  const { tabs: sectionTabs } = SECTIONS[sectionIndex()];
  const index = sectionTabs.findIndex((tab) => tab.id === state.tab);
  return goTab(sectionTabs[index + step]?.id);
}

/** Section and tab switching; Back returns to the title. Returns true when handled. */
export function handle(action) {
  if (PANELS[state.section]?.handle(action)) return true;

  switch (action.type) {
    case 'prevSection':
      return goSection(-1);
    case 'nextSection':
      return goSection(1);
    case 'prevTab':
      return stepTab(-1);
    case 'nextTab':
      return stepTab(1);
    case 'tab':
      return goTab(action.id);
    case 'back':
      set(HOME);
      return true;
    default:
      return false;
  }
}
