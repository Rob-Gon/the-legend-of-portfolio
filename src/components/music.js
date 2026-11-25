import { el } from '../core/dom.js';
import { icon } from './icon.js';

/**
 * Always-visible music bar (bottom-left): previous, pause/resume, next, master volume and the
 * track credit. Buttons dispatch `prevTrack`, `toggleMusic` and `nextTrack` via `data-action`;
 * the slider calls `onVolume(0–1)`. Dynamic state (icons, values) is set by the caller.
 * `labels`: { group, prev, next, pause, volume }.
 */
export function musicControls({ labels, onVolume }) {
  const button = (action, modifier, iconName, label) =>
    el(
      'button',
      {
        class: `c-music__button c-music__button--${modifier}`,
        type: 'button',
        'aria-label': label,
        title: label,
        dataset: { action },
      },
      icon(iconName),
    );

  return el('div', { class: 'c-music', role: 'group', 'aria-label': labels.group }, [
    button('prevTrack', 'prev', 'track-prev', labels.prev),
    button('toggleMusic', 'toggle', 'pause', labels.pause),
    button('nextTrack', 'next', 'track-next', labels.next),
    el('span', { class: 'c-music__speaker', 'aria-hidden': 'true' }, icon('sound-on')),
    el('input', {
      class: 'c-range c-music__volume',
      type: 'range',
      min: '0',
      max: '100',
      step: '5',
      'aria-label': labels.volume,
      oninput: (event) => {
        event.target.style.setProperty('--fill', `${event.target.value}%`);
        onVolume(Number(event.target.value) / 100);
      },
    }),
    el('p', { class: 'c-music__track', 'aria-live': 'polite' }),
  ]);
}
