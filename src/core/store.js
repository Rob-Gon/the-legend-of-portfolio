import { emit } from './bus.js';

export const state = {
  lang: 'es',
  section: null,
  tab: null,
  selection: null,
  prefs: {},
};

/** Shallow-merges `patch` and emits `state:change` with the keys whose value really changed. */
export function set(patch) {
  const keys = Object.keys(patch).filter((key) => !Object.is(state[key], patch[key]));
  if (!keys.length) return;
  for (const key of keys) state[key] = patch[key];
  emit('state:change', { keys });
}
