import { Rune } from '@/components/ordo';
import { cn } from '@/lib/utils';
import type { ClassFeatureSummary } from '@/types';
import s from './FeatureTimeline.module.css';

export interface FeatureTimelineProps {
  features: ClassFeatureSummary[];
  /** Levels (1-based) that carry reward groups — rendered as a marker even when
   *  no feature exists at that level, to surface data-completeness gaps. */
  rewardLevels?: number[];
  /** Levels flagged as having an unknown grant type. */
  warnLevels?: number[];
  emptyLabel?: string;
}

/**
 * Vertical per-level timeline of class features. Optional reward / warning markers
 * let callers (e.g. the dev content viewer) show data completeness at a glance.
 */
export function FeatureTimeline({
  features,
  rewardLevels = [],
  warnLevels = [],
  emptyLabel = 'Нет умений',
}: FeatureTimelineProps) {
  const byLevel = new Map<number, ClassFeatureSummary[]>();
  for (const f of features) {
    const lvl = f.level ?? 0;
    const bucket = byLevel.get(lvl) ?? [];
    bucket.push(f);
    byLevel.set(lvl, bucket);
  }
  for (const bucket of byLevel.values()) {
    bucket.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }

  const rewardSet = new Set(rewardLevels);
  const warnSet = new Set(warnLevels);
  const levels = [...new Set([...byLevel.keys(), ...rewardLevels, ...warnLevels])].sort(
    (a, b) => a - b,
  );

  if (levels.length === 0) {
    return <span className={cn('ao-italic', s.empty)}>{emptyLabel}</span>;
  }

  return (
    <div className={s.timeline}>
      {levels.map((lvl) => {
        const items = byLevel.get(lvl) ?? [];
        return (
          <div key={lvl} className={s.row}>
            <span className={cn(s.level, warnSet.has(lvl) && s.levelWarn)}>{lvl}</span>
            <div className={s.body}>
              {items.length > 0 ? (
                items.map((f) => (
                  <div key={f.id} className={s.feature}>
                    <span className="ao-h6">{f.title}</span>
                    {f.description && <span className="ao-italic ao-codex">{f.description}</span>}
                  </div>
                ))
              ) : (
                <span className="ao-italic ao-codex">
                  {rewardSet.has(lvl) ? 'Только награды (без именованного умения)' : '—'}
                </span>
              )}
              <div className="ao-row ao-gap-6 ao-wrap">
                {rewardSet.has(lvl) && (
                  <span className={cn(s.tag, s.tagReward)}>
                    <Rune kind="scroll" size={10} color="var(--arcane)" /> награды
                  </span>
                )}
                {warnSet.has(lvl) && (
                  <span className={cn(s.tag, s.tagWarn)}>
                    <Rune kind="diamond" size={10} color="var(--ember)" /> неизвестный grant
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
