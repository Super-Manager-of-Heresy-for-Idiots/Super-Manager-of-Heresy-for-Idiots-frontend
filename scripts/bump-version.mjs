import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function parseVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) {
    throw new Error(`Invalid version "${version}". Expected major.minor.patch.`);
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

export function nextVersion(version) {
  const current = parseVersion(version);
  if (current.patch < 99) {
    return `${current.major}.${current.minor}.${current.patch + 1}`;
  }
  if (current.minor < 99) {
    return `${current.major}.${current.minor + 1}.0`;
  }
  return `${current.major + 1}.0.0`;
}

export async function bumpReleaseConfig(configPath) {
  const absolutePath = resolve(configPath);
  const raw = await readFile(absolutePath, 'utf8');
  const config = JSON.parse(raw);

  if (!config.releaseName?.ru || !config.releaseName?.en) {
    throw new Error('Release config must contain releaseName.ru and releaseName.en.');
  }

  const bumped = {
    ...config,
    version: nextVersion(config.version),
  };

  await writeFile(absolutePath, `${JSON.stringify(bumped, null, 2)}\n`, 'utf8');
  return bumped.version;
}

async function main() {
  const [, , configPath = 'public/app-release.json', ...flags] = process.argv;
  const version = await bumpReleaseConfig(configPath);
  if (flags.includes('--print')) {
    process.stdout.write(version);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
