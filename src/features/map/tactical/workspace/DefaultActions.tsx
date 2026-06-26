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
import type { MovementConfig } from './movement';
import s from './workspace.module.css';

interface DefaultActionsProps {
  /** Movement config for the acting combatant; null when the viewer can't act. */
  movement: MovementConfig | null;
}

export function DefaultActions({ movement }: DefaultActionsProps) {
  const t = useT();
  const combatAction = useMapTransientStore((st) => st.combatAction);
  const setCombatAction = useMapTransientStore((st) => st.setCombatAction);
  const clearCombatAction = useMapTransientStore((st) => st.clearCombatAction);

  if (!movement) return null;

  const canWalk = movement.walkRangeCells > 0;
  const canFly = movement.flyRangeCells > 0;
  const isMove = combatAction?.type === 'MOVE' && combatAction.mode === 'WALK';
  const isFly = combatAction?.type === 'MOVE' && combatAction.mode === 'FLY';
  const isPush = combatAction?.type === 'PUSH';

  const armedHint = isPush
    ? t('tactical.actions.pushHint')
    : isFly
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
        <button
          type="button"
          className={cn(s.actionChip, isPush && s.actionChipActive)}
          onClick={() => setCombatAction(isPush ? null : { type: 'PUSH' })}
        >
          <Rune kind="shield" size={12} color="currentColor" />
          {t('tactical.actions.push')}
        </button>
      </div>
      {armedHint && (
        <div className={s.armedRow}>
          <span className={cn('ao-italic', s.hint)}>{armedHint}</span>
          <button type="button" className="ao-btn ao-btn--sm ao-btn--ghost" onClick={clearCombatAction}>
            {t('tactical.actions.cancel')}
          </button>
        </div>
      )}
    </div>
  );
}
