# Project Brief — The Legend Of Roberto - Portfolio Of The Wild

> Status: **Phase 1 approved** (answers recorded in §10). Phase 2 in progress.
> Unofficial fan project. Not affiliated with, endorsed by or sponsored by Nintendo.

---

## 1. Vision (summary)

A static, JSON-driven portfolio for a full-stack web developer whose UI is a homage to the
*structure and feel* of the pause menu of *Breath of the Wild*: a title screen, then a hub with
three sections switched with **L / R** (Adventure Log · Inventory · System). Spanish by default,
English available. Ambient music and UI sound effects, never autoplayed. Mobile-first in
practice (most traffic), full "stage" experience on desktop with an optional 3D viewer.
Audience: recruiters and clients — it must look good **and** be fast to scan. A plain
**Quick mode** page carries the same content for accessibility, SEO and impatient readers.

All content lives in `public/data/{es,en}/*.json` and is edited by hand. No backend.

### 1.1 Fidelity principle (IP)

We reproduce **layout, rhythm and interaction** (header/footer bars, list rows, item grid,
detail card, corner-bracket selection, L/R neighbours, button hints). We do **not** reproduce
Nintendo-specific artwork: no Hylian crest, Sheikah eye, Triforce, BotW rupee silhouette,
Hylia-style lettering, game backgrounds, sounds or fonts. Every icon, background and model is
original (hand-made CSS/SVG/Blender) or carries a permissive licence recorded in
`THIRD_PARTY.md`.

### 1.2 Findings from `chaos-xxl/zelda-hyrule-ui`

- Code: MIT. Assets: all SVGs/design exported from Hunter Paramore's Figma kit (CC BY 4.0),
  i.e. **not original to the repo author**, and many depict Nintendo IP (Sheikah eye, Divine
  Beasts, crest-based quest icons). It also ships `HyliaSerif.ttf`, a fan font imitating the
  game's lettering.
- Stack is React/Vue + Less, so no code is directly reusable in vanilla JS + SCSS.
- **Decision:** reuse **no assets and no font**. Colour values and the generic "double border
  via `::after`" CSS idea are used only as reference (not copyrightable). If any code is ever
  copied literally, its MIT notice goes into `THIRD_PARTY.md`.

---

## 2. Technical decisions

Kept as requested: Vite · semantic HTML · SCSS · vanilla JS ES modules · JSON via `fetch()` ·
hash router · Three.js lazy-loaded on desktop with WebGL · Howler.js · ESLint + Prettier +
Stylelint · Vitest · Playwright smoke test · GitHub Pages via GitHub Actions · local dev with
`npm run dev` (Vite), not Laragon.

### 2.1 Proposed corrections (with arguments — none applied without approval)

| # | Proposal | Why |
|---|---|---|
| C1 | **Do not hijack `Tab`** for tab switching. Use **`Z` / `C`** (next to Q/E), arrow keys while focus is in the tablist, and **LT / RT** on gamepad. | `Tab` is the standard focus key; overriding it breaks keyboard and screen-reader navigation (WCAG 2.1.1). Roving tabindex makes each composite widget (tablist, grid, list, detail) a single Tab stop, so Tab stays useful. |
| C2 | **"Single-key shortcuts" toggle** in System (on by default). | Global letter shortcuts (L, R, Q, E, WASD, Z, C) must be switchable off for speech-input users (WCAG 2.1.4). Shortcuts are also ignored while focus is in a form control (e.g. volume sliders). |
| C3 | **Quick mode is pre-rendered to static HTML at build time** (`/quick/` and `/en/quick/`), from the same JSON and the same pure render functions the app uses. `index.html` meta/OG tags and `sitemap.xml` are generated at build time too. | Social crawlers (LinkedIn, WhatsApp, X) do not run JS, so OG previews need static tags. Hash routes are not separately indexable. Static HTML also makes Lighthouse accessibility 100 and a no-JS fallback trivial. Cost: one small Vite plugin. |
| C4 | **meshopt instead of Draco** for GLB compression. | The meshopt decoder is a few KB; the Draco decoder (wasm + JS) is far heavier. Our models are small, so meshopt + quantisation reaches the 1.5 MB budget easily. |
| C5 | **`_placeholder: true` items are hidden in production builds** and shown with a visible "PLACEHOLDER" badge in dev; `_review: true` shows a dev-only badge. | Prevents invented example content from ever being published by accident on a public portfolio. |
| C6 | Keep one full JSON per language (as requested) **plus a Vitest "data parity" test** that fails if `es` and `en` differ in ids or language-neutral fields (dates, levels, URLs, stack). | Avoids a merge layer and keeps editing simple, while catching drift between languages. |
| C7 | ~~JSDoc types + `checkJs`~~ — **rejected**: plain JS without type checking. | — |
| C8 | **Self-host fonts** (WOFF2 subsets, `font-display: swap`), no Google Fonts CDN. | Privacy (EU rulings on the Google Fonts CDN), one fewer origin, better LCP. Fonts are OFL so self-hosting is allowed. |
| C9 | **No `backdrop-filter`** on tablet/mobile; use a pre-blurred backdrop image or a solid translucent panel. | `backdrop-filter` is costly on low-end phones and makes contrast unpredictable. |
| C10 | **Completed (grey) quests keep ≥ 4.5:1 text contrast**; the fading is applied to the icon and frame, not the text. | In the game they are very faint; for us it is content, so WCAG contrast applies. |
| C11 | **Deep links skip the title screen** (e.g. `#/diario/recuerdos/automotive-erp` opens the hub directly, music stays off until a user gesture). | A recruiter clicking a shared link must not be forced through an intro. |
| C12 | **Reuse the Blender avatar as a 2D render** (AVIF/WebP) on the title screen and on tablet/mobile. | The same asset gives a personal hero image everywhere without WebGL on phones. |

