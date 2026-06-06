import { useState } from 'react';
import { OrdoPanel, PanelHeader, Rune, OrdoChip, Bar } from '@/components/ordo';
import { CharStatusBadge } from '@/components/campaigns';
import { useUpdateHp } from '@/hooks/useCharacter';
import { useT } from '@/i18n/I18nContext';

interface HPRailPanelProps {
  characterId: string;
  currentHp: number;
  maxHp: number;
  status?: string;
  onOpenDamageHeal?: () => void;
}

export function HPRailPanel({
  characterId,
  currentHp,
  maxHp,
  status,
  onOpenDamageHeal,
}: HPRailPanelProps) {
  const t = useT();
  const [amount, setAmount] = useState(1);
  const updateHp = useUpdateHp();

  const isDown = status === 'DOWN' || currentHp <= 0;
  const hpPct = maxHp > 0 ? Math.round((currentHp / maxHp) * 100) : 0;

  function handleDamage() {
    if (amount <= 0) return;
    updateHp.mutate({ id: characterId, data: { amount: -amount } });
  }

  function handleHeal() {
    if (amount <= 0) return;
    updateHp.mutate({ id: characterId, data: { amount } });
  }

  return (
    <OrdoPanel frame>
      <PanelHeader
        title={t('cmp.hp.title')}
        glyph="flame"
        tone="ember"
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isDown ? (
              <CharStatusBadge status="DOWN" />
            ) : (
              <OrdoChip tone="gold" glyph="cir-dot">
                {t('cmp.hp.hale')}
              </OrdoChip>
            )}
          </div>
        }
      />

      <div style={{ padding: 16 }}>
        {/* Large HP display */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'center',
            gap: 4,
            marginBottom: 12,
          }}
        >
          <span
            style={{
              fontSize: 48,
              fontFamily: 'var(--font-display)',
              color: isDown ? 'var(--ember)' : 'var(--ink-bright)',
              lineHeight: 1,
            }}
          >
            {currentHp}
          </span>
          <span
            style={{
              fontSize: 18,
              color: 'var(--ink-faint)',
              fontFamily: 'var(--font-display)',
            }}
          >
            /
          </span>
          <span
            style={{
              fontSize: 24,
              fontFamily: 'var(--font-display)',
              color: 'var(--ink-quiet)',
              lineHeight: 1,
            }}
          >
            {maxHp}
          </span>
        </div>

        {/* HP bar */}
        <div style={{ marginBottom: 16 }}>
          <Bar
            value={currentHp}
            max={maxHp}
            tone={isDown ? 'ember' : 'gold'}
            height={10}
            showNumbers={false}
          />
          <div
            style={{
              textAlign: 'center',
              fontSize: 11,
              color: 'var(--ink-faint)',
              marginTop: 4,
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            {hpPct}%
          </div>
        </div>

        {/* Damage / Heal controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            justifyContent: 'center',
          }}
        >
          {/* Damage button */}
          <button
            onClick={handleDamage}
            disabled={updateHp.isPending}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: 'var(--ember)18',
              border: '1px solid var(--ember)44',
              color: 'var(--ember)',
              fontSize: 11,
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase' as const,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              opacity: updateHp.isPending ? 0.5 : 1,
            }}
          >
            <Rune kind="minus" size={10} color="var(--ember)" />
            {t('cmp.hp.damage')}
          </button>

          {/* Amount input */}
          <input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
            style={{
              width: 56,
              textAlign: 'center',
              padding: '8px 4px',
              background: 'var(--abyss)',
              border: '1px solid var(--rule)',
              color: 'var(--ink-bright)',
              fontSize: 18,
              fontFamily: 'var(--font-mono, monospace)',
            }}
          />

          {/* Heal button */}
          <button
            onClick={handleHeal}
            disabled={updateHp.isPending}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: 'rgba(122,152,102,0.1)',
              border: '1px solid rgba(122,152,102,0.27)',
              color: '#7a9866',
              fontSize: 11,
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase' as const,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              opacity: updateHp.isPending ? 0.5 : 1,
            }}
          >
            <Rune kind="plus" size={10} color="#7a9866" />
            {t('cmp.hp.heal')}
          </button>
        </div>

        {/* Open modal link */}
        {onOpenDamageHeal && (
          <button
            onClick={onOpenDamageHeal}
            style={{
              display: 'block',
              width: '100%',
              marginTop: 12,
              background: 'none',
              border: 'none',
              color: 'var(--ink-faint)',
              fontSize: 11,
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.08em',
              cursor: 'pointer',
              textDecoration: 'underline',
              textUnderlineOffset: 3,
            }}
          >
            {t('cmp.hp.advanced')}
          </button>
        )}
      </div>
    </OrdoPanel>
  );
}
