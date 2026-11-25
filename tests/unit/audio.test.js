import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FADE_IN_MS,
  FADE_OUT_MS,
  TYPING,
  createAudio,
  typingPattern,
} from '../../src/audio/audio.js';
import { createPlaylist } from '../../src/audio/playlist.js';

const tracks = ['intro', 'a', 'b', 'c'].map((id) => ({
  id,
  title: id,
  author: 'x',
  files: [`${id}.mp3`],
}));
const ids = (list) => list.map((track) => track?.id ?? null);
const take = (playlist, count, step = 'next') =>
  Array.from({ length: count }, () => playlist[step]());

describe('playlist', () => {
  const first = () => 0; // a "random" that keeps the shuffle predictable

  it('plays the intro first on the first visit, then loops the others without it', () => {
    const playlist = createPlaylist({ tracks, intro: 'intro', introPlayed: false, random: first });
    const order = ids(take(playlist, 8));
    expect(order[0]).toBe('intro');
    expect(order.slice(1).filter((id) => id === 'intro')).toEqual([]);
    expect(new Set(order.slice(1, 4))).toEqual(new Set(['a', 'b', 'c']));
    expect(order.slice(4, 7)).toEqual(order.slice(1, 4));
  });

  it('skips the intro once it has been played on an earlier visit', () => {
    const playlist = createPlaylist({ tracks, intro: 'intro', introPlayed: true, random: first });
    expect(ids(take(playlist, 6))).not.toContain('intro');
  });

  it('goes back through the loop, never to the intro', () => {
    const playlist = createPlaylist({ tracks, intro: 'intro', introPlayed: false, random: first });
    const forward = ids(take(playlist, 3));
    const back = playlist.previous();
    expect(back.id).toBe(forward[1]);
    expect(ids(take(playlist, 5, 'previous'))).not.toContain('intro');
  });

  it('handles only an intro, or no tracks at all', () => {
    const onlyIntro = createPlaylist({ tracks: [tracks[0]], intro: 'intro', introPlayed: false });
    expect(ids(take(onlyIntro, 3))).toEqual(['intro', null, null]);
    const empty = createPlaylist({ tracks: [], intro: 'intro', introPlayed: false });
    expect([empty.next(), empty.previous()]).toEqual([null, null]);
  });
});

/** Minimal Howler double that records what the player asks for. */
function fakeHowler() {
  const instances = [];
  class Howl {
    constructor(options) {
      Object.assign(this, {
        options,
        calls: [],
        listeners: {},
        isPlaying: false,
        vol: options.volume ?? 1,
      });
      this.length = 100;
      this.position = 0;
      instances.push(this);
    }
    play() {
      this.calls.push('play');
      this.isPlaying = true;
      return this.calls.length;
    }
    rate(value) {
      this.calls.push(`rate:${value.toFixed(2)}`);
    }
    pause() {
      this.calls.push('pause');
      this.isPlaying = false;
    }
    stop() {
      this.calls.push('stop');
      this.isPlaying = false;
    }
    unload() {
      this.calls.push('unload');
    }
    volume(value) {
      if (value === undefined) return this.vol;
      this.vol = value;
      this.calls.push(`volume:${value}`);
      return this;
    }
    fade(from, to, ms) {
      this.calls.push(`fade:${from}->${to}/${ms}`);
      this.vol = to;
      (this.listeners.fade ?? []).forEach((listener) => listener());
      this.listeners.fade = [];
    }
    once(event, listener) {
      (this.listeners[event] ??= []).push(listener);
    }
    playing() {
      return this.isPlaying;
    }
    duration() {
      return this.length;
    }
    seek() {
      return this.position;
    }
  }
  const Howler = {
    muted: false,
    master: 1,
    mute: (value) => (Howler.muted = value),
    volume: (value) => (Howler.master = value),
  };
  return { Howl, Howler, instances };
}

