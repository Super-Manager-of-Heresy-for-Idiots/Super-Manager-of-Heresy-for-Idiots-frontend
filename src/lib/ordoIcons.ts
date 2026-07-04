import { ORDO_ICON_MANIFEST, type OrdoIconManifestSource } from '@/data/ordoIconManifest';

export type OrdoIconSource = OrdoIconManifestSource | 'item' | 'magic' | 'any';

export interface OrdoIconEntry {
  readonly name: string;
  readonly src: string;
  readonly group?: string;
  readonly school?: string;
  readonly level?: number;
}

const MANIFEST = ORDO_ICON_MANIFEST as Readonly<
  Record<OrdoIconManifestSource, Readonly<Record<string, OrdoIconEntry>>>
>;

const SOURCE_ORDER: Record<OrdoIconSource, OrdoIconManifestSource[]> = {
  equipment: ['equipment'],
  items: ['items'],
  spells: ['spells'],
  item: ['items', 'equipment'],
  magic: ['items'],
  any: ['items', 'equipment', 'spells'],
};

export function normalizeOrdoIconKey(value: string | null | undefined): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[’'`]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function candidateKeys(names: readonly (string | null | undefined)[]): string[] {
  const keys = new Set<string>();
  for (const name of names) {
    const normalized = normalizeOrdoIconKey(name);
    if (!normalized) continue;
    keys.add(normalized);
    keys.add(normalized.replace(/\b\+\s*/g, ''));
    keys.add(normalized.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim());
  }
  return Array.from(keys).filter(Boolean);
}

export function findOrdoIcon(
  names: readonly (string | null | undefined)[],
  source: OrdoIconSource = 'any',
): OrdoIconEntry | null {
  const keys = candidateKeys(names);
  if (keys.length === 0) return null;

  for (const src of SOURCE_ORDER[source]) {
    const bucket = MANIFEST[src];
    for (const key of keys) {
      const entry = bucket[key];
      if (entry) return entry;
    }
  }

  return null;
}
