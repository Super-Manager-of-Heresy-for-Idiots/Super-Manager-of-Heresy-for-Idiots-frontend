import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { OrdoPanel, PanelHeader, Rune, EmptyVault } from '@/components/ordo';
import { BackLink, CharStatusBadge } from '@/components/campaigns';
import {
  CurrencyPanel,
  TopupForm,
  WalletJournal,
  WalletSkeleton,
  WalletErrorBanner,
  WalletReadOnlyBanner,
  walletTotalGold,
} from '@/components/characters';
import {
  useCampaignCharacters,
  useCampaignCurrencies,
  useCharacterWallet,
  useModifyWallet,
  useWalletHistoryPaged,
} from '@/hooks/useCharacter';
import { useCampaign } from '@/hooks/useCampaigns';
import { useT } from '@/i18n/I18nContext';
import type { CharacterResponse, CurrencyTypeResponse, WalletEntry } from '@/types';

const PAGE_SIZE = 10;
const fmt = (n: number) => Math.round(n).toLocaleString();

/* ── Paginated journal (GM) ────────────────────────────────────── */

function PagedJournal({ campaignId, characterId }: { campaignId: string; characterId: string }) {
  const t = useT();
  const [page, setPage] = useState(0);
  const { data: history, isFetching } = useWalletHistoryPaged(campaignId, characterId, page, PAGE_SIZE);

  // Endpoint not served yet (404/501) → hide the section entirely.
  if (history === null) return null;

  const rows = history?.content ?? [];
  const totalPages = history ? Math.max(1, Math.ceil(history.totalElements / history.size)) : 1;
  const hasPrev = page > 0;
  const hasNext = page + 1 < totalPages;

  return (
    <WalletJournal
      rows={rows}
      footer={
        <>
          <button
            className="ao-btn ao-btn--ghost ao-btn--sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={!hasPrev || isFetching}
            style={{ opacity: hasPrev ? 1 : 0.4 }}
          >
            <Rune kind="arrow-l" size={9} /> {t('camp.wallet.journal.prev')}
          </button>
          <span className="ao-codex" style={{ color: 'var(--ink-faint)', fontSize: 11 }}>
            {t('camp.wallet.journal.page', { page: page + 1, total: totalPages })}
          </span>
          <button
            className="ao-btn ao-btn--ghost ao-btn--sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasNext || isFetching}
            style={{ opacity: hasNext ? 1 : 0.4 }}
          >
            {t('camp.wallet.journal.next')} <Rune kind="arrow-r" size={9} />
          </button>
        </>
      }
    />
  );
}

/* ── Selected character wallet + editor ────────────────────────── */

