import type { SpellDetail } from '@/types';

/**
 * Formatting helpers for a content-catalog {@link SpellDetail}.
 * Shared by the level-up spell picker and the character-sheet spell
 * detail card so the same parsing logic is not duplicated.
 */

export function spellRangeText(d: SpellDetail): string | undefined {
  if (d.rangeDistance != null && d.rangeUnit) return `${d.rangeDistance} ${d.rangeUnit}`;
  return d.rangeType ?? undefined;
}

export function spellComponentsText(d: SpellDetail): string | undefined {
  const parts = (d.components ?? []).map((c) => c.component).filter((x): x is string => !!x);
  return parts.length ? parts.join(', ') : undefined;
}

export function spellMaterialText(d: SpellDetail): string | undefined {
  return (d.components ?? []).find((c) => c.materialText)?.materialText ?? undefined;
}