---

## 3. Architecture

### 3.1 Folder tree

```
/
├─ index.html                    # App shell (title screen + hub). Static meta/OG injected at build.
├─ quick/index.html              # Quick mode ES — generated at build (C3)
├─ en/quick/index.html           # Quick mode EN — generated at build (C3)
├─ public/
│  ├─ data/
│  │  ├─ es/  ui.json profile.json quests.json sidequests.json projects.json tech.json softskills.json
│  │  └─ en/  (same files)
│  ├─ audio/music/  audio/sfx/   # Empty slots until licensed files are chosen
│  ├─ models/                    # *.glb (meshopt), M8
│  ├─ img/projects/              # Screenshots/illustrations, AVIF + WebP, several widths
│  ├─ cv/                        # Only after you approve which PDFs are published
│  ├─ favicon.svg  og-image.png  robots.txt
├─ src/
│  ├─ main.js                    # Bootstrap: prefs → device → data → router → screens
│  ├─ core/
│  │  ├─ bus.js                  # Native EventTarget used as the app event bus
│  │  ├─ store.js                # Small state object + `set()` that emits `state:change`
│  │  ├─ router.js               # Hash ⇄ state (parse/format), history push/replace
│  │  ├─ input.js                # Keyboard/gamepad/pointer/touch → actions
│  │  ├─ i18n.js                 # t(key, vars), lang switch, <html lang>
│  │  ├─ data.js                 # fetch + per-lang cache + error results + placeholder filter
│  │  ├─ prefs.js                # localStorage with try/catch
│  │  ├─ device.js               # Breakpoints (matchMedia), WebGL detection, reduced motion
│  │  ├─ experience.js           # Months/years computed from job periods (HUD, tech years)
│  │  └─ dom.js                  # el() helper (textContent only), `{{highlight}}` parser
│  ├─ components/                # panel, list-row, grid, tabs, detail-card, button-hints,
│  │                             # hud, sheet (mobile <dialog>), toast/error
│  ├─ screens/                   # title.js, hub.js, journal.js, inventory.js, system.js
│  ├─ audio/audio.js             # Howler wrapper, lazy-loaded on first gesture
│  ├─ three/                     # viewer.js, tech-icon.js (SVG extrude), avatar.js — lazy chunk
│  ├─ render/quick.js            # Pure string renderers shared by the build plugin (escaped)
│  ├─ assets/icons/              # Own SVG icons (tabs, HUD, hints) + tech logos (see §6.5)
│  ├─ assets/fonts/              # Self-hosted WOFF2
│  └─ styles/
│     ├─ tokens/ _colors _spacing _typography _motion _breakpoints
│     ├─ base/ _reset _fonts _a11y
│     ├─ components/ _panel _list-row _grid-cell _tabs _detail _hints _hud _sheet
│     ├─ layouts/ _stage _hub _title _quick
│     └─ main.scss
├─ build/vite-plugin-static-pages.js   # Quick mode prerender, meta/OG, sitemap.xml
├─ schemas/*.schema.json         # JSON Schema per data file (editor autocomplete + tests)
├─ tests/unit/  tests/e2e/
├─ docs/PROJECT_BRIEF.md  docs/references/ (git-ignored)  docs/sources/ (git-ignored)
└─ .github/workflows/ci-deploy.yml
```

### 3.2 How modules talk

```
             ┌──────────── input.js ────────────┐
 keyboard ──►│                                  │
 gamepad  ──►│  normalise → action {type, ...}  ├──► bus "action"
 pointer  ──►│                                  │
 touch    ──►└──────────────────────────────────┘
                                                     ┌─► active screen.handle(action)
 bus "action" ──► hub.js (owns section) ─────────────┤      (unhandled → hub: section/tab)
                                                     └─► store.set({section, tab, selection})
 store "state:change" ──► router.js   (writes hash: push on section/tab, replace on selection)
 window "hashchange"  ──► router.js ──► store.set(...)          (back button, deep links)
 store "state:change" ──► screens re-render the affected part
 bus "ui:sfx"         ──► audio.js (cursor, select, back, tab, section)
 store lang change    ──► i18n.js ──► data.js (load/cached) ──► full re-render
 store selection      ──► three/viewer.js (desktop only; swaps model, pauses when hidden)
```

