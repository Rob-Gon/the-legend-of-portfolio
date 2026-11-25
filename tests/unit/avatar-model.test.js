// Node environment: GLTFLoader parses the binary model without a DOM.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { Box3, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { POSES, SEAT_DROP, poseAt, rigAvatar } from '../../src/three/avatar.js';

describe('avatar model (public/models/avatar.glb)', () => {
  it('loads the Blender model within budget and holds items in front of the chest', async () => {
    const file = readFileSync(resolve('public/models/avatar.glb'));
    expect(file.byteLength).toBeLessThan(1.5 * 1024 * 1024);
    const buffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
    const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(buffer, '');

    let triangles = 0;
    gltf.scene.traverse((child) => {
      if (child.isMesh)
        triangles += (child.geometry.index?.count ?? child.geometry.attributes.position.count) / 3;
    });
    expect(triangles).toBeLessThan(60_000);

    const avatar = rigAvatar(gltf.scene, { gradientMap: null });
    const head = avatar.head.getWorldPosition(new Vector3());
    const holdAt = (target) => {
      avatar.setPose(poseAt(1, 0, target));
      return avatar.hold.getWorldPosition(new Vector3());
    };

    const chest = holdAt('hold');
    expect(chest.z).toBeGreaterThan(0.15); // in front of the body
    expect(chest.y).toBeLessThan(head.y); // below the face
    expect(chest.y).toBeGreaterThan(0.9); // above the belt

    const overHead = holdAt('raise');
    expect(overHead.y).toBeGreaterThan(head.y + 0.25); // over the head
    expect(Math.abs(overHead.x)).toBeLessThan(0.05); // centred

    const oneHand = holdAt('raiseOne');
    expect(oneHand.y).toBeGreaterThan(head.y + 0.1); // up in the air
    expect(oneHand.x).toBeLessThan(-0.15); // off to the avatar's right side

    // A plain pose without `seat` (the title render uses POSES.rest) keeps the legs standing.
    avatar.setPose(POSES.rest);
    expect(avatar.root.getObjectByName('Hip_L').rotation.x).toBeCloseTo(0);
    expect(avatar.root.getObjectByName('Knee_R').rotation.x).toBeCloseTo(0);

    // Seated: thighs forward (knees in front of the hips), shins back down to the floor.
    avatar.setPose(poseAt(1, 0, 'type'));
    avatar.root.position.y = -SEAT_DROP;
    avatar.root.updateMatrixWorld(true);
    const at = (name) => avatar.root.getObjectByName(name).getWorldPosition(new Vector3());
    for (const side of ['L', 'R']) {
      const hip = at(`Hip_${side}`);
      const knee = at(`Knee_${side}`);
      expect(knee.z - hip.z).toBeGreaterThan(0.35);
      expect(Math.abs(knee.y - hip.y)).toBeLessThan(0.02);
    }
    let lowest = Infinity;
    avatar.root.getObjectByName('Knee_L').traverse((child) => {
      if (child.isMesh) lowest = Math.min(lowest, new Box3().setFromObject(child).min.y);
    });
    expect(Math.abs(lowest)).toBeLessThan(0.04); // feet on the floor
    avatar.dispose();
  });
});
