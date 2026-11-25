import { el } from '../core/dom.js';
import { emit } from '../core/bus.js';
import { peek } from '../core/data.js';
import { formatPeriod } from '../core/experience.js';
import { t } from '../core/i18n.js';
import { findSection } from '../core/sections.js';
import { isMobile } from '../core/device.js';
import { set, state } from '../core/store.js';
import { detail } from '../components/detail.js';
import { list } from '../components/list.js';
import { openSheet } from '../components/sheet.js';

const period = (item) =>
  item.period ? formatPeriod(item.period, state.lang, t('status.current')) : null;
const joined = (...parts) => parts.filter(Boolean).join(' · ');

/** "Stack: Laravel, PHP…" with the names from tech.json (falls back to the id). */
function stackLine(stack = []) {
  if (!stack.length) return null;
  const tech = peek(state.lang, 'tech')?.data.items ?? [];
  const names = stack.map((id) => tech.find((item) => item.id === id)?.name ?? id);
  return `${t('detail.stack')}: ${names.join(', ')}`;
}

// One entry per journal tab: data file, list row and detail panel.
const TABS = {
  quests: {
    file: 'quests',
    row: (quest) => ({
      iconName: 'quest',
      subtitle: quest.kind === 'goal' ? t('journal.goal') : joined(quest.org, quest.location),
      status: quest.status === 'active' ? 'active' : 'done',
    }),
    detail: (quest) => ({
      meta: { alert: quest.status === 'active', left: period(quest), right: quest.org },
      body: [quest.summary, ...(quest.details ?? []), stackLine(quest.stack)].filter(Boolean),
    }),
  },
  'side-quests': {
    file: 'sidequests',
    row: (side) => ({ iconName: 'side-quest', subtitle: side.location }),
    detail: (side) => ({
      meta: { left: side.location },
      body: side.description,
      links: side.links,
    }),
  },
  memories: {
    file: 'projects',
    row: (project) => ({ iconName: 'memories', subtitle: project.context }),
    detail: (project) => ({
      meta: { left: period(project), right: project.context },
      body: [
        project.summary,
        project.role && `${t('detail.role')}: ${project.role}`,
        stackLine(project.stack),
      ].filter(Boolean),
      points: project.highlights,
      note: project.confidential ? t('detail.confidential') : null,
      links: [
        project.links.demo && { href: project.links.demo, label: t('detail.demo') },
        project.links.repo && { href: project.links.repo, label: t('detail.repo') },
      ].filter(Boolean),
    }),
  },
};

let root = null;

const tabConfig = () => TABS[state.tab];
const items = () => peek(state.lang, tabConfig().file)?.data.items;
// No selection (or an unknown id from a deep link) shows the first item.
const selected = (entries) => entries.find((item) => item.id === state.selection) ?? entries[0];

function render() {
  const entries = items();
  if (!entries) {
    root.replaceChildren(
      el('p', { class: 's-journal__message', role: 'alert', text: t('errors.data') }),
    );
    return;
  }
  if (!entries.length) {
    root.replaceChildren(el('p', { class: 's-journal__message', text: t('journal.empty') }));
    return;
  }

  const { row, detail: detailOf } = tabConfig();
  const current = selected(entries);
  const listNode = el(
    'div',
    { class: 's-journal__list' },
    list({
      label: t(`tabs.${findSection('journal').tabs.find((tab) => tab.id === state.tab).key}`),
      rows: entries.map((item) => ({
        id: item.id,
        title: item.title,
        selected: item === current,
        ...row(item),
      })),
    }),
  );
  // On mobile the detail opens in a bottom sheet instead (see openDetail).
  if (isMobile()) root.replaceChildren(listNode);
  else {
    root.replaceChildren(
      listNode,
      el('div', { class: 's-journal__detail' }, detailPanel(current, detailOf, true)),
    );
  }
}

function detailPanel(item, detailOf, scrollable) {
  return detail({
    variant: 'quest',
    id: item.id,
    title: item.title,
    scrollable,
    ...detailOf(item),
  });
}

function openDetail() {
  const current = selected(items());
  openSheet({
    content: detailPanel(current, tabConfig().detail, false),
    labelledBy: `detail-title-${current.id}`,
    closeLabel: t('detail.close'),
    onClose: focusSelected,
  });
}

function focusSelected() {
  const option = root.querySelector('[role="option"][aria-selected="true"]');
  option?.focus();
  option?.scrollIntoView({ block: 'nearest' });
}

export function mount(target) {
  root = target;
  root.classList.add('s-journal');
  render();
}

export function update(keys) {
  if (keys.includes('selection')) render();
}

function choose(id) {
  if (id !== selected(items()).id) {
    set({ selection: id });
    emit('ui:sfx', 'cursor');
  }
  focusSelected();
  return true;
}

/** ↑/↓ walk the list (↓ from the tabs enters it, ↑ from the top returns to them). */
export function handle(action) {
  const entries = items();
  if (!entries?.length) return false;

  if (action.type === 'item') {
    choose(action.id);
    if (isMobile()) openDetail();
    return true;
  }
  if (action.type === 'select') {
    if (!document.activeElement?.closest('[role="option"]')) return false;
    if (isMobile()) openDetail();
    return true;
  }
  if (action.type !== 'move' || !action.dy) return false;

  const inTabs = document.activeElement?.closest('[role="tablist"]');
  if (inTabs) {
    if (action.dy > 0) focusSelected();
    return true;
  }

  const next = entries.indexOf(selected(entries)) + action.dy;
  if (next < 0) {
    document.querySelector('[role="tab"][aria-selected="true"]')?.focus();
    return true;
  }
  return choose(entries[Math.min(next, entries.length - 1)].id);
}