- **Actions:** `prevSection`, `nextSection`, `prevTab`, `nextTab`, `move {dx, dy}`, `select`, `back`.
- **Routes** (as requested, language-neutral):
  `#/inicio` · `#/diario/misiones[/<id>]` · `#/diario/side-quests[/<id>]` ·
  `#/diario/recuerdos[/<id>]` · `#/inventario/tecnologias[/<id>]` ·
  `#/inventario/habilidades` · `#/inventario/objetos-clave` · `#/sistema`. Unknown → `#/inicio`.
- **Rendering:** DOM built with `el()` and `textContent`. No `innerHTML` with data. The only
  rich text is `{{word}}` → `<em class="hl">` (red keyword highlight), parsed into DOM nodes.
- **Resilience:** `data.js` returns `{ok, data | error}`; a failed file renders that section's
  error state (text from `ui.json`, with a hard-coded minimal fallback if `ui.json` itself
  fails). Audio/3D failures are caught and silently disable the feature with a toast.
- **3D:** `import('./three/viewer.js')` only when `device.isDesktop && device.hasWebGL`.
  One renderer, one canvas, moved between hosts. `IntersectionObserver` +
  `visibilitychange` pause the render loop.

### 3.3 Tests

- **Vitest:** router parse/format, input mapping (incl. shortcut toggle and form-control
  guard), i18n fallback and interpolation, data loader (errors, cache, placeholder filter),
  experience months/years, `{{highlight}}` parser, schema validation and es/en parity.
- **Playwright (Chromium only):** title → Start → hub; L/R switch; deep link; Back button;
  Quick mode renders; no console errors.

---

## 4. JSON data schema

Common rules for every file:

- Root is an object `{ "$schema": "...", "items": [...] }` (except `ui.json` and
  `profile.json`), so the editor validates and autocompletes.
- `id`: kebab-case, **identical in `es` and `en`** (checked by the parity test).
- Metadata on any item: `"_source": "cv" | "linkedin" | "skills-list" | "github" | "user"`,
  `"_review": true` (pending your review), `"_placeholder": true` (invented example — hidden
  in production), optional `"_note": "what to check"`.
- Rich text: `{{text}}` = highlighted keyword. Line breaks: separate array entries.
- Dates: `"YYYY-MM"`. `end: null` = ongoing.

### 4.1 `ui.json` — every visible UI string

```json
{
  "meta": {
    "lang": "es",
    "langName": "Español",
    "siteTitle": "The Legend Of Roberto - Portfolio Of The Wild",
    "description": "Portfolio de Roberto Báez González, desarrollador full-stack (Laravel, PHP, JavaScript, React).",
    "disclaimer": "Proyecto de fan no oficial. Sin relación con Nintendo."
  },
  "title": { "start": "Iniciar", "language": "Idioma", "quickMode": "Modo rápido" },
  "sections": { "journal": "Diario de Aventura", "inventory": "Inventario", "system": "Sistema" },
  "tabs": {
    "quests": "Misiones principales", "sideQuests": "Side Quests", "memories": "Recuerdos",
    "weapons": "Armas", "armor": "Armaduras", "keyItems": "Objetos clave"
  },
  "tabHints": { "weapons": "Tecnologías", "armor": "Habilidades", "keyItems": "Sobre mí" },
  "weaponPages": { "core": "Principales", "secondary": "Secundarias", "tools": "Herramientas", "office": "Ofimática y diseño" },
  "availability": "Disponible para trabajar",
  "hints": { "back": "Atrás", "select": "Seleccionar", "rotate": "Girar", "open": "Abrir" },
  "status": { "completed": "Completada", "active": "En curso", "current": "Actualidad" },
  "hud": { "hearts": "{years} años y {months} meses de experiencia profesional", "gems": "{count} proyectos" },
  "system": {
    "musicVolume": "Volumen de la música", "sfxVolume": "Volumen de los efectos",
    "mute": "Silenciar", "reduceMotion": "Reducir animaciones",
    "shortcuts": "Atajos de una tecla", "language": "Idioma",
    "backToTitle": "Volver a la pantalla de inicio", "quickMode": "Modo rápido"
  },
  "detail": { "level": "Nivel", "years": "{value} de uso profesional", "studied": "Formación", "stack": "Stack", "role": "Mi papel", "demo": "Demo", "repo": "Código" },
  "errors": { "data": "No se ha podido cargar esta sección. Prueba a recargar la página.", "audio": "El audio no está disponible.", "model": "El modelo 3D no está disponible." }
}
```

### 4.2 `profile.json` — identity, summary, key items

