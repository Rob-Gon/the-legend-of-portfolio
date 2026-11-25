import { describe, expect, it } from 'vitest';
import { HOME, format, parse } from '../../src/core/router.js';

describe('router parse', () => {
  it.each([
    ['#/diario/misiones', { section: 'journal', tab: 'quests', selection: null }],
    ['#/diario/misiones/grupo-ari', { section: 'journal', tab: 'quests', selection: 'grupo-ari' }],
    ['#/diario/side-quests', { section: 'journal', tab: 'side-quests', selection: null }],
    ['#/diario/recuerdos/api-rest', { section: 'journal', tab: 'memories', selection: 'api-rest' }],
    ['#/diario', { section: 'journal', tab: 'quests', selection: null }],
    ['#/inventario/tecnologias/php', { section: 'inventory', tab: 'weapons', selection: 'php' }],
    ['#/inventario/habilidades', { section: 'inventory', tab: 'armor', selection: null }],
    ['#/inventario/objetos-clave', { section: 'inventory', tab: 'key-items', selection: null }],
    ['#/sistema', { section: 'system', tab: null, selection: null }],
    ['#/diario/misiones/', { section: 'journal', tab: 'quests', selection: null }],
  ])('%s', (hash, expected) => {
    expect(parse(hash)).toEqual(expected);
  });

  it.each([
    '',
    '#',
    '#/',
    '#/inicio',
    '#/nope',
    '#/diario/nope',
    '#/sistema/x',
    '#/diario/misiones/a/b',
  ])('unknown route %j → HOME', (hash) => {
    expect(parse(hash)).toBe(HOME);
  });

  it('drops invalid or non-selectable item ids', () => {
    expect(parse('#/diario/misiones/Bad_Id').selection).toBeNull();
    expect(parse('#/diario/misiones/<script>').selection).toBeNull();
    expect(parse('#/inventario/habilidades/teamwork').selection).toBeNull();
  });
});

describe('router format', () => {
  it.each([
    [{ section: 'journal', tab: 'quests', selection: null }, '#/diario/misiones'],
    [{ section: 'journal', tab: 'memories', selection: 'api-rest' }, '#/diario/recuerdos/api-rest'],
    [{ section: 'inventory', tab: 'armor', selection: 'teamwork' }, '#/inventario/habilidades'],
    [{ section: 'inventory', tab: null, selection: null }, '#/inventario/tecnologias'],
    [{ section: 'system', tab: null, selection: null }, '#/sistema'],
    [HOME, '#/inicio'],
  ])('%j → %s', (route, hash) => {
    expect(format(route)).toBe(hash);
  });

  it('round-trips every valid route', () => {
    for (const hash of ['#/diario/side-quests/music', '#/inventario/tecnologias', '#/sistema']) {
      expect(format(parse(hash))).toBe(hash);
    }
  });
});
