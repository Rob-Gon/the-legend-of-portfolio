# Content data (JSON)

## Files

`public/data/{es,en}/`:

| File | Feeds |
|---|---|
| `ui.json` | Every UI string, site meta, error messages |
| `profile.json` | Name, role, summary, key items (contact, links, languages, CV), `available`, `hud.hearts` |
| `quests.json` | Adventure Log → main quests (jobs, education, certifications, assessments, milestones, goals) |
| `sidequests.json` | Adventure Log → side quests |
| `projects.json` | Adventure Log → Memories (projects) |
| `tech.json` | Inventory → Weapons (pages by `category`: `core`, `secondary`, `tools`, `office`) |
| `softskills.json` | Inventory → Armour |

Schemas live in `schemas/*.schema.json`; each list file starts with `"$schema"` and an
`"items"` array. Full examples: `docs/PROJECT_BRIEF.md` §4.

## Rules

- `id` is kebab-case and **identical in `es` and `en`**. Language-neutral fields (dates, levels,
  URLs, `stack`, `usedIn`, `category`, `icon`) must match across languages — enforced by the
  parity test.
- Dates are `"YYYY-MM"`; `end: null` means ongoing. Periods are inclusive.
- Rich text: `{{text}}` highlights a keyword. Multi-paragraph text is an array of strings.
  No HTML in JSON.
- Tech years are **computed** from `usedIn` job periods — never write years by hand.
- HUD hearts are the fixed value `profile.hud.hearts` (3). Gems = number of projects.
- In `en/`, keep proper nouns and technology names; base wording on the English CV
  (typos corrected).

## Metadata fields

| Field | Meaning |
|---|---|
| `_source` | Where the data came from: `cv`, `linkedin`, `skills-list`, `github`, `user` |
| `_review: true` | Real data proposed by Claude, pending the owner's review. Dev-only badge. |
| `_placeholder: true` | Invented example. **Hidden in production builds**, badge in dev. |
| `_note` | Free text: what to check. |

Remove `_review` once the owner confirms an item. Never invent data without `_placeholder`.

## Adding content without touching code

1. Copy an existing item in the `es` file, give it a new `id`, edit the texts.
2. Do the same in the `en` file with the same `id` and language-neutral fields.
3. For a project image, add `public/img/projects/<id>-{480,960,1440}.{avif,webp}`.
4. Run `npm test` (schema + parity) and `npm run dev` to check.

## Privacy and confidentiality

- Published contact data: email, LinkedIn, GitHub, location "Gran Canaria", languages,
  availability, CV PDFs. **Never** phone or age in JSON/HTML; the CV PDFs are published as
  they are by the owner's decision.
- **Never** publish the internal product name of the Grupo ARI ERP or the client names of the
  Crealia IT apps. Describe them generically ("automotive ERP", "pharmacy web application").
- Confidential projects have `confidential: true`, no links and an own illustration.
- Active quests (goals) only as confirmed by the owner.