```json
{
  "name": "Roberto Báez González",
  "role": "Desarrollador Full-Stack",
  "summary": [
    "Empecé muy joven haciendo páginas en WordPress y, de forma autodidacta, descubrí que el desarrollo web era mi vocación.",
    "Hoy me muevo con más soltura en {{Laravel}} y {{React}}: desarrollo back end y front end, diseño de interfaces y resolución de incidencias.",
    "Ahora estoy inmerso en proyectos de {{IA}}, {{automatización de procesos}} y {{desarrollo de videojuegos}}: flujos con n8n, back ends en PHP y Laravel conectados por APIs REST, interfaces en React y JavaScript, MongoDB y MySQL, Git y Docker."
  ],
  "keyItems": [
    { "id": "email", "icon": "letter", "name": "Email", "value": "<email from CV>", "href": "mailto:<email from CV>", "_source": "cv" },
    { "id": "linkedin", "icon": "linkedin", "name": "LinkedIn", "value": "roberto-gonzalez-web-dev", "href": "https://www.linkedin.com/in/roberto-gonzalez-web-dev/", "_source": "linkedin" },
    { "id": "location", "icon": "pin", "name": "Ubicación", "value": "Gran Canaria (España)", "_source": "linkedin" },
    { "id": "github", "icon": "github", "name": "GitHub", "value": "Rob-Gon", "href": "https://github.com/Rob-Gon", "_source": "github" },
    { "id": "languages", "icon": "speech", "name": "Idiomas", "value": ["Español — nativo", "Inglés — B2 (título)", "Francés — A2"], "_source": "cv", "_review": true },
    { "id": "cv", "icon": "scroll", "name": "Currículum", "value": "Descargar CV (PDF)", "href": "cv/cv-es.pdf", "_source": "cv" }
  ],
  "available": true,
  "hud": { "hearts": 3 },
  "_source": "cv"
}
```

### 4.3 `quests.json` — main quests (jobs, education, certifications, goals)

`kind`: `job | education | certification | assessment | milestone | goal`.
`status`: `completed | active`. Jobs feed the HUD hearts and tech years.

```json
{
  "$schema": "../../../schemas/quests.schema.json",
  "items": [
    {
      "id": "grupo-ari",
      "kind": "job",
      "status": "completed",
      "title": "Desarrollador Full-Stack",
      "org": "Grupo ARI",
      "location": "Las Palmas de Gran Canaria",
      "period": { "start": "2025-04", "end": "2026-11" },
      "summary": "Plataforma {{ERP}} empresarial del sector automoción con Laravel y JavaScript.",
      "details": [
        "Ingestión automatizada de datos por {{SFTP}} y su procesamiento con {{MongoDB}}.",
        "Facturación y contabilidad procesadas con {{colas}}.",
        "Integraciones con varias {{APIs externas}} y control de acceso granular.",
        "Módulo de {{chat con WhatsApp}} desarrollado desde cero: mensajería en tiempo real con la API oficial de Meta, Laravel Reverb y Echo. Lo usan 100 operadores y ha gestionado más de 100.000 mensajes.",
        "Mantenimiento de otras aplicaciones del grupo, como la gestión de grúas y el servicio de campa.",
        "Flujo de trabajo con herramientas de IA como {{Claude Code}}."
      ],
      "stack": ["laravel", "php", "javascript", "mysql", "mongodb", "laravel-reverb", "rest-apis", "sass", "claude-code"],
      "_source": "user+linkedin",
      "_review": true
    }
  ]
}
```

### 4.4 `sidequests.json`

```json
{
  "$schema": "../../../schemas/sidequests.schema.json",
  "items": [
    {
      "id": "wordpress-origins",
      "title": "Las webs que nadie verá",
      "location": "Mis comienzos",
      "description": ["Mis primeras páginas fueron en WordPress. No pongo enlaces porque da pena verlas."],
      "_source": "linkedin",
      "_review": true
    }
  ]
}
```

### 4.5 `projects.json` — Memories (most important section for recruiters)

```json
{
  "$schema": "../../../schemas/projects.schema.json",
  "items": [
    {
      "id": "automotive-erp",
      "title": "ERP del sector automoción",
      "context": "Grupo ARI · Profesional",
      "period": { "start": "2025-04", "end": "2026-11" },
      "featured": true,
      "confidential": true,
      "summary": "ERP empresarial del sector automoción: ingestión de datos, facturación y contabilidad.",
      "role": "Desarrollador full-stack en parte de la aplicación.",
      "highlights": ["Ingestión automatizada por {{SFTP}} y procesamiento con MongoDB", "Colas para facturación y contabilidad", "Integraciones con APIs externas", "Control de acceso granular"],
      "stack": ["laravel", "php", "javascript", "mysql", "mongodb"],
      "image": { "src": "img/projects/automotive-erp", "alt": "Ilustración abstracta de un panel de ERP (proyecto confidencial)" },
      "links": { "demo": null, "repo": null },
      "_source": "user",
      "_review": true
    },
    {
      "id": "erp-whatsapp-chat",
      "title": "Chat de WhatsApp para el ERP",
      "context": "Grupo ARI · Profesional",
      "period": { "start": "2025-04", "end": "2026-11" },
      "featured": true,
      "confidential": true,
      "summary": "Módulo de mensajería en tiempo real con WhatsApp, integrado en el ERP del grupo.",
      "role": "Lo desarrollé desde cero.",
      "highlights": ["API oficial de {{WhatsApp}} (Meta)", "Tiempo real con {{Laravel Reverb}} y Echo", "100 operadores en activo", "Más de 100.000 mensajes gestionados"],
      "stack": ["laravel", "php", "javascript", "laravel-reverb", "rest-apis"],
      "image": { "src": "img/projects/erp-whatsapp-chat", "alt": "Ilustración abstracta de una conversación de chat (proyecto confidencial)" },
      "links": { "demo": null, "repo": null },
      "_source": "linkedin",
      "_review": true,
      "_note": "Period is the whole job; confirm the module's real dates"
    }
  ]
}
```

