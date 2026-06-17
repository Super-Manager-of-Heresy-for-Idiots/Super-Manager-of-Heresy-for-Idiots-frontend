// Grant-type classification helpers (non-component module so React Fast Refresh
// stays happy and these can be reused by viewers/tests).

export type GrantKind =
  | 'FEATURE' | 'SUBCLASS' | 'FEAT' | 'SPELL' | 'SKILL'
  | 'ABILITY' | 'MODIFIER' | 'CUSTOM' | 'UNKNOWN';

/** Maps a (flexible-text) backend grantType onto a known render kind. */
export function grantKind(grantType: string | undefined): GrantKind {
  const k = (grantType ?? '').toUpperCase().replace(/[\s-]+/g, '_');
  if (k.includes('FEATURE')) return 'FEATURE';
  if (k.includes('SUBCLASS')) return 'SUBCLASS';
  if (k.includes('FEAT')) return 'FEAT';
  if (k.includes('SPELL')) return 'SPELL';
  if (k.includes('SKILL')) return 'SKILL';
  if (k.includes('ABILITY')) return 'ABILITY';
  if (k.includes('MODIFIER') || k.includes('NUMERIC')) return 'MODIFIER';
  if (k.includes('CUSTOM') || k.includes('TEXT')) return 'CUSTOM';
  return 'UNKNOWN';
}

/** True when the backend grantType doesn't map to a known typed payload. */
export function isUnknownGrantKind(grantType: string | undefined): boolean {
  return grantKind(grantType) === 'UNKNOWN';
}
