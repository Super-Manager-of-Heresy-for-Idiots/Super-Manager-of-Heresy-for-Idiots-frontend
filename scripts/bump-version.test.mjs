import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { bumpReleaseConfig, nextVersion } from './bump-version.mjs';

test('nextVersion increments patch until 99', () => {
  assert.equal(nextVersion('0.0.1'), '0.0.2');
  assert.equal(nextVersion('7.12.3'), '7.12.4');
});

test('nextVersion carries patch and minor at 99', () => {
  assert.equal(nextVersion('0.0.99'), '0.1.0');
  assert.equal(nextVersion('0.99.99'), '1.0.0');
});

test('bumpReleaseConfig preserves release names', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dnd-version-'));
  const file = join(dir, 'app-release.json');
  await writeFile(file, JSON.stringify({
    version: '0.0.99',
    releaseName: {
      ru: 'Хранилище Пепла и Латуни',
      en: 'Vault of Ash and Brass',
    },
  }), 'utf8');

  try {
    const bumped = await bumpReleaseConfig(file);
    const saved = JSON.parse(await readFile(file, 'utf8'));

    assert.equal(bumped, '0.1.0');
    assert.equal(saved.version, '0.1.0');
    assert.equal(saved.releaseName.ru, 'Хранилище Пепла и Латуни');
    assert.equal(saved.releaseName.en, 'Vault of Ash and Brass');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
