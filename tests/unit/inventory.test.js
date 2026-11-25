// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { bus } from '../../src/core/bus.js';
import { load } from '../../src/core/data.js';
import { set, state } from '../../src/core/store.js';
import * as hub from '../../src/screens/hub.js';
import { useLanguage } from './helpers/ui.js';

// jsdom has no layout, so no scrollIntoView.
Element.prototype.scrollIntoView = () => {};

await useLanguage('es');
await Promise.all(
  ['profile', 'quests', 'sidequests', 'projects', 'tech', 'softskills'].map((file) =>
    load('es', file),
  ),
);

const root = document.createElement('main');
document.body.append(root);
set({ lang: 'es', section: 'inventory', tab: 'weapons', selection: null });
hub.mount(root);
bus.addEventListener('state:change', ({ detail }) => hub.update(detail.keys));

const cells = () => [...root.querySelectorAll('[role="gridcell"]')];
const title = () => root.querySelector('.c-detail__title').textContent;
const effect = () => root.querySelector('.c-detail__effect')?.textContent ?? null;
const page = () => root.querySelector('.s-inventory__page').textContent;
const move = (dx, dy) => hub.handle({ type: 'move', dx, dy });

describe('weapons', () => {
  it('shows the first page in a 5-column grid with levels as badges', () => {
    expect(cells()).toHaveLength(15);
    expect(root.querySelectorAll('[role="row"]')).toHaveLength(3);
    expect(page()).toBe('Principales · 1/4');
    expect(cells()[0].getAttribute('aria-label')).toBe('Laravel');
    expect(cells()[0].textContent).toBe('5');
    expect(cells()[0].querySelector('.c-cell__icon').style.getPropertyValue('--icon-color')).toBe(
      '#ff2d20',
    );
    expect(root.textContent).not.toContain('false');
  });

  it('computes the years of professional use from the jobs', () => {
    expect(title()).toBe('Laravel');
    expect(effect()).toBe('1 año y 8 meses de uso profesional');
    expect(root.querySelector('.c-detail__body').textContent).toContain('Usado en: Grupo ARI');

    move(1, 0);
    expect(title()).toBe('PHP');
    expect(effect()).toBe('2 años y 2 meses de uso profesional');
  });

  it('walks off the right edge onto the next page and back', () => {
    hub.handle({ type: 'item', id: 'laravel' });
    for (let step = 0; step < 4; step += 1) move(1, 0);
    expect(state.selection).toBe('react');
    move(1, 0);
    expect(page()).toBe('Secundarias · 2/4');
    expect(state.selection).toBe('laravel-reverb');
    move(-1, 0);
    expect(state.selection).toBe('material-ui');
    expect(page()).toBe('Principales · 1/4');
  });

  it('turns pages with the pager buttons and hides the edge arrow', () => {
    hub.handle({ type: 'nextPage' });
    hub.handle({ type: 'nextPage' });
    hub.handle({ type: 'nextPage' });
    expect(page()).toBe('Ofimática y diseño · 4/4');
    expect(root.querySelector('.c-pager--next').disabled).toBe(true);
    expect(effect()).toBeNull();
  });

  it('moves down by rows, clamping to the last item, and up into the tabs', () => {
    hub.handle({ type: 'item', id: 'claude-code' });
    move(0, 1);
    move(0, 1);
    expect(state.selection).toBe('docker');
    move(0, -1);
    move(0, -1);
    move(0, -1);
    expect(document.activeElement.id).toBe('tab-weapons');
  });
});

describe('armour and key items', () => {
  it('shows soft skills with their real example and no pagers', () => {
    set({ tab: 'armor', selection: null });
    expect(cells()).toHaveLength(9);
    expect(root.querySelector('.c-pager')).toBeNull();
    expect(page()).toBe('Habilidades');
    expect(root.querySelector('.c-detail__body').textContent).toContain('Ejemplo:');
  });

  it('links key items, serving the CV from the site base path', () => {
    set({ tab: 'key-items', selection: 'cv' });
    const link = root.querySelector('.c-detail__link');
    expect(link.getAttribute('href')).toBe(`${import.meta.env.BASE_URL}cv/cv-es.pdf`);

    hub.handle({ type: 'item', id: 'email' });
    expect(root.querySelector('.c-detail__link').getAttribute('href')).toMatch(/^mailto:/);

    hub.handle({ type: 'item', id: 'languages' });
    expect(root.querySelector('.c-detail__link')).toBeNull();
    expect(root.querySelectorAll('.c-detail__body p')).toHaveLength(3);
  });
});
