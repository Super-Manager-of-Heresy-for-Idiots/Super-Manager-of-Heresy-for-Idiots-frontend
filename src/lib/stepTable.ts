/**
 * Bridges a per-level max table (what the Player's Handbook prints) and the `step(character_level, …)` DSL
 * formula the runtime already evaluates. The admin fills a level→value grid; we serialize it to a `step(...)`
 * expression stored in `max_formula`, and parse it back for editing. No new backend schema — the existing
 * formula runtime does the lookup.
 */

export const MAX_LEVEL = 20;

/** Expand a `step(character_level, t1,v1, …)` formula into a level→value array (index 1..MAX_LEVEL). */
export function parseStepTable(formula?: string | null): string[] | null {
  if (!formula) return null;
  const m = formula.trim().match(/^step\(\s*character_level\s*,(.*)\)$/is);
  if (!m) return null;
  const parts = m[1]
    .split(',')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  if (parts.length === 0 || parts.length % 2 !== 0) return null;
  const pairs: Array<{ t: number; v: number }> = [];
  for (let i = 0; i < parts.length; i += 2) {
    const t = Number(parts[i]);
    const v = Number(parts[i + 1]);
    if (!Number.isFinite(t) || !Number.isFinite(v)) return null;
    pairs.push({ t, v });
  }
  pairs.sort((a, b) => a.t - b.t);
  const out: string[] = new Array(MAX_LEVEL + 1).fill('');
  for (let lvl = 1; lvl <= MAX_LEVEL; lvl += 1) {
    let value = 0;
    for (const p of pairs) {
      if (lvl >= p.t) value = p.v;
    }
    out[lvl] = String(value);
  }
  return out;
}

/**
 * Serialize a level→value table (index 1..MAX_LEVEL; blank inherits the previous filled level) into a
 * `step(character_level, …)` formula. Returns '' when the table is empty / all-zero.
 */
export function buildStepFormula(values: string[]): string {
  const eff: number[] = new Array(MAX_LEVEL + 1).fill(0);
  let prev = 0;
  for (let lvl = 1; lvl <= MAX_LEVEL; lvl += 1) {
    const raw = (values[lvl] ?? '').trim();
    if (raw !== '' && Number.isFinite(Number(raw))) {
      prev = Number(raw);
    }
    eff[lvl] = prev;
  }
  const pairs: string[] = [];
  let lastEmitted = 0; // step() returns 0 below the first threshold
  for (let lvl = 1; lvl <= MAX_LEVEL; lvl += 1) {
    if (eff[lvl] !== lastEmitted) {
      pairs.push(`${lvl},${eff[lvl]}`);
      lastEmitted = eff[lvl];
    }
  }
  return pairs.length ? `step(character_level, ${pairs.join(', ')})` : '';
}
