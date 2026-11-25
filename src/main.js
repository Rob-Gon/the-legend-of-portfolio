import './styles/main.scss';
import { el } from './core/dom.js';
import { bus, emit } from './core/bus.js';
import { load } from './core/data.js';
import { DEFAULT_LANG, SUPPORTED_LANGS, detectLang, loadLanguage, t } from './core/i18n.js';
import { startInput } from './core/input.js';
import { readPrefs, writePrefs } from './core/prefs.js';
import { HOME, startRouter } from './core/router.js';
import { set, state } from './core/store.js';
import { AUDIO_ACTIONS, startAudio } from './audio/bridge.js';
import { closeSheet, isSheetOpen } from './components/sheet.js';
import { toast } from './components/toast.js';
import { onLayoutChange } from './core/device.js';
import * as title from './screens/title.js';
import * as guide from './screens/guide.js';
import * as hub from './screens/hub.js';
import { refreshMotion } from './screens/inventory.js';

const root = document.querySelector('#app');
// Content preloaded with each language so screens render synchronously (no request waterfalls).
// A file that fails stays unloaded and its screen shows the error state.
const CONTENT_FILES = ['profile', 'quests', 'sidequests', 'projects', 'tech', 'softskills'];
const loadContent = (lang) => Promise.all(CONTENT_FILES.map((file) => load(lang, file)));
let active = null;
// Language shortcut + music bar: live outside the screen host so they stay across screens.
const languageButton = el('button', {
  class: 'c-music__button c-music__button--lang',
  type: 'button',
  dataset: { action: 'language' },
});
const musicBar = el('div', { class: 'l-music__bar' });
const musicHost = el('div', { class: 'l-music' }, [languageButton, musicBar]);

function syncLanguageButton() {
  languageButton.textContent = t('meta.langCode');
  languageButton.setAttribute('aria-label', t('a11y.switchLanguage'));
  languageButton.title = t('a11y.switchLanguage');
}

const screenFor = (section) => (section === null ? title : section === 'guide' ? guide : hub);

/** Mounts the screen for the current route in a fresh host; fades in when the screen changes. */
function show({ animate }) {
  active = screenFor(state.section);
  const host = el('div', { class: `l-screen${animate ? ' l-screen--enter' : ''}` });
  // Re-inserting the bar blurs it: keep focus on the bar button the user was on.
  const focused = musicHost.contains(document.activeElement) ? document.activeElement : null;
  root.replaceChildren(host, musicHost);
  focused?.focus();
  active.mount(host);
}

async function switchLanguage() {
  const next = SUPPORTED_LANGS[(SUPPORTED_LANGS.indexOf(state.lang) + 1) % SUPPORTED_LANGS.length];
  const [result] = await Promise.all([loadLanguage(next), loadContent(next)]);
  if (!result.ok) {
    console.error(result.error);
    toast(t('errors.data'));
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
  start: () => {
    emit('ui:sfx', 'select');
    set({ section: 'journal', tab: 'quests', selection: null });
  },
  guide: openGuide,
  language: switchLanguage,
  title: () => set(HOME),
  ...AUDIO_ACTIONS,
};

/** System motion setting: 'system' follows the OS; the others force it either way. */
function applyMotion(motion) {
  if (motion === 'system') delete document.documentElement.dataset.motion;
  else document.documentElement.dataset.motion = motion;
}

function onAction(event) {
  const action = event.detail;
  // While the mobile detail sheet is open, Back closes it and nothing moves behind it.
  if (isSheetOpen()) {
    if (action.type === 'back') {
      closeSheet();
      event.preventDefault();
    }
    return;
  }
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
  if (keys.includes('prefs')) {
    applyMotion(state.prefs.motion);
    refreshMotion();
  }
  if (keys.includes('lang')) {
    syncLanguageButton();
    return show({ animate: false });
  }
  if (keys.includes('section') && screenFor(state.section) !== active) {
    return show({ animate: true });
  }
  active.update(keys);
}

const prefs = readPrefs();
let lang = detectLang(prefs.lang, navigator.languages);
let [ui] = await Promise.all([loadLanguage(lang), loadContent(lang)]);
if (!ui.ok && lang !== DEFAULT_LANG) {
  console.error(ui.error);
  lang = DEFAULT_LANG;
  [ui] = await Promise.all([loadLanguage(lang), loadContent(lang)]);
}

if (ui.ok) {
  set({ prefs, lang });
  applyMotion(prefs.motion);
  startRouter();
  syncLanguageButton();
  show({ animate: false });
  startAudio(musicBar);
  // Crossing the mobile breakpoint swaps layouts (grouped inventory, sheet): re-render.
  onLayoutChange(() => {
    closeSheet();
    show({ animate: false });
  });
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
