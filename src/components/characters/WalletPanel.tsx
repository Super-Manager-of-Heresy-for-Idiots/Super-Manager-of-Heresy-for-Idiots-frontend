import { OrdoPanel, PanelHeader, Rune, OrdoDivider } from '@/components/ordo';
import { useUpdateWallet } from '@/hooks/useCharacter';
import { useT } from '@/i18n/I18nContext';
import type { WalletEntry } from '@/types';

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
          <span
            style={{
              fontSize: 13,
              fontFamily: 'var(--font-display)',
              color: 'var(--gold)',
              letterSpacing: '0.04em',
            }}
          >
            {t('cmp.wallet.gp', { amount: totalGoldEquivalent.toLocaleString() })}
          </span>
        }
      />

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 0 }}>
        {wallet.filter((entry) => entry.amount !== 0).map((entry, idx, visible) => (
          <div key={entry.currencyTypeId}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 0',
              }}
            >
              {/* Currency name + gold equivalent */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    color: 'var(--ink-bright)',
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '0.04em',
                  }}
                >
                  {entry.currencyName}
                </div>
                <div className="ao-codex" style={{ fontSize: 10, color: 'var(--ink-faint)', marginTop: 2 }}>
                  {t('cmp.wallet.gp', { amount: (entry.goldEquivalent ?? 0).toLocaleString() })}
                </div>
              </div>

              {/* +/- buttons and amount */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {canEdit && (
                  <button
                    onClick={() => handleDelta(entry.currencyTypeId, -1)}
                    disabled={updateWallet.isPending}
                    style={{
                      width: 28,
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'var(--abyss)',
                      border: '1px solid var(--rule)',
                      cursor: 'pointer',
                      opacity: updateWallet.isPending ? 0.5 : 1,
                    }}
                    aria-label={t('cmp.wallet.decrease', { name: entry.currencyName })}
                  >
                    <Rune kind="minus" size={10} color="var(--ink-quiet)" />
                  </button>
                )}

                <span
                  style={{
                    minWidth: 48,
                    textAlign: 'center',
                    fontSize: 18,
                    fontFamily: 'var(--font-mono, monospace)',
                    color: 'var(--ink-bright)',
                  }}
                >
                  {entry.amount.toLocaleString()}
                </span>

                {canEdit && (
                  <button
                    onClick={() => handleDelta(entry.currencyTypeId, 1)}
                    disabled={updateWallet.isPending}
                    style={{
                      width: 28,
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'var(--abyss)',
                      border: '1px solid var(--rule)',
                      cursor: 'pointer',
                      opacity: updateWallet.isPending ? 0.5 : 1,
                    }}
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
          <div
            style={{
              padding: '24px 0',
              textAlign: 'center',
              color: 'var(--ink-faint)',
              fontSize: 12,
              fontStyle: 'italic',
            }}
          >
            {t('cmp.wallet.empty')}
          </div>
        )}
      </div>

      {/* Add Currency ghost button */}
      {canEdit && onAddCurrency && (
        <div
          style={{
            padding: '8px 16px 12px',
            borderTop: '1px solid var(--rule)',
          }}
        >
          <button
            onClick={onAddCurrency}
            style={{
              width: '100%',
              padding: '8px 0',
              background: 'none',
              border: '1px dashed var(--rule)',
              color: 'var(--ink-quiet)',
              fontSize: 11,
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase' as const,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Rune kind="plus" size={10} color="var(--ink-quiet)" />
            {t('cmp.wallet.addCurrency')}
          </button>
        </div>
      )}
    </OrdoPanel>
  );
}
