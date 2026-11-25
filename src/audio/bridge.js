import { bus } from '../core/bus.js';
import { t } from '../core/i18n.js';
import { writePrefs } from '../core/prefs.js';
import { set, state } from '../core/store.js';
import { icon } from '../components/icon.js';
import { musicControls } from '../components/music.js';

// Small eager part of the audio feature: music bar, gesture unlock and wiring. Howler and the
// player itself are loaded lazily on the first user gesture, so music never autoplays.
const MANIFEST_URL = `${import.meta.env.BASE_URL}audio/manifest.json`;
// An effect requested while the module is still loading plays only if it is this recent.
const PENDING_SFX_MS = 1000;

let audio = null;
let loading = null;
let started = false;
let gestured = false;
let host = null;
let bar = null;
let track = null;
// Assume music until the manifest says otherwise, so the bar is usable before the first gesture.
let hasMusic = true;
let pending = null;

function updatePrefs(patch) {
  const prefs = { ...state.prefs, ...patch };
  writePrefs(prefs);
  set({ prefs });
}

function renderControls() {
  if (!host) return;
  const focused = host.contains(document.activeElement) && document.activeElement.dataset.action;
  bar = musicControls({
    labels: {
      group: t('music.label'),
      prev: t('music.prev'),
      next: t('music.next'),
      pause: t('music.pause'),
      volume: t('music.volume'),
    },
    onVolume: (volume) => updatePrefs({ volume }),
  });
  host.replaceChildren(bar);
  syncControls();
  // Re-rendering (language change) must not steal focus from the button the user was on.
  if (focused) host.querySelector(`[data-action="${focused}"]`)?.focus();
}

/** Updates the bar in place, so dragging the volume slider is never interrupted. */
function syncControls() {
  if (!bar) return;
  const { musicPaused, muted, volume } = state.prefs;
  const toggle = bar.querySelector('[data-action="toggleMusic"]');
  const toggleLabel = t(musicPaused ? 'music.play' : 'music.pause');
  toggle.setAttribute('aria-label', toggleLabel);
  toggle.title = toggleLabel;
  toggle.replaceChildren(icon(musicPaused ? 'play' : 'pause'));
  for (const button of bar.querySelectorAll('.c-music__button')) button.disabled = !hasMusic;

  const slider = bar.querySelector('.c-music__volume');
  const percent = Math.round(volume * 100);
  if (document.activeElement !== slider) slider.value = String(percent);
  slider.setAttribute('aria-valuetext', `${percent} %`);
  slider.style.setProperty('--fill', `${percent}%`);
  bar
    .querySelector('.c-music__speaker')
    .replaceChildren(icon(muted || volume === 0 ? 'sound-off' : 'sound-on'));
  bar.querySelector('.c-music__track').textContent = track
    ? t('music.nowPlaying', { title: track.title, author: track.author })
    : '';
}

async function loadManifest() {
  const response = await fetch(MANIFEST_URL);
  if (!response.ok) throw new Error(`HTTP ${response.status} loading ${MANIFEST_URL}`);
  return response.json();
}

function enable() {
  loading ??= Promise.all([import('howler'), import('./audio.js'), loadManifest()])
    .then(([{ Howl, Howler }, { createAudio }, manifest]) => {
      hasMusic = (manifest.music ?? []).length > 0;
      audio = createAudio({
        Howl,
        Howler,
        manifest,
        base: import.meta.env.BASE_URL,
        prefs: state.prefs,
        onTrack: (current) => {
          track = current;
          syncControls();
        },
        onIntroPlayed: () => updatePrefs({ introPlayed: true }),
      });
      syncControls();
      if (pending && performance.now() - pending.time < PENDING_SFX_MS) audio.sfx(pending.name);
    })
    // Audio is optional: if it fails the site keeps working, silently.
    .catch((error) => console.error(error));
  return loading;
}

// Armed as soon as this module loads, so a click made while the app is still booting counts.
// The browser keeps that activation, so playback can start once the app is ready.
function onGesture() {
  document.removeEventListener('pointerdown', onGesture, true);
  document.removeEventListener('keydown', onGesture, true);
  gestured = true;
  if (started) enable();
}
document.addEventListener('pointerdown', onGesture, true);
document.addEventListener('keydown', onGesture, true);

/** Mounts the music bar in `target`; audio loads on (or right after) the first gesture. */
export function startAudio(target) {
  host = target;
  started = true;
  renderControls();
  if (gestured) enable();

  bus.addEventListener('ui:sfx', ({ detail: name }) => {
    if (audio) audio.sfx(name);
    else pending = { name, time: performance.now() };
  });
  bus.addEventListener('state:change', ({ detail: { keys } }) => {
    if (keys.includes('prefs')) {
      audio?.applyPrefs(state.prefs);
      syncControls();
    }
    if (keys.includes('lang')) renderControls();
  });
  document.addEventListener('visibilitychange', () => audio?.onVisibility(document.hidden));
}

// Skipping a track while paused also resumes playback.
const resumeAnd = (move) => () => {
  if (state.prefs.musicPaused) updatePrefs({ musicPaused: false });
  move();
};

/** Actions available everywhere (music bar, M key). */
export const AUDIO_ACTIONS = {
  toggleMute: () => updatePrefs({ muted: !state.prefs.muted }),
  toggleMusic: () => updatePrefs({ musicPaused: !state.prefs.musicPaused }),
  nextTrack: resumeAnd(() => audio?.next()),
  prevTrack: resumeAnd(() => audio?.previous()),
};
