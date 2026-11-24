/**
 * Creates an element. Text always goes through text nodes, never through innerHTML.
 * Props: `class`, `text`, `dataset`, `on<event>` handlers; any other key becomes an attribute
 * (`true` → empty attribute, `null`/`undefined`/`false` → omitted).
 */
export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);

  for (const [key, value] of Object.entries(props)) {
    if (value == null || value === false) continue;

    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2), value);
    } else node.setAttribute(key, value === true ? '' : String(value));
  }

  node.append(...[children].flat(Infinity).filter((child) => child != null && child !== false));
  return node;
}

/** Turns `{{keyword}}` markup from the JSON content into highlighted nodes. */
export function rich(text) {
  return text
    .split(/\{\{(.+?)\}\}/)
    .map((part, index) => (index % 2 ? el('em', { class: 'u-hl' }, part) : part))
    .filter((part) => part !== '');
}
