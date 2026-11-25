// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { Mesh } from 'three';
import { iconNames, iconSource } from '../../src/components/icon.js';
import { POSES, mixPose, poseAt } from '../../src/three/avatar.js';
import { createEffect, effectFor } from '../../src/three/effects.js';
import { createItemMesh, disposeItem } from '../../src/three/items.js';
import { prefersReducedMotion, webglAvailable } from '../../src/three/support.js';

describe('avatar pose', () => {
  it('goes from rest to hold with eased in-between values', () => {
    expect(poseAt(0)).toMatchObject({ left: POSES.rest.left, right: POSES.rest.right, seat: 0 });
    expect(poseAt(1)).toMatchObject(POSES.hold);
    expect(poseAt(-1).left).toEqual(POSES.rest.left);
    expect(poseAt(2)).toMatchObject(POSES.hold);
    const half = poseAt(0.5).left;
    expect(half.shoulderX).toBeCloseTo((POSES.rest.left.shoulderX + POSES.hold.left.shoulderX) / 2);
    // Eased: a quarter of the way in time is less than a quarter of the way in angle.
    const quarter = poseAt(0.25).left.shoulderX - POSES.rest.left.shoulderX;
    expect(Math.abs(quarter)).toBeLessThan(
      Math.abs(POSES.hold.left.shoulderX - POSES.rest.left.shoulderX) / 4,
    );
  });

  it('raises both arms for weapons and only the right one for armour', () => {
    const both = poseAt(1, 0, 'raise');
    expect(both.left.shoulderX).toBeLessThan(-2);
    expect(both.right.shoulderX).toBeLessThan(-2);
    const one = poseAt(1, 0, 'raiseOne');
    expect(one.right.shoulderX).toBeLessThan(-2);
    expect(one.left).toEqual(POSES.rest.left);
    expect(one.anchor).toBe('right');
  });

  it('blends from any pose, so a tab change mid-move never jumps', () => {
    const midway = mixPose(POSES.rest, POSES.hold, 0.5);
    expect(mixPose(midway, POSES.raise, 0)).toMatchObject({
      left: midway.left,
      right: midway.right,
    });
    expect(mixPose(midway, POSES.raise, 1)).toMatchObject(POSES.raise);
  });

  it('sits down and turns the set for the Key items desk, and stands back up', () => {
    const seated = poseAt(1, 0, 'type');
    expect(seated.seat).toBe(1);
    expect(seated.yaw).toBe(POSES.type.yaw);
    expect(poseAt(0.5, 0, 'type').seat).toBeCloseTo(0.5);
    const standing = mixPose(seated, POSES.raise, 1);
    expect(standing.seat).toBe(0);
    expect(standing.yaw).toBe(0);
  });
});

describe('avatar idle lift', () => {
  it('raises only the busy arms, as much as they have arrived', () => {
    expect(poseAt(0, 0.1).left).toEqual(POSES.rest.left);
    expect(poseAt(1, 0.1).left.shoulderX).toBeCloseTo(POSES.hold.left.shoulderX - 0.1);
    expect(poseAt(1, 0.1).left.elbowX).toBe(POSES.hold.left.elbowX);
    expect(poseAt(1, 0.1, 'raiseOne').left).toEqual(POSES.rest.left);
  });
});

describe('item effects', () => {
  it('adds rays and an aura at level 5, only rays at 4 and nothing below', () => {
    expect(effectFor(5)).toBe('radiant');
    expect(effectFor(4)).toBe('rays');
    expect(effectFor(3)).toBe('halo');
    expect(effectFor(1)).toBe('halo');
    expect(effectFor(undefined)).toBe('halo');
  });

  it('builds one layer for rays and two for radiant, none for the plain halo', () => {
    expect(createEffect('halo', { color: '#ff2d20' })).toBeNull();
    for (const [kind, layers] of [
      ['rays', 1],
      ['radiant', 2],
    ]) {
      const effect = createEffect(kind, { color: '#ff2d20' });
      expect(effect.object.children).toHaveLength(layers);
      effect.update(1000, false);
      effect.dispose();
    }
  });
});

describe('item glow depth', () => {
  it('draws over nearer geometry only when asked (weapons), otherwise behind it (armour)', () => {
    const layers = (overlay) =>
      createEffect('radiant', { color: '#ffffff', overlay }).object.children.map(
        (layer) => layer.material.depthTest,
      );
    expect(layers(true)).toEqual([false, false]);
    expect(layers(false)).toEqual([true, true]);
  });
});

describe('3D items', () => {
  it.each(iconNames)('extrudes the %s icon into a centred, sized object', (name) => {
    const item = createItemMesh(iconSource(name), { color: '#ff2d20', size: 0.42 });
    let meshes = 0;
    item.traverse((child) => {
      if (child instanceof Mesh) meshes += 1;
    });
    expect(meshes).toBeGreaterThan(0);
    expect(item.scale.x).toBeGreaterThan(0);
    disposeItem(item);
  });
});

describe('3D support checks', () => {
  it('reports no WebGL where there is none (jsdom), so 3D never loads there', () => {
    expect(webglAvailable()).toBe(false);
  });

  it('follows the System motion setting before the OS preference', () => {
    document.documentElement.dataset.motion = 'reduced';
    expect(prefersReducedMotion()).toBe(true);
    document.documentElement.dataset.motion = 'full';
    expect(prefersReducedMotion()).toBe(false);
    delete document.documentElement.dataset.motion;
    expect(prefersReducedMotion()).toBe(false);
  });
});
