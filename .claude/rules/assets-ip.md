# Assets, intellectual property and private sources

The repository is **public** and carries the owner's name. These rules are mandatory.

## Never use

- Nintendo assets of any kind: music, sound effects, voice, sprites, textures, screenshots,
  illustrations, models, the Zelda/BotW logo, game fonts or fan fonts that imitate them
  (e.g. Hylia Serif).
- Recognisable Nintendo symbols: Hylian crest, Triforce, Sheikah eye, Divine Beasts, the BotW
  rupee silhouette, Master Sword.
- Assets from `chaos-xxl/zelda-hyrule-ui` (they derive from a third-party Figma kit and
  depict Nintendo IP). Its MIT code may be consulted; if any code is copied literally, add its
  MIT notice to `THIRD_PARTY.md`.

## Allowed

- Own CSS, SVG, Blender models and illustrations made for this project.
- Google Fonts under OFL/Apache (Cinzel, Roboto), self-hosted.
- Kenney CC0 sound effects; music with a licence that allows commercial use (owner's choice).
- Technology logos from Simple Icons (CC0 SVG data), used nominatively to name each
  technology; logos not available there are replaced by an own neutral glyph.
- Every third-party asset gets a line in `THIRD_PARTY.md`: name, author, source URL, licence.

## Guide fairy

- Original SVG/CSS design made for this project (own colours, wing shape and glow). It is
  never traced from or modelled on game art.
- It has **no name** in the UI, the JSON or the code (`guide-fairy`); never call it Navi.
- Its sound is an original CC0 chime (see `audio.md`), never the game character's voice.

## Title and disclaimer

- The title "The Legend Of Roberto - Portfolio Of The Wild" is set as **live text** in the
  project's own typography. Never imitate the game logo's lettering, sword or layout.
- The footer of the site, Quick mode and the README carry: "Unofficial fan project. Not
  affiliated with Nintendo." (localised via `ui.json` `meta.disclaimer`).
- UI wording uses generic terms (Adventure Log, Inventory, Side Quests, gems); no Nintendo
  proper names (Hyrule, Sheikah, Link…).
- Content may name the game the homage is based on, nominatively and only as a reference
  (e.g. the portfolio's own project description, owner's decision): "The Legend of Zelda:
  Breath of the Wild". Never as branding, a logo or a title-like treatment.

## Git-ignored, never committed

- `docs/references/` and any game screenshot anywhere in the repo.
- `docs/sources/` (CVs and LinkedIn export).
- Check `git status` before every commit that touches `docs/` or `public/`.

## Private sources

- `docs/sources/` is read-only input. Extract text to the session scratchpad, never into the
  repo.
- Only the two CV PDFs may be copied to `public/cv/` (approved: published as they are).
  The LinkedIn export is never published.
