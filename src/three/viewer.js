import {
  AdditiveBlending,
  Color,
  DataTexture,
  DirectionalLight,
  Group,
  HemisphereLight,
  NearestFilter,
  PerspectiveCamera,
  RedFormat,
  Scene,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three';
import { POSES, SEAT_DROP, loadAvatar, mixPose } from './avatar.js';
import { createDesk } from './desk.js';
import { createEffect, effectFor, glowTexture } from './effects.js';
import { createItemMesh, disposeItem } from './items.js';

const FRAME_MS = 1000 / 30; // idle animation never runs faster than 30 fps
const HOLD_MS = 300; // arms going up to hold an item
const BOB = { amplitude: 0.03, periodMs: 1500 }; // the held item floating up and down
// Idle: breathing, a slow weight shift and the arms rising with the item's bob.
const IDLE = { breath: 0.006, breathMs: 3200, sway: 0.015, swayMs: 5200, lift: 0.035 };
const DRAG_SPEED = 0.01; // radians per pixel

const HALO = { size: 0.42, opacity: 0.6, pulse: 0.08, periodMs: 2400 };
const GLOW_ORDER = 1; // render order of the halo and effect layers
// Which pose each Inventory tab uses: weapons raised overhead, armour in one hand, key items
// typed away at the desk (the icon shows on the monitor).
const POSE_FOR_MODE = { weapons: 'raise', armor: 'raiseOne', 'key-items': 'type' };
// Goofy typing: forearms bouncing over the keyboard, out of step with each other.
const TYPE = { periodMs: 280, elbow: 0.25, shoulder: 0.06 };
// Seated, the whole set rises so the desk stays clear of the detail card over the viewer.
const SEATED_RISE = 0.3;

/** Three-step ramp for the cel-shaded look. */
function toonGradient() {
  const texture = new DataTexture(new Uint8Array([90, 170, 255]), 3, 1, RedFormat);
  texture.minFilter = NearestFilter;
  texture.magFilter = NearestFilter;
  texture.needsUpdate = true;
  return texture;
}

const AVATAR_URL = `${import.meta.env.BASE_URL}models/avatar.glb`;

/**
 * The one 3D viewer of the app (one renderer, one canvas, moved between hosts). The avatar
 * raises its arms and holds the selected item, which bobs gently. Drag rotates the avatar.
 * `reducedMotion()`: when true there is no idle animation, no bobbing and no arm tween.
 * Rejects if WebGL or the avatar model fails; the caller keeps its 2D fallback.
 */
export async function createViewer({ reducedMotion = () => false } = {}) {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  const canvas = renderer.domElement;
  canvas.className = 'c-viewer__canvas';

  const scene = new Scene();
  const camera = new PerspectiveCamera(24, 1, 0.1, 50);
  // Framed with headroom for the raised poses (item over the head).
  camera.position.set(0, 1.25, 5.9);
  camera.lookAt(0, 1.08, 0);
  scene.add(new HemisphereLight('#fff6e6', '#2a3a26', 1.1));
  const key = new DirectionalLight('#ffffff', 1.7);
  key.position.set(2, 4, 3);
  const rim = new DirectionalLight('#9fe3ff', 1.1);
  rim.position.set(-3, 2, -2);
  scene.add(key, rim);

  const gradientMap = toonGradient();
  // The held item glows: a camera-facing sprite behind it, additive so it only adds light.
  const halo = new Sprite(
    new SpriteMaterial({
      map: glowTexture(),
      blending: AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: HALO.opacity,
    }),
  );
  halo.renderOrder = GLOW_ORDER;
  halo.scale.setScalar(HALO.size);
  halo.visible = false;
  const avatar = await loadAvatar({ url: AVATAR_URL, gradientMap }).catch((error) => {
    renderer.dispose();
    gradientMap.dispose();
    throw error;
  });
  const turntable = new Group();
  const desk = createDesk({ gradientMap });
  desk.group.visible = false;
  turntable.add(avatar.root, desk.group);
  scene.add(turntable);

  let host = null;
  let item = null;
  let effect = null;
  let visible = false;
  let frame = 0;
  let lastFrame = 0;
  let rotation = 0;
  let drag = null;
  // The arms blend from wherever they were (`from`) to the target pose over HOLD_MS.
  const pose = { from: POSES.rest, to: POSES.rest, start: 0 };
  const progress = (now) => Math.min((now - pose.start) / HOLD_MS, 1);

  function draw(now = performance.now()) {
    const still = reducedMotion();
    const amount = still ? 1 : progress(now);
    const wave = (periodMs) => (still ? 0 : Math.sin((now / periodMs) * Math.PI * 2));
    const current = mixPose(pose.from, pose.to, amount, wave(BOB.periodMs) * IDLE.lift);
    if (pose.to === POSES.type && !still) {
      for (const [side, phase] of [
        ['left', 0],
        ['right', 0.5],
      ]) {
        const tap = Math.max(Math.sin((now / TYPE.periodMs + phase) * Math.PI * 2), 0) * amount;
        current[side].elbowX -= tap * TYPE.elbow;
        current[side].shoulderX -= tap * TYPE.shoulder;
      }
    }
    avatar.setPose(current);
    avatar.root.position.y = wave(IDLE.breathMs) * IDLE.breath - SEAT_DROP * current.seat;
    avatar.root.rotation.z = wave(IDLE.swayMs) * IDLE.sway;
    if (avatar.head) avatar.head.rotation.y = still ? 0 : Math.sin(now / 3200) * 0.06;
    // The desk pops in once the avatar is mostly seated (and out as it stands up).
    desk.group.visible = current.seat > 0.5;
    if (item?.parent === desk.screen) {
      item.visible = desk.group.visible;
    } else if (item) {
      item.position.y = wave(BOB.periodMs) * BOB.amplitude;
      item.rotation.y = still ? -0.3 : Math.sin(now / 2400) * 0.35;
      // The item appears once the hands are nearly in place.
      item.visible = pose.to !== POSES.rest && amount > 0.6;
      halo.visible = item.visible;
      if (effect) {
        effect.object.visible = item.visible;
        effect.object.position.y = item.position.y;
        effect.update(now, still);
      }
      halo.position.set(0, item.position.y, -0.04);
      const pulse = still ? 1 : 1 + Math.sin((now / HALO.periodMs) * Math.PI * 2) * HALO.pulse;
      halo.scale.setScalar(HALO.size * pulse);
    }
    turntable.rotation.y = rotation + current.yaw;
    turntable.position.y = SEATED_RISE * current.seat;
    renderer.render(scene, camera);
  }

  function loop(now) {
    frame = requestAnimationFrame(loop);
    if (now - lastFrame < FRAME_MS) return;
    lastFrame = now;
    draw(now);
  }
  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
  }
  function start() {
    if (frame || !visible || document.hidden) return;
    if (reducedMotion()) draw();
    else frame = requestAnimationFrame(loop);
  }

  function resize() {
    if (!host) return;
    const { clientWidth: width, clientHeight: height } = host;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    draw();
  }

  const resizeObserver = new ResizeObserver(resize);
  // Rendering pauses whenever the viewer is off-screen or the tab is hidden.
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) start();
    else stop();
  });
  const onVisibility = () => (document.hidden ? stop() : start());
  document.addEventListener('visibilitychange', onVisibility);

  // Drag to rotate: the viewer's own gesture, like the game's "Rotate".
  canvas.addEventListener('pointerdown', (event) => {
    drag = { x: event.clientX, rotation };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!drag) return;
    rotation = drag.rotation + (event.clientX - drag.x) * DRAG_SPEED;
    if (!frame) draw();
  });
  const endDrag = () => (drag = null);
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  return {
    canvas,

    /** Moves the single canvas into `target` (a screen's viewer slot). */
    attach(target) {
      if (host !== target) {
        host = target;
        host.append(canvas);
        resizeObserver.disconnect();
        resizeObserver.observe(host);
        intersection.disconnect();
        intersection.observe(host);
      }
      resize();
      start();
    },

    /**
     * Holds a new item (its SVG icon, extruded) or empties the hands when `svg` is null. `mode`
     * is the Inventory tab (its pose); `level` (skill stars) picks the extra glow layers.
     */
    show({ svg, color, mode, level }) {
      if (item) {
        item.removeFromParent();
        disposeItem(item);
      }
      if (effect) {
        effect.object.removeFromParent();
        effect.dispose();
        effect = null;
      }
      halo.removeFromParent();
      halo.visible = false;
      const target = svg ? POSES[POSE_FOR_MODE[mode] ?? 'hold'] : POSES.rest;
      const atDesk = target === POSES.type;
      item = svg ? createItemMesh(svg, { color, size: atDesk ? 0.22 : 0.26, gradientMap }) : null;
      if (item && atDesk) {
        // Flattened onto the monitor, like an app icon on the screen.
        item.scale.z *= 0.3;
        desk.screen.add(item);
      } else if (item) {
        avatar.hold.add(item);
        // Weapons: the item is over the head, so its glow draws without depth test, over the
        // cap; the item draws after it (a later render order needs the transparent pass), so
        // its logo stays crisp in front. Armour holds it to one side: there the head, when the
        // view is rotated, must hide the glow, so normal depth testing stays.
        const overlay = mode === 'weapons';
        halo.material.depthTest = !overlay;
        item.traverse((child) => {
          if (!child.isMesh || !overlay) return;
          child.material.transparent = true;
          child.renderOrder = GLOW_ORDER + 1;
        });
        // Halo in the item's colour, lifted towards white so dark logos still glow.
        const glow = new Color(color ?? '#ffffff').lerp(new Color('#ffffff'), 0.45);
        halo.material.color.copy(glow);
        avatar.hold.add(halo);
        effect = createEffect(effectFor(level), { color: glow, overlay });
        if (effect) avatar.hold.add(effect.object);
      }
      const now = performance.now();
      // Start from the current pose, so switching tab mid-move never jumps.
      pose.from = mixPose(pose.from, pose.to, progress(now));
      pose.to = target;
      pose.start = now;
      draw(now);
    },

    /** Re-reads the motion preference (System toggle) and restarts or stops the loop. */
    refresh() {
      stop();
      start();
      draw();
    },

    dispose() {
      stop();
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      if (item) disposeItem(item);
      effect?.dispose();
      desk.dispose();
      avatar.dispose();
      gradientMap.dispose();
      halo.material.map.dispose();
      halo.material.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
