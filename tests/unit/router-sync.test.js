// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { HOME, startRouter } from '../../src/core/router.js';
import { set, state } from '../../src/core/store.js';

const nextHashChange = () =>
  new Promise((resolve) => window.addEventListener('hashchange', resolve, { once: true }));

describe('router ⇄ store', () => {
  history.replaceState(null, '', '#/inventario');
  startRouter();

  it('reads the deep link and normalises the URL without adding history', () => {
    expect(state).toMatchObject({ section: 'inventory', tab: 'weapons', selection: null });
    expect(location.hash).toBe('#/inventario/tecnologias');
  });

  it('pushes on tab change and replaces on selection change', () => {
    const before = history.length;
    set({ tab: 'armor' });
    expect(location.hash).toBe('#/inventario/habilidades');
    expect(history.length).toBe(before + 1);

    set({ tab: 'weapons' });
    const afterTabs = history.length;
    set({ selection: 'php' });
    expect(location.hash).toBe('#/inventario/tecnologias/php');
    expect(history.length).toBe(afterTabs);
  });

  it('applies hash changes (Back button, typed URL) to the store', async () => {
    location.hash = '#/sistema';
    await nextHashChange();
    expect(state).toMatchObject({ section: 'system', tab: null });
  });

  it('sends unknown routes to the title screen and fixes the URL', async () => {
    location.hash = '#/nope';
    await nextHashChange();
    expect(state).toMatchObject(HOME);
    expect(location.hash).toBe('#/inicio');
  });
});
