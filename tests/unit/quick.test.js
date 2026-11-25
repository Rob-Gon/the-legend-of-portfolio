import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { escape, renderQuickPage, rich } from '../../src/render/quick.js';
import { swipeToAction } from '../../src/core/input.js';

const FILES = ['ui', 'profile', 'quests', 'sidequests', 'projects', 'tech', 'softskills'];
const read = (lang) =>
  Object.fromEntries(
    FILES.map((file) => [
      file,
      JSON.parse(readFileSync(resolve('public/data', lang, `${file}.json`), 'utf8')),
    ]),
  );
const options = (lang) => ({
  lang,
  base: '/site/',
  siteUrl: 'https://example.test/site/',
  alternate: {
    lang: lang === 'es' ? 'en' : 'es',
    href: 'https://example.test/site/other/',
    path: '/site/other/',
  },
});
const render = (lang, patch = (data) => data) => {
  const data = read(lang);
  return renderQuickPage(patch({ ...data, fallbackUi: read('es').ui }), options(lang));
};

describe('quick mode helpers', () => {
  it('escapes HTML and turns {{keywords}} into <strong>', () => {
    expect(escape(`<a href="x">'&'</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;',
    );
    expect(rich('Uses {{<Laravel>}} & more')).toBe(
      'Uses <strong>&lt;Laravel&gt;</strong> &amp; more',
    );
  });
});

describe('renderQuickPage', () => {
  const es = render('es');

  it('is a complete, language-tagged page with every section', () => {
    expect(es).toMatch(/^<!doctype html>\n<html lang="es">/);
    expect(es).toContain('<h1>Roberto Báez González</h1>');
    for (const heading of ['Contacto', 'Experiencia', 'Proyectos', 'Tecnologías', 'Habilidades']) {
      expect(es).toContain(`>${heading}</h2>`);
    }
    expect(es).toContain('Proyecto de fan no oficial. Sin relación con Nintendo.');
    expect(es).toContain('2 años y 5 meses de experiencia profesional');
    expect(es).not.toContain('<script');
  });

  it('links contact items, the CV under the base path and external links safely', () => {
    expect(es).toContain('href="mailto:robertobbgg@gmail.com"');
    expect(es).toContain('href="/site/cv/cv-es.pdf"');
    expect(es).toContain(
      '<a href="https://github.com/Rob-Gon/Contact-Form" target="_blank" rel="noopener noreferrer">',
    );
  });

  it('points to the other language and the interactive version', () => {
    expect(es).toContain(
      '<link rel="alternate" hreflang="en" href="https://example.test/site/other/">',
    );
    expect(es).toContain('<a href="/site/other/" hreflang="en" lang="en">English version</a>');
    expect(es).toContain('<a href="/site/">Ver la versión interactiva</a>');
    expect(render('en')).toMatch(/<html lang="en">[\s\S]*Experience<\/h2>/);
  });

  it('never lets content inject markup or unsafe links', () => {
    const html = render('es', (data) => ({
      ...data,
      profile: {
        ...data.profile,
        summary: ['<script>alert(1)</script>'],
        keyItems: [
          { id: 'x', icon: 'mail', name: 'X', value: ['click'], href: 'javascript:alert(1)' },
        ],
      },
    }));
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('javascript:');
  });
});

describe('swipeToAction', () => {
  it.each([
    [{ dx: -120, dy: 10, ms: 200 }, { type: 'nextSection' }],
    [{ dx: 120, dy: -20, ms: 300 }, { type: 'prevSection' }],
    [{ dx: -40, dy: 0, ms: 200 }, null],
    [{ dx: -120, dy: 90, ms: 200 }, null],
    [{ dx: -120, dy: 0, ms: 900 }, null],
  ])('%j → %j', (swipe, action) => {
    expect(swipeToAction(swipe)).toEqual(action);
  });
});
