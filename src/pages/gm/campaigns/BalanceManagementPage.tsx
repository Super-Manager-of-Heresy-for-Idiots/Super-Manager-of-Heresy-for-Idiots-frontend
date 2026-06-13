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
import { cn } from '@/lib/utils';
import type { CharacterResponse, CurrencyTypeResponse, WalletEntry } from '@/types';
import s from './BalanceManagementPage.module.css';

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
            className={cn('ao-btn ao-btn--ghost ao-btn--sm', !hasPrev && s.navBtnDim)}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={!hasPrev || isFetching}
          >
            <Rune kind="arrow-l" size={9} /> {t('camp.wallet.journal.prev')}
          </button>
          <span className={cn('ao-codex', s.pageLabel)}>
            {t('camp.wallet.journal.page', { page: page + 1, total: totalPages })}
          </span>
          <button
            className={cn('ao-btn ao-btn--ghost ao-btn--sm', !hasNext && s.navBtnDim)}
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasNext || isFetching}
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
    <div className={s.editorCol}>
      {/* Selected character header */}
      <div className={s.charHeader}>
        <span className={s.charAvatar}>
          <Rune kind="sigil-3" size={22} color="var(--gold-pale)" />
        </span>
        <div className={s.charMain}>
          <div className={s.charNameRow}>
            <h4 className="ao-h4">{character.name}</h4>
            {character.status && <CharStatusBadge status={character.status} />}
          </div>
          <span className={cn('ao-codex', s.charOwner)}>
            {t('camp.dash.owner', { name: character.ownerUsername })}
          </span>
        </div>
        <div className={s.totalCol}>
          <div className={cn('ao-overline', s.totalLabel)}>{t('camp.wallet.total')}</div>
          <div className={cn('ao-num', s.totalValue)}>
            {fmt(totalGold)} <span className={s.totalUnit}>{t('camp.wallet.goldUnit')}</span>
          </div>
        </div>
      </div>

      {isDead && <WalletReadOnlyBanner />}

      <div className={cn('ao-rgrid', s.editorGrid)}>
        {/* LEFT — wallet + journal */}
        <div className={s.editorLeft}>
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
        <div className={s.editorRight}>
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
      <BackLink to={`/campaigns/${campaignId}`} label={t('camp.backToDashboard')} className={s.backLink} />

      {/* Header */}
      <div className={s.headerBlock}>
        <p className={cn('ao-overline', s.overlineGold)}>{t('camp.balances.overline')}</p>
        <h3 className={cn('ao-h3', s.title)}>{t('camp.balances.title')}</h3>
        <p className={cn('ao-italic', s.subtitle)}>
          {campaign ? campaign.name : t('camp.balances.sub')}
        </p>
      </div>

      <div className={cn('ao-rgrid', s.pageGrid)}>
        {/* LEFT — character picker */}
        <OrdoPanel frame padding={0} className={s.pickerPanel}>
          <PanelHeader
            title={t('camp.balances.pickTitle')}
            sub={roster.length > 0 ? t('camp.balances.soulCount', { count: roster.length }) : t('camp.balances.pickSub')}
            glyph="shield"
          />
          {isLoading ? (
            <div className={cn('ao-breathe', s.skelBox)}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={cn('ao-ph', s.skelRow)} />
              ))}
            </div>
          ) : error ? (
            <div className={s.errorBox}>
              <p className={cn('ao-italic', s.errorText)}>{t('camp.balances.loadError')}</p>
              <button className="ao-btn ao-btn--sm" onClick={() => refetch()}>{t('common.retry')}</button>
            </div>
          ) : roster.length === 0 ? (
            <div className={s.emptyBox}>
              <p className={cn('ao-italic', s.emptyText)}>{t('camp.balances.pickEmpty')}</p>
            </div>
          ) : (
            <div className={cn('ao-scroll', s.pickerList)}>
              {roster.map((ch) => {
                const active = ch.id === selectedId;
                return (
                  <button
                    key={ch.id}
                    onClick={() => setSelectedId(ch.id)}
                    className={cn(s.pickerBtn, active && s.active)}
                  >
                    <span className={s.pickerAvatar}>
                      <Rune kind="sigil-3" size={16} color={active ? 'var(--gold-pale)' : 'var(--ink-quiet)'} />
                    </span>
                    <div className={s.pickerMain}>
                      <div className={cn('ao-h6', s.pickerName)}>{ch.name}</div>
                      <div className={s.pickerMeta}>
                        {ch.status && <CharStatusBadge status={ch.status} />}
                        <span className={cn('ao-codex', s.pickerOwner)}>{ch.ownerUsername}</span>
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
