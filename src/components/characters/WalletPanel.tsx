import { OrdoPanel, PanelHeader, Rune, OrdoDivider } from '@/components/ordo';
import { useUpdateWallet } from '@/hooks/useCharacter';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { WalletEntry } from '@/types';
import s from './WalletPanel.module.css';

interface WalletPanelProps {
  characterId: string;
  campaignId?: string;
  wallet: WalletEntry[];
  /** When false, hide the +/- controls and "add currency" CTA (read-only viewers). */
  canEdit?: boolean;
  onAddCurrency?: () => void;
}

export function WalletPanel({ characterId, campaignId, wallet, canEdit = true, onAddCurrency }: WalletPanelProps) {
  const t = useT();
  const updateWallet = useUpdateWallet();

  const totalGoldEquivalent = wallet.reduce(
    (sum, w) => sum + (w.goldEquivalent ?? 0),
    0,
  );

  function handleDelta(currencyTypeId: string, delta: number) {
    // `amount` is a signed delta: +1 credits, -1 debits.
    updateWallet.mutate({
      campaignId,
      id: characterId,
      currencyTypeId,
      data: { currencyTypeId, amount: delta },
    });
  }

  return (
    <OrdoPanel frame>
      <PanelHeader
        title={t('cmp.wallet.title')}
        glyph="coin"
        right={
          <span className={s.headerAmount}>
            {t('cmp.wallet.gp', { amount: totalGoldEquivalent.toLocaleString() })}
          </span>
        }
      />

      <div className={s.list}>
        {wallet.filter((entry) => entry.amount !== 0).map((entry, idx, visible) => (
          <div key={entry.currencyTypeId}>
            <div className={s.row}>
              {/* Currency name + gold equivalent */}
              <div className={s.info}>
                <div className={s.name}>{entry.currencyName}</div>
                <div className={cn('ao-codex', s.gpEq)}>
                  {t('cmp.wallet.gp', { amount: (entry.goldEquivalent ?? 0).toLocaleString() })}
                </div>
              </div>

              {/* +/- buttons and amount */}
              <div className={s.controls}>
                {canEdit && (
                  <button
                    onClick={() => handleDelta(entry.currencyTypeId, -1)}
                    disabled={updateWallet.isPending}
                    className="ao-stepbtn"
                    aria-label={t('cmp.wallet.decrease', { name: entry.currencyName })}
                  >
                    <Rune kind="minus" size={10} color="var(--ink-quiet)" />
                  </button>
                )}

                <span className={s.amount}>{entry.amount.toLocaleString()}</span>

                {canEdit && (
                  <button
                    onClick={() => handleDelta(entry.currencyTypeId, 1)}
                    disabled={updateWallet.isPending}
                    className="ao-stepbtn"
                    aria-label={t('cmp.wallet.increase', { name: entry.currencyName })}
                  >
                    <Rune kind="plus" size={10} color="var(--ink-quiet)" />
                  </button>
                )}
              </div>
            </div>

            {idx < visible.length - 1 && (
              <OrdoDivider glyph="diamond" color="var(--rule)" />
            )}
          </div>
        ))}

        {wallet.length === 0 && (
          <div className={s.empty}>{t('cmp.wallet.empty')}</div>
        )}
      </div>

      {/* Add Currency ghost button */}
      {canEdit && onAddCurrency && (
        <div className={s.addWrap}>
          <button onClick={onAddCurrency} className={s.addBtn}>
            <Rune kind="plus" size={10} color="var(--ink-quiet)" />
            {t('cmp.wallet.addCurrency')}
          </button>
        </div>
      )}
    </OrdoPanel>
  );
}
