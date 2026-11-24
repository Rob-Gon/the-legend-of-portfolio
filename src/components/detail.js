import { el, rich } from '../core/dom.js';
import { icon } from './icon.js';

function stars({ value, max, label }) {
  const items = Array.from({ length: max }, (_, index) =>
    icon('star', `c-icon c-detail__star${index < value ? ' is-filled' : ''}`),
  );
  return el('p', { class: 'c-detail__stars' }, [
    el('span', { class: 'u-visually-hidden', text: label }),
    ...items,
  ]);
}

function chip({ iconName, value, label }) {
  return el('span', { class: 'c-detail__chip' }, [
    icon(iconName),
    el('span', {
      class: 'c-detail__chip-value',
      'aria-hidden': label ? 'true' : null,
      text: value,
    }),
    label && el('span', { class: 'u-visually-hidden', text: label }),
  ]);
}

/**
 * Detail panel. `variant`: 'quest' (large Adventure Log panel) or 'item' (inventory card).
 * `meta`: { alert?, left?, right? } line under the title.
 * `body`: array of paragraphs with optional `{{highlights}}`.
 */
export function detail({ variant, id, title, stars: rating, meta, chips = [], effect, body = [] }) {
  const titleId = `detail-title-${id}`;

  return el(
    'section',
    { class: `c-panel c-panel--plain c-detail c-detail--${variant}`, 'aria-labelledby': titleId },
    [
      rating && stars(rating),
      el('h2', { class: 'c-detail__title', id: titleId, text: title }),
      meta &&
        el('p', { class: 'c-detail__meta' }, [
          el('span', { class: 'c-detail__meta-left' }, [
            meta.alert && icon('alert', 'c-icon c-detail__alert'),
            meta.left,
          ]),
          meta.right && el('span', { class: 'c-detail__meta-right', text: meta.right }),
        ]),
      (chips.length > 0 || effect) &&
        el('p', { class: 'c-detail__chips' }, [
          ...chips.map(chip),
          effect &&
            el('span', { class: 'c-detail__effect' }, [
              effect.iconName && icon(effect.iconName),
              effect.text,
            ]),
        ]),
      el(
        'div',
        { class: 'c-detail__body' },
        body.map((paragraph) => el('p', {}, rich(paragraph))),
      ),
    ],
  );
}