`image.src` is a base name; the build provides `-480/-960/-1440` widths in AVIF and WebP.

### 4.6 `tech.json` — Weapons (technologies)

Everything lives in the single **Weapons** tab. `category` sets the grid page, shown with a
page label like the game's paginated grid: `core` (page 1, "Principales") · `secondary`
("Secundarias") · `tools` ("Herramientas") · `office` ("Ofimática y diseño", lowest weight).
On mobile the pages become stacked groups with a heading each.
`level`: 1–5 (shown as the cell number and as stars in the detail panel).
`usedIn` / `studiedIn`: quest ids. **Years are computed** from the `usedIn` job periods, so
they never need manual updates.

```json
{
  "$schema": "../../../schemas/tech.schema.json",
  "items": [
    {
      "id": "laravel",
      "name": "Laravel",
      "category": "core",
      "level": 4,
      "icon": "laravel",
      "model3d": "extrude",
      "usedIn": ["grupo-ari"],
      "studiedIn": ["cifp-daw"],
      "description": "Mi framework principal: ERP en producción con colas, integraciones y control de acceso.",
      "_source": "skills-list",
      "_review": true,
      "_note": "Level proposed from CV; confirm"
    }
  ]
}
```

### 4.7 `softskills.json` — Armour

```json
{
  "$schema": "../../../schemas/softskills.schema.json",
  "items": [
    {
      "id": "teamwork",
      "name": "Trabajo en equipo",
      "icon": "tunic",
      "level": 4,
      "description": "Colaboro con compañeros y superiores de forma eficiente.",
      "example": "Desarrollo de componentes en sprints de Scrum durante mis prácticas en Advance Digital Experts.",
      "_source": "skills-list",
      "_review": true
    }
  ]
}
```

---

## 5. Content proposal

### 5.1 Experience used for computed values

| Job | Period | Months |
|---|---|---|
| Grupo ARI — Full-Stack Developer | 2025-04 → 2026-11 | 20 |
| Crealia IT — Full-Stack Developer | 2024-10 → 2025-03 | 6 |
| Advance Digital Experts SL — Front-end Developer (internship) | 2024-03 → 2024-05 | 3 |
| **Total professional** | | **29 (2 y 5 m)** |

### 5.2 HUD (approved)

- **Hearts: fixed value `profile.hud.hearts = 3`.** The accessible label still states the
  computed experience ("2 years and 5 months of professional experience").
- **Gems = number of projects** in Memories (computed from `projects.json`, currently 11).
  Own faceted-gem icon, not the game's rupee silhouette.
- **Availability badge** ("Disponible para trabajar") in the HUD and in Quick mode, driven by
  `profile.available`.

### 5.3 Inventory tabs (approved)

Exactly three tabs: **Weapons** (technologies) · **Armour** (soft skills) · **Key items**
(about me). Each tab shows a small hint for recruiters (`ui.tabHints`).

**Weapons — page "Principales" (core, ordered by full-stack relevance; level 1–5):**

| # | Tech | Lvl | Where |
|---|---|---|---|
| 1 | Laravel | 4 | Grupo ARI, CIFP |
| 2 | PHP | 4 | Grupo ARI, Crealia IT, CIFP, cert. |
| 3 | JavaScript | 4 | Grupo ARI, Advance, CIFP, cert. |
| 4 | TypeScript | 3 | Crealia IT |
| 5 | React | 3 | Crealia IT, Advance |
| 6 | MySQL (and SQL) | 4 | Grupo ARI, Crealia IT, CIFP |
| 7 | MongoDB | 3 | Grupo ARI (SFTP data processing), Crealia IT |
| 8 | REST APIs | 4 | Grupo ARI (CV; Meta WhatsApp API, LinkedIn) |
| 9 | Sass | 4 | Grupo ARI, Crealia IT, Advance |
| 10 | HTML | 4 | Grupo ARI, CIFP, cert. |
| 11 | CSS | 4 | Grupo ARI, CIFP, cert. |
| 12 | Git | 4 | Grupo ARI, Crealia IT, CIFP, LinkedIn assessment |
| 13 | Vite | 3 | Advance (CV) |
| 14 | Bootstrap | 3 | Grupo ARI, CIFP |
| 15 | Material UI | 2 | Crealia IT |

**Page "Secundarias":** Jest (2, Advance) · JSON (4) · XML (2) · XQuery (1, CIFP) ·
Java (2, CIFP + 2 certs) · C# (2, CIFP + cert + LinkedIn assessment) · Python (2, cert) ·
Laravel Reverb + Echo / WebSockets (3, Grupo ARI WhatsApp chat module; LinkedIn).

