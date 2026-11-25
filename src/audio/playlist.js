/**
 * Music order: the intro track once (only on the very first visit), then the other tracks in a
 * shuffled loop that never includes the intro again. Pure: `random` is injectable for tests.
 */
export function createPlaylist({ tracks, intro, introPlayed, random = Math.random }) {
  const introTrack = introPlayed ? null : (tracks.find((track) => track.id === intro) ?? null);
  const loop = tracks.filter((track) => track.id !== intro);

  // Fisher–Yates shuffle, once per visit.
  for (let index = loop.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [loop[index], loop[other]] = [loop[other], loop[index]];
  }

  let introPending = Boolean(introTrack);
  let position = -1;

  return {
    next() {
      if (introPending) {
        introPending = false;
        return introTrack;
      }
      if (!loop.length) return null;
      position = (position + 1) % loop.length;
      return loop[position];
    },
    previous() {
      if (!loop.length) return null;
      position = position <= 0 ? loop.length - 1 : position - 1;
      return loop[position];
    },
    get size() {
      return loop.length + (introPending ? 1 : 0);
    },
  };
}
