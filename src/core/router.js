import { bus } from './bus.js';
import { SECTIONS, findSection } from './sections.js';
import { set, state } from './store.js';

export const HOME = Object.freeze({ section: null, tab: null, selection: null });
const HOME_HASH = '#/inicio';
const ITEM_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Hash → route state. Unknown routes give HOME; an invalid item id is dropped. */
export function parse(hash) {
  const [sectionSlug, tabSlug, id, ...rest] = String(hash)
    .replace(/^#\/?/, '')
    .split('/')
    .filter(Boolean);
  const section = SECTIONS.find((candidate) => candidate.slug === sectionSlug);
  if (!section || rest.length) return HOME;

  if (!section.tabs.length) {
    return tabSlug ? HOME : { section: section.id, tab: null, selection: null };
  }

  const tab = tabSlug
    ? section.tabs.find((candidate) => candidate.slug === tabSlug)
    : section.tabs[0];
  if (!tab) return HOME;

  const selection = tab.selectable && id && ITEM_ID.test(id) ? id : null;
  return { section: section.id, tab: tab.id, selection };
}

/** Route state → hash. */
export function format({ section, tab, selection }) {
  const sectionDef = findSection(section);
  if (!sectionDef) return HOME_HASH;

  const tabDef = sectionDef.tabs.find((candidate) => candidate.id === tab) ?? sectionDef.tabs[0];
  if (!tabDef) return `#/${sectionDef.slug}`;

  const item = tabDef.selectable && selection ? `/${selection}` : '';
  return `#/${sectionDef.slug}/${tabDef.slug}${item}`;
}

/**
 * Keeps the hash and the store in sync. Section/tab changes push a history entry (so Back
 * works); selection changes replace it. `fallback` replaces HOME until the title screen exists.
 */
export function startRouter(fallback) {
  const resolve = (route) => (route.section || !fallback ? route : fallback);

  set(resolve(parse(location.hash)));
  history.replaceState(null, '', format(state));

  window.addEventListener('hashchange', () => {
    const route = resolve(parse(location.hash));
    // Replace, not push: an invalid or home hash must not leave a Back-button trap behind it.
    if (format(route) !== location.hash) history.replaceState(null, '', format(route));
    set(route);
  });

  bus.addEventListener('state:change', ({ detail: { keys } }) => {
    if (!keys.some((key) => key === 'section' || key === 'tab' || key === 'selection')) return;
    const hash = format(state);
    if (hash === location.hash) return;
    const navigates = keys.includes('section') || keys.includes('tab');
    history[navigates ? 'pushState' : 'replaceState'](null, '', hash);
  });
}
