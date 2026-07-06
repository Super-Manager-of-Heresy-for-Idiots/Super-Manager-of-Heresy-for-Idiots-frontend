import { useState } from 'react';
import { useT } from '@/i18n/I18nContext';
import { useHitDice, useSpendHitDice } from '@/hooks/useCharacter';

interface Props {
  campaignId: string;
  characterId: string;
  /** Owner / GM / admin may spend; others see a read-only pool. */
  canManage: boolean;
}

/**
 * A character's hit dice (per die size). On a short rest, spend N dice of a size and enter the rolled
 * total — the server heals that plus the CON modifier. A long rest regains half automatically.
 */
export function HitDicePanel({ campaignId, characterId, canManage }: Props) {
  const t = useT();
  const { data: dice } = useHitDice(campaignId, characterId);
  const spend = useSpendHitDice();
  const [inputs, setInputs] = useState<Record<number, { count: string; rolled: string }>>({});

  const list = dice ?? [];
  if (list.length === 0) {
    return null;
  }

  return (
    <div className="ao-col ao-gap-8">
      <div className="ao-overline">{t('camp2.folio.hitDice.title')}</div>
      {list.map((h) => {
        const row = inputs[h.die] ?? { count: '1', rolled: '' };
        const set = (patch: Partial<typeof row>) => setInputs({ ...inputs, [h.die]: { ...row, ...patch } });
        return (
          <div key={h.die} className="ao-row ao-between ao-gap-8 ao-wrap">
            <span className="ao-num">d{h.die}: {h.remaining} / {h.total}</span>
            {canManage && (
              <div className="ao-row ao-gap-6">
                <input
                  className="ao-input"
                  type="number"
                  min={1}
                  max={h.remaining}
                  value={row.count}
                  aria-label={t('camp2.folio.hitDice.count')}
                  onChange={(e) => set({ count: e.target.value })}
                />
                <input
                  className="ao-input"
                  type="number"
                  min={0}
                  value={row.rolled}
                  placeholder={t('camp2.folio.hitDice.rolled')}
                  aria-label={t('camp2.folio.hitDice.rolled')}
                  onChange={(e) => set({ rolled: e.target.value })}
                />
                <button
                  className="ao-btn ao-btn--primary ao-btn--sm"
                  disabled={spend.isPending || h.remaining < 1}
                  onClick={() =>
                    spend.mutate({
                      campaignId,
                      characterId,
                      die: h.die,
                      count: Math.max(1, Number(row.count) || 1),
                      rolledTotal: Math.max(0, Number(row.rolled) || 0),
                    })
                  }
                >
                  {t('camp2.folio.hitDice.spend')}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
