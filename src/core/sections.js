/**
 * Hub structure shared by the router (slugs) and the hub screen (order, icons, ui.json keys).
 * Slugs are the language-neutral hash routes; `selectable` tabs accept an item id in the URL.
 */
export const SECTIONS = [
  {
    id: 'journal',
    slug: 'diario',
    tabs: [
      { id: 'quests', key: 'quests', slug: 'misiones', icon: 'quest', selectable: true },
      {
        id: 'side-quests',
        key: 'sideQuests',
        slug: 'side-quests',
        icon: 'side-quest',
        selectable: true,
      },
      { id: 'memories', key: 'memories', slug: 'recuerdos', icon: 'memories', selectable: true },
    ],
  },
  {
    id: 'inventory',
    slug: 'inventario',
    tabs: [
      { id: 'weapons', key: 'weapons', slug: 'tecnologias', icon: 'weapons', selectable: true },
      { id: 'armor', key: 'armor', slug: 'habilidades', icon: 'armor' },
      { id: 'key-items', key: 'keyItems', slug: 'objetos-clave', icon: 'key-items' },
    ],
  },
  { id: 'system', slug: 'sistema', tabs: [] },
];

/** The Guide is routed like a section but lives outside the L/R ring (title menu and System). */
export const GUIDE = {
  id: 'guide',
  slug: 'guia',
  tabs: [
    { id: 'controls', key: 'controls', slug: 'controles', icon: 'controls' },
    { id: 'legend', key: 'legend', slug: 'leyenda', icon: 'legend' },
  ],
};

export const ROUTES = [...SECTIONS, GUIDE];

export function findSection(id) {
  return ROUTES.find((section) => section.id === id);
}
