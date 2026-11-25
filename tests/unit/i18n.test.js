// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { createTranslator, detectLang, t } from '../../src/core/i18n.js';
import { useLanguage } from './helpers/ui.js';

const readUi = (lang) => JSON.parse(readFileSync(resolve('public/data', lang, 'ui.json'), 'utf8'));

const leaves = (node, prefix = '') =>
  Object.entries(node).flatMap(([key, value]) =>
    value && typeof value === 'object'
      ? leaves(value, `${prefix}${key}.`)
      : [[`${prefix}${key}`, value]],
  );
const keysOf = (node) =>
  leaves(node)
    .map(([key]) => key)
    .sort();

describe('detectLang', () => {
  it.each([
    ['en', ['es-ES'], 'en'],
    ['es', ['en-US'], 'es'],
    [null, ['en-GB', 'es-419'], 'es'],
    [null, ['ES'], 'es'],
    [null, ['fr-FR', 'de'], 'en'],
    [null, [], 'en'],
    ['de', ['es'], 'es'],
  ])('saved %j + browser %j → %s', (saved, languages, expected) => {
    expect(detectLang(saved, languages)).toBe(expected);
  });
});

describe('createTranslator', () => {
  const es = { hud: { gems: '{count} proyectos' }, only: { es: 'Solo ES' } };
  const en = { hud: { gems: '{count} projects' } };

  it('interpolates placeholders and leaves unknown ones', () => {
    const tr = createTranslator(en, es);
    expect(tr('hud.gems', { count: 11 })).toBe('11 projects');
    expect(tr('hud.gems')).toBe('{count} projects');
    expect(tr('hud.gems', { other: 1 })).toBe('{count} projects');
  });

  it('falls back to Spanish, then to the key, warning once per key', () => {
    const warn = vi.fn();
    const tr = createTranslator(en, es, warn);
    expect(tr('only.es')).toBe('Solo ES');
    expect(tr('only.es')).toBe('Solo ES');
    expect(tr('nope.key')).toBe('nope.key');
    expect(tr('hud')).toBe('hud');
    expect(warn.mock.calls).toEqual([['only.es'], ['nope.key'], ['hud']]);
  });
});

describe('ui.json', () => {
  it('has the same keys in every language, all non-empty strings', () => {
    const es = readUi('es');
    const en = readUi('en');
    expect(keysOf(en)).toEqual(keysOf(es));
    for (const [key, value] of [...leaves(es), ...leaves(en)]) {
      expect(typeof value === 'string' && value.trim() !== '', key).toBe(true);
    }
  });

  it('meta.lang matches its folder', () => {
    expect(readUi('es').meta.lang).toBe('es');
    expect(readUi('en').meta.lang).toBe('en');
  });
});

describe('loadLanguage', () => {
  it('activates the dictionary and updates <html lang>, title and description', async () => {
    document.head.innerHTML = '<meta name="description" content="">';
    await useLanguage('en');

    expect(t('sections.inventory')).toBe('Inventory');
    expect(document.documentElement.lang).toBe('en');
    expect(document.title).toBe('The Legend Of Roberto - Portfolio Of The Wild');
    expect(document.querySelector('meta[name="description"]').content).toContain(
      'full-stack developer',
    );
  });
});
