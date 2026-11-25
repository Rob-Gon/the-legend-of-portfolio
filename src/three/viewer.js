import {
  AdditiveBlending,
  CanvasTexture,
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
import { loadAvatar } from './avatar.js';
import { createItemMesh, disposeItem } from './items.js';

const FRAME_MS = 1000 / 30; // idle animation never runs faster than 30 fps
const HOLD_MS = 300; // arms going up to hold an item
const BOB = { amplitude: 0.03, periodMs: 1500 }; // the held item floating up and down
// Idle: breathing, a slow weight shift and the arms rising with the item's bob.
const IDLE = { breath: 0.006, breathMs: 3200, sway: 0.015, swayMs: 5200, lift: 0.035 };
const DRAG_SPEED = 0.01; // radians per pixel

const HALO = { size: 0.42, opacity: 0.6, pulse: 0.08, periodMs: 2400 };

/** Soft radial glow drawn once on a small canvas; tinted per item. */
function haloTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.35, 'rgba(255,255,255,0.45)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

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
  camera.position.set(0, 1.15, 5.2);
  camera.lookAt(0, 0.98, 0);
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
      map: haloTexture(),
      blending: AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: HALO.opacity,
    }),
  );
  halo.scale.setScalar(HALO.size);
  halo.visible = false;
  const avatar = await loadAvatar({ url: AVATAR_URL, gradientMap }).catch((error) => {
    renderer.dispose();
    gradientMap.dispose();
    throw error;
  });
  const turntable = new Group();
  turntable.add(avatar.root);
  scene.add(turntable);

  let host = null;
  let item = null;
  let visible = false;
  let frame = 0;
  let lastFrame = 0;
  let rotation = 0;
  let drag = null;
  const hold = { from: 0, to: 0, start: 0 };

  const holdAmount = (now) => {
    const progress = Math.min((now - hold.start) / HOLD_MS, 1);
    return hold.from + (hold.to - hold.from) * progress;
  };

  function draw(now = performance.now()) {
    const still = reducedMotion();
    const amount = still ? hold.to : holdAmount(now);
    const wave = (periodMs) => (still ? 0 : Math.sin((now / periodMs) * Math.PI * 2));
    avatar.setPose(amount, wave(BOB.periodMs) * IDLE.lift);
    avatar.root.position.y = wave(IDLE.breathMs) * IDLE.breath;
    avatar.root.rotation.z = wave(IDLE.swayMs) * IDLE.sway;
    if (avatar.head) avatar.head.rotation.y = still ? 0 : Math.sin(now / 3200) * 0.06;
    if (item) {
      item.position.y = wave(BOB.periodMs) * BOB.amplitude;
      item.rotation.y = still ? -0.3 : Math.sin(now / 2400) * 0.35;
      // The item appears once the hands are nearly in place.
      item.visible = amount > 0.6;
      halo.visible = item.visible;
      halo.position.set(0, item.position.y, -0.04);
      const pulse = still ? 1 : 1 + Math.sin((now / HALO.periodMs) * Math.PI * 2) * HALO.pulse;
      halo.scale.setScalar(HALO.size * pulse);
    }
    turntable.rotation.y = rotation;
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

    /** Holds a new item (its SVG icon, extruded) or empties the hands when `svg` is null. */
    show({ svg, color }) {
      if (item) {
        avatar.hold.remove(item);
        disposeItem(item);
      }
      item = svg ? createItemMesh(svg, { color, size: 0.26, gradientMap }) : null;
      if (item) {
        avatar.hold.add(item);
        // Halo in the item's colour, lifted towards white so dark logos still glow.
        halo.material.color.set(color).lerp(new Color('#ffffff'), 0.45);
        avatar.hold.add(halo);
      } else {
        halo.visible = false;
      }
      const now = performance.now();
      hold.from = holdAmount(now);
      hold.to = item ? 1 : 0;
      hold.start = now;
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
      avatar.dispose();
      gradientMap.dispose();
      halo.material.map.dispose();
      halo.material.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
