import { useState } from 'react';
import type { CSSProperties } from 'react';
import { OrdoPanel, PanelHeader, Rune, OrdoChip, Bar } from '@/components/ordo';
import { CharStatusBadge } from '@/components/campaigns';
import { useUpdateHp } from '@/hooks/useCharacter';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import s from './HPRailPanel.module.css';

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
        icon="hp"
        tone="ember"
        right={
          <div className={s.headerRight}>
            {isDown ? (
              <CharStatusBadge status="DOWN" />
            ) : (
              <OrdoChip tone="gold" icon="healing">
                {t('cmp.hp.hale')}
              </OrdoChip>
            )}
          </div>
        }
      />

      <div className={s.body}>
        {/* Large HP display */}
        <div className={cn(s.display, isDown && s.down)}>
          <span className={s.current}>{currentHp}</span>
          <span className={s.slash}>/</span>
          <span className={s.max}>{maxHp}</span>
        </div>

        {/* HP bar */}
        <div className={s.barWrap}>
          <Bar
            value={currentHp}
            max={maxHp}
            tone={isDown ? 'ember' : 'gold'}
            height={10}
            showNumbers={false}
          />
          <div className={s.pct}>{hpPct}%</div>
        </div>

        {/* Damage / Heal controls */}
        <div className={s.controls}>
          {/* Damage button */}
          <button
            onClick={handleDamage}
            disabled={updateHp.isPending}
            className={cn('ao-actionbtn', s.hpBtn)}
            style={{ '--accent': 'var(--ember)' } as CSSProperties}
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
            className={s.amount}
          />

          {/* Heal button */}
          <button
            onClick={handleHeal}
            disabled={updateHp.isPending}
            className={cn('ao-actionbtn', s.hpBtn)}
            style={{ '--accent': '#7a9866' } as CSSProperties}
          >
            <Rune kind="plus" size={10} color="#7a9866" />
            {t('cmp.hp.heal')}
          </button>
        </div>

        {/* Open modal link */}
        {onOpenDamageHeal && (
          <button onClick={onOpenDamageHeal} className={s.advanced}>
            {t('cmp.hp.advanced')}
          </button>
        )}
      </div>
    </OrdoPanel>
  );
}
