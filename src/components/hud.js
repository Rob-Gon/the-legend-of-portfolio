import { el } from '../core/dom.js';
import { icon } from './icon.js';
import { keyGlyph } from './hints.js';

function heart(fill) {
  const node = el('span', { class: 'c-hud__heart' }, [
    icon('heart', 'c-icon c-hud__heart-empty'),
    icon('heart', 'c-icon c-hud__heart-full'),
  ]);
  // CSSOM instead of a style attribute so a future CSP without 'unsafe-inline' keeps working.
  node.style.setProperty('--fill', String(fill));
  return node;
}

/** Whole hearts plus one partial heart rounded to quarters (e.g. 2.5 → [1, 1, 0.5]). */
export function heartFills(value) {
  const whole = Math.floor(value);
  const fills = Array.from({ length: whole }, () => 1);
  const rest = Math.round((value - whole) * 4) / 4;
  if (rest > 0) fills.push(rest);
  return fills;
}

function neighbor(side, data) {
  if (!data) return el('span', { class: 'c-hud__neighbor', 'aria-hidden': 'true' });

  return el(
    'button',
    {
      class: `c-hud__neighbor c-hud__neighbor--${side}`,
      type: 'button',
      dataset: { action: side === 'prev' ? 'prevSection' : 'nextSection' },
    },
    [
      el('span', { class: 'c-hud__neighbor-keys' }, keyGlyph(data.keys)),
      el('span', { text: data.label }),
    ],
  );
}

/**
 * Top bar. `hearts`/`gems`: { value, label } where `label` is the full screen-reader text.
 * `sections`: { index, count } for the pagination dots. `available`: badge text or null.
 * `hearts`, `gems` and `available` are optional (their data files arrive in later milestones).
 */
export function hud({ title, sections, prev, next, hearts, gems, available }) {
  const dots = Array.from({ length: sections.count }, (_, index) =>
    el('span', { class: `c-hud__dot${index === sections.index ? ' is-active' : ''}` }),
  );

  return el('header', { class: 'c-hud' }, [
    hearts
      ? el('p', { class: 'c-hud__hearts' }, [
          el('span', { class: 'u-visually-hidden', text: hearts.label }),
          ...heartFills(hearts.value).map(heart),
        ])
      : el('span', { 'aria-hidden': 'true' }),
    el('div', { class: 'c-hud__center' }, [
      neighbor('prev', prev),
      el('div', { class: 'c-hud__heading' }, [
        el('h1', { class: 'c-hud__title', text: title }),
        el('span', { class: 'c-hud__dots', 'aria-hidden': 'true' }, dots),
      ]),
      neighbor('next', next),
    ]),
    el('div', { class: 'c-hud__status' }, [
      gems &&
        el('p', { class: 'c-hud__gems' }, [
          icon('gem', 'c-icon c-hud__gem'),
          el('span', { 'aria-hidden': 'true', text: String(gems.value) }),
          el('span', { class: 'u-visually-hidden', text: gems.label }),
        ]),
      available && el('p', { class: 'c-hud__available', text: available }),
    ]),
  ]);
}
