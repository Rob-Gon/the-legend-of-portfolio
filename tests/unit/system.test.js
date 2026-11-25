// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { DEFAULT_PREFS, readPrefs } from '../../src/core/prefs.js';
import { set, state } from '../../src/core/store.js';
import * as system from '../../src/screens/system.js';
import { useLanguage } from './helpers/ui.js';

await useLanguage('es');
localStorage.clear();
set({ prefs: { ...DEFAULT_PREFS } });

const root = document.createElement('div');
document.body.append(root);
system.mount(root);

const control = (setting) => root.querySelector(`[data-setting="${setting}"]`);

describe('System settings', () => {
  it('shows every setting with an accessible name', () => {
    const names = [...root.querySelectorAll('.c-setting__label')].map((label) => label.textContent);
    expect(names).toEqual([
      'Volumen de la música',
      'Volumen de los efectos',
      'Silenciar',
      'Reducir animaciones',
      'Atajos de una tecla',
    ]);
    expect(control('musicVolume').value).toBe('50');
    expect(control('muted').getAttribute('aria-labelledby')).toBe('setting-muted');
  });

  it('toggles a setting, saves it and reflects it', () => {
    control('muted').click();
    expect(state.prefs.muted).toBe(true);
    expect(readPrefs().muted).toBe(true);
    expect(control('muted').getAttribute('aria-pressed')).toBe('false');

    system.update(['prefs']);
    expect(control('muted').getAttribute('aria-pressed')).toBe('true');
    expect(control('muted').textContent).toBe('Sí');
  });

  it('cycles the motion setting through system, reduced and full', () => {
    const values = [];
    for (let step = 0; step < 3; step += 1) {
      control('motion').click();
      system.update(['prefs']);
      values.push([state.prefs.motion, control('motion').textContent]);
    }
    expect(values).toEqual([
      ['reduced', 'Sí'],
      ['full', 'No'],
      ['system', 'Según el sistema'],
    ]);
  });

  it('saves the volume from the slider', () => {
    const slider = control('sfxVolume');
    slider.value = '25';
    slider.dispatchEvent(new Event('input'));
    expect(state.prefs.sfxVolume).toBe(0.25);
    expect(slider.getAttribute('aria-valuetext')).toBe('25 %');
    expect(readPrefs().sfxVolume).toBe(0.25);
  });

  it('moves focus through menu buttons and settings with up/down', () => {
    for (let step = 0; step < 4; step += 1) system.handle({ type: 'move', dx: 0, dy: 1 });
    expect(document.activeElement).toBe(control('musicVolume'));
  });
});
