/**
 * Left column of the unified workspace: the combatant roster. In prep it is the
 * battle order; once active it is the initiative-ordered turn queue with the
 * acting combatant highlighted. "On map" status and the Place affordance are
 * derived from the tactical token view (GM + linked map session only). Clicking a
 * placed combatant selects its token (focuses the inspector).
 */

import { useMemo, useState } from 'react';
import { Rune } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { BattleResponse } from '@/types';
import { useMapTransientStore } from '../../state';
import { enterPlacement } from '../combatantPlacement';
import type { TacticalTokenView } from '../tacticalView';
import s from './workspace.module.css';

interface RosterRailProps {
  battle: BattleResponse;
  tacticalTokens: TacticalTokenView[];
  currentUserId: string | null;
  placementEnabled: boolean;
}

export function RosterRail({ battle, tacticalTokens, currentUserId, placementEnabled }: RosterRailProps) {
  const t = useT();
  const placement = useMapTransientStore((st) => st.placement);
  const setPlacement = useMapTransientStore((st) => st.setPlacement);
  const clearPlacement = useMapTransientStore((st) => st.clearPlacement);
  const setSelectedToken = useMapTransientStore((st) => st.setSelectedToken);

  // GM-chosen token footprint (creature size) applied to the next placement.
  const [placeSize, setPlaceSize] = useState(1);

  const isActive = battle.status === 'ACTIVE';

  const tokenByCombatant = useMemo(() => {
    const map = new Map<string, string>();
    for (const tk of tacticalTokens) {
      if (tk.linkedCombatantId) map.set(tk.linkedCombatantId, tk.tokenId);
    }
    return map;
  }, [tacticalTokens]);

  const ordered = useMemo(() => {
    const list = [...battle.combatants];
    if (isActive) return list.sort((a, b) => a.turnOrder - b.turnOrder || b.initiative - a.initiative);
    return list.sort(
      (a, b) => a.displayName.localeCompare(b.displayName) || a.instanceIndex - b.instanceIndex,
    );
  }, [battle.combatants, isActive]);

  return (
    <div className={s.roster}>
      <div className={cn('ao-row ao-between', s.rosterHead)}>
        <span className={cn('ao-overline', s.goldOverline)}>
          {isActive ? t('tactical.roster.combatTitle') : t('tactical.roster.prepTitle')}
        </span>
        <span className={s.listMeta}>{battle.combatants.length}</span>
      </div>

      {ordered.length === 0 ? (
        <p className={cn('ao-italic', s.muted)}>{t('battle.tracker.empty')}</p>
      ) : (
        <ul className={cn('ao-scroll', s.rosterList)}>
          {ordered.map((c) => {
            const isMonster = c.type === 'MONSTER';
            const isYou = c.type === 'CHARACTER' && !!currentUserId && c.ownerUserId === currentUserId;
            const tokenId = tokenByCombatant.get(c.id);
            const onMap = !!tokenId;
            const hpKnown = c.currentHp != null && c.maxHp != null;
            const hpPct = hpKnown ? Math.max(0, Math.min(100, (c.currentHp! / c.maxHp!) * 100)) : 0;
            const isPlacing = placement?.combatantId === c.id;

            return (
              <li
                key={c.id}
                className={cn(s.rosterRow, c.currentTurn && s.rosterRowActive, onMap && s.rosterRowClickable)}
                onClick={onMap ? () => setSelectedToken(tokenId!) : undefined}
              >
                <div className="ao-row ao-gap-8">
                  {isActive && (
                    <div className={s.initBadge}>
                      <span className={s.initVal}>{c.initiative}</span>
                      <span className={cn('ao-overline', s.initLbl)}>{t('battle.tracker.init')}</span>
                    </div>
                  )}
                  <div className={s.rosterIcon}>
                    <Rune
                      kind={isMonster ? 'flame' : 'helm'}
                      size={15}
                      color={isMonster ? 'var(--ember)' : 'var(--gold)'}
                    />
                  </div>
                  <div className={s.rosterMain}>
                    <span className={s.rosterName}>
                      {c.displayName}
                      {isYou && <span className={s.youTag}>{t('battle.tracker.you')}</span>}
                    </span>
                    <span className={cn(s.placedTag, onMap ? s.placedYes : s.placedNo)}>
                      {onMap ? t('tactical.left.placed') : t('tactical.left.unplaced')}
                    </span>
                  </div>
                  {hpKnown && (
                    <span className={cn('ao-num', s.rosterHp)}>
                      {c.currentHp}/{c.maxHp}
                    </span>
                  )}
                </div>

                {hpKnown && (
                  <div className={s.hpTrack}>
                    <div className={s.hpFill} style={{ width: `${hpPct}%` }} />
                  </div>
                )}

                {c.conditions && c.conditions.length > 0 && (
                  <div className={cn('ao-row ao-wrap ao-gap-4', s.condRow)}>
                    {c.conditions.map((cond) => (
                      <span
                        key={cond.conditionId}
                        className={s.condChip}
                        title={cond.sourceText ? `${cond.name} — ${cond.sourceText}` : cond.name}
                      >
                        {cond.name}
                        {cond.remainingRounds != null && (
                          <span className={s.condRounds}>{cond.remainingRounds}</span>
                        )}
                      </span>
                    ))}
                  </div>
                )}

                {placementEnabled && !onMap && (
                  <div className={s.placeRow}>
                    {isPlacing ? (
                      <>
                        <span className={cn('ao-overline', s.placeHint)}>{t('tactical.place.pickCell')}</span>
                        <button
                          type="button"
                          className="ao-btn ao-btn--sm ao-btn--ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearPlacement();
                          }}
                        >
                          {t('tactical.place.cancel')}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="ao-btn ao-btn--sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPlacement(enterPlacement(c.id, placeSize, placeSize));
                        }}
                      >
                        {t('tactical.place.button')}
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {placementEnabled && (
        <div className={s.placeSizeRow}>
          <span className={cn('ao-overline', s.fieldLabel)}>{t('tactical.place.size')}</span>
          <select
            className={s.sizeSelect}
            value={placeSize}
            onChange={(e) => setPlaceSize(Number(e.target.value))}
          >
            <option value={1}>{t('tactical.size.s1')}</option>
            <option value={2}>{t('tactical.size.s2')}</option>
            <option value={3}>{t('tactical.size.s3')}</option>
            <option value={4}>{t('tactical.size.s4')}</option>
          </select>
        </div>
      )}

      <p className={cn('ao-italic', s.rosterFootHint)}>
        {isActive ? t('tactical.roster.combatHint') : t('tactical.roster.prepHint')}
      </p>
    </div>
  );
}
