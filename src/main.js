import './styles/main.scss';
import { el } from './core/dom.js';
import { bus } from './core/bus.js';
import { DEFAULT_LANG, SUPPORTED_LANGS, detectLang, loadLanguage } from './core/i18n.js';
import { startInput } from './core/input.js';
import { readPrefs, writePrefs } from './core/prefs.js';
import { HOME, startRouter } from './core/router.js';
import { set, state } from './core/store.js';
import * as title from './screens/title.js';
import * as guide from './screens/guide.js';
import * as hub from './screens/hub.js';

const root = document.querySelector('#app');
let active = null;

const screenFor = (section) => (section === null ? title : section === 'guide' ? guide : hub);

/** Mounts the screen for the current route in a fresh host; fades in when the screen changes. */
function show({ animate }) {
  active = screenFor(state.section);
  const host = el('div', { class: `l-screen${animate ? ' l-screen--enter' : ''}` });
  root.replaceChildren(host);
  active.mount(host);
}

async function switchLanguage() {
  const next = SUPPORTED_LANGS[(SUPPORTED_LANGS.indexOf(state.lang) + 1) % SUPPORTED_LANGS.length];
  const result = await loadLanguage(next);
  if (!result.ok) {
    // shortcut: failure is only logged; the toast component arrives in M9.
    console.error(result.error);
    return;
  }
  writePrefs({ ...state.prefs, lang: next });
  set({ lang: next, prefs: { ...state.prefs, lang: next } });
}

function openGuide() {
  guide.setReturn({ section: state.section, tab: state.tab, selection: null });
  set({ section: 'guide', tab: 'controls', selection: null });
}

// Actions available on every screen (title menu, System menu).
const GLOBAL_ACTIONS = {
  start: () => set({ section: 'journal', tab: 'quests', selection: null }),
  guide: openGuide,
  language: switchLanguage,
  title: () => set(HOME),
};

function onAction(event) {
  const action = event.detail;
  if (active.handle(action)) {
    event.preventDefault();
    return;
  }
  const global = GLOBAL_ACTIONS[action.type];
  if (global) {
    global();
    event.preventDefault();
    return;
  }
  // Gamepad A has no native click: activate the focused button, like Enter does.
  if (action.type === 'select' && document.activeElement?.matches('button')) {
    document.activeElement.click();
    event.preventDefault();
  }
}

function onStateChange({ detail: { keys } }) {
  if (keys.includes('lang')) return show({ animate: false });
  if (keys.includes('section') && screenFor(state.section) !== active) {
    return show({ animate: true });
  }
  active.update(keys);
}

const prefs = readPrefs();
let lang = detectLang(prefs.lang, navigator.languages);
let ui = await loadLanguage(lang);
if (!ui.ok && lang !== DEFAULT_LANG) {
  console.error(ui.error);
  lang = DEFAULT_LANG;
  ui = await loadLanguage(lang);
}

if (ui.ok) {
  set({ prefs, lang });
  startRouter();
  show({ animate: false });
  bus.addEventListener('state:change', onStateChange);
  bus.addEventListener('action', onAction);
  startInput({ getPrefs: () => state.prefs });
} else {
  console.error(ui.error);
  // ui.json itself failed, so there are no translated strings: minimal bilingual fallback.
  root.append(
    el('p', {
      class: 's-fatal',
      role: 'alert',
      text: 'No se ha podido cargar el portfolio. Recarga la página. / The portfolio could not be loaded. Please reload the page.',
    }),
  );
}
