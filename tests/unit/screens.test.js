// @vitest-environment jsdom
import { beforeAll, describe, expect, it } from 'vitest';
import { bus } from '../../src/core/bus.js';
import { CONTROLS } from '../../src/core/input.js';
import { HOME } from '../../src/core/router.js';
import { set, state } from '../../src/core/store.js';
import * as title from '../../src/screens/title.js';
import * as guide from '../../src/screens/guide.js';
import { useLanguage } from './helpers/ui.js';

const host = () => {
  const node = document.createElement('div');
  document.body.replaceChildren(node);
  return node;
};

beforeAll(() => useLanguage('es'));

describe('title screen', () => {
  it('shows the live-text title, the menu and the disclaimer, focusing Start', () => {
    const root = host();
    title.mount(root);

    expect(root.querySelector('h1').textContent).toBe('The Legend Of RobertoPortfolio Of The Wild');
    const buttons = [...root.querySelectorAll('.c-menu__button')];
    expect(buttons.map((button) => button.dataset.action)).toEqual(['start', 'guide', 'language']);
    expect(buttons[2].textContent).toBe('Idioma: Español');
    expect(document.activeElement).toBe(buttons[0]);
    expect(root.textContent).toContain('Proyecto de fan no oficial. Sin relación con Nintendo.');
  });

  it('moves focus through the menu with up/down and stops at the ends', () => {
    const root = host();
    title.mount(root);
    const buttons = root.querySelectorAll('.c-menu__button');

    expect(title.handle({ type: 'move', dx: 0, dy: 1 })).toBe(true);
    expect(document.activeElement).toBe(buttons[1]);
    title.handle({ type: 'move', dx: 0, dy: 1 });
    title.handle({ type: 'move', dx: 0, dy: 1 });
    expect(document.activeElement).toBe(buttons[2]);
    expect(title.handle({ type: 'move', dx: 1, dy: 0 })).toBe(false);
    expect(title.handle({ type: 'back' })).toBe(false);
  });
});

describe('guide screen', () => {
  let root;

  beforeAll(() => {
    set({ section: 'guide', tab: 'controls', selection: null });
    root = host();
    guide.setReturn({ section: 'system', tab: null, selection: null });
    guide.mount(root);
    bus.addEventListener('state:change', ({ detail }) => {
      if (state.section === 'guide') guide.update(detail.keys);
    });
  });

  it('lists every documented control in a real table, with translated key names', () => {
    const rows = root.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(CONTROLS.length);
    expect(root.querySelector('caption').textContent).toBe('Controles');
    const select = [...rows].find((row) => row.querySelector('th').textContent === 'Seleccionar');
    expect([...select.querySelectorAll('kbd')].map((key) => key.textContent)).toEqual([
      'Enter',
      'Espacio',
      'A',
    ]);
  });

  it('shows the fairy as decoration with a live speech bubble', () => {
    expect(root.querySelector('.c-fairy__art').getAttribute('aria-hidden')).toBe('true');
    const bubble = root.querySelector('.c-fairy__bubble');
    expect(bubble.getAttribute('aria-live')).toBe('polite');
    expect(bubble.textContent).toMatch(/^¡Oye!/);
    expect(root.textContent).not.toMatch(/navi/i);
  });

  it('switches to the legend in place, keeping the same fairy', () => {
    const fairyNode = root.querySelector('.c-fairy');
    expect(guide.handle({ type: 'nextTab' })).toBe(true);

    expect(state.tab).toBe('legend');
    expect(root.querySelector('.c-fairy')).toBe(fairyNode);
    expect(root.querySelector('.c-fairy__bubble').textContent).toMatch(/cada sección/);
    expect([...root.querySelectorAll('h2')].map((h) => h.textContent)).toEqual([
      'Diario de Aventura',
      'Inventario',
      'Sistema',
      'Marcador',
    ]);
    expect(root.querySelector('[role="tabpanel"]').getAttribute('aria-labelledby')).toBe(
      'tab-legend',
    );
    expect(document.activeElement.id).toBe('tab-legend');
  });

  it('returns to the screen that opened it', () => {
    expect(guide.handle({ type: 'back' })).toBe(true);
    expect(state).toMatchObject({ section: 'system', tab: null });
    guide.setReturn(HOME);
  });
});
