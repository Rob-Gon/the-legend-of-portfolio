import './styles/main.scss';
import { el } from './core/dom.js';
import { bus } from './core/bus.js';
import { load } from './core/data.js';
import { startInput } from './core/input.js';
import { readPrefs } from './core/prefs.js';
import { startRouter } from './core/router.js';
import { set, state } from './core/store.js';
import * as hub from './screens/hub.js';

// Until the title screen exists (M3), `#/inicio` and unknown routes land on the first section.
const LANDING = { section: 'journal', tab: 'quests', selection: null };

const root = document.querySelector('#app');
set({ prefs: readPrefs() });

const ui = await load(state.lang, 'ui');

if (ui.ok) {
  startRouter(LANDING);
  hub.mount(root, ui.data);
  bus.addEventListener('state:change', ({ detail }) => hub.update(detail.keys));
  bus.addEventListener('action', (event) => {
    if (hub.handle(event.detail)) event.preventDefault();
  });
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
