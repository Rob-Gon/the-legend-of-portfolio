import { el } from '../core/dom.js';
import { emit } from '../core/bus.js';
import { peek } from '../core/data.js';
import { formatDuration, monthsIn } from '../core/experience.js';
import { t } from '../core/i18n.js';
import { findSection } from '../core/sections.js';
import { isMobile } from '../core/device.js';
import { set, state } from '../core/store.js';
import { detail } from '../components/detail.js';
import { grid, pager } from '../components/grid.js';
import { icon } from '../components/icon.js';
import { openSheet } from '../components/sheet.js';

const COLUMNS = 5;
// Mobile: 4 columns and every weapons page stacked as a titled group (no pagers).
const MOBILE_COLUMNS = 4;
const columns = () => (isMobile() ? MOBILE_COLUMNS : COLUMNS);
// Weapons are split into pages by category, in this order.
const CATEGORIES = ['core', 'secondary', 'tools', 'office'];
const ABSOLUTE_URL = /^(https:|mailto:)/;

let root = null;

const isWeapons = () => state.tab === 'weapons';
const tabKey = () => findSection('inventory').tabs.find((tab) => tab.id === state.tab).key;

function items() {
  if (state.tab === 'key-items') return peek(state.lang, 'profile')?.data.keyItems;
  return peek(state.lang, isWeapons() ? 'tech' : 'softskills')?.data.items;
}

const selected = (all) => all.find((item) => item.id === state.selection) ?? all[0];
const pages = (all) =>
  CATEGORIES.filter((category) => all.some((item) => item.category === category));
const pageItems = (all, current) =>
  isWeapons() ? all.filter((item) => item.category === current.category) : all;

function questsById() {
  const quests = peek(state.lang, 'quests')?.data.items ?? [];
  return (id) => quests.find((quest) => quest.id === id);
}

function weaponDetail(tech) {
  const quest = questsById();
  const names = (ids) =>
    ids
      .map(quest)
      .filter(Boolean)
      .map((entry) => entry.org ?? entry.title)
      .join(', ');
  // Years of use are computed from the jobs in `usedIn`, never written by hand.
  const months = tech.usedIn
    .map(quest)
    .filter((job) => job?.period)
    .reduce((sum, job) => sum + monthsIn(job.period), 0);
  const level = t('detail.levelOf', { value: tech.level });

  return {
    stars: { value: tech.level, max: 5, label: level },
    chips: [{ iconName: 'weapons', value: String(tech.level), label: level }],
    effect: months > 0 && {
      iconName: 'star',
      text: t('detail.years', { value: formatDuration(months, t) }),
    },
    body: [
      tech.description,
      tech.usedIn.length > 0 && `${t('detail.usedIn')}: ${names(tech.usedIn)}`,
      tech.studiedIn.length > 0 && `${t('detail.studied')}: ${names(tech.studiedIn)}`,
    ].filter(Boolean),
  };
}

function armorDetail(skill) {
  return {
    stars: { value: skill.level, max: 5, label: t('detail.levelOf', { value: skill.level }) },
    body: [skill.description, skill.example && `${t('detail.example')}: ${skill.example}`].filter(
      Boolean,
    ),
  };
}

function keyItemDetail(item) {
  if (!item.href) return { body: item.value };
  // Relative links (the CV PDFs) live under the site base path.
  const href = ABSOLUTE_URL.test(item.href) ? item.href : `${import.meta.env.BASE_URL}${item.href}`;
  return { links: [{ href, label: item.value[0] }], body: item.value.slice(1) };
}

function previewIcon(item) {
  const node = icon(item.icon, 'c-icon s-inventory__preview-icon');
  if (item.color) node.style.setProperty('--icon-color', item.color);
  return node;
}

const DETAILS = { weapons: weaponDetail, armor: armorDetail, 'key-items': keyItemDetail };

