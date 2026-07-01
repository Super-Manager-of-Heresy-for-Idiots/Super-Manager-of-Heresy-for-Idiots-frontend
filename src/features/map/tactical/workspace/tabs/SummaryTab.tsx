/**
 * GM "Сводка" tab — encounter stats, manual XP override, and the assembled enemy
 * group. While ASSEMBLING the GM can remove monsters and start the battle; once
 * ACTIVE the group is read-only (start/remove are server-gated) and only the XP
 * override stays editable (allowed until COMPLETED).
 */

import { useEffect, useMemo, useState } from 'react';
import { Rune } from '@/components/ordo';
import {
  useOverrideBattleXp,
  useRemoveCombatant,
  useStartBattle,
} from '@/hooks/useBattles';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { BattleResponse } from '@/types';
import s from '../workspace.module.css';

interface SummaryTabProps {
  campaignId: string;
  battle: BattleResponse;
}

export function SummaryTab({ campaignId, battle }: SummaryTabProps) {
  const t = useT();
  const overrideXp = useOverrideBattleXp();
  const removeCombatant = useRemoveCombatant();
  const startBattle = useStartBattle();

  const isAssembling = battle.status === 'ASSEMBLING';
  const displayedXp = battle.overrideXp ?? battle.totalXp;
  const hasOverride = battle.overrideXp != null;
  const [xpDraft, setXpDraft] = useState(String(displayedXp));

  useEffect(() => {
    setXpDraft(String(displayedXp));
  }, [displayedXp]);

  const group = useMemo(
    () =>
      battle.combatants
        .filter((c) => c.type === 'MONSTER')
        .sort(
          (a, b) =>
            a.displayName.localeCompare(b.displayName) || a.instanceIndex - b.instanceIndex,
        ),
    [battle.combatants],
  );

  const commitXp = () => {
    const n = parseInt(xpDraft, 10);
    if (!Number.isFinite(n) || n < 0) {
      setXpDraft(String(displayedXp));
      return;
    }
    if (n === displayedXp) return;
    overrideXp.mutate({ campaignId, battleId: battle.id, data: { overrideXp: n } });
  };
  const resetXp = () =>
    overrideXp.mutate({ campaignId, battleId: battle.id, data: { overrideXp: null } });
  const remove = (combatantId: string) =>
    removeCombatant.mutate({ campaignId, battleId: battle.id, combatantId });
  const start = () => {
    if (group.length === 0) return;
    startBattle.mutate({ campaignId, battleId: battle.id });
  };

  return (
    <div className={s.tabPad}>
      <p className={cn('ao-overline', s.goldOverline)}>{t('battle.assembly.title')}</p>
      <p className={cn('ao-italic', s.tabSub)}>{battle.name}</p>

      <div className={s.statRow}>
        <div className={s.statCard}>
          <div className={cn(s.statVal, s.valArcane)}>{battle.averageDanger.toFixed(1)}</div>
          <div className={s.statLbl}>{t('battle.stats.avgDanger')}</div>
        </div>
        <div className={s.statCard}>
          <div className={cn(s.statVal, s.valGold)}>{displayedXp.toLocaleString()}</div>
          <div className={s.statLbl}>{t('battle.stats.totalXp')}</div>
        </div>
        <div className={s.statCard}>
          <div className={s.statVal}>{battle.monsterCount}</div>
          <div className={s.statLbl}>{t('battle.stats.monsters')}</div>
        </div>
      </div>

      <div className={s.block}>
        <label className={cn('ao-overline', s.fieldLabel)} htmlFor="tactical-xp">
          {t('battle.stats.xpOverride')}
        </label>
        <div className={s.inlineRow}>
          <input
            id="tactical-xp"
            className={cn('ao-input', s.numFieldWide)}
            inputMode="numeric"
            value={xpDraft}
            onChange={(e) => setXpDraft(e.target.value.replace(/[^0-9]/g, ''))}
            onBlur={commitXp}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitXp();
            }}
          />
          {hasOverride ? (
            <button
              className="ao-btn ao-btn--ghost ao-btn--sm"
              onClick={resetXp}
              disabled={overrideXp.isPending}
            >
              {t('battle.stats.resetXp')}
            </button>
          ) : (
            <span className="ao-chip">{t('battle.stats.xpAuto')}</span>
          )}
        </div>
        <div className={s.hint}>{t('battle.stats.xpEditHint')}</div>
      </div>

      <div className={cn('ao-row ao-between', s.block, s.squadHead)}>
        <span className={cn('ao-overline', s.goldOverline)}>{t('battle.assembly.groupTitle')}</span>
        <span className={s.listMeta}>{group.length}</span>
      </div>
      {group.length === 0 ? (
        <div className={s.muted}>{t('battle.assembly.empty')}</div>
      ) : (
        <div>
          {group.map((c) => (
            <div key={c.id} className={s.listRow}>
              <Rune kind="flame" size={14} color="var(--ember)" />
              <div className={s.listMain}>
                <div className={s.listName}>{c.displayName}</div>
                {c.maxHp != null && (
                  <div className={s.listMeta}>
                    {t('battle.tracker.hp')} {c.maxHp}
                  </div>
                )}
              </div>
              {isAssembling && (
                <button
                  className="ao-btn ao-btn--ghost ao-btn--sm"
                  onClick={() => remove(c.id)}
                  disabled={removeCombatant.isPending}
                  title={t('battle.assembly.remove')}
                >
                  <Rune kind="x" size={10} color="currentColor" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {isAssembling && (
        <div className={s.block}>
          <button
            className="ao-btn ao-btn--primary ao-btn--block"
            onClick={start}
            disabled={group.length === 0 || startBattle.isPending}
          >
            <Rune kind="sword" size={14} color="currentColor" />
            <span className={s.ml6}>{t('battle.assembly.confirmStart')}</span>
          </button>
          {group.length === 0 && <div className={cn(s.muted, s.mt8)}>{t('battle.assembly.needMonsters')}</div>}
        </div>
      )}
    </div>
  );
}
