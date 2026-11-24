import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Guards the privacy/IP rules: CVs, LinkedIn export and game screenshots must never be committed.
describe('.gitignore', () => {
  const ignored = readFileSync('.gitignore', 'utf8').split(/\r?\n/);

  it.each(['docs/sources/', 'docs/references/', 'node_modules/', 'dist/'])('ignores %s', (path) => {
    expect(ignored).toContain(path);
  });
});
