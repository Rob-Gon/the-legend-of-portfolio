import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import Ajv from 'ajv';
import { describe, expect, it } from 'vitest';

const FILES = ['profile', 'quests', 'sidequests', 'projects', 'tech', 'softskills'];
const LANGS = ['es', 'en'];
// Fields that are not translated and must be identical in every language.
const NEUTRAL = {
  quests: ['kind', 'status', 'period', 'stack'],
  sidequests: ['links'],
  projects: ['period', 'featured', 'confidential', 'stack', 'links'],
  tech: ['category', 'level', 'icon', 'color', 'usedIn', 'studiedIn'],
  softskills: ['level', 'icon'],
};

const readJson = (...parts) => JSON.parse(readFileSync(resolve(...parts), 'utf8'));
const data = (lang, file) => readJson('public/data', lang, `${file}.json`);

describe.each(FILES)('%s.json', (file) => {
  const validate = new Ajv({ allErrors: true }).compile(readJson('schemas', `${file}.schema.json`));

  it.each(LANGS)('matches its schema (%s)', (lang) => {
    const valid = validate(data(lang, file));
    expect(validate.errors ?? [], JSON.stringify(validate.errors, null, 2)).toEqual([]);
    expect(valid).toBe(true);
  });

  if (file === 'profile') {
    it('keeps availability, hearts and key item ids/icons identical across languages', () => {
      const [es, en] = LANGS.map((lang) => data(lang, file));
      expect([en.available, en.hud]).toEqual([es.available, es.hud]);
      const neutral = (profile) => profile.keyItems.map(({ id, icon }) => ({ id, icon }));
      expect(neutral(en)).toEqual(neutral(es));
    });
    return;
  }

  it('has the same ids, order and language-neutral fields in every language', () => {
    const [es, en] = LANGS.map((lang) => data(lang, file).items);
    expect(en.map((item) => item.id)).toEqual(es.map((item) => item.id));
    es.forEach((item, index) => {
      for (const field of NEUTRAL[file]) {
        expect(en[index][field], `${item.id}.${field}`).toEqual(item[field]);
      }
    });
  });

  it('has unique ids', () => {
    const ids = data('es', file).items.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('cross references', () => {
  const quests = data('es', 'quests').items;
  const techIds = data('es', 'tech').items.map((item) => item.id);
  const icons = ['src/assets/icons', 'src/assets/tech'].flatMap((dir) =>
    readdirSync(resolve(dir)).map((name) => name.replace('.svg', '')),
  );

  it('every stack id is a technology', () => {
    const stacks = [...quests, ...data('es', 'projects').items].flatMap((item) => item.stack ?? []);
    expect(stacks.filter((id) => !techIds.includes(id))).toEqual([]);
  });

  it('usedIn points to jobs with a period and studiedIn to existing quests', () => {
    for (const tech of data('es', 'tech').items) {
      for (const id of tech.usedIn) {
        const job = quests.find((quest) => quest.id === id);
        expect(job?.kind === 'job' && Boolean(job.period), `${tech.id} → ${id}`).toBe(true);
      }
      for (const id of tech.studiedIn) {
        expect(
          quests.some((quest) => quest.id === id),
          `${tech.id} → ${id}`,
        ).toBe(true);
      }
    }
  });

  it('every icon exists', () => {
    const used = [
      ...data('es', 'tech').items,
      ...data('es', 'softskills').items,
      ...data('es', 'profile').keyItems,
    ].map((item) => item.icon);
    expect(used.filter((name) => !icons.includes(name))).toEqual([]);
  });
});

describe('privacy', () => {
  it('never publishes the phone number, age or the ERP product name', () => {
    for (const lang of LANGS) {
      const text = FILES.map((file) =>
        readFileSync(resolve('public/data', lang, `${file}.json`), 'utf8'),
      ).join();
      expect(text).not.toMatch(/\+34|\b\d{3}\s?\d{2}\s?\d{2}\s?\d{2}\b/);
      expect(text).not.toMatch(/sarix/i);
      expect(text).not.toMatch(/\bedad\b|\bage\b/i);
    }
  });
});
