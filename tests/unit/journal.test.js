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
await Promise.all(['profile', 'quests', 'sidequests', 'projects'].map((file) => load('es', file)));

const root = document.createElement('main');
document.body.append(root);
set({ lang: 'es', section: 'journal', tab: 'quests', selection: null });
hub.mount(root);
bus.addEventListener('state:change', ({ detail }) => hub.update(detail.keys));

const options = () => [...root.querySelectorAll('[role="option"]')];
const selectedOption = () => root.querySelector('[role="option"][aria-selected="true"]');
const detailTitle = () => root.querySelector('.c-detail__title').textContent;

describe('HUD', () => {
  it('shows hearts with the computed experience, gems = projects and availability', () => {
    expect(root.querySelectorAll('.c-hud__heart')).toHaveLength(3);
    expect(root.querySelector('.c-hud__hearts').textContent).toBe(
      '2 años y 5 meses de experiencia profesional',
    );
    expect(root.querySelector('.c-hud__gems').textContent).toBe('1111 proyectos');
    expect(root.querySelector('.c-hud__available').textContent).toBe('Disponible para trabajar');
  });
});

describe('journal: main quests', () => {
  it('lists goals first as active and completed quests greyed, selecting the first', () => {
    expect(options()).toHaveLength(9);
    expect(options()[0].classList.contains('c-row--active')).toBe(true);
    expect(options()[2].classList.contains('c-row--done')).toBe(true);
    expect(options()[0].querySelector('.c-row__subtitle').textContent).toBe('Meta actual');
    expect(options()[1].querySelector('.c-row__subtitle').textContent).toBe('Proyecto personal');
    expect(selectedOption()).toBe(options()[0]);
    expect(detailTitle()).toBe('Proyectos con IA');
  });

  it('walks the list with ↓/↑ and updates the detail and the selection', () => {
    hub.handle({ type: 'move', dx: 0, dy: 1 });
    hub.handle({ type: 'move', dx: 0, dy: 1 });
    expect(state.selection).toBe('grupo-ari');
    expect(document.activeElement).toBe(selectedOption());
    expect(detailTitle()).toBe('Desarrollador Full-Stack');
    expect(root.querySelector('.c-detail__meta').textContent).toBe('Abr 2025 – Nov 2026Grupo ARI');
    expect(root.querySelector('.c-detail__body .u-hl').textContent).toBe('ERP');
  });

  it('stops at the end and returns to the tabs from the top', () => {
    for (let step = 0; step < 20; step += 1) hub.handle({ type: 'move', dx: 0, dy: 1 });
    expect(state.selection).toBe('journey-begins');

    set({ selection: null });
    hub.handle({ type: 'move', dx: 0, dy: -1 });
    expect(document.activeElement.id).toBe('tab-quests');
    hub.handle({ type: 'move', dx: 0, dy: 1 });
    expect(document.activeElement).toBe(selectedOption());
  });

  it('selects a clicked row', () => {
    expect(hub.handle({ type: 'item', id: 'crealia-it' })).toBe(true);
    expect(state.selection).toBe('crealia-it');
    expect(root.querySelector('.c-detail__meta-right').textContent).toBe('Crealia IT');
  });
});

describe('journal: memories', () => {
  it('shows a deep-linked project with its points and public links', () => {
    set({ tab: 'memories', selection: 'contact-form' });
    expect(detailTitle()).toBe('Formulario de contacto');
    const links = [...root.querySelectorAll('.c-detail__link')];
    expect(links.map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['Demo', 'https://rob-gon.github.io/Contact-Form/'],
      ['Código', 'https://github.com/Rob-Gon/Contact-Form'],
    ]);
    expect(links[0].getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('marks confidential projects and gives them no links', () => {
    hub.handle({ type: 'item', id: 'erp-whatsapp-chat' });
    expect(root.querySelector('.c-detail__note').textContent).toContain('confidencial');
    expect(root.querySelectorAll('.c-detail__link')).toHaveLength(0);
    expect(root.querySelectorAll('.c-detail__points li')).toHaveLength(4);
  });

  it('falls back to the first item for an unknown id', () => {
    set({ selection: 'does-not-exist' });
    expect(detailTitle()).toBe('ERP del sector automoción');
  });
});

describe('journal: side quests', () => {
  it('uses the Spanish label and shows the side quests', () => {
    set({ tab: 'side-quests', selection: null });
    expect(root.querySelector('[role="listbox"]').getAttribute('aria-label')).toBe(
      'Misiones secundarias',
    );
    expect(options().map((option) => option.dataset.id)).toEqual([
      'music',
      'photo-video',
      'french',
    ]);
  });
});