function render() {
  const all = items();
  if (!all?.length) {
    root.replaceChildren(
      el('p', {
        class: 's-inventory__message',
        role: all ? null : 'alert',
        text: t(all ? 'journal.empty' : 'errors.data'),
      }),
    );
    return;
  }

  const current = selected(all);
  if (isMobile()) {
    renderGroups(all, current);
    return;
  }
  const pageList = isWeapons() ? pages(all) : [];
  const pageIndex = pageList.indexOf(current.category);

  // Native replaceChildren would print `false` for the missing pagers, so filter them out.
  const children = [
    el('div', { class: 's-inventory__preview', 'aria-hidden': 'true' }, previewIcon(current)),
    isWeapons() &&
      pager({ direction: 'prev', label: t('inventory.prevPage'), disabled: pageIndex === 0 }),
    el(
      'div',
      { class: 's-inventory__grid' },
      grid({
        label: t(`tabs.${tabKey()}`),
        columns: COLUMNS,
        cells: pageItems(all, current).map((item) => cell(item, current)),
      }),
    ),
    isWeapons() &&
      pager({
        direction: 'next',
        label: t('inventory.nextPage'),
        disabled: pageIndex === pageList.length - 1,
      }),
    el('p', {
      class: 's-inventory__page',
      text: isWeapons()
        ? t('inventory.page', {
            name: t(`weaponPages.${current.category}`),
            current: pageIndex + 1,
            total: pageList.length,
          })
        : t(`tabHints.${tabKey()}`),
    }),
    el('div', { class: 's-inventory__detail' }, itemDetail(current, true)),
  ];
  root.replaceChildren(...children.filter(Boolean));
}

function cell(item, current) {
  return {
    id: item.id,
    iconName: item.icon,
    label: item.name,
    badge: item.level,
    color: item.color,
    selected: item === current,
  };
}

function itemDetail(item, scrollable) {
  return detail({
    variant: 'item',
    id: item.id,
    title: item.name,
    scrollable,
    ...DETAILS[state.tab](item),
  });
}

function renderGroups(all, current) {
  const groups = isWeapons()
    ? pages(all).map((category) => ({
        title: t(`weaponPages.${category}`),
        entries: all.filter((item) => item.category === category),
      }))
    : [{ title: t(`tabHints.${tabKey()}`), entries: all }];
  root.replaceChildren(
    ...groups.map(({ title, entries }) =>
      el('section', { class: 's-inventory__group' }, [
        el('h2', { class: 's-inventory__group-title', text: title }),
        grid({
          label: title,
          columns: MOBILE_COLUMNS,
          cells: entries.map((item) => cell(item, current)),
        }),
      ]),
    ),
  );
}

function openDetail() {
  const current = selected(items());
  openSheet({
    content: itemDetail(current, false),
    labelledBy: `detail-title-${current.id}`,
    closeLabel: t('detail.close'),
    onClose: focusSelected,
  });
}

function focusSelected() {
  root.querySelector('[role="gridcell"][aria-selected="true"]')?.focus();
}

export function mount(target) {
  root = target;
  root.classList.add('s-inventory');
  render();
}

export function update(keys) {
  if (keys.includes('selection')) render();
}

function choose(all, id) {
  if (id !== selected(all).id) {
    set({ selection: id });
    emit('ui:sfx', 'cursor');
  }
  focusSelected();
  return true;
}

/** Previous/next weapons page: the first item going forward, the last going back. */
function turnPage(all, current, step) {
  const pageList = pages(all);
  const target = pageList[pageList.indexOf(current.category) + step];
  if (!target) return true;
  const onPage = all.filter((item) => item.category === target);
  return choose(all, (step > 0 ? onPage[0] : onPage[onPage.length - 1]).id);
}

function move(all, current, { dx, dy }) {
  if (document.activeElement?.closest('[role="tablist"]')) {
    if (dy > 0) focusSelected();
    return true;
  }

  const visible = pageItems(all, current);
  const index = visible.indexOf(current);

  if (dy) {
    const next = index + dy * columns();
    // Mobile groups are stacked: walking past a group's edge goes to the next/previous group.
    if (
      isMobile() &&
      isWeapons() &&
      (next < 0 ? current.category !== pages(all)[0] : next >= visible.length)
    ) {
      return turnPage(all, current, dy);
    }
    if (next < 0) {
      document.querySelector('[role="tab"][aria-selected="true"]')?.focus();
      return true;
    }
    // Down from a row above a shorter last row lands on the last item.
    return choose(all, visible[Math.min(next, visible.length - 1)].id);
  }

  const column = index % columns();
  const atEdge = dx > 0 ? column === columns() - 1 || index === visible.length - 1 : column === 0;
  // Walking off the side of the grid turns the page, as in the pause menu.
  if (atEdge) return isWeapons() ? turnPage(all, current, dx) : true;
  return choose(all, visible[index + dx].id);
}

export function handle(action) {
  const all = items();
  if (!all?.length) return false;
  const current = selected(all);

  switch (action.type) {
    case 'item':
      choose(all, action.id);
      if (isMobile()) openDetail();
      return true;
    case 'prevPage':
      return turnPage(all, current, -1);
    case 'nextPage':
      return turnPage(all, current, 1);
    case 'move':
      return move(all, current, action);
    case 'select':
      if (!document.activeElement?.closest('[role="gridcell"]')) return false;
      if (isMobile()) openDetail();
      return true;
    default:
      return false;
  }
}
