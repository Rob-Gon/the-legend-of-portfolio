import { createPlaylist } from './playlist.js';

export const FADE_IN_MS = 1500;
export const FADE_OUT_MS = 1500;
// Minimum gap between two plays of the same effect; the Guide chime gets a longer one so
// entering and leaving the Guide quickly never stacks it.
const MIN_GAP_MS = { cursor: 60, guide: 400 };
const DEFAULT_GAP_MS = 80;

/**
 * Howler wrapper. Everything it needs is injected (Howl, Howler, manifest, prefs), so it can be
 * tested without a browser. It never starts on its own: the caller creates it after a user
 * gesture, which is what lets music play at all.
 *
 * manifest: { intro, music: [{ id, title, author, files }], sfx: { name: [files] } }
 */
export function createAudio({
  Howl,
  Howler,
  manifest,
  base,
  prefs,
  onTrack = () => {},
  onIntroPlayed = () => {},
  now = () => performance.now(),
}) {
  let settings = { ...prefs };
  const url = (file) => `${base}audio/${file}`;
  const broken = new Set();
  const lastPlayed = {};

  const effects = Object.fromEntries(
    Object.entries(manifest.sfx ?? {}).map(([name, files]) => [
      name,
      new Howl({
        src: files.map(url),
        preload: true,
        onloaderror: () => broken.add(name),
      }),
    ]),
  );

  const playlist = createPlaylist({
    tracks: manifest.music ?? [],
    intro: manifest.intro,
    introPlayed: settings.introPlayed,
  });
  let music = null;
  let current = null;
  const brokenTracks = new Set();

  /** Next (or previous) track that has not failed to load; null when none is left. */
  function pick(step) {
    for (let tries = 0; tries <= playlist.size; tries += 1) {
      const track = step > 0 ? playlist.next() : playlist.previous();
      if (!track || !brokenTracks.has(track.id)) return track;
    }
    return null;
  }
  let pausedByVisibility = false;
  const ending = new WeakSet();

  function sfx(name) {
    const sound = effects[name];
    if (!sound || broken.has(name)) return;
    const time = now();
    if (time - (lastPlayed[name] ?? -Infinity) < (MIN_GAP_MS[name] ?? DEFAULT_GAP_MS)) return;
    lastPlayed[name] = time;
    // One instance per effect: restart it instead of layering copies (no clipping).
    sound.stop();
    sound.volume(settings.sfxVolume);
    sound.play();
  }

  function fadeOut(howl) {
    if (!howl) return;
    ending.add(howl);
    howl.once('fade', () => howl.unload());
    howl.fade(howl.volume(), 0, FADE_OUT_MS);
  }

  function play(track) {
    fadeOut(music);
    music = null;
    current = track;
    onTrack(track);
    if (!track) return;

    const howl = new Howl({
      src: track.files.map(url),
      html5: true, // streams long tracks instead of decoding them whole
      volume: 0,
      onend: () => !ending.has(howl) && play(pick(1)),
      onloaderror: () => {
        ending.add(howl);
        brokenTracks.add(track.id);
        play(pick(1));
      },
    });
    music = howl;
    howl.play();
    howl.fade(0, settings.musicVolume, FADE_IN_MS);
    if (track.id === manifest.intro) onIntroPlayed();
  }

  // Start the next track a little before the end so the fade-out overlaps the fade-in.
  const watcher = setInterval(() => {
    if (!music || ending.has(music) || !music.playing()) return;
    const left = (music.duration() - music.seek()) * 1000;
    if (left > 0 && left <= FADE_OUT_MS) play(pick(1));
  }, 250);

  const wantsMusic = () => !settings.muted && !settings.musicPaused;

  function onVisibility(hidden) {
    if (!music || settings.musicPaused) return;
    if (hidden && music.playing()) {
      pausedByVisibility = true;
      music.pause();
    } else if (!hidden && pausedByVisibility) {
      pausedByVisibility = false;
      music.play();
      music.fade(0, settings.musicVolume, FADE_IN_MS);
    }
  }

  Howler.mute(Boolean(settings.muted));
  Howler.volume(settings.volume ?? 1);
  if (wantsMusic()) play(pick(1));

  return {
    sfx,
    next: () => play(pick(1)),
    previous: () => play(pick(-1)),
    get current() {
      return current;
    },
    get hasMusic() {
      return (manifest.music ?? []).length > 0;
    },
    onVisibility,
    /**
     * Applies volume, mute and pause changes. Pausing keeps the track; resuming fades it back
     * in, or starts the playlist if nothing has played yet.
     */
    applyPrefs(next) {
      settings = { ...next };
      Howler.mute(Boolean(settings.muted));
      Howler.volume(settings.volume ?? 1);
      const live = music && !ending.has(music) ? music : null;
      if (settings.musicPaused) {
        if (live?.playing()) live.pause();
        return;
      }
      if (live) {
        live.volume(settings.musicVolume);
        if (!live.playing() && !pausedByVisibility) {
          live.play();
          live.fade(0, settings.musicVolume, FADE_IN_MS);
        }
      } else if (wantsMusic() && current === null) {
        play(pick(1));
      }
    },
    destroy() {
      clearInterval(watcher);
      music?.unload();
      Object.values(effects).forEach((sound) => sound.unload());
    },
  };
}
