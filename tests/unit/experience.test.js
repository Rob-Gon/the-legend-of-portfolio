import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createTranslator } from '../../src/core/i18n.js';
import {
  currentMonth,
  formatDuration,
  formatPeriod,
  monthsIn,
  totalExperience,
} from '../../src/core/experience.js';

describe('monthsIn', () => {
  it.each([
    [{ start: '2025-04', end: '2026-11' }, 20],
    [{ start: '2024-10', end: '2025-03' }, 6],
    [{ start: '2024-03', end: '2024-05' }, 3],
    [{ start: '2024-02', end: '2024-02' }, 1],
    [{ start: '2021', end: '2024' }, 37],
  ])('%j → %i months (inclusive)', (period, months) => {
    expect(monthsIn(period)).toBe(months);
  });

  it('counts ongoing periods up to now', () => {
    expect(monthsIn({ start: '2026-01', end: null }, '2026-11')).toBe(11);
  });
});

describe('totalExperience', () => {
  const quests = [
    { kind: 'goal', status: 'active' },
    { kind: 'job', period: { start: '2025-04', end: '2026-11' } },
    { kind: 'job', period: { start: '2024-10', end: '2025-03' } },
    { kind: 'job', period: { start: '2024-03', end: '2024-05' } },
    { kind: 'education', period: { start: '2021', end: '2024' } },
  ];

  it('adds up only jobs: 29 months = 2 years and 5 months', () => {
    expect(totalExperience(quests)).toEqual({ years: 2, months: 5, total: 29 });
  });
});

describe('formatPeriod', () => {
  it.each([
    ['es', { start: '2025-04', end: '2026-11' }, 'Abr 2025 – Nov 2026'],
    ['en', { start: '2025-04', end: '2026-11' }, 'Apr 2025 – Nov 2026'],
    ['es', { start: '2021', end: '2024' }, '2021 – 2024'],
    ['es', { start: '2026-11', end: null }, 'Nov 2026 – Actualidad'],
    ['es', { start: '2024-02' }, 'Feb 2024'],
    ['es', { start: '2024-02', end: '2024-02' }, 'Feb 2024'],
  ])('%s %j → %s', (lang, period, text) => {
    expect(formatPeriod(period, lang, 'Actualidad')).toBe(text);
  });
});

describe('formatDuration', () => {
  const ui = (lang) => JSON.parse(readFileSync(resolve('public/data', lang, 'ui.json'), 'utf8'));
  const es = createTranslator(ui('es'));
  const en = createTranslator(ui('en'));

  it.each([
    [20, '1 año y 8 meses', '1 year and 8 months'],
    [26, '2 años y 2 meses', '2 years and 2 months'],
    [12, '1 año', '1 year'],
    [24, '2 años', '2 years'],
    [6, '6 meses', '6 months'],
    [1, '1 mes', '1 month'],
    [0, '0 meses', '0 months'],
  ])('%i months', (months, spanish, english) => {
    expect(formatDuration(months, es)).toBe(spanish);
    expect(formatDuration(months, en)).toBe(english);
  });
});

describe('currentMonth', () => {
  it('pads the month', () => {
    expect(currentMonth(new Date(2026, 0, 15))).toBe('2026-01');
  });
});