**Page "Herramientas":** Claude Code / AI · GitHub · GitLab · Postman · Jira & Atlassian ·
Trello · DBeaver · Linux (Ubuntu, Debian) · Scrum & sprints · n8n (2, current personal AI and
automation projects; LinkedIn) · Docker (2, current personal projects; LinkedIn).
Neither has a job in `usedIn`, so they show no computed years.

**Page "Ofimática y diseño":** Photoshop · Premiere Pro · Lightroom · Excel · Word · PowerPoint.

**Armour (soft skills, each with a real example):**

| Skill | Example (source) |
|---|---|
| Communication | Working efficiently with colleagues and superiors (CV) |
| Teamwork | Scrum sprints at Advance Digital Experts (skills list) |
| Problem solving | Supporting and fixing Grupo ARI's other applications: tow-truck management and vehicle yard service (LinkedIn) |
| Analytical thinking | Designing SFTP ingestion + queue processing for invoicing/accounting in the automotive ERP (user) |
| Emotional intelligence | LinkedIn top skill; concrete example `_placeholder` |
| Working under pressure | Production modules delivered at Grupo ARI and Crealia IT (CV) |
| Commitment | 1 year 8 months on the ERP; WhatsApp chat module built from scratch, now used by 100 operators (LinkedIn) |
| Versatility | Laravel/JS at Grupo ARI, React/TypeScript at Crealia IT (LinkedIn) |
| Determination | Self-taught path from first WordPress sites to the Higher VET Diploma and a full-stack job (LinkedIn) |

**Key items (published):** email, LinkedIn, GitHub, location "Gran Canaria (Spain)",
languages, availability, CV PDF. **Not published:** phone, age, driving licence.
The CV PDFs are published **as they are** (your decision), which means they include the
phone number.

**Knowledge areas** (web/back-end/front-end development, UI design, version control, issue
resolution) go into the profile summary, not the grid.

### 5.4 Main quests

**Active (goals, confirmed by you):**
1. Find new projects related to AI and AI-driven automation. Includes process automation with n8n
   and video game development (LinkedIn, Nov 2026; confirmed).
2. ~~Keep improving the skills I already have.~~ Replaced (Nov 2026, owner) by **Matricular**:
   a timed web game (car number plates → words checked against an unofficial RAE API), link
   coming soon.

**Completed (greyed):**
1. Full-Stack Developer — Grupo ARI (automotive ERP + WhatsApp chat module), 2025-04 → 2026-11
2. Full-Stack Developer — Crealia IT (pharmacy + logistics web apps), 2024-10 → 2025-03
3. Front-end Developer (internship) — Advance Digital Experts SL, 2024-03 → 2024-05
4. Higher VET Diploma in Web Application Development — CIFP Villa de Agüimes, 2021 → 2024
5. Programming Hub certification courses — PHP, JavaScript, HTML, CSS, Python, Java,
   Java Advanced, C# (2021)
6. LinkedIn skill assessments passed — C#, Git, Front-end development
7. English B2 certificate
8. "The journey begins" — first WordPress sites (origin story)

Secondary school entries are omitted (low value for recruiters).

### 5.5 Memories (projects) — all approved, all with own illustrations

The internal product name of the Grupo ARI ERP is **never** published. Client names of the
Crealia IT apps are not published; their descriptions come only from the CV and LinkedIn.

| # | Project | Type | Links |
|---|---|---|---|
| 1 | Automotive ERP | Grupo ARI, confidential | — |
| 2 | WhatsApp chat module for the ERP | Grupo ARI, confidential; Meta API + Laravel Reverb/Echo; 100 operators, 100,000+ messages (LinkedIn) | — |
| 3 | Pharmacy web application | Crealia IT, maintenance (React + TypeScript, MongoDB/SQL/PHP) | — |
| 4 | Logistics web application | Crealia IT, maintenance (same stack) | — |
| 5 | The Legend Of Roberto (this site) | Personal | demo + repo |
| 6 | Proyecto-Web | Laravel + Blade + JS (2024); description from repo data only | repo |
| 7 | Api-Rest | Laravel REST API | repo |
| 8 | Modules-List | Laravel, role-based access | repo |
| 9 | Contact-Form | JS + Bootstrap, validations | demo + repo |
| 10 | To-Dos | Laravel, categories | repo |
| 11 | CRUD-Projects | Laravel 8 CRUD | repo |

### 5.6 Side quests

Confirmed topics: **music** and **photography / video editing** (details `_review` until you
write them), first WordPress sites ("too embarrassing to link"), learning French (A2).
Anything else is `_placeholder`.

### 5.7 English data