const manifest = {
  intro: 'intro',
  music: tracks,
  sfx: {
    cursor: ['sfx/cursor.mp3'],
    guide: ['sfx/guide.mp3'],
    key1: ['sfx/key-1.mp3'],
    key2: ['sfx/key-2.mp3'],
    key3: ['sfx/key-3.mp3'],
  },
};
const prefs = {
  volume: 1,
  musicVolume: 0.5,
  sfxVolume: 0.7,
  muted: false,
  musicPaused: false,
  introPlayed: false,
};

describe('audio player', () => {
  let clock;
  let howler;
  let player;
  const setup = (overrides = {}) => {
    howler = fakeHowler();
    player = createAudio({
      ...howler,
      manifest,
      base: '/base/',
      prefs: { ...prefs, ...overrides.prefs },
      now: () => clock,
      onIntroPlayed: overrides.onIntroPlayed,
      onTrack: overrides.onTrack,
    });
    return howler;
  };
  const effect = (name) =>
    howler.instances.find((howl) => howl.options.src[0].endsWith(`sfx/${name}.mp3`));
  const music = () => howler.instances.filter((howl) => howl.options.html5);

  beforeEach(() => {
    vi.useFakeTimers();
    clock = 1000;
  });
  afterEach(() => {
    player?.destroy();
    vi.useRealTimers();
  });

  it('starts with the intro, fading it in, and remembers it was played', () => {
    const onIntroPlayed = vi.fn();
    setup({ onIntroPlayed });
    const [first] = music();
    expect(first.options.src).toEqual(['/base/audio/intro.mp3']);
    expect(first.calls).toEqual(['play', `fade:0->0.5/${FADE_IN_MS}`]);
    expect(onIntroPlayed).toHaveBeenCalledOnce();
  });

  it('crossfades: the old track fades out and is unloaded, the new one fades in', () => {
    setup();
    player.next();
    const [first, second] = music();
    expect(first.calls).toContain(`fade:0.5->0/${FADE_OUT_MS}`);
    expect(first.calls.at(-1)).toBe('unload');
    expect(second.calls).toEqual(['play', `fade:0->0.5/${FADE_IN_MS}`]);
  });

  it('starts the next track just before the current one ends', () => {
    setup();
    const [first] = music();
    first.position = first.length - FADE_OUT_MS / 1000 + 0.1;
    vi.advanceTimersByTime(300);
    expect(music()).toHaveLength(2);
    vi.advanceTimersByTime(1000);
    expect(music()).toHaveLength(2);
  });

  it('skips tracks that fail to load and stops when none is left', () => {
    const onTrack = vi.fn();
    setup({ onTrack });
    for (let round = 0; round < 10; round += 1) music().at(-1).options.onloaderror();
    expect(onTrack).toHaveBeenLastCalledWith(null);
    expect(music().length).toBeLessThanOrEqual(5);
  });

  it('never plays music before being unmuted, and unmuting starts it', () => {
    setup({ prefs: { muted: true } });
    expect(howler.Howler.muted).toBe(true);
    expect(music()).toHaveLength(0);
    player.applyPrefs({ ...prefs, muted: false });
    expect(howler.Howler.muted).toBe(false);
    expect(music()).toHaveLength(1);
  });

  it('applies the master volume from the music bar', () => {
    setup({ prefs: { volume: 0.4 } });
    expect(howler.Howler.master).toBe(0.4);
    player.applyPrefs({ ...prefs, volume: 0.1 });
    expect(howler.Howler.master).toBe(0.1);
  });

  it('pauses and resumes the same track with a fade-in, and starts paused if asked', () => {
    setup();
    const [first] = music();
    player.applyPrefs({ ...prefs, musicPaused: true });
    expect(first.calls.at(-1)).toBe('pause');
    player.onVisibility(true);
    player.onVisibility(false);
    expect(first.calls.at(-1)).toBe('pause');
    player.applyPrefs({ ...prefs, musicPaused: false });
    expect(first.calls.slice(-3)).toEqual(['volume:0.5', 'play', `fade:0->0.5/${FADE_IN_MS}`]);
    expect(music()).toHaveLength(1);

    player.destroy();
    setup({ prefs: { musicPaused: true } });
    expect(music()).toHaveLength(0);
    player.applyPrefs({ ...prefs, musicPaused: false });
    expect(music()).toHaveLength(1);
  });

  it('applies the music volume to the playing track', () => {
    setup();
    player.applyPrefs({ ...prefs, musicVolume: 0.2 });
    expect(music()[0].calls).toContain('volume:0.2');
  });

  it('pauses while the tab is hidden and fades back in', () => {
    setup();
    const [first] = music();
    player.onVisibility(true);
    player.onVisibility(false);
    expect(first.calls.slice(-3)).toEqual(['pause', 'play', `fade:0->0.5/${FADE_IN_MS}`]);
  });

  it('plays one instance of an effect at a time and never stacks the Guide chime', () => {
    setup();
    player.sfx('guide');
    clock += 100;
    player.sfx('guide');
    clock += 400;
    player.sfx('guide');
    const guide = effect('guide');
    expect(guide.calls).toEqual(['stop', 'volume:0.7', 'play', 'stop', 'volume:0.7', 'play']);
  });

  it('types a burst of key clicks at varied rates, and a new burst replaces the old one', () => {
    setup();
    const clicks = () =>
      TYPING.keys
        .flatMap((key) => effect(key.replace('key', 'key-')).calls)
        .filter((call) => call.startsWith('rate:'));
    player.sfx('typing');
    vi.advanceTimersByTime(TYPING.durationMs / 2);
    const firstHalf = clicks().length;
    expect(firstHalf).toBeGreaterThan(3);
    player.sfx('typing'); // restart: the rest of the first burst never plays
    vi.advanceTimersByTime(TYPING.durationMs * 2);
    const total = clicks().length - firstHalf;
    expect(total).toBeLessThanOrEqual(Math.ceil(TYPING.durationMs / TYPING.gapMs[0]) + 1);
    expect(new Set(clicks()).size).toBeGreaterThan(1); // not all at the same pitch
  });

  it('throttles the cursor sound and ignores effects that failed to load', () => {
    setup();
    player.sfx('cursor');
    clock += 30;
    player.sfx('cursor');
    expect(effect('cursor').calls.filter((call) => call === 'play')).toHaveLength(1);

    effect('guide').options.onloaderror();
    clock += 1000;
    player.sfx('guide');
    expect(effect('guide').calls).not.toContain('play');
    player.sfx('missing');
  });
});

