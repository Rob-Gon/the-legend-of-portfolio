import {
  BackSide,
  BoxGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshToonMaterial,
  PlaneGeometry,
} from 'three';

// Low-poly desk, chair, keyboard and monitor for the Key items tab: plain boxes with the same
// toon shading and dark outline as the avatar, built in code (no model file to download).
// Units are metres in the avatar's space: floor at y = 0, the avatar faces +z, seated at the
// origin (see the `type` pose in avatar.js).

const OUTLINE = 0.006; // metres added on each side of a box for its outline shell

const COLORS = {
  wood: '#8a5a35',
  woodDark: '#6b4428',
  plastic: '#2b2f36',
  keys: '#cfc8b8',
  screen: '#10242c',
};

// The monitor faces the avatar, its screen tilted up towards the eyes. From the default camera
// only its back shows: the icon on the screen is a detail found by rotating the view.
export const SCREEN_TILT = -0.4;

/** The scene props; `screen` is where the selected item's icon goes. */
export function createDesk({ gradientMap }) {
  const group = new Group();
  group.name = 'Desk';
  const geometries = [];
  const materials = new Map();
  const outline = new MeshBasicMaterial({ color: '#141416', side: BackSide });

  const toon = (color) => {
    if (!materials.has(color)) materials.set(color, new MeshToonMaterial({ color, gradientMap }));
    return materials.get(color);
  };

  /** A box of `size` [w, h, d] centred at `at` [x, y, z], with an outline shell. */
  function box(parent, size, at, color) {
    const geometry = new BoxGeometry(...size);
    geometries.push(geometry);
    const mesh = new Mesh(geometry, toon(color));
    mesh.position.set(...at);
    const shell = new Mesh(geometry, outline);
    shell.scale.set(...size.map((side) => (side + OUTLINE * 2) / side));
    mesh.add(shell);
    parent.add(mesh);
    return mesh;
  }

  // Desk: top just above the seated avatar's thighs, keyboard where the hands land.
  box(group, [1, 0.03, 0.5], [0, 0.565, 0.43], COLORS.wood);
  for (const x of [-0.46, 0.46]) {
    for (const z of [0.21, 0.65]) box(group, [0.04, 0.55, 0.04], [x, 0.275, z], COLORS.woodDark);
  }
  box(group, [0.34, 0.02, 0.12], [0, 0.59, 0.33], COLORS.plastic);
  box(group, [0.31, 0.008, 0.09], [0, 0.603, 0.33], COLORS.keys);

  // Chair: seat under the thighs, reaching back to the backrest; the back legs run up into the
  // backrest posts in one piece, clear of the shield on the avatar's back.
  box(group, [0.42, 0.04, 0.5], [0, 0.335, -0.07], COLORS.woodDark);
  for (const x of [-0.18, 0.18]) {
    box(group, [0.035, 0.315, 0.035], [x, 0.1575, 0.14], COLORS.wood);
    box(group, [0.035, 0.85, 0.035], [x, 0.425, -0.3], COLORS.wood);
  }
  box(group, [0.4, 0.2, 0.03], [0, 0.74, -0.3], COLORS.woodDark);

  // Monitor on a stand in front of the avatar, facing it (-z), the panel tilted to its eyes.
  const monitor = new Group();
  monitor.position.set(0, 0.58, 0.6);
  monitor.rotation.y = Math.PI;
  group.add(monitor);
  box(monitor, [0.16, 0.012, 0.1], [0, 0.006, 0], COLORS.plastic);
  box(monitor, [0.03, 0.17, 0.03], [0, 0.09, 0], COLORS.plastic);
  const panel = new Group();
  panel.position.y = 0.17;
  panel.rotation.x = SCREEN_TILT;
  monitor.add(panel);
  box(panel, [0.6, 0.38, 0.035], [0, 0.17, 0], COLORS.plastic);
  const displayGeometry = new PlaneGeometry(0.55, 0.33);
  geometries.push(displayGeometry);
  // Unlit, so the screen reads as glowing whatever the lights do.
  const displayMaterial = new MeshBasicMaterial({ color: COLORS.screen });
  const display = new Mesh(displayGeometry, displayMaterial);
  display.position.set(0, 0.17, 0.0185);
  panel.add(display);

  const screen = new Group();
  screen.position.set(0, 0.17, 0.025);
  panel.add(screen);

  return {
    group,
    screen,
    dispose() {
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      outline.dispose();
      displayMaterial.dispose();
    },
  };
}
