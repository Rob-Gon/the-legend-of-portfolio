import { describe, expect, it } from 'vitest';
import {
  currentMonth,
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

describe('currentMonth', () => {
  it('pads the month', () => {
    expect(currentMonth(new Date(2026, 0, 15))).toBe('2026-01');
  });
});
