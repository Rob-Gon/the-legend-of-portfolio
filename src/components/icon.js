// Own SVG files inlined so they inherit `currentColor`. They are static project assets,
// never user data, so parsing them with a template is safe.
const sources = import.meta.glob('../assets/icons/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const svgByName = Object.fromEntries(
  Object.entries(sources).map(([path, svg]) => [path.split('/').pop().replace('.svg', ''), svg]),
);

export const iconNames = Object.keys(svgByName);

export function icon(name, className = 'c-icon') {
  const svg = svgByName[name];
  if (!svg) throw new Error(`Unknown icon: ${name}`);
  return inlineSvg(svg, className);
}

/** Decorative inline SVG from a static project asset (never user data). */
export function inlineSvg(svg, className) {
  const template = document.createElement('template');
  template.innerHTML = svg.trim();
  const node = template.content.firstElementChild;
  node.setAttribute('class', className);
  node.setAttribute('aria-hidden', 'true');
  node.setAttribute('focusable', 'false');
  return node;
}
