import {
  Box3,
  BufferGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshToonMaterial,
  Vector3,
} from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';

const DEPTH = 3; // extrusion depth in SVG units (icons are 24 × 24)
const STROKE_DEFAULTS = { strokeWidth: 2, strokeLineJoin: 'round', strokeLineCap: 'round' };

/**
 * Turns an icon's SVG into a small 3D object (the "item" the avatar holds): filled paths are
 * extruded, stroked paths become thin double-sided ribbons. Centred, scaled to `size`.
 */
export function createItemMesh(svgText, { color, size = 1, gradientMap } = {}) {
  const { paths } = new SVGLoader().parse(svgText);
  const material = new MeshToonMaterial({ color, gradientMap, side: DoubleSide });
  const group = new Group();

  for (const path of paths) {
    const style = path.userData.style;
    if (style.fill && style.fill !== 'none') {
      for (const shape of path.toShapes()) {
        group.add(
          new Mesh(new ExtrudeGeometry(shape, { depth: DEPTH, bevelEnabled: false }), material),
        );
      }
    }
    if (style.stroke && style.stroke !== 'none') {
      const strokeStyle = SVGLoader.getStrokeStyle(
        Number(style.strokeWidth) || STROKE_DEFAULTS.strokeWidth,
        style.stroke,
        STROKE_DEFAULTS.strokeLineJoin,
        STROKE_DEFAULTS.strokeLineCap,
      );
      for (const subPath of path.subPaths) {
        const geometry = SVGLoader.pointsToStroke(subPath.getPoints(), strokeStyle);
        if (geometry) group.add(new Mesh(geometry, material));
      }
    }
  }

  // SVG y grows downwards: flip, then centre on the origin and fit into `size`.
  group.scale.set(1, -1, 1);
  const box = new Box3().setFromObject(group);
  const center = box.getCenter(new Vector3());
  const extent = box.getSize(new Vector3());
  const scale = size / Math.max(extent.x, extent.y, 1e-6);
  const holder = new Group();
  group.position.set(-center.x, -center.y, -center.z);
  holder.add(group);
  holder.scale.setScalar(scale);
  return holder;
}

/** Frees the GPU memory of an object made by `createItemMesh` (shared material included). */
export function disposeItem(object) {
  const materials = new Set();
  object.traverse((child) => {
    if (child.geometry instanceof BufferGeometry) child.geometry.dispose();
    if (child.material) materials.add(child.material);
  });
  materials.forEach((material) => material.dispose());
}
