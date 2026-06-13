import type { CSSProperties } from 'react';
import { Rune, ModifierTag } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { CharacterActiveEffectResponse } from '@/types';
import s from './EffectRow.module.css';

interface EffectRowProps {
  effect: CharacterActiveEffectResponse;
  onRemove?: () => void;
}

export function EffectRow({ effect, onRemove }: EffectRowProps) {
  const t = useT();
  const tone = effect.isBuff ? '#7a9866' : '#c9803a';

  return (
    <div className={s.row} style={{ '--tone': tone } as CSSProperties}>
      <div className={s.icon}>
        <Rune kind={effect.isBuff ? 'arrow-up' : 'minus'} size={14} color={tone} />
      </div>

      <div className={s.main}>
        <div className={s.nameRow}>
          <span className={cn('ao-h5', s.name)}>{effect.buffDebuffName}</span>
          <span className={cn('ao-overline', s.typeLabel)}>
            {effect.isBuff ? t('cmp.effect.buff') : t('cmp.effect.debuff')}
          </span>
        </div>

        {effect.targetStatName && effect.modifierValue != null && (
          <div className={s.tags}>
            <ModifierTag
              stat={effect.targetStatName}
              value={effect.modifierValue}
              size="sm"
            />
          </div>
        )}
      </div>

      <div className={s.rounds}>
        {effect.remainingRounds != null ? (
          <div>
            <span className={cn('ao-num', s.roundNum, effect.remainingRounds <= 1 && s.urgent)}>
              {effect.remainingRounds}
            </span>
            <div className={cn('ao-overline', s.roundLabel)}>
              {effect.remainingRounds === 1 ? t('cmp.effect.round') : t('cmp.effect.rounds')}
            </div>
          </div>
        ) : (
          <span className={cn('ao-overline', s.perm)}>{t('cmp.effect.permanent')}</span>
        )}
      </div>

      {onRemove && (
        <button
          className={cn('ao-btn ao-btn--ghost ao-btn--sm', s.removeBtn)}
          onClick={onRemove}
          title={t('cmp.effect.liftTitle')}
        >
          <Rune kind="x" size={10} color="currentColor" />
          {t('cmp.effect.lift')}
        </button>
      )}
    </div>
  );
}
