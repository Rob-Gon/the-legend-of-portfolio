import { BackSide, Box3, Group, Mesh, MeshBasicMaterial, MeshToonMaterial, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

// The avatar is modelled in Blender (assets-src/avatar.blend → public/models/avatar.glb): the
// owner's likeness (curly mushroom-cut hair, nose ring, ear studs) in an adventurer outfit.
// Arms hang from empties named Shoulder_L/R and Elbow_L/R, so poses are plain rotations.

/** Pose targets: rest (arms down) and hold (arms forward, hands together at chest height). */
export const POSES = {
  rest: { shoulderX: 0.04, shoulderZ: -0.08, elbowX: -0.12 },
  hold: { shoulderX: -0.85, shoulderZ: 0.62, elbowX: -1.15 },
};

// Exact at both ends (no floating-point drift when fully at rest or fully holding).
const mix = (from, to, amount) => (amount >= 1 ? to : from + (to - from) * amount);

/**
 * Pure: joint angles for a hold amount between 0 (rest) and 1 (holding). `lift` (radians) raises
 * the arms a little more for the idle sway; it only applies as much as the arms are holding.
 */
export function poseAt(amount, lift = 0) {
  const value = Math.min(Math.max(amount, 0), 1);
  // Ease in-out so the arms start and stop softly.
  const eased = value * value * (3 - 2 * value);
  const pose = Object.fromEntries(
    Object.keys(POSES.rest).map((key) => [key, mix(POSES.rest[key], POSES.hold[key], eased)]),
  );
  pose.shoulderX -= lift * eased;
  return pose;
}

const OUTLINE_WIDTH = 0.0055; // metres, pushed along the normals
const OUTLINE_MIN_SIZE = 0.035; // tiny details get no outline
// Face details and small metal bits read better without the black outline.
const NO_OUTLINE = new Set(['eye', 'brow', 'white', 'lip', 'metal']);
const HOLD_OFFSET = new Vector3(0, 0.03, 0.06); // item: just above and in front of the hands

/** Back-face hull pushed out along the normals: works whatever each part's origin is. */
function outlineMaterial() {
  const material = new MeshBasicMaterial({ color: '#141416', side: BackSide });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>\ntransformed += normal * ${OUTLINE_WIDTH.toFixed(4)};`,
    );
  };
  return material;
}

const findByPrefix = (root, prefix) => {
  let found = null;
  root.traverse((child) => {
    if (!found && child.name.startsWith(prefix)) found = child;
  });
  return found;
};

/** Cel-shades and rigs an already parsed glTF scene (also used by the unit test). */
export function rigAvatar(scene, { gradientMap }) {
  const outline = outlineMaterial();
  const materials = new Set([outline]);
  const meshes = [];
  scene.traverse((child) => {
    if (child.isMesh) meshes.push(child);
  });
  for (const mesh of meshes) {
    const toon = new MeshToonMaterial({
      name: mesh.material.name,
      color: mesh.material.color,
      gradientMap,
    });
    mesh.material.dispose();
    mesh.material = toon;
    materials.add(toon);
    const size = new Box3().setFromObject(mesh).getSize(new Vector3());
    const named = mesh.material.name;
    if (Math.max(size.x, size.y, size.z) >= OUTLINE_MIN_SIZE && !NO_OUTLINE.has(named)) {
      mesh.add(new Mesh(mesh.geometry, outline));
    }
  }

  const arms = [
    { side: 1, shoulder: findByPrefix(scene, 'Shoulder_L'), elbow: findByPrefix(scene, 'Elbow_L') },
    {
      side: -1,
      shoulder: findByPrefix(scene, 'Shoulder_R'),
      elbow: findByPrefix(scene, 'Elbow_R'),
    },
  ];
  if (arms.some(({ shoulder, elbow }) => !shoulder || !elbow)) {
    throw new Error('avatar.glb is missing its Shoulder_*/Elbow_* pivots');
  }
  const hands = [findByPrefix(scene, 'Hand_L'), findByPrefix(scene, 'Hand_R')];
  // Where the held item floats. Created here when missing: the optimiser prunes empty leaf nodes,
  // and its position is computed from the hands anyway.
  let hold = findByPrefix(scene, 'Hold');
  if (!hold) {
    hold = new Group();
    hold.name = 'Hold';
    scene.add(hold);
  }
  const left = new Vector3();
  const right = new Vector3();

  function setPose(amount, lift = 0) {
    const pose = poseAt(amount, lift);
    for (const { side, shoulder, elbow } of arms) {
      shoulder.rotation.set(pose.shoulderX, 0, -side * pose.shoulderZ);
      elbow.rotation.set(pose.elbowX, 0, 0);
    }
    // The held item floats just in front of the midpoint between the hands.
    if (hold && hands[0] && hands[1]) {
      scene.updateMatrixWorld(true);
      hands[0].getWorldPosition(left);
      hands[1].getWorldPosition(right);
      const between = left.add(right).multiplyScalar(0.5);
      hold.parent.worldToLocal(between);
      hold.position.copy(between).add(HOLD_OFFSET);
    }
  }
  setPose(0);

  return {
    root: scene,
    hold,
    // Everything above the neck turns together (hair, eyes, cap).
    head: findByPrefix(scene, 'HeadPivot') ?? findByPrefix(scene, 'Head'),
    setPose,
    dispose() {
      scene.traverse((child) => child.geometry?.dispose());
      materials.forEach((material) => material.dispose());
    },
  };
}

export async function loadAvatar({ url, gradientMap }) {
  // The model is meshopt-compressed (npm run model:optimize).
  const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(url);
  return rigAvatar(gltf.scene, { gradientMap });
}
