// Dates are "YYYY-MM" or "YYYY" (year-only items such as courses). Periods are inclusive.

const monthIndex = (date) => {
  const [year, month = '1'] = date.split('-');
  return Number(year) * 12 + Number(month) - 1;
};

/** Current month as "YYYY-MM". */
export function currentMonth(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/** Inclusive months in a period; `end: null` means ongoing (counts up to `now`). */
export function monthsIn({ start, end }, now = currentMonth()) {
  return monthIndex(end ?? now) - monthIndex(start) + 1;
}

/**
 * Professional experience from the `job` quests.
 * shortcut: overlapping jobs are counted twice; merge ranges if two jobs ever overlap.
 */
export function totalExperience(quests, now = currentMonth()) {
  const total = quests
    .filter((quest) => quest.kind === 'job' && quest.period)
    .reduce((sum, quest) => sum + monthsIn(quest.period, now), 0);
  return { years: Math.floor(total / 12), months: total % 12, total };
}

/** "Abr 2025 – Nov 2026", "2021 – 2024", "Nov 2026 – Actualidad" or a single date. */
export function formatPeriod({ start, end }, lang, currentLabel) {
  const monthYear = new Intl.DateTimeFormat(lang, { month: 'short', year: 'numeric' });
  const format = (date) => {
    if (!date.includes('-')) return date;
    const [year, month] = date.split('-').map(Number);
    const text = monthYear.format(new Date(year, month - 1, 1)).replace('.', '');
    return text.charAt(0).toUpperCase() + text.slice(1);
  };
  if (end === undefined || end === start) return format(start);
  return `${format(start)} – ${end === null ? currentLabel : format(end)}`;
}
