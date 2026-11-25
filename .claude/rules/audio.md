# Audio

## Library and loading

- Howler.js, loaded with dynamic `import()` on the first user gesture (the **Start** button or
  the first interaction after a deep link). Never in the initial bundle.
- **Music never plays without a user gesture.** Deep links open the hub silently; music starts
  only after an explicit click/tap/key press, and only if not muted.
- Pause music on `visibilitychange` (hidden) and resume on visible if it was playing.

## Channels and preferences

| Pref (`localStorage`) | Default | Notes |
|---|---|---|
| `musicVolume` | 0.5 | 0–1, applied to the music Howl |
| `sfxVolume` | 0.7 | 0–1, applied to every SFX Howl |
| `muted` | false | Global mute (`Howler.mute`) |

Read/write through `core/prefs.js` (try/catch; works without storage).

## Playback (owner's spec)

- `public/audio/manifest.json` is the single source: `intro` (track id), `music`
  (`[{ id, title, author, licence, source, files }]`) and `sfx` (`{ name: [files] }`). Only
  files that exist are listed (a unit test checks it), so no request ever 404s.
- First visit: the `intro` track plays first, then the other tracks loop in a shuffled order
  that never includes the intro again (`prefs.introPlayed`). Tracks fade out (1.5 s) and the
  next fades in (1.5 s), overlapping.
- Music bar (bottom-left on every screen): previous, mute, next and the current
  "title · author" (credit). `M` toggles mute anywhere.
- Effects never stack: one instance per effect (restart, not layer) plus a minimum gap
  (cursor 60 ms, Guide chime 400 ms). The Guide chime plays only when the Guide opens.
- Typing (Key items, desktop 3D only): `ui:sfx` `typing` plays a ~1.5 s burst of key clicks
  (`key1`–`key3`, every 70–150 ms, each at a random `rate` 0.85–1.25 so three clicks sound like
  many keys; `typingPattern` in `src/audio/audio.js`). A new selection restarts the burst. No
  burst with reduced motion.

## Files

- `public/audio/music/` — `title.*`, `hub.*` (loop).
- `public/audio/sfx/` — `cursor`, `select`, `back`, `tab`, `section`, `key-1`–`key-3` (Kenney UI
  Audio `switch13`, `switch14`, `mouseclick1`; CC0) and `guide`
  (fairy sound provided by the owner; see the owner's risk decision in `assets-ip.md`).
- Formats: `.mp3` (plays everywhere); `.webm` (Opus) first is optional once ffmpeg is available. SFX ≤ 30 KB each,
  music ≤ 2.5 MB per track (96 kbps, streamed), loudness-normalised.
- Missing or failing files: log once in dev, disable that sound, never break the UI.

## Licences

- SFX: **Kenney** "UI Audio" / "Interface Sounds" (CC0) — approved.
- Music: chosen by the owner; must allow commercial use. Until then, slots stay empty and the
  music controls still work (silent).
- Every audio file gets an entry in `THIRD_PARTY.md` (title, author, source URL, licence).
- **Never** use sounds or music ripped from any Nintendo game. Owner-approved exceptions (lo-fi
  versions from Pixabay, fairy sound) are listed in `assets-ip.md`.
