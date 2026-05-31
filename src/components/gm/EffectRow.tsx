import { Rune, ModifierTag } from '@/components/ordo';
import type { CharacterActiveEffectResponse } from '@/types';

interface EffectRowProps {
  effect: CharacterActiveEffectResponse;
  onRemove?: () => void;
}

export function EffectRow({ effect, onRemove }: EffectRowProps) {
  const borderColor = effect.isBuff ? '#7a9866' : '#c9803a';
  const iconColor = effect.isBuff ? '#7a9866' : '#c9803a';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        borderLeft: `3px solid ${borderColor}`,
        background: effect.isBuff
          ? 'rgba(122,152,102,0.04)'
          : 'rgba(201,128,58,0.04)',
        borderBottom: '1px solid var(--hairline)',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 28,
          height: 28,
          flexShrink: 0,
          border: `1px solid ${iconColor}44`,
          background: 'var(--abyss)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Rune
          kind={effect.isBuff ? 'arrow-up' : 'minus'}
          size={14}
          color={iconColor}
        />
      </div>

      {/* Name + type label */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <span
            className="ao-h5"
            style={{ fontSize: 13, color: 'var(--ink-bright)' }}
          >
            {effect.buffDebuffName}
          </span>
          <span
            className="ao-overline"
            style={{
              fontSize: 8,
              color: iconColor,
              letterSpacing: '0.14em',
            }}
          >
            {effect.isBuff ? 'BUFF' : 'DEBUFF'}
          </span>
        </div>

        {/* Modifier tags */}
        {effect.targetStatName && effect.modifierValue != null && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
            <ModifierTag
              stat={effect.targetStatName}
              value={effect.modifierValue}
              size="sm"
            />
          </div>
        )}
      </div>

      {/* Rounds counter or permanent label */}
      <div
        style={{
          flexShrink: 0,
          textAlign: 'center',
          minWidth: 60,
        }}
      >
        {effect.remainingRounds != null ? (
          <div>
            <span
              className="ao-num"
              style={{
                fontSize: 18,
                fontFamily: 'var(--font-mono)',
                color: effect.remainingRounds <= 1 ? 'var(--ember)' : 'var(--ink-bright)',
              }}
            >
              {effect.remainingRounds}
            </span>
            <div
              className="ao-overline"
              style={{ fontSize: 8, color: 'var(--ink-faint)', marginTop: 1 }}
            >
              {effect.remainingRounds === 1 ? 'ROUND' : 'ROUNDS'}
            </div>
          </div>
        ) : (
          <span
            className="ao-overline"
            style={{
              fontSize: 9,
              color: 'var(--ink-quiet)',
              letterSpacing: '0.12em',
            }}
          >
            PERMANENT
          </span>
        )}
      </div>

      {onRemove && (
        <button
          className="ao-btn ao-btn--ghost ao-btn--sm"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            flexShrink: 0,
            color: 'var(--ember)',
            borderColor: 'var(--ember)',
          }}
          onClick={onRemove}
          title="Lift this effect"
        >
          <Rune kind="x" size={10} color="currentColor" />
          Lift
        </button>
      )}
    </div>
  );
}
