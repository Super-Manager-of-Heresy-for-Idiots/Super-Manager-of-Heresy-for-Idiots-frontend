/**
 * Left column of the tactical workspace: battle summary + initiative-ordered
 * combatant list. Read-only in task 01 — GM management (place/HP/end-turn) and the
 * player action panel are layered on in prompts 03/04. The "on map" marker is
 * derived from the tactical token view, not stored.
 */

import { useMemo } from 'react';
import { useI18n, useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { BattleResponse } from '@/types';
import { useBattleCurrentTurn } from '@/hooks/useBattles';
import { useMapTransientStore } from '../state';
import { enterPlacement } from './combatantPlacement';
import { attackNamesFromTurn } from './tacticalSelection';
import { currentTurnCombatant, type TacticalTokenView } from './tacticalView';
import s from './TacticalBattlePage.module.css';

interface TacticalBattleLeftPanelProps {
  battle: BattleResponse | undefined;
  tacticalTokens: TacticalTokenView[];
  isGm: boolean;
  currentUserId: string | null;
  /** Placement affordances only make sense with a loaded map session and GM rights. */
  placementEnabled: boolean;
}

export function TacticalBattleLeftPanel({
  battle,
  tacticalTokens,
  isGm,
  currentUserId,
  placementEnabled,
}: TacticalBattleLeftPanelProps) {
  const t = useT();
  const { lang } = useI18n();
  const placement = useMapTransientStore((st) => st.placement);
  const setPlacement = useMapTransientStore((st) => st.setPlacement);
  const clearPlacement = useMapTransientStore((st) => st.clearPlacement);
  const attackName = useMapTransientStore((st) => st.attackName);
  const setAttackName = useMapTransientStore((st) => st.setAttackName);

  // Attack picker: only meaningful while a battle is active. The active combatant's
  // attacks come from the core current-turn detail; choosing one arms the map (the
  // next target-token click resolves it in the inspector via the core attack API).
  const isActive = battle?.status === 'ACTIVE';
  const { data: turn } = useBattleCurrentTurn(battle?.campaignId ?? '', battle?.id, isActive);
  const active = battle ? currentTurnCombatant(battle.combatants) : null;
  const controlsActive =
    !!active && (isGm || (active.type === 'CHARACTER' && active.ownerUserId === currentUserId));
  const attackNames = useMemo(() => attackNamesFromTurn(turn, lang), [lang, turn]);
  const showAttackPicker = isActive && controlsActive && attackNames.length > 0;

  const placedCombatantIds = useMemo(
    () => new Set(tacticalTokens.map((tk) => tk.linkedCombatantId).filter(Boolean) as string[]),
    [tacticalTokens],
  );

  const ordered = useMemo(
    () => (battle ? [...battle.combatants].sort((a, b) => a.turnOrder - b.turnOrder) : []),
    [battle],
  );

  if (!battle) {
    return (
      <div className={s.panelEmpty}>
        <p className="ao-italic">{t('tactical.left.noBattle')}</p>
      </div>
    );
  }

  return (
    <div className={s.left}>
      <p className={cn('ao-overline', s.leftOverline)}>{t('tactical.left.overline')}</p>
      <h4 className="ao-h4">{battle.name}</h4>

      <div className={cn('ao-row ao-gap-8', s.leftMeta)}>
        <span className={s.metaPill}>
          {t('tactical.top.round')} {battle.roundNumber}
        </span>
        <span className={s.metaPill}>
          {t(`tactical.status.${battle.status}`)}
        </span>
      </div>

      <ul className={s.combatantList}>
        {ordered.map((c) => {
          const isYou = c.type === 'CHARACTER' && !!currentUserId && c.ownerUserId === currentUserId;
          const onMap = placedCombatantIds.has(c.id);
          const hpKnown = c.currentHp != null && c.maxHp != null;
          const hpPct = hpKnown ? Math.max(0, Math.min(100, (c.currentHp! / c.maxHp!) * 100)) : 0;
          const isPlacing = placement?.combatantId === c.id;
          return (
            <li
              key={c.id}
              className={cn(s.combatantRow, c.currentTurn && s.isCurrentTurn)}
            >
              <span className={s.initBadge}>{c.initiative}</span>
              <div className={s.combatantBody}>
                <div className="ao-row ao-between ao-gap-8">
                  <span className={s.combatantName}>
                    {c.displayName}
                    {isYou && <span className={s.youTag}>{t('tactical.left.you')}</span>}
                  </span>
                  <span className={cn(s.onMapDot, onMap ? s.onMapYes : s.onMapNo)}>
                    {onMap ? t('tactical.left.placed') : t('tactical.left.unplaced')}
                  </span>
                </div>
                {hpKnown && (
                  <div className={s.hpRow}>
                    <div className={s.hpTrack}>
                      <div className={s.hpFill} style={{ width: `${hpPct}%` }} />
                    </div>
                    <span className={s.hpText}>
                      {c.currentHp}/{c.maxHp}
                    </span>
                  </div>
                )}
                {placementEnabled && !onMap && (
                  <div className={s.placeRow}>
                    {isPlacing ? (
                      <>
                        <span className={cn('ao-overline', s.placeHint)}>
                          {t('tactical.place.pickCell')}
                        </span>
                        <button
                          type="button"
                          className="ao-btn ao-btn--sm ao-btn--ghost"
                          onClick={clearPlacement}
                        >
                          {t('tactical.place.cancel')}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="ao-btn ao-btn--sm"
                        onClick={() => setPlacement(enterPlacement(c.id))}
                      >
                        {t('tactical.place.button')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {showAttackPicker && (
        <div className={s.attackPicker}>
          <p className={cn('ao-overline', s.actionOverline)}>{t('tactical.attack.overline')}</p>
          <div className={s.attackOptions}>
            {attackNames.map((name) => (
              <button
                key={name}
                type="button"
                className={cn(
                  'ao-btn ao-btn--sm ao-btn--ghost',
                  s.attackOption,
                  attackName === name && 'is-active',
                )}
                onClick={() => setAttackName(attackName === name ? null : name)}
              >
                {name}
              </button>
            ))}
          </div>
          {attackName && <p className={s.attackHint}>{t('tactical.attack.pickTarget')}</p>}
        </div>
      )}

      {isGm && (
        <p className={cn('ao-italic', s.leftHint)}>{t('tactical.left.gmHint')}</p>
      )}
    </div>
  );
}