Based on the English CV with its typos corrected ("Online Courses", "React development with
TypeScript", "Higher VET Diploma in Web Application Development", "English: Advanced (B2
certificate)"). Proper nouns and tech names are kept.

---

## 6. Design tokens (from the references)

All sizes are expressed on a **1280 × 720 stage** and scaled with `em` on desktop
(`.stage { font-size: min(1.25vw, 2.2222vh) }` → 16 px at 1280 × 720; SCSS helper
`u(82)` = `82em / 16`). Tablet and mobile use normal `rem` sizes. Browser zoom ≥ 200 %
naturally drops desktop into the tablet layout.

### 6.1 Colour

| Token | Value | Use |
|---|---|---|
| `--c-text` | `#E9E1D1` | Body/title text (warm white, never pure white) |
| `--c-text-muted` | `#B8B1A3` | Secondary text, inactive tabs |
| `--c-text-done` | `#9A958B` | Completed quests (≥ 4.5:1 on panel) |
| `--c-border` | `rgb(226 222 211 / 0.35)` | Hairlines, panel frames |
| `--c-border-strong` | `#E2DED3` | Selected frame, corner brackets |
| `--c-accent-yellow` | `#E2D146` | Location/subtitle lines |
| `--c-accent-red` | `#F15050` | Keyword highlights, alert dot |
| `--c-accent-green` | `#6FD49C` | Effect chips |
| `--c-accent-blue` | `#3CD3FC` | Focus ring, glow, links |
| `--c-equipped` | `#1F8BFF → #0B5FD0` | "Equipped/featured" cell gradient |
| `--c-panel` | `rgb(0 0 0 / 0.6)` | Large panels |
| `--c-row` | `rgb(0 0 0 / 0.78)` | List rows, buttons, grid cells |
| `--c-callout` | `rgb(10 40 70 / 0.78)` + line `#3B8ED8` | System callouts |
| `--c-heart` | `#E3343F` | HUD hearts |
| `--c-gem` | `#3FBF5A` | HUD gem |
| `--c-backdrop` | `#0F160E → #1E2B1B` | Hub backdrop (own blurred landscape later) |
| `--c-title-bg` | `#B99A5B → #7A5E3C → #3A2C35` (diagonal) | Title screen |

### 6.2 Spacing and sizes (stage units)

Scale: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 60. Page margin 60. Header height 107 (rule at y≈107),
footer rule at y≈650. Grid cell 82 × 82, gap 16, 5 visible columns + peeking 6th. List row
420 × 56, gap 14. System button 220 × 46. Detail card ≈ 600 × 160. Corner bracket 10 × 10,
stroke 2.

### 6.3 Radii

`--r-0: 0` (rows, cells) · `--r-1: 2px` (chips, badges) · `--r-2: 4px` (max, cards).

### 6.4 Typography (Google Fonts, OFL, self-hosted)

| Option | Title (title screen, logo text) | UI (everything else, italic 500/700) |
|---|---|---|
| **A (recommended)** | **Cinzel** 600 | **Roboto** italic |
| B | Marcellus SC | Barlow Semi Condensed italic |
| C | Cormorant SC 700 | Fira Sans italic |

Stage sizes: section title 30 bold italic · neighbour labels 15 · tab label 15 · list title 22
bold italic · list subtitle 13 bold italic · detail title 24 bold italic · body 17 italic 500 ·
cell badge 15 bold · hints 16. Mobile body never below 16 px.

### 6.5 Iconography

Own SVG set, 1.5–2 px strokes, monochrome `currentColor`: tab icons (banner, speech bubble,
film strip, blade, bow, tunic, crystal, star), HUD heart and gem, keycap/button glyphs
(L, R, A, B, Z, C, Esc, Enter). Tech logos from **Simple Icons** (CC0 SVG data; nominative
use of each brand), copied as individual files with attribution in `THIRD_PARTY.md`; logos
not available there get an own neutral glyph with the abbreviation.

### 6.6 Motion

| Token | Value | Use |
|---|---|---|
| `--t-fast` | 120 ms `cubic-bezier(.2,.9,.3,1.3)` | Cursor move (slight overshoot) |
| `--t-base` | 180 ms `cubic-bezier(.4,0,.2,1)` | Fades, tab indicator |
| `--t-section` | 280 ms `cubic-bezier(.4,0,.2,1)` | L/R horizontal slide |
| `--t-sheet` | 240 ms `cubic-bezier(0,0,.2,1)` | Mobile bottom sheet |
| `--t-intro` | 600 ms ease-in-out | Title → hub (fade through black) |
| `--t-pulse` | 1200 ms ease-in-out infinite | Selected corner-bracket pulse |

`prefers-reduced-motion` or the System toggle → slides become 0 ms cross-fades and the pulse
stops.

---

## 7. Responsive summary

| Range | Layout |
|---|---|
| ≥ 1200 px | 16:9 stage, full HUD, list/grid + detail, 3D viewer on the right |
| 768–1199 px | Grid and detail side by side, no 3D (avatar render image), tabs always visible |
| < 768 px | One section at a time, L/R bar fixed at the bottom, 4-column grid, detail in a bottom sheet (`<dialog>`), swipe to change section, lighter motion |

Checked at 360, 390, 768, 1024, 1280 and 1920 px, portrait and landscape.

---

## 8. Milestones

| Phase / M | Content | Exit criteria |
|---|---|---|
| Phase 2 | Project `CLAUDE.md` + `.claude/rules/*` | Your OK |
| Phase 3 | Scaffold, tooling, CI, `.gitignore` (references + sources), first commit | `git status` clean of `docs/sources/` |
| M1 | Design system + base components (panel, row, cell, tabs, detail, hints, HUD) | Component demo page |
| M2 | Input manager (+ gamepad), router, hub structure with L/R transitions | Unit tests green |
| M3 | Title screen + i18n ES/EN + **Guide** (controls + section legend, guide fairy; own commit) | Language switch works everywhere; Guide reachable from the title menu and from System |
| M4 | Adventure Log (quests, side quests, memories) | Reads JSON, deep links |
| M5 | Inventory (weapons with category pages, armour, key items) + detail panel | Computed years shown |
| M6 | System + audio (Howler, volumes, persistence, SFX incl. the Guide chime) | Never autoplays |
| M7 | Full tablet/mobile + Quick mode (pre-rendered), sitemap, OG | Lighthouse a11y 100 on Quick mode |
| M8 | 3D on desktop (viewer, extruded tech icons, avatar or placeholder; avatar holds the selected item with a gentle bob) | ≤ 1.5 MB/model, paused when hidden |
| M9 | Polish: a11y, performance, SEO, error states, deploy to GitHub Pages; one own icon per soft skill (Armour) | Lighthouse ≥ 90 ×4 |

Every milestone: tests green → Conventional Commit on a `feature/…` branch → screenshot or
description → stop for your review.

### 8.1 Dependencies to approve (Phase 3)

Runtime: `howler`, `three` (lazy chunk).
Dev: `vite`, `sass`, `eslint` + `@eslint/js` + `globals`, `prettier`, `eslint-config-prettier`,
`stylelint` + `stylelint-config-standard-scss`, `vitest` + `jsdom`, `@playwright/test`,
`ajv` (schema tests), `@gltf-transform/cli` (M8, can be
run with `npx` instead of installed). Fonts as downloaded WOFF2 files (no package).

---

## 9. Technical risks

| Risk | Mitigation |
|---|---|
| Hash routes not indexable; OG crawlers don't run JS | C3 pre-rendered Quick mode + static meta |
| Single-key shortcuts vs. assistive tech | C1, C2 |
| Contrast over translucent panels | Backdrop we control, minimum panel alpha, contrast check in M9 |
| Autoplay policies / iOS audio unlock | Howler loaded and unlocked on the Start gesture; music paused on `visibilitychange` |
| Three.js weight / weak laptop GPUs | Lazy chunk, desktop + WebGL only, low-poly budget, render on demand, pause when hidden |
| Low-end phones (blur, animation) | C9, lighter motion < 768 px |
| Placeholder content leaking to production | C5 |
| ES/EN drift | C6 parity test |
| IP: look-and-feel too close to the original | §1.1: layout homage only, all artwork original |
| Wrong Vite `base` breaks every asset on Pages | Repo `the-legend-of-roberto` → `base: '/the-legend-of-roberto/'`; Playwright smoke test runs against `vite preview` with the same base |
| Confidential professional projects | No screenshots, no client names unless you confirm, own illustrations |

---

## 10. Decisions recorded (Phase 1 answers)

| # | Topic | Decision |
|---|---|---|
| 1 | Fonts | Option A: Cinzel (title) + Roboto italic (UI), self-hosted |
| 2 | Personal data | Email, LinkedIn, GitHub, "Gran Canaria (Spain)", languages. No phone, age or driving licence |
| 3 | CV PDFs | Published as they are (ES/EN by active language) |
| 4 | Active quests | AI projects and automations; keep improving current skills |
| 5 | Availability | "Available for work" in the HUD and in Quick mode |
| 6 | Inventory tabs | Only Weapons, Armour, Key items; extra techs as Weapons pages |
| 7 | Levels | 1–5 scale; years computed from job dates |
| 8 | HUD | 3 hearts (fixed); gems = number of projects |
| 9 | Public repos | No README changes; Proyecto-Web described from repo data only |
| 10 | Confidentiality | Never publish the ERP's product name or Crealia's client names; descriptions from CV/LinkedIn. Only metrics the owner made public on LinkedIn (WhatsApp module: 100 operators, 100,000+ messages) |
| 11 | Project images | Own illustrations |
| 12 | Side quests | Music and photography/video confirmed |
| 13 | Extra soft skills | Add working under pressure, commitment, versatility; determination (LinkedIn, Nov 2026) |
| 14 | Repo / deploy | `the-legend-of-roberto` on GitHub Pages, `base: '/the-legend-of-roberto/'` |
| 15 | Initial language | Saved preference → else Spanish if `navigator.languages` has `es*` → else English |
| 16 | Type checking | Plain JS, no type checking (C7 rejected) |
| 17 | Audio | Kenney CC0 SFX ("UI Audio", "Interface Sounds"); music chosen by you later |
| 18 | Guide | New "Guide" option in the title menu and in System. Two tabs: Controls (keyboard, gamepad, touch; generated from `KEY_HINTS`) and Legend (what each section, tab and HUD value means) |
| 19 | Guide fairy | Original animated SVG/CSS fairy that introduces each Guide tab with a speech bubble. **No name** (left for the user to guess). Still under reduced motion |
| 20 | Guide sound | Original CC0 chime (Kenney) when entering the Guide, only after a user gesture; added in M6. Never Navi's voice or any recreation of it |
