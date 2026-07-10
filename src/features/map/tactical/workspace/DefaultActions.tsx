/**
 * Default combat actions every creature has, independent of class/race abilities:
 * «Сходить» (walk), «Перелететь» (fly, only with a fly speed) and «Оттолкнуть»
 * (shove). They ARM an intent in the transient map store; the map center then drives
 * targeting + confirmation. Rendered above the class/race attacks in the player's
 * Character tab and the GM's Turn tab, so it augments — never replaces — them.
 */

import { Rune } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import { useMapTransientStore } from '../../state';
import type { TacticalTokenView } from '../tacticalView';
import { stepDistance, type MovementConfig } from './movement';
import s from './workspace.module.css';

interface DefaultActionsProps {
  /** Movement config for the acting combatant; null when the viewer can't act. */
  movement: MovementConfig | null;
  /** Placed tokens — used to warn about opportunity attacks when leaving an enemy's reach (Phase 2.8). */
  tacticalTokens?: TacticalTokenView[];
}

/**
 * Enemies the mover would provoke by leaving their reach (5 ft / one cell) on the staged move.
 * A pure hint — the OA itself is a server-resolved reaction; reach weapons (10 ft) are not modelled here.
 */
function opportunityProvokers(
  tokens: TacticalTokenView[],
  activeTokenId: string,
  dest: { gridX: number; gridY: number },
): string[] {
  const mover = tokens.find((tk) => tk.tokenId === activeTokenId);
  const side = mover?.combatant?.type;
  if (!mover || !side) return [];
  const origin = { gridX: mover.gridX, gridY: mover.gridY };
  return tokens
    .filter(
      (tk) =>
        tk.combatant?.type &&
        tk.combatant.type !== side &&
        (tk.combatant.currentHp == null || tk.combatant.currentHp > 0) &&
        stepDistance(origin, { gridX: tk.gridX, gridY: tk.gridY }) <= 1 &&
        stepDistance(dest, { gridX: tk.gridX, gridY: tk.gridY }) > 1,
    )
    .map((tk) => tk.displayName);
}

export function DefaultActions({ movement, tacticalTokens }: DefaultActionsProps) {
  const t = useT();
  const combatAction = useMapTransientStore((st) => st.combatAction);
  const setCombatAction = useMapTransientStore((st) => st.setCombatAction);
  const clearCombatAction = useMapTransientStore((st) => st.clearCombatAction);
  const movePending = useMapTransientStore((st) => st.movePending);

  const oaProvokers =
    movement && movePending && tacticalTokens
      ? opportunityProvokers(tacticalTokens, movement.activeTokenId, movePending)
      : [];

  if (!movement) return null;

  const canWalk = movement.walkRangeCells > 0;
  const canFly = movement.flyRangeCells > 0;
  const isMove = combatAction?.type === 'MOVE' && combatAction.mode === 'WALK';
  const isFly = combatAction?.type === 'MOVE' && combatAction.mode === 'FLY';

  const armedHint = isFly
    ? t('tactical.actions.flyHint')
    : isMove
      ? t('tactical.actions.moveHint')
      : null;

  return (
    <div className={s.block}>
      <div className={cn('ao-overline', s.fieldLabel)}>{t('tactical.actions.title')}</div>
      <div className={s.actionGrid}>
        {canWalk && (
          <button
            type="button"
            className={cn(s.actionChip, isMove && s.actionChipActive)}
            onClick={() => setCombatAction(isMove ? null : { type: 'MOVE', mode: 'WALK' })}
          >
            <Rune kind="arrow-r" size={12} color="currentColor" />
            {t('tactical.actions.move')}
          </button>
        )}
        {canFly && (
          <button
            type="button"
            className={cn(s.actionChip, isFly && s.actionChipActive)}
            onClick={() => setCombatAction(isFly ? null : { type: 'MOVE', mode: 'FLY' })}
          >
            <Rune kind="arrow-up" size={12} color="currentColor" />
            {t('tactical.actions.fly')}
          </button>
        )}
      </div>
      {armedHint && (
        <div className={s.armedRow}>
          <span className={cn('ao-italic', s.hint)}>{armedHint}</span>
          <button type="button" className="ao-btn ao-btn--sm ao-btn--ghost" onClick={clearCombatAction}>
            {t('tactical.actions.cancel')}
          </button>
        </div>
      )}
      {oaProvokers.length > 0 && (
        <div className={cn('ao-italic', s.oaWarn)}>
          ⚔ {t('tactical.actions.oaWarn', { names: oaProvokers.join(', ') })}
        </div>
      )}
    </div>
  );
}
