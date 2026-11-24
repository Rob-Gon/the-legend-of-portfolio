// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { icon, iconNames } from '../../src/components/icon.js';
import { list, listRow } from '../../src/components/list.js';
import { grid } from '../../src/components/grid.js';
import { tabs } from '../../src/components/tabs.js';
import { detail } from '../../src/components/detail.js';
import { hints } from '../../src/components/hints.js';
import { heartFills, hud } from '../../src/components/hud.js';

describe('icon', () => {
  it('returns a decorative inline SVG', () => {
    const svg = icon('heart');
    expect(svg.tagName.toLowerCase()).toBe('svg');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(iconNames).toContain('gem');
  });

  it('throws on unknown names', () => {
    expect(() => icon('nope')).toThrow('Unknown icon: nope');
  });
});

describe('list', () => {
  it('renders a listbox with one focusable selected option', () => {
    const node = list({
      label: 'Quests',
      rows: [
        { id: 'a', title: 'A', selected: true },
        { id: 'b', title: 'B', status: 'done' },
      ],
    });
    const options = node.querySelectorAll('[role="option"]');

    expect(node.getAttribute('role')).toBe('listbox');
    expect(options[0].getAttribute('aria-selected')).toBe('true');
    expect(options[0].tabIndex).toBe(0);
    expect(options[1].tabIndex).toBe(-1);
    expect(options[1].classList.contains('c-row--done')).toBe(true);
  });

  it('omits the subtitle when missing', () => {
    expect(listRow({ id: 'x', title: 'X' }).querySelector('.c-row__subtitle')).toBeNull();
  });
});

describe('grid', () => {
  it('splits cells into rows of the given column count', () => {
    const cells = Array.from({ length: 7 }, (_, index) => ({
      id: `c${index}`,
      label: `Cell ${index}`,
      badge: index,
    }));
    const node = grid({ label: 'Weapons', columns: 5, cells });
    const rows = node.querySelectorAll('[role="row"]');

    expect(rows).toHaveLength(2);
    expect(rows[1].querySelectorAll('[role="gridcell"]')).toHaveLength(2);
    expect(node.querySelector('[data-id="c3"]').getAttribute('aria-label')).toBe('Cell 3');
  });
});

describe('tabs', () => {
  it('marks only the active tab as selected and focusable', () => {
    const node = tabs({
      label: 'Inventory',
      activeId: 'armor',
      items: [
        { id: 'weapons', iconName: 'weapons', label: 'Weapons' },
        { id: 'armor', iconName: 'armor', label: 'Armour' },
      ],
    });
    const [first, second] = node.querySelectorAll('[role="tab"]');

    expect(first.getAttribute('aria-selected')).toBe('false');
    expect(first.tabIndex).toBe(-1);
    expect(second.getAttribute('aria-selected')).toBe('true');
    expect(second.tabIndex).toBe(0);
    expect(first.textContent).toBe('Weapons');
  });
});

describe('detail', () => {
  it('labels the section with its title and renders highlights', () => {
    const node = detail({
      variant: 'quest',
      id: 'ari',
      title: 'Full-Stack Developer',
      meta: { alert: true, left: '2025', right: 'Grupo ARI' },
      body: ['Built with {{Laravel}}.'],
    });

    expect(node.getAttribute('aria-labelledby')).toBe('detail-title-ari');
    expect(node.querySelector('#detail-title-ari').textContent).toBe('Full-Stack Developer');
    expect(node.querySelector('.u-hl').textContent).toBe('Laravel');
    expect(node.querySelector('.c-detail__meta-right').textContent).toBe('Grupo ARI');
  });

  it('renders filled stars up to the value with a text alternative', () => {
    const node = detail({
      variant: 'item',
      id: 'php',
      title: 'PHP',
      stars: { value: 3, max: 5, label: 'Level 3 of 5' },
    });

    expect(node.querySelectorAll('.c-detail__star')).toHaveLength(5);
    expect(node.querySelectorAll('.c-detail__star.is-filled')).toHaveLength(3);
    expect(node.querySelector('.c-detail__stars').textContent).toBe('Level 3 of 5');
  });
});

describe('hints', () => {
  it('renders a button per action with keyboard and gamepad glyphs', () => {
    const node = hints({
      label: 'Actions',
      items: [{ action: 'back', label: 'Back', keys: { keyboard: 'Esc', gamepad: 'B' } }],
    });
    const button = node.querySelector('button');

    expect(button.dataset.action).toBe('back');
    expect(button.querySelector('kbd.c-key--kb').textContent).toBe('Esc');
    expect(button.querySelector('.c-key--pad').textContent).toBe('B');
  });
});

describe('hud', () => {
  it.each([
    [3, [1, 1, 1]],
    [2.5, [1, 1, 0.5]],
    [2.42, [1, 1, 0.5]],
    [0.1, []],
  ])('heartFills(%s) → %j', (value, expected) => {
    expect(heartFills(value)).toEqual(expected);
  });

  it('exposes hearts and gems as text and only renders existing neighbours', () => {
    const node = hud({
      title: 'Inventory',
      sections: { index: 1, count: 3 },
      next: { label: 'System', keys: { keyboard: 'R', gamepad: 'RB' } },
      hearts: { value: 3, label: '2 years and 5 months of experience' },
      gems: { value: 10, label: '10 projects' },
      available: 'Available for work',
    });

    expect(node.querySelector('h1').textContent).toBe('Inventory');
    expect(node.querySelectorAll('.c-hud__heart')).toHaveLength(3);
    expect(node.querySelector('.c-hud__hearts').textContent).toBe(
      '2 years and 5 months of experience',
    );
    expect(node.querySelector('.c-hud__gems').textContent).toBe('1010 projects');
    expect(node.querySelectorAll('button.c-hud__neighbor')).toHaveLength(1);
    expect(node.querySelectorAll('.c-hud__dot.is-active')).toHaveLength(1);
    expect(node.querySelector('.c-hud__available').textContent).toBe('Available for work');
  });
});
