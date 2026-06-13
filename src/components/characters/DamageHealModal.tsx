import { useState } from 'react';
import type { CSSProperties } from 'react';
import { ModalScene, Bar } from '@/components/ordo';
import { useUpdateHp } from '@/hooks/useCharacter';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import s from './DamageHealModal.module.css';

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
  const t = useT();
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
      title={isDamage ? t('cmp.dmgHeal.applyDamage') : t('cmp.dmgHeal.applyHealing')}
      rune={isDamage ? 'minus' : 'plus'}
      tone={accentColor}
      danger={isDamage}
      width={420}
      footer={
        <div className={s.footer} style={{ '--accent': accentColor } as CSSProperties}>
          <button onClick={() => onOpenChange(false)} className={s.cancel}>
            {t('common.cancel')}
          </button>
          <button
            onClick={handleApply}
            disabled={amount <= 0 || updateHp.isPending}
            className={s.apply}
          >
            {updateHp.isPending ? t('cmp.dmgHeal.applying') : t('cmp.dmgHeal.apply')}
          </button>
        </div>
      }
    >
      {/* Mode toggle */}
      <div className={s.toggle}>
        <button
          onClick={() => setMode('damage')}
          className={cn(s.tab, isDamage && s.active)}
          style={{ '--tab-accent': 'var(--ember)' } as CSSProperties}
        >
          {t('cmp.dmgHeal.damage')}
        </button>
        <button
          onClick={() => setMode('heal')}
          className={cn(s.tab, !isDamage && s.active)}
          style={{ '--tab-accent': '#7a9866' } as CSSProperties}
        >
          {t('cmp.dmgHeal.heal')}
        </button>
      </div>

      {/* Amount input */}
      <div className={s.amountWrap} style={{ '--accent': accentColor } as CSSProperties}>
        <label className={cn('ao-overline', s.amountLabel)}>{t('cmp.dmgHeal.amount')}</label>
        <input
          type="number"
          min={0}
          value={amount || ''}
          onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
          placeholder="0"
          className={s.amountInput}
        />
      </div>

      {/* Preview */}
      <div className={s.preview}>
        <div className={cn('ao-overline', s.previewLabel)}>{t('cmp.dmgHeal.preview')}</div>

        {/* Current -> Projected */}
        <div className={s.projRow}>
          <span className={s.cur}>{currentHp}</span>
          <span className={s.arrow}>&rarr;</span>
          <span
            className={s.proj}
            style={{
              color:
                projected < currentHp
                  ? 'var(--ember)'
                  : projected > currentHp
                    ? '#7a9866'
                    : 'var(--ink-bright)',
            }}
          >
            {projected}
          </span>
          <span className={s.projMax}>/ {maxHp}</span>
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
