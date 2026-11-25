import { describe, expect, it, vi } from 'vitest';
import { bus } from '../../src/core/bus.js';
import { set, state } from '../../src/core/store.js';
import { DEFAULT_PREFS, readPrefs } from '../../src/core/prefs.js';
import { load, stripPlaceholders } from '../../src/core/data.js';

describe('store', () => {
  it('emits state:change with only the keys that changed', () => {
    const listener = vi.fn();
    bus.addEventListener('state:change', listener);
    set({ section: 'journal', tab: 'quests' });
    set({ section: 'journal', tab: 'memories' });
    set({ tab: 'memories' });
    bus.removeEventListener('state:change', listener);

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener.mock.calls[0][0].detail.keys).toEqual(['section', 'tab']);
    expect(listener.mock.calls[1][0].detail.keys).toEqual(['tab']);
    expect(state.tab).toBe('memories');
  });
});

describe('prefs', () => {
  const storage = (value) => ({ getItem: () => value });

  it('returns defaults when nothing is stored', () => {
    expect(readPrefs(storage(null))).toEqual(DEFAULT_PREFS);
  });

  it('keeps valid values and drops invalid or unknown ones', () => {
    const stored = JSON.stringify({
      lang: 'en',
      musicVolume: 0.2,
      sfxVolume: 3,
      muted: 'yes',
      motion: 'reduced',
      shortcuts: false,
      evil: '<script>',
    });
    expect(readPrefs(storage(stored))).toEqual({
      ...DEFAULT_PREFS,
      lang: 'en',
      musicVolume: 0.2,
      motion: 'reduced',
      shortcuts: false,
    });
  });

  it('never throws on broken JSON or blocked storage', () => {
    expect(readPrefs(storage('{oops'))).toEqual(DEFAULT_PREFS);
    expect(
      readPrefs({
        getItem() {
          throw new Error('SecurityError');
        },
      }),
    ).toEqual(DEFAULT_PREFS);
  });
});

describe('data', () => {
  const reply = (body, status = 200) => ({
    ok: status < 400,
    status,
    json: async () => body,
  });

  it('loads a file once and caches it per language', async () => {
    const fetcher = vi.fn(async () => reply({ hello: 'hola' }));
    const first = await load('es', 'cache-test', fetcher);
    const second = await load('es', 'cache-test', fetcher);

    expect(first).toEqual({ ok: true, data: { hello: 'hola' } });
    expect(second).toBe(first);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][0]).toMatch(/data\/es\/cache-test\.json$/);
  });

  it('returns an error result on HTTP errors and retries next time', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(reply(null, 404))
      .mockResolvedValueOnce(reply({ ok: 1 }));
    const failed = await load('es', 'retry-test', fetcher);
    const retried = await load('es', 'retry-test', fetcher);

    expect(failed.ok).toBe(false);
    expect(failed.error.message).toContain('404');
    expect(retried).toEqual({ ok: true, data: { ok: 1 } });
  });

  it('never throws on network or JSON errors', async () => {
    const network = await load('es', 'network-test', async () => {
      throw new TypeError('Failed to fetch');
    });
    const badJson = await load('es', 'json-test', async () => ({
      ok: true,
      json: async () => {
        throw new SyntaxError('Unexpected token');
      },
    }));

    expect(network.ok).toBe(false);
    expect(badJson.ok).toBe(false);
  });

  it('strips placeholder items from list files only', () => {
    expect(stripPlaceholders({ items: [{ id: 'a' }, { id: 'b', _placeholder: true }] })).toEqual({
      items: [{ id: 'a' }],
    });
    expect(stripPlaceholders({ title: 'x' })).toEqual({ title: 'x' });
  });
});
