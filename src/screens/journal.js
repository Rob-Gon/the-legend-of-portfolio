import { el } from '../core/dom.js';
import { emit } from '../core/bus.js';
import { peek } from '../core/data.js';
import { formatPeriod } from '../core/experience.js';
import { t } from '../core/i18n.js';
import { findSection } from '../core/sections.js';
import { set, state } from '../core/store.js';
import { detail } from '../components/detail.js';
import { list } from '../components/list.js';

const period = (item) =>
  item.period ? formatPeriod(item.period, state.lang, t('status.current')) : null;
const joined = (...parts) => parts.filter(Boolean).join(' · ');

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
      body: [quest.summary, ...(quest.details ?? [])],
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
      body: [project.summary, project.role && `${t('detail.role')}: ${project.role}`].filter(
        Boolean,
      ),
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
  root.replaceChildren(
    el(
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
    ),
    el(
      'div',
      { class: 's-journal__detail' },
      detail({
        variant: 'quest',
        id: current.id,
        title: current.title,
        scrollable: true,
        ...detailOf(current),
      }),
    ),
  );
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

  if (action.type === 'item') return choose(action.id);
  if (action.type === 'select') return Boolean(document.activeElement?.closest('[role="option"]'));
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
