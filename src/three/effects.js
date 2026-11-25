import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  Group,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
} from 'three';

// Glow layers around the held item, on top of the plain halo every item has, like an item just
// obtained: light rays fanning out and, for the best items, a soft blue-white aura. They live in
// the avatar's `Hold` group, so they follow the item. Additive blending: they only add light.

/**
 * Pure: which extra layers an item gets from its skill level (weapons and armour alike):
 * 5 → rays and aura, 4 → rays, 3 or less → none (just the halo).
 */
export function effectFor(level) {
  if (level >= 5) return 'radiant';
  if (level === 4) return 'rays';
  return 'halo';
}

function canvasTexture(size, paint) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  // No 2D context (very old browsers, test DOMs): the layer is simply blank.
  const context = canvas.getContext('2d');
  if (context) paint(context, size);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** Soft radial glow drawn once on a small canvas; tinted per item. */
export function glowTexture() {
  return canvasTexture(128, (context) => {
    const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.35, 'rgba(255,255,255,0.45)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
  });
}

/** Soft light rays fanning out from the centre, alternating long and short. */
function raysTexture() {
  return canvasTexture(256, (context, size) => {
    context.translate(size / 2, size / 2);
    const RAYS = 12;
    for (let ray = 0; ray < RAYS; ray += 1) {
      const length = size / 2 - (ray % 2 ? 26 : 4);
      const gradient = context.createLinearGradient(0, 0, length, 0);
      gradient.addColorStop(0, 'rgba(255,255,255,0.9)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      context.fillStyle = gradient;
      context.beginPath();
      context.moveTo(0, 0);
      context.lineTo(length, -length * 0.07);
      context.lineTo(length, length * 0.07);
      context.closePath();
      context.fill();
      context.rotate((Math.PI * 2) / RAYS);
    }
  });
}

/** Bright core fading into a pale blue rim: the bloom behind an item just obtained. */
function auraTexture() {
  return canvasTexture(256, (context, size) => {
    const half = size / 2;
    const gradient = context.createRadialGradient(half, half, 0, half, half, half);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.3, 'rgba(235,248,255,0.8)');
    gradient.addColorStop(0.6, 'rgba(150,215,255,0.35)');
    gradient.addColorStop(1, 'rgba(150,215,255,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  });
}

const RAYS = { size: 0.72, opacity: 0.55, spinMs: 24000 };
const AURA = { size: 0.62, opacity: 0.7, pulse: 0.06, periodMs: 2000, color: '#dff3ff' };

function sprite(texture, color, opacity, size, overlay) {
  const material = new SpriteMaterial({
    map: texture,
    color,
    blending: AdditiveBlending,
    depthWrite: false,
    // `overlay`: light over the cap and hands too, like the game's item glow (see viewer.js).
    depthTest: !overlay,
    transparent: true,
    opacity,
  });
  const layer = new Sprite(material);
  layer.renderOrder = 1;
  layer.scale.setScalar(size);
  // Behind the item, so its logo stays readable.
  layer.position.z = -0.08;
  return layer;
}

/**
 * The extra layers for `kind` (`effectFor`), tinted with `color`; null for the plain halo.
 * `overlay` draws them over everything (no depth test) instead of behind nearer geometry.
 */
export function createEffect(kind, { color, overlay = false }) {
  if (kind !== 'rays' && kind !== 'radiant') return null;
  const object = new Group();
  const textures = [raysTexture()];
  const tint = new Color(color).lerp(new Color('#ffffff'), 0.55);
  const rays = sprite(textures[0], tint, RAYS.opacity, RAYS.size, overlay);
  object.add(rays);
  let aura = null;
  if (kind === 'radiant') {
    textures.push(auraTexture());
    aura = sprite(textures[1], new Color(AURA.color), AURA.opacity, AURA.size, overlay);
    object.add(aura);
  }
  return {
    object,
    update(now, still) {
      if (still) return;
      rays.material.rotation = (now / RAYS.spinMs) * Math.PI * 2;
      const pulse = 1 + Math.sin((now / AURA.periodMs) * Math.PI * 2) * AURA.pulse;
      aura?.scale.setScalar(AURA.size * pulse);
    },
    dispose() {
      textures.forEach((texture) => texture.dispose());
      object.children.forEach((layer) => layer.material.dispose());
    },
  };
}
