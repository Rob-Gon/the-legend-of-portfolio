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

## Files

- `public/audio/music/` — `title.*`, `hub.*` (loop).
- `public/audio/sfx/` — `cursor`, `select`, `back`, `tab`, `section`, `open`.
- Each sound in two formats: `.webm` (Opus) first, `.mp3` fallback. SFX ≤ 30 KB each,
  music ≤ 1.5 MB per track, loudness-normalised.
- Missing or failing files: log once in dev, disable that sound, never break the UI.

## Licences

- SFX: **Kenney** "UI Audio" / "Interface Sounds" (CC0) — approved.
- Music: chosen by the owner; must allow commercial use. Until then, slots stay empty and the
  music controls still work (silent).
- Every audio file gets an entry in `THIRD_PARTY.md` (title, author, source URL, licence).
- **Never** use sounds or music from any Nintendo game, or recordings/remixes of them.
