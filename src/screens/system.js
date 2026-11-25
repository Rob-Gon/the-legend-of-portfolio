import { el } from '../core/dom.js';
import { t } from '../core/i18n.js';
import { writePrefs } from '../core/prefs.js';
import { set, state } from '../core/store.js';
import { menu, moveMenuFocus } from '../components/menu.js';

const MOTION_ORDER = ['system', 'reduced', 'full'];
const NAVIGABLE = '.c-menu__button, .c-setting__control';

let root = null;

/** Saves and applies a preference change (main.js and the audio module react to `prefs`). */
function updatePrefs(patch) {
  const prefs = { ...state.prefs, ...patch };
  writePrefs(prefs);
  set({ prefs });
}

const onOff = (value) => t(value ? 'system.on' : 'system.off');

function row(key, labelKey, control) {
  return el('div', { class: 'c-setting' }, [
    el('span', { class: 'c-setting__label', id: `setting-${key}`, text: t(labelKey) }),
    control,
  ]);
}

function slider(key, labelKey) {
  const percent = Math.round(state.prefs[key] * 100);
  const input = (control) => {
    control.style.setProperty('--fill', `${percent}%`);
    return control;
  };
  return row(
    key,
    labelKey,
    input(
      el('input', {
        class: 'c-range c-setting__control c-setting__range',
        type: 'range',
        min: '0',
        max: '100',
        step: '5',
        value: String(percent),
        'aria-labelledby': `setting-${key}`,
        'aria-valuetext': `${percent} %`,
        dataset: { setting: key },
        oninput: (event) => {
          const value = Number(event.target.value);
          event.target.setAttribute('aria-valuetext', `${value} %`);
          event.target.style.setProperty('--fill', `${value}%`);
          updatePrefs({ [key]: value / 100 });
        },
      }),
    ),
  );
}

function toggle(key, labelKey) {
  return row(
    key,
    labelKey,
    el(
      'button',
      {
        class: 'c-setting__control c-setting__toggle',
        type: 'button',
        'aria-labelledby': `setting-${key}`,
        'aria-pressed': String(state.prefs[key]),
        dataset: { setting: key },
        onclick: () => updatePrefs({ [key]: !state.prefs[key] }),
      },
      el('span', { class: 'c-setting__value', text: onOff(state.prefs[key]) }),
    ),
  );
}

function motionCycle() {
  return row(
    'motion',
    'system.reduceMotion',
    el(
      'button',
      {
        class: 'c-setting__control c-setting__toggle',
        type: 'button',
        'aria-labelledby': 'setting-motion setting-motion-value',
        dataset: { setting: 'motion' },
        onclick: () => {
          const index = MOTION_ORDER.indexOf(state.prefs.motion);
          updatePrefs({ motion: MOTION_ORDER[(index + 1) % MOTION_ORDER.length] });
        },
      },
      el('span', {
        class: 'c-setting__value',
        id: 'setting-motion-value',
        text: t(`system.motion.${state.prefs.motion}`),
      }),
    ),
  );
}

export function mount(target) {
  root = target;
  root.classList.add('s-system');
  root.replaceChildren(
    el('div', { class: 's-system__menu' }, [
      menu({
        label: t('a11y.systemMenu'),
        items: [
          { action: 'guide', label: t('system.guide') },
          { action: 'language', label: t('title.languageCurrent', { name: t('meta.langName') }) },
          { action: 'title', label: t('system.backToTitle') },
        ],
      }),
      el('p', { class: 's-system__disclaimer', text: t('meta.disclaimer') }),
    ]),
    el('div', { class: 's-system__settings', role: 'group', 'aria-label': t('a11y.settings') }, [
      slider('musicVolume', 'system.musicVolume'),
      slider('sfxVolume', 'system.sfxVolume'),
      toggle('muted', 'system.mute'),
      motionCycle(),
      toggle('shortcuts', 'system.shortcuts'),
    ]),
  );
}

/** Keeps the controls in sync when prefs change elsewhere (e.g. the M key or the music bar). */
export function update(keys) {
  if (!keys.includes('prefs') || !root) return;
  for (const control of root.querySelectorAll('[data-setting]')) {
    const value = state.prefs[control.dataset.setting];
    if (control.type === 'range') {
      control.value = String(Math.round(value * 100));
      control.style.setProperty('--fill', `${control.value}%`);
    } else if (control.dataset.setting === 'motion') {
      control.querySelector('.c-setting__value').textContent = t(`system.motion.${value}`);
    } else {
      control.setAttribute('aria-pressed', String(value));
      control.querySelector('.c-setting__value').textContent = onOff(value);
    }
  }
}

export function handle(action) {
  if (action.type === 'move' && action.dy) return moveMenuFocus(root, action.dy, NAVIGABLE);
  return false;
}
