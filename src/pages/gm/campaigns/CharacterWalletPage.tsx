import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { OrdoPanel, Rune, EmptyVault } from '@/components/ordo';
import { BackLink } from '@/components/campaigns';
import {
  CurrencyPanel,
  TopupForm,
  WalletJournal,
  WalletSkeleton,
  WalletErrorBanner,
  WalletReadOnlyBanner,
} from '@/components/characters';
import {
  useCharacter,
  useCharacterWallet,
  useModifyWallet,
  useWalletHistory,
} from '@/hooks/useCharacter';
import { useAuthStore } from '@/store/authStore';
import { useT } from '@/i18n/I18nContext';
import type { WalletEntry } from '@/types';

/* ── Page ────────────────────────────────────────────────────── */

export default function CharacterWalletPage() {
  const t = useT();
  const { campaignId, characterId } = useParams<{ campaignId: string; characterId: string }>();
  const { user } = useAuthStore();

  const { data: character } = useCharacter(campaignId!, characterId!);
  const { data: wallet, isLoading, error, refetch } = useCharacterWallet(campaignId!, characterId!);
  const { data: history } = useWalletHistory(campaignId!, characterId!);
  const modifyWallet = useModifyWallet();

  const [showAll, setShowAll] = useState(false);

  const entries = useMemo<WalletEntry[]>(() => wallet ?? [], [wallet]);

  const isOwner = !!user && !!character && user.id === character.ownerId;
  const isPrivileged = user?.role === 'GAME_MASTER' || user?.role === 'ADMIN';
  const isDead = character?.status === 'DEAD';
  // Owner / GM may edit — unless the soul has fallen (read-only memorial).
  const canWrite = (isOwner || isPrivileged) && !isDead;

  const backTo = `/campaigns/${campaignId}/characters/${characterId}`;

  function adjust(currencyTypeId: string, delta: number) {
    modifyWallet.mutate({ campaignId, characterId, currencyTypeId, data: { currencyTypeId, amount: delta } });
  }

  function apply(currencyTypeId: string, signedDelta: number, reason: string) {
    modifyWallet.mutate({
      campaignId,
      characterId,
      currencyTypeId,
      data: reason ? { currencyTypeId, amount: signedDelta, reason } : { currencyTypeId, amount: signedDelta },
    });
  }

  const journalRows = history
    ? (showAll ? history.content : history.content.slice(0, 6))
    : [];

  return (
    <div>
      <BackLink to={backTo} label={t('camp.backToCharacter')} style={{ marginBottom: 12 }} />

      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <p className="ao-overline" style={{ color: 'var(--gold)' }}>{t('camp.wallet.overline')}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
          <h3 className="ao-h3">{t('camp.wallet.title')}</h3>
        </div>
        <p className="ao-italic" style={{ color: 'var(--ink-quiet)', fontSize: 13, marginTop: 6 }}>
          {character ? character.name : t('camp.wallet.sub')}
        </p>
      </div>

      {isLoading ? (
        <WalletSkeleton />
      ) : error ? (
        <WalletErrorBanner onRetry={() => refetch()} />
      ) : entries.length === 0 && !canWrite ? (
        <OrdoPanel frame padding={0}>
          <EmptyVault glyph="coin" title={t('camp.wallet.empty.title')} body={t('camp.wallet.empty.body')} />
        </OrdoPanel>
      ) : (
        <>
          {isDead && (isOwner || isPrivileged) && (
            <div style={{ marginBottom: 16 }}><WalletReadOnlyBanner /></div>
          )}

          <div
            className="ao-rgrid"
            style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 18, alignItems: 'start' }}
          >
            {/* LEFT — currencies + journal */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <CurrencyPanel entries={entries} editable={canWrite} onAdjust={adjust} pending={modifyWallet.isPending} />

              {history && (
                <WalletJournal
                  rows={journalRows}
                  footer={
                    !showAll && history.totalElements > journalRows.length ? (
                      <button className="ao-btn ao-btn--ghost ao-btn--sm" onClick={() => setShowAll(true)}>
                        <Rune kind="chev-r" size={9} /> {t('camp.wallet.journal.showAll')}
                      </button>
                    ) : showAll ? (
                      <button className="ao-btn ao-btn--ghost ao-btn--sm" onClick={() => setShowAll(false)}>
                        <Rune kind="chev-d" size={9} /> {t('camp.wallet.journal.collapse')}
                      </button>
                    ) : undefined
                  }
                />
              )}
            </div>

            {/* RIGHT — add/deduct form (owner & GM only, soul alive) */}
            <div style={{ position: 'sticky', top: 0 }}>
              {canWrite ? (
                <TopupForm
                  options={entries.map((e) => ({ id: e.currencyTypeId, name: e.currencyName }))}
                  wallet={entries}
                  onApply={apply}
                  pending={modifyWallet.isPending}
                />
              ) : isDead && (isOwner || isPrivileged) ? (
                <OrdoPanel frame padding={0}>
                  <EmptyVault glyph="lock" title={t('camp.balances.sealed.title')} body={t('camp.balances.sealed.body')} />
                </OrdoPanel>
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
