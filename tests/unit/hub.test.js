// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { bus } from '../../src/core/bus.js';
import { set, state } from '../../src/core/store.js';
import { HOME } from '../../src/core/router.js';
import * as hub from '../../src/screens/hub.js';
import { useLanguage } from './helpers/ui.js';

await useLanguage('es');

const root = document.createElement('main');
document.body.append(root);
set({ section: 'journal', tab: 'quests', selection: null });
hub.mount(root);
bus.addEventListener('state:change', ({ detail }) => hub.update(detail.keys));

const title = () => root.querySelector('h1').textContent;
const activeTab = () => root.querySelector('[role="tab"][aria-selected="true"]');

describe('hub', () => {
  it('renders the current section with its tabs, without an entry animation', () => {
    expect(title()).toBe('Diario de Aventura');
    expect(root.querySelectorAll('[role="tab"]')).toHaveLength(3);
    expect(activeTab().id).toBe('tab-quests');
    expect(root.querySelector('[role="tabpanel"]').getAttribute('aria-labelledby')).toBe(
      'tab-quests',
    );
    expect(root.querySelector('.s-hub__section').dataset.enter).toBeUndefined();
  });

  it('consumes L at the first section without changing anything', () => {
    expect(hub.handle({ type: 'prevSection' })).toBe(true);
    expect(state.section).toBe('journal');
  });

  it('moves to the next section, slides it in and focuses its active tab', () => {
    const sfx = vi.fn();
    bus.addEventListener('ui:sfx', sfx, { once: true });

    expect(hub.handle({ type: 'nextSection' })).toBe(true);
    expect(state).toMatchObject({ section: 'inventory', tab: 'weapons', selection: null });
    expect(title()).toBe('Inventario');
    expect(root.querySelector('.s-hub__section').dataset.enter).toBe('next');
    expect(document.activeElement).toBe(activeTab());
    expect(sfx.mock.calls[0][0].detail).toBe('section');
  });

  it('switches tabs by step and by id, ignoring unknown ids', () => {
    hub.handle({ type: 'nextTab' });
    expect(state.tab).toBe('armor');
    hub.handle({ type: 'tab', id: 'key-items' });
    expect(state.tab).toBe('key-items');
    expect(hub.handle({ type: 'nextTab' })).toBe(true);
    expect(hub.handle({ type: 'tab', id: 'nope' })).toBe(true);
    expect(state.tab).toBe('key-items');
    expect(document.activeElement.id).toBe('tab-key-items');
  });

  it('remembers the last tab of each section', () => {
    hub.handle({ type: 'prevSection' });
    expect(state).toMatchObject({ section: 'journal', tab: 'quests' });
    expect(root.querySelector('.s-hub__section').dataset.enter).toBe('prev');
    hub.handle({ type: 'nextSection' });
    expect(state.tab).toBe('key-items');
  });

  it('shows System without tabs and focuses its panel', () => {
    hub.handle({ type: 'nextSection' });
    expect(state).toMatchObject({ section: 'system', tab: null });
    expect(root.querySelector('[role="tablist"]')).toBeNull();
    expect(document.activeElement.getAttribute('role')).toBe('region');
    expect(document.activeElement.getAttribute('aria-label')).toBe('Sistema');
    expect(root.querySelectorAll('button.c-hud__neighbor')).toHaveLength(1);
    expect([...root.querySelectorAll('.c-menu__button')].map((b) => b.dataset.action)).toEqual([
      'guide',
      'language',
      undefined, // Quick mode is a real link
      'title',
    ]);
    expect(root.querySelector('a.c-menu__button').getAttribute('href')).toMatch(/quick\/$/);
  });

  it('moves through the System menu with up/down', () => {
    expect(hub.handle({ type: 'move', dx: 0, dy: 1 })).toBe(true);
    expect(document.activeElement.dataset.action).toBe('guide');
  });

  it('goes back to the title with Back', () => {
    expect(hub.handle({ type: 'back' })).toBe(true);
    expect(state).toMatchObject(HOME);
  });

  it('leaves other actions to the screens', () => {
    set({ section: 'journal', tab: 'quests', selection: null });
    expect(hub.handle({ type: 'move', dx: 0, dy: 1 })).toBe(false);
    expect(hub.handle({ type: 'select' })).toBe(false);
  });
});
