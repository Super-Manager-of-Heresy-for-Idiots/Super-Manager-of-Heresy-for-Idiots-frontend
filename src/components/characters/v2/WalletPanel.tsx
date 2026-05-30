import { OrdoPanel, PanelHeader, Rune, OrdoDivider } from '@/components/ordo';
import { useUpdateWallet } from '@/hooks/useCharacterV2';
import type { WalletEntry } from '@/types';

interface WalletPanelProps {
  characterId: string;
  wallet: WalletEntry[];
  onAddCurrency?: () => void;
}

export function WalletPanel({ characterId, wallet, onAddCurrency }: WalletPanelProps) {
  const updateWallet = useUpdateWallet();

  const totalGoldEquivalent = wallet.reduce(
    (sum, w) => sum + (w.goldEquivalent ?? 0),
    0,
  );

  function handleDelta(currencyTypeId: string, delta: number) {
    updateWallet.mutate({ id: characterId, currencyTypeId, data: { delta } });
  }

  return (
    <OrdoPanel frame>
      <PanelHeader
        title="Coin & Coffer"
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
            {totalGoldEquivalent.toLocaleString()} gp
          </span>
        }
      />

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 0 }}>
        {wallet.map((entry, idx) => (
          <div key={entry.currencyTypeId}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 0',
              }}
            >
              {/* Currency name */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 13,
                    color: 'var(--ink-bright)',
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '0.04em',
                  }}
                >
                  {entry.name}
                </div>
                {entry.goldRate != null && entry.goldRate !== 1 && (
                  <div
                    style={{
                      fontSize: 10,
                      color: 'var(--ink-faint)',
                      marginTop: 2,
                    }}
                  >
                    1 = {entry.goldRate} gp
                  </div>
                )}
              </div>

              {/* +/- buttons and amount */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
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
                  aria-label={`Decrease ${entry.name}`}
                >
                  <Rune kind="minus" size={10} color="var(--ink-quiet)" />
                </button>

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
                  aria-label={`Increase ${entry.name}`}
                >
                  <Rune kind="plus" size={10} color="var(--ink-quiet)" />
                </button>
              </div>
            </div>

            {idx < wallet.length - 1 && (
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
            No currencies tracked
          </div>
        )}
      </div>

      {/* Add Currency ghost button */}
      {onAddCurrency && (
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
            Add Currency
          </button>
        </div>
      )}
    </OrdoPanel>
  );
}