function BalanceEditor({
  campaignId,
  character,
  currencies,
}: {
  campaignId: string;
  character: CharacterResponse;
  currencies: CurrencyTypeResponse[];
}) {
  const t = useT();
  const { data: wallet, isLoading, error, refetch } = useCharacterWallet(campaignId, character.id);
  const modifyWallet = useModifyWallet();

  const entries = useMemo<WalletEntry[]>(() => wallet ?? [], [wallet]);
  const totalGold = walletTotalGold(entries);
  const isDead = character.status === 'DEAD';

  // GM edits across ALL campaign currencies; default currency offered first.
  const options = useMemo(
    () =>
      [...currencies]
        .sort((a, b) => Number(b.isDefault) - Number(a.isDefault))
        .map((c) => ({ id: c.id, name: c.name })),
    [currencies],
  );

  function adjust(currencyTypeId: string, delta: number) {
    modifyWallet.mutate({ campaignId, characterId: character.id, currencyTypeId, data: { currencyTypeId, amount: delta } });
  }

  function apply(currencyTypeId: string, signedDelta: number, reason: string) {
    modifyWallet.mutate({
      campaignId,
      characterId: character.id,
      currencyTypeId,
      data: reason ? { currencyTypeId, amount: signedDelta, reason } : { currencyTypeId, amount: signedDelta },
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Selected character header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ width: 48, height: 48, flexShrink: 0, border: '1px solid var(--rule)', background: 'var(--abyss)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Rune kind="sigil-3" size={22} color="var(--gold-pale)" />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h4 className="ao-h4">{character.name}</h4>
            {character.status && <CharStatusBadge status={character.status} />}
          </div>
          <span className="ao-codex" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
            {t('camp.dash.owner', { name: character.ownerUsername })}
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="ao-overline" style={{ color: 'var(--ink-faint)' }}>{t('camp.wallet.total')}</div>
          <div className="ao-num" style={{ color: 'var(--gold-pale)', fontSize: 28, lineHeight: 1.1 }}>
            {fmt(totalGold)} <span style={{ fontSize: 14, color: 'var(--brass)' }}>{t('camp.wallet.goldUnit')}</span>
          </div>
        </div>
      </div>

      {isDead && <WalletReadOnlyBanner />}

      <div
        className="ao-rgrid"
        style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)', gap: 18, alignItems: 'start' }}
      >
        {/* LEFT — wallet + journal */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {isLoading ? (
            <WalletSkeleton />
          ) : error ? (
            <WalletErrorBanner onRetry={() => refetch()} />
          ) : (
            <CurrencyPanel entries={entries} editable={!isDead} onAdjust={adjust} pending={modifyWallet.isPending} />
          )}

          <PagedJournal campaignId={campaignId} characterId={character.id} />
        </div>

        {/* RIGHT — add/deduct form, or sealed when fallen */}
        <div style={{ position: 'sticky', top: 0 }}>
          {isDead ? (
            <OrdoPanel frame padding={0}>
              <EmptyVault glyph="lock" title={t('camp.balances.sealed.title')} body={t('camp.balances.sealed.body')} />
            </OrdoPanel>
          ) : (
            <TopupForm
              options={options}
              wallet={entries}
              onApply={apply}
              pending={modifyWallet.isPending}
              overline={t('camp.wallet.form.overlineGm')}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────── */

export default function BalanceManagementPage() {
  const t = useT();
  const { campaignId } = useParams<{ campaignId: string }>();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: campaign } = useCampaign(campaignId!);
  const { data: characters, isLoading, error, refetch } = useCampaignCharacters(campaignId!);
  const { data: currencies } = useCampaignCurrencies(campaignId!);

  const roster = useMemo<CharacterResponse[]>(() => characters ?? [], [characters]);
  const selected = roster.find((c) => c.id === selectedId) ?? null;

  return (
    <div>
      <BackLink to={`/campaigns/${campaignId}`} label={t('camp.backToDashboard')} style={{ marginBottom: 12 }} />

      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <p className="ao-overline" style={{ color: 'var(--gold)' }}>{t('camp.balances.overline')}</p>
        <h3 className="ao-h3" style={{ marginTop: 4 }}>{t('camp.balances.title')}</h3>
        <p className="ao-italic" style={{ color: 'var(--ink-quiet)', fontSize: 13, marginTop: 6 }}>
          {campaign ? campaign.name : t('camp.balances.sub')}
        </p>
      </div>

      <div
        className="ao-rgrid"
        style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 280px) minmax(0, 1fr)', gap: 18, alignItems: 'start' }}
      >
        {/* LEFT — character picker */}
        <OrdoPanel frame padding={0} style={{ display: 'flex', flexDirection: 'column' }}>
          <PanelHeader
            title={t('camp.balances.pickTitle')}
            sub={roster.length > 0 ? t('camp.balances.soulCount', { count: roster.length }) : t('camp.balances.pickSub')}
            glyph="shield"
          />
          {isLoading ? (
            <div className="ao-breathe" style={{ padding: 16 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="ao-ph" style={{ width: '80%', height: 14, marginBottom: 12 }} />
              ))}
            </div>
          ) : error ? (
            <div style={{ padding: '24px 16px', textAlign: 'center' }}>
              <p className="ao-italic" style={{ color: 'var(--ink-faint)', marginBottom: 14 }}>{t('camp.balances.loadError')}</p>
              <button className="ao-btn ao-btn--sm" onClick={() => refetch()}>{t('common.retry')}</button>
            </div>
          ) : roster.length === 0 ? (
            <div style={{ padding: 18 }}>
              <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 13 }}>{t('camp.balances.pickEmpty')}</p>
            </div>
          ) : (
            <div className="ao-scroll" style={{ overflowY: 'auto' }}>
              {roster.map((ch) => {
                const active = ch.id === selectedId;
                return (
                  <button
                    key={ch.id}
                    onClick={() => setSelectedId(ch.id)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 11,
                      padding: '12px 14px',
                      borderBottom: '1px solid var(--hairline)',
                      borderLeft: `2px solid ${active ? 'var(--gold)' : 'transparent'}`,
                      background: active ? 'linear-gradient(90deg, rgba(176,141,78,0.10), transparent)' : 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ width: 36, height: 36, flexShrink: 0, border: `1px solid ${active ? 'var(--brass)' : 'var(--rule)'}`, background: 'var(--abyss)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Rune kind="sigil-3" size={16} color={active ? 'var(--gold-pale)' : 'var(--ink-quiet)'} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="ao-h6" style={{ fontSize: 14, color: active ? 'var(--ink-bright)' : 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 4 }}>
                        {ch.status && <CharStatusBadge status={ch.status} />}
                        <span className="ao-codex" style={{ fontSize: 10, color: 'var(--ink-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch.ownerUsername}</span>
                      </div>
                    </div>
                    {active && <Rune kind="chev-r" size={12} color="var(--gold)" />}
                  </button>
                );
              })}
            </div>
          )}
        </OrdoPanel>

        {/* RIGHT — editor or prompt */}
        {selected ? (
          <BalanceEditor key={selected.id} campaignId={campaignId!} character={selected} currencies={currencies ?? []} />
        ) : (
          <OrdoPanel frame padding={0}>
            <EmptyVault glyph="coin" title={t('camp.balances.selectPrompt.title')} body={t('camp.balances.selectPrompt.body')} />
          </OrdoPanel>
        )}
      </div>
    </div>
  );
}
