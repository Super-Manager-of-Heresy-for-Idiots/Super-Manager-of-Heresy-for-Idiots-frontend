import { useState } from 'react';
import { ModalScene, Bar } from '@/components/ordo';
import { useUpdateHp } from '@/hooks/useCharacterV2';

type Mode = 'damage' | 'heal';

interface DamageHealModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  campaignId: string;
  characterId: string;
  currentHp: number;
  maxHp: number;
}

export function DamageHealModal({
  open,
  onOpenChange,
  campaignId,
  characterId,
  currentHp,
  maxHp,
}: DamageHealModalProps) {
  const [mode, setMode] = useState<Mode>('damage');
  const [amount, setAmount] = useState(0);
  const updateHp = useUpdateHp();

  const delta = mode === 'damage' ? -amount : amount;
  const projected = Math.max(0, Math.min(maxHp, currentHp + delta));

  function handleApply() {
    if (amount <= 0) return;
    updateHp.mutate(
      { campaignId, characterId, data: { amount: delta } },
      {
        onSuccess: () => {
          setAmount(0);
          onOpenChange(false);
        },
      },
    );
  }

  const isDamage = mode === 'damage';
  const accentColor = isDamage ? 'var(--ember)' : '#7a9866';

  return (
    <ModalScene
      open={open}
      onOpenChange={onOpenChange}
      title={isDamage ? 'Apply Damage' : 'Apply Healing'}
      rune={isDamage ? 'minus' : 'plus'}
      tone={accentColor}
      danger={isDamage}
      width={420}
      footer={
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => onOpenChange(false)}
            style={{
              flex: 1,
              padding: '10px 16px',
              background: 'none',
              border: '1px solid var(--rule)',
              color: 'var(--ink-quiet)',
              fontSize: 12,
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase' as const,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={amount <= 0 || updateHp.isPending}
            style={{
              flex: 1,
              padding: '10px 16px',
              background: `${accentColor}22`,
              border: `1px solid ${accentColor}66`,
              color: accentColor,
              fontSize: 12,
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase' as const,
              cursor: amount > 0 && !updateHp.isPending ? 'pointer' : 'not-allowed',
              opacity: amount > 0 && !updateHp.isPending ? 1 : 0.5,
            }}
          >
            {updateHp.isPending ? 'Applying...' : 'Apply'}
          </button>
        </div>
      }
    >
      {/* Mode toggle */}
      <div
        style={{
          display: 'flex',
          marginBottom: 24,
          border: '1px solid var(--rule)',
          overflow: 'hidden',
        }}
      >
        <button
          onClick={() => setMode('damage')}
          style={{
            flex: 1,
            padding: '10px 0',
            background: isDamage ? 'var(--ember)18' : 'transparent',
            border: 'none',
            borderRight: '1px solid var(--rule)',
            color: isDamage ? 'var(--ember)' : 'var(--ink-quiet)',
            fontSize: 12,
            fontFamily: 'var(--font-display)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase' as const,
            cursor: 'pointer',
          }}
        >
          Damage
        </button>
        <button
          onClick={() => setMode('heal')}
          style={{
            flex: 1,
            padding: '10px 0',
            background: !isDamage ? 'rgba(122,152,102,0.1)' : 'transparent',
            border: 'none',
            color: !isDamage ? '#7a9866' : 'var(--ink-quiet)',
            fontSize: 12,
            fontFamily: 'var(--font-display)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase' as const,
            cursor: 'pointer',
          }}
        >
          Heal
        </button>
      </div>

      {/* Amount input */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <label
          className="ao-overline"
          style={{
            display: 'block',
            color: accentColor,
            letterSpacing: '0.18em',
            marginBottom: 10,
          }}
        >
          Amount
        </label>
        <input
          type="number"
          min={0}
          value={amount || ''}
          onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
          placeholder="0"
          style={{
            width: 120,
            textAlign: 'center',
            padding: '12px 8px',
            background: 'var(--abyss)',
            border: `1px solid ${accentColor}44`,
            color: 'var(--ink-bright)',
            fontSize: 36,
            fontFamily: 'var(--font-mono, monospace)',
            lineHeight: 1,
          }}
        />
      </div>

      {/* Preview */}
      <div
        style={{
          background: 'var(--abyss)',
          border: '1px solid var(--rule)',
          padding: 16,
        }}
      >
        <div
          className="ao-overline"
          style={{
            color: 'var(--ink-faint)',
            letterSpacing: '0.16em',
            marginBottom: 12,
          }}
        >
          Preview
        </div>

        {/* Current -> Projected */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 12,
          }}
        >
          <span
            style={{
              fontSize: 24,
              fontFamily: 'var(--font-display)',
              color: 'var(--ink-quiet)',
            }}
          >
            {currentHp}
          </span>
          <span style={{ color: 'var(--ink-faint)', fontSize: 16 }}>&rarr;</span>
          <span
            style={{
              fontSize: 32,
              fontFamily: 'var(--font-display)',
              color: projected < currentHp ? 'var(--ember)' : projected > currentHp ? '#7a9866' : 'var(--ink-bright)',
              lineHeight: 1,
            }}
          >
            {projected}
          </span>
          <span
            style={{
              fontSize: 14,
              color: 'var(--ink-faint)',
              fontFamily: 'var(--font-display)',
            }}
          >
            / {maxHp}
          </span>
        </div>

        {/* Preview bar */}
        <Bar
          value={projected}
          max={maxHp}
          tone={projected <= 0 ? 'ember' : 'gold'}
          height={8}
          showNumbers={false}
        />
      </div>
    </ModalScene>
  );
}
