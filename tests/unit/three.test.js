// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { Mesh } from 'three';
import { iconNames, iconSource } from '../../src/components/icon.js';
import { POSES, poseAt } from '../../src/three/avatar.js';
import { createItemMesh, disposeItem } from '../../src/three/items.js';
import { prefersReducedMotion, webglAvailable } from '../../src/three/support.js';

describe('avatar pose', () => {
  it('goes from rest to hold with eased in-between values', () => {
    expect(poseAt(0)).toEqual(POSES.rest);
    expect(poseAt(1)).toEqual(POSES.hold);
    expect(poseAt(-1)).toEqual(POSES.rest);
    expect(poseAt(2)).toEqual(POSES.hold);
    const half = poseAt(0.5);
    expect(half.shoulderX).toBeCloseTo((POSES.rest.shoulderX + POSES.hold.shoulderX) / 2);
    // Eased: a quarter of the way in time is less than a quarter of the way in angle.
    const quarter = poseAt(0.25).shoulderX - POSES.rest.shoulderX;
    expect(Math.abs(quarter)).toBeLessThan(
      Math.abs(POSES.hold.shoulderX - POSES.rest.shoulderX) / 4,
    );
  });
});

describe('avatar idle lift', () => {
  it('raises the arms only as much as they are holding', () => {
    expect(poseAt(0, 0.1)).toEqual(POSES.rest);
    expect(poseAt(1, 0.1).shoulderX).toBeCloseTo(POSES.hold.shoulderX - 0.1);
    expect(poseAt(1, 0.1).elbowX).toBe(POSES.hold.elbowX);
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
