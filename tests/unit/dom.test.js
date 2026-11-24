// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { el, rich } from '../../src/core/dom.js';

describe('el', () => {
  it('sets class, text, dataset and attributes, skipping empty values', () => {
    const node = el('button', {
      class: 'c-button',
      text: 'Start',
      dataset: { action: 'select' },
      'aria-pressed': 'false',
      disabled: true,
      hidden: false,
      title: null,
    });

    expect(node.className).toBe('c-button');
    expect(node.textContent).toBe('Start');
    expect(node.dataset.action).toBe('select');
    expect(node.getAttribute('aria-pressed')).toBe('false');
    expect(node.hasAttribute('disabled')).toBe(true);
    expect(node.hasAttribute('hidden')).toBe(false);
    expect(node.hasAttribute('title')).toBe(false);
  });

  it('never parses markup in text or children', () => {
    const node = el('p', {}, ['<img src=x onerror=alert(1)>', el('b', { text: '<i>' })]);

    expect(node.querySelector('img')).toBeNull();
    expect(node.textContent).toBe('<img src=x onerror=alert(1)><i>');
  });

  it('flattens children and ignores null/false', () => {
    const node = el('ul', {}, [[el('li'), null], false, el('li')]);
    expect(node.children).toHaveLength(2);
  });

  it('binds on<event> handlers', () => {
    const onclick = vi.fn();
    el('button', { onclick }).click();
    expect(onclick).toHaveBeenCalledOnce();
  });
});

describe('rich', () => {
  it('turns {{keyword}} into highlighted <em> nodes', () => {
    const parts = rich('Built with {{Laravel}} and {{queues}}.');
    const node = el('p', {}, parts);

    expect(node.textContent).toBe('Built with Laravel and queues.');
    expect([...node.querySelectorAll('em.u-hl')].map((em) => em.textContent)).toEqual([
      'Laravel',
      'queues',
    ]);
  });

  it('returns plain text untouched and drops empty parts', () => {
    expect(rich('No highlights')).toEqual(['No highlights']);
    expect(rich('{{Only}}')).toHaveLength(1);
  });
});
