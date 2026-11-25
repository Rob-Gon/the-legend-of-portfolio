// Dev-only component showcase (not part of the production build).
// Sample copy is hard-coded here on purpose: real text comes from JSON from M3 on.
import '../src/styles/main.scss';
import './design-system.scss';
import { el } from '../src/core/dom.js';
import { hud } from '../src/components/hud.js';
import { tabs } from '../src/components/tabs.js';
import { list } from '../src/components/list.js';
import { grid, pager } from '../src/components/grid.js';
import { detail } from '../src/components/detail.js';
import { hints } from '../src/components/hints.js';

const keys = {
  prevSection: { keyboard: 'L', gamepad: 'LB' },
  nextSection: { keyboard: 'R', gamepad: 'RB' },
  back: { keyboard: 'Esc', gamepad: 'B' },
  select: { keyboard: 'Enter', gamepad: 'A' },
};

const common = {
  sections: { count: 3 },
  hearts: { value: 3, label: '2 años y 5 meses de experiencia profesional' },
  gems: { value: 10, label: '10 proyectos' },
  available: 'Disponible para trabajar',
};

const footer = (items) => [
  el('div', { class: 'd-footer', 'aria-hidden': 'true' }),
  el('div', { class: 'd-hints' }, hints({ label: 'Acciones', items })),
];

const backSelect = [
  { action: 'back', label: 'Atrás', keys: keys.back },
  { action: 'select', label: 'Seleccionar', keys: keys.select },
];

document.querySelector('#journal').append(
  hud({
    ...common,
    title: 'Diario de Aventura',
    sections: { ...common.sections, index: 0 },
    next: { label: 'Inventario', keys: keys.nextSection },
  }),
  el('div', { class: 'c-panel d-panel' }),
  el(
    'div',
    { class: 'd-tabs-journal' },
    tabs({
      label: 'Diario de Aventura',
      activeId: 'quests',
      keys: { prev: 'Z', next: 'C' },
      items: [
        { id: 'quests', iconName: 'quest', label: 'Misiones principales' },
        { id: 'side-quests', iconName: 'side-quest', label: 'Misiones secundarias' },
        { id: 'memories', iconName: 'memories', label: 'Recuerdos' },
      ],
    }),
  ),
  el(
    'div',
    { class: 'd-list' },
    list({
      label: 'Misiones principales',
      rows: [
        {
          id: 'ai',
          iconName: 'quest',
          title: 'Proyectos con IA',
          subtitle: 'Meta actual',
          status: 'active',
        },
        {
          id: 'skills',
          iconName: 'quest',
          title: 'Mejorar mis habilidades',
          subtitle: 'Meta actual',
        },
        {
          id: 'ari',
          iconName: 'quest',
          title: 'Desarrollador Full-Stack',
          subtitle: 'Grupo ARI · Las Palmas de G.C.',
          selected: true,
        },
        {
          id: 'crealia',
          iconName: 'quest',
          title: 'Desarrollador Full-Stack',
          subtitle: 'Crealia IT',
          status: 'done',
        },
        {
          id: 'advance',
          iconName: 'quest',
          title: 'Front-end (prácticas)',
          subtitle: 'Advance Digital Experts',
          status: 'done',
        },
      ],
    }),
  ),
  el(
    'div',
    { class: 'd-detail-quest' },
    detail({
      variant: 'quest',
      id: 'ari',
      title: 'Desarrollador Full-Stack',
      meta: { alert: true, left: 'Abr 2025 – Nov 2026', right: 'Grupo ARI' },
      body: [
        'Plataforma {{ERP}} empresarial del sector automoción con {{Laravel}} y {{JavaScript}}.',
        'Ingestión automatizada de datos por {{SFTP}}, procesamiento con {{colas}} para facturación y contabilidad, integraciones con varias {{APIs externas}} y control de acceso granular.',
      ],
    }),
  ),
  ...footer([
    { action: 'back', label: 'Atrás', keys: keys.back },
    { action: 'select', label: 'Ver detalle', keys: keys.select },
  ]),
);

const techs = [
  ['laravel', 4, true],
  ['php', 4],
  ['javascript', 4],
  ['typescript', 3],
  ['react', 3],
  ['mysql', 4],
  ['mongodb', 3],
  ['rest', 4],
  ['sass', 4],
  ['html', 4],
  ['css', 4],
  ['git', 4],
  ['vite', 3],
  ['bootstrap', 3],
  ['mui', 2],
];

document.querySelector('#inventory').append(
  hud({
    ...common,
    title: 'Inventario',
    sections: { ...common.sections, index: 1 },
    prev: { label: 'Diario de Aventura', keys: keys.prevSection },
    next: { label: 'Sistema', keys: keys.nextSection },
  }),
  el(
    'div',
    { class: 'd-tabs-inventory' },
    tabs({
      label: 'Inventario',
      activeId: 'weapons',
      keys: { prev: 'Z', next: 'C' },
      items: [
        { id: 'weapons', iconName: 'weapons', label: 'Armas' },
        { id: 'armor', iconName: 'armor', label: 'Armaduras' },
        { id: 'key-items', iconName: 'key-items', label: 'Objetos clave' },
      ],
    }),
  ),
  pager({ direction: 'prev', label: 'Página anterior', disabled: true }),
  el(
    'div',
    { class: 'd-grid' },
    grid({
      label: 'Armas: tecnologías principales',
      cells: techs.map(([id, level, featured], index) => ({
        id,
        iconName: 'weapons',
        label: `${id}, nivel ${level}`,
        badge: level,
        featured,
        selected: index === 7,
      })),
    }),
  ),
  pager({ direction: 'next', label: 'Página siguiente' }),
  el('div', { class: 'd-viewer', 'aria-hidden': 'true' }),
  el(
    'div',
    { class: 'd-detail-item' },
    detail({
      variant: 'item',
      id: 'rest',
      title: 'APIs REST',
      stars: { value: 4, max: 5, label: 'Nivel 4 de 5' },
      chips: [{ iconName: 'weapons', value: '4', label: 'Nivel 4' }],
      effect: { iconName: 'star', text: '2 años y 5 meses' },
      body: ['Integraciones con varias APIs externas en un ERP en producción.'],
    }),
  ),
  ...footer(backSelect),
);

document.querySelector('.c-pager--prev').classList.add('d-pager-prev');
document.querySelector('.c-pager--next').classList.add('d-pager-next');

document.querySelector('#system').append(
  hud({
    ...common,
    title: 'Sistema',
    sections: { ...common.sections, index: 2 },
    prev: { label: 'Inventario', keys: keys.prevSection },
  }),
  el(
    'div',
    { class: 'd-buttons' },
    ['Volumen', 'Idioma', 'Reducir animaciones', 'Modo rápido', 'Volver al inicio'].map(
      (text, index) =>
        el('button', {
          class: `c-button${index === 0 ? ' is-selected' : ''}`,
          type: 'button',
          text,
        }),
    ),
  ),
  ...footer(backSelect),
);
