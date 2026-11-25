// Node environment: GLTFLoader parses the binary model without a DOM.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { rigAvatar } from '../../src/three/avatar.js';

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
    avatar.setPose(1);
    const hold = avatar.hold.getWorldPosition(new Vector3());
    const head = avatar.head.getWorldPosition(new Vector3());
    expect(hold.z).toBeGreaterThan(0.15); // in front of the body
    expect(hold.y).toBeLessThan(head.y); // below the face
    expect(hold.y).toBeGreaterThan(0.9); // above the belt
    avatar.dispose();
  });
});
