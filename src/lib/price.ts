type GoldInput = number | string | null | undefined;

export function parseGoldValue(value: GoldInput): number | null {
  if (value == null || value === '') return null;
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export function goldFromCopper(copperValue: GoldInput): number | null {
  const copper = parseGoldValue(copperValue);
  return copper == null ? null : copper / 100;
}

export function stackGoldValue(priceGold: GoldInput, quantity: number | null | undefined): number | null {
  const unit = parseGoldValue(priceGold);
  if (unit == null) return null;
  return unit * Math.max(1, quantity ?? 1);
}

export function formatApproxGold(value: GoldInput, empty = '-'): string {
  const numeric = parseGoldValue(value);
  if (numeric == null) return empty;

  const formatted = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: numeric < 1 ? 3 : 2,
  }).format(numeric);

  return `~${formatted} gp`;
}