describe('typing pattern', () => {
  it('spreads clicks over the burst at a human pace, within the rate range', () => {
    const presses = typingPattern(1500);
    expect(presses[0].at).toBe(0);
    for (const [index, press] of presses.entries()) {
      expect(press.at).toBeLessThan(1500);
      expect(TYPING.keys).toContain(press.key);
      expect(press.rate).toBeGreaterThanOrEqual(TYPING.rate[0]);
      expect(press.rate).toBeLessThanOrEqual(TYPING.rate[1]);
      if (index)
        expect(press.at - presses[index - 1].at).toBeGreaterThanOrEqual(TYPING.gapMs[0] - 1);
    }
  });
});

describe('audio manifest', () => {
  const file = (...parts) => resolve('public/audio', ...parts);
  const data = JSON.parse(readFileSync(file('manifest.json'), 'utf8'));

  it('only lists files that exist, each with title, author and licence for music', () => {
    for (const track of data.music) {
      expect(track.title && track.author && track.licence, track.id).toBeTruthy();
      for (const path of track.files) expect(existsSync(file(path)), path).toBe(true);
    }
    for (const [name, paths] of Object.entries(data.sfx)) {
      for (const path of paths) expect(existsSync(file(path)), `${name}: ${path}`).toBe(true);
    }
  });
});
