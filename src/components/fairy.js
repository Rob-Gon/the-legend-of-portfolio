import { el } from '../core/dom.js';
import { inlineSvg } from './icon.js';
import fairyArt from '../assets/illustrations/guide-fairy.svg?raw';

/**
 * The Guide's unnamed fairy: flies in, hovers and talks through a speech bubble.
 * The art is decorative; the bubble is a polite live region so new tips are announced.
 */
export function fairy({ message }) {
  return el('div', { class: 'c-fairy' }, [
    el('div', { class: 'c-fairy__flight' }, [
      el('div', { class: 'c-fairy__hover' }, inlineSvg(fairyArt, 'c-fairy__art')),
    ]),
    el('p', { class: 'c-fairy__bubble', 'aria-live': 'polite', text: message }),
  ]);
}
