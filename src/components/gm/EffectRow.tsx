import { Rune, ModifierTag } from '@/components/ordo';
import type { ActiveEffect } from '@/types';

interface EffectRowProps {
  effect: ActiveEffect;
  onRemove: () => void;
}

export function EffectRow({ effect, onRemove }: EffectRowProps) {
  const isBuff = effect.buffDebuff.isBuff;
  const borderColor = isBuff ? '#7a9866' : '#c9803a';
  const iconColor = isBuff ? '#7a9866' : '#c9803a';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        borderLeft: `3px solid ${borderColor}`,
        background: isBuff
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
          kind={isBuff ? 'arrow-up' : 'minus'}
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
            {effect.buffDebuff.name}
          </span>
          <span
            className="ao-overline"
            style={{
              fontSize: 8,
              color: iconColor,
              letterSpacing: '0.14em',
            }}
          >
            {isBuff ? 'BUFF' : 'DEBUFF'}
          </span>
        </div>

        {/* Modifier tags */}
        {effect.buffDebuff.targetStatName && effect.buffDebuff.modifierValue != null && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
            <ModifierTag
              stat={effect.buffDebuff.targetStatName}
              value={effect.buffDebuff.modifierValue}
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

      {/* Lift button */}
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
    </div>
  );
}
