import { BackSide, Box3, Group, Mesh, MeshBasicMaterial, MeshToonMaterial, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

// The avatar is modelled in Blender (assets-src/avatar.blend → public/models/avatar.glb): the
// owner's likeness (curly mushroom-cut hair, nose ring, ear studs) in an adventurer outfit.
// Arms hang from empties named Shoulder_L/R and Elbow_L/R, legs from Hip_L/R and Knee_L/R, so
// poses are plain rotations.

const arm = (shoulderX, shoulderZ, elbowX) => ({ shoulderX, shoulderZ, elbowX });
const REST_ARM = arm(0.04, -0.08, -0.12);

/**
 * Pose targets, per arm (`left`/`right` are the avatar's own sides; a positive shoulderZ brings
 * the hand towards the body's centre), plus where the held item sits: between both hands or at
 * the right hand, offset in metres. Optional `seat` (0 standing, 1 seated) and `yaw` (radians,
 * the whole set turned for a three-quarter view) default to 0.
 */
export const POSES = {
  rest: { left: REST_ARM, right: REST_ARM, anchor: 'both', offset: [0, 0.03, 0.06] },
  // Both hands together at chest height (the M8 hold).
  hold: {
    left: arm(-0.85, 0.62, -1.15),
    right: arm(-0.85, 0.62, -1.15),
    anchor: 'both',
    offset: [0, 0.03, 0.06],
  },
  // Weapons: both arms up in a V, the item floating over the head, like an item just found.
  // The head is big for the arms, so the item sits clear of the cap rather than in the hands.
  raise: {
    left: arm(-2.85, -0.32, -0.25),
    right: arm(-2.85, -0.32, -0.25),
    anchor: 'both',
    offset: [0, 0.36, 0.04],
  },
  // Armour: the right arm thrust up to one side with the item in that hand; the left stays down.
  raiseOne: {
    left: REST_ARM,
    right: arm(-2.45, -0.3, -0.15),
    anchor: 'right',
    offset: [0, 0.14, 0.03],
  },
  // Key items: seated at the desk, forearms level over the keyboard.
  type: {
    left: arm(-0.35, 0.28, -1.2),
    right: arm(-0.35, 0.28, -1.2),
    anchor: 'both',
    offset: [0, 0, 0],
    seat: 1,
    yaw: -1,
  },
};

/** How far the body drops when seated: hip height standing minus seat height (metres). */
export const SEAT_DROP = 0.41;

const ARMS = ['left', 'right'];
const JOINTS = ['shoulderX', 'shoulderZ', 'elbowX'];

// Exact at both ends (no floating-point drift when fully at rest or fully holding).
const mix = (from, to, amount) => (amount >= 1 ? to : from + (to - from) * amount);

/**
 * Pure: joint angles between two poses for `amount` 0–1 (eased in-out, so the arms start and
 * stop softly). `lift` (radians) raises the busy arms of the target a little more for the idle
 * sway, only as much as they have arrived. The item anchor is the target's.
 */
export function mixPose(from, to, amount, lift = 0) {
  const value = Math.min(Math.max(amount, 0), 1);
  const eased = value * value * (3 - 2 * value);
  const pose = {
    anchor: to.anchor,
    offset: to.offset,
    seat: mix(from.seat ?? 0, to.seat ?? 0, eased),
    yaw: mix(from.yaw ?? 0, to.yaw ?? 0, eased),
  };
  for (const side of ARMS) {
    const joints = Object.fromEntries(
      JOINTS.map((key) => [key, mix(from[side][key], to[side][key], eased)]),
    );
    if (to[side] !== REST_ARM) joints.shoulderX -= lift * eased;
    pose[side] = joints;
  }
  return pose;
}

/** Pure: from rest towards a named target pose (`hold` by default). */
export const poseAt = (amount, lift = 0, target = 'hold') =>
  mixPose(POSES.rest, POSES[target], amount, lift);

const OUTLINE_WIDTH = 0.0055; // metres, pushed along the normals
const OUTLINE_MIN_SIZE = 0.035; // tiny details get no outline
// Face details and small metal bits read better without the black outline.
const NO_OUTLINE = new Set(['eye', 'brow', 'white', 'lip', 'metal', 'jewel_gold']);

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
    {
      key: 'left',
      side: 1,
      shoulder: findByPrefix(scene, 'Shoulder_L'),
      elbow: findByPrefix(scene, 'Elbow_L'),
    },
    {
      key: 'right',
      side: -1,
      shoulder: findByPrefix(scene, 'Shoulder_R'),
      elbow: findByPrefix(scene, 'Elbow_R'),
    },
  ];
  if (arms.some(({ shoulder, elbow }) => !shoulder || !elbow)) {
    throw new Error('avatar.glb is missing its Shoulder_*/Elbow_* pivots');
  }
  const hands = [findByPrefix(scene, 'Hand_L'), findByPrefix(scene, 'Hand_R')];
  // Legs bend at the hips and knees to sit; an older model without them just stays standing.
  const legs = ['L', 'R']
    .map((side) => ({
      hip: findByPrefix(scene, `Hip_${side}`),
      knee: findByPrefix(scene, `Knee_${side}`),
    }))
    .filter(({ hip, knee }) => hip && knee);
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

  const offset = new Vector3();

  /** Applies a pose from `mixPose`/`poseAt` and moves the item anchor with the hands. */
  function setPose(pose) {
    for (const { key, side, shoulder, elbow } of arms) {
      const joints = pose[key];
      shoulder.rotation.set(joints.shoulderX, 0, -side * joints.shoulderZ);
      elbow.rotation.set(joints.elbowX, 0, 0);
    }
    // Plain POSES entries have no `seat` (only mixPose fills it): standing.
    const seat = pose.seat ?? 0;
    for (const { hip, knee } of legs) {
      hip.rotation.x = (-Math.PI / 2) * seat;
      knee.rotation.x = (Math.PI / 2) * seat;
    }
    if (!hands[0] || !hands[1]) return;
    scene.updateMatrixWorld(true);
    hands[1].getWorldPosition(right);
    // The item floats at the right hand or just in front of the midpoint between both hands.
    const anchor =
      pose.anchor === 'right'
        ? right
        : hands[0].getWorldPosition(left).add(right).multiplyScalar(0.5);
    hold.parent.worldToLocal(anchor);
    hold.position.copy(anchor).add(offset.fromArray(pose.offset));
  }
  setPose(POSES.rest);

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
