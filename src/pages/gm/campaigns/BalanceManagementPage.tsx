import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { OrdoPanel, PanelHeader, Rune, OrdoField, EmptyVault } from '@/components/ordo';
import { BackLink, CharStatusBadge } from '@/components/campaigns';
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

/* ── Add / deduct form ─────────────────────────────────────────── */

interface EditorFormProps {
  campaignId: string;
  characterId: string;
  currencies: CurrencyTypeResponse[];
  wallet: WalletEntry[];
}

function BalanceForm({ campaignId, characterId, currencies, wallet }: EditorFormProps) {
  const t = useT();
  const modifyWallet = useModifyWallet();

  const defaultCurrency = currencies.find((c) => c.isDefault)?.id ?? currencies[0]?.id ?? '';
  const [currencyTypeId, setCurrencyTypeId] = useState(defaultCurrency);
  const [mode, setMode] = useState<'add' | 'deduct'>('add');
  const [amount, setAmount] = useState(0);

  if (currencies.length === 0) {
    return (
      <OrdoPanel frame>
        <PanelHeader title={t('camp.wallet.form.title')} sub={t('camp.wallet.form.sub')} glyph="scroll" tone="gold" />
        <div style={{ padding: 20 }}>
          <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 13 }}>
            {t('camp.balances.noCurrencies')}
          </p>
        </div>
      </OrdoPanel>
    );
  }

  const current = wallet.find((w) => w.currencyTypeId === currencyTypeId)?.amount ?? 0;
  const delta = mode === 'add' ? amount : -amount;
  const projected = current + delta;
  const insufficient = projected < 0;
  const canSubmit = amount > 0 && !insufficient && !modifyWallet.isPending && !!currencyTypeId;

  function handleSubmit() {
    if (!canSubmit) return;
    modifyWallet.mutate(
      {
        campaignId,
        characterId,
        currencyTypeId,
        data: { currencyTypeId, amount: delta },
      },
      { onSuccess: () => setAmount(0) },
    );
  }

  const isAdd = mode === 'add';
  const accent = isAdd ? '#7a9866' : 'var(--ember)';

  return (
    <OrdoPanel frame>
      <PanelHeader title={t('camp.wallet.form.title')} sub={t('camp.wallet.form.sub')} glyph="scroll" tone="gold" />
      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Mode toggle */}
        <div style={{ display: 'flex', border: '1px solid var(--rule)', overflow: 'hidden' }}>
          {(['add', 'deduct'] as const).map((m) => {
            const active = mode === m;
            const c = m === 'add' ? '#7a9866' : 'var(--ember)';
            return (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  background: active ? `${c}22` : 'transparent',
                  border: 'none',
                  borderRight: m === 'add' ? '1px solid var(--rule)' : 'none',
                  color: active ? c : 'var(--ink-quiet)',
                  fontSize: 12,
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                {m === 'add' ? t('camp.wallet.form.modeAdd') : t('camp.wallet.form.modeDeduct')}
              </button>
            );
          })}
        </div>

        {/* Currency select — all campaign currencies */}
        <OrdoField label={t('camp.wallet.form.currency')}>
          <select
            value={currencyTypeId}
            onChange={(e) => setCurrencyTypeId(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 10px',
              background: 'var(--abyss)',
              border: '1px solid var(--rule)',
              color: 'var(--ink-bright)',
              fontSize: 13,
              fontFamily: 'var(--font-display)',
            }}
          >
            {currencies.map((c) => {
              const have = wallet.find((w) => w.currencyTypeId === c.id)?.amount ?? 0;
              return (
                <option key={c.id} value={c.id}>
                  {c.name} · {have.toLocaleString()}
                </option>
              );
            })}
          </select>
        </OrdoField>

        {/* Amount */}
        <OrdoField label={t('camp.wallet.form.amount')}>
          <input
            type="number"
            min={0}
            value={amount || ''}
            onChange={(e) => setAmount(Math.max(0, Math.floor(Number(e.target.value))))}
            placeholder="0"
            style={{
              width: '100%',
              padding: '10px 12px',
              background: 'var(--abyss)',
              border: `1px solid ${accent}44`,
              color: 'var(--ink-bright)',
              fontSize: 22,
              fontFamily: 'var(--font-mono, monospace)',
            }}
          />
        </OrdoField>

        {/* Preview */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--abyss)', border: '1px solid var(--rule)' }}>
          <span className="ao-overline" style={{ color: 'var(--ink-faint)' }}>{t('camp.wallet.form.preview')}</span>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="ao-num" style={{ color: 'var(--ink-quiet)', fontSize: 16 }}>{current.toLocaleString()}</span>
            <span style={{ color: 'var(--ink-faint)' }}>&rarr;</span>
            <span className="ao-num" style={{ color: insufficient ? 'var(--ember)' : accent, fontSize: 22 }}>
              {Math.max(0, projected).toLocaleString()}
            </span>
          </span>
        </div>

        {insufficient && (
          <p style={{ color: 'var(--ember)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Rune kind="cross-pat" size={10} color="var(--ember)" />
            {t('camp.wallet.form.insufficient')}
          </p>
        )}

        <button
          className="ao-btn ao-btn--primary"
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{ opacity: canSubmit ? 1 : 0.5, cursor: canSubmit ? 'pointer' : 'not-allowed' }}
        >
          <Rune kind={isAdd ? 'plus' : 'minus'} size={11} color="currentColor" />
          <span style={{ marginLeft: 6 }}>
            {modifyWallet.isPending ? t('camp.wallet.form.submitting') : t('camp.wallet.form.submit')}
          </span>
        </button>
      </div>
    </OrdoPanel>
  );
}

/* ── Paginated journal ─────────────────────────────────────────── */

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
    <OrdoPanel frame padding={0}>
      <PanelHeader title={t('camp.wallet.journal.title')} sub={t('camp.wallet.journal.sub')} glyph="book" />
      {rows.length === 0 ? (
        <div style={{ padding: 20 }}>
          <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 13 }}>{t('camp.wallet.journal.empty')}</p>
        </div>
      ) : (
        <>
          <table className="ao-table">
            <thead>
              <tr>
                <th>{t('camp.wallet.journal.col.when')}</th>
                <th>{t('camp.wallet.journal.col.currency')}</th>
                <th style={{ textAlign: 'right' }}>{t('camp.wallet.journal.col.delta')}</th>
                <th style={{ textAlign: 'right' }}>{t('camp.wallet.journal.col.balance')}</th>
                <th>{t('camp.wallet.journal.col.by')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="ao-italic" style={{ color: 'var(--ink-faint)', whiteSpace: 'nowrap' }}>
                    {new Date(row.createdAt).toLocaleString()}
                  </td>
                  <td style={{ color: 'var(--ink-bright)' }}>{row.currencyName}</td>
                  <td className="ao-num" style={{ textAlign: 'right', color: row.delta >= 0 ? '#7a9866' : 'var(--ember)' }}>
                    {row.delta >= 0 ? `+${row.delta}` : row.delta}
                  </td>
                  <td className="ao-num" style={{ textAlign: 'right', color: 'var(--ink-quiet)' }}>{row.balanceAfter}</td>
                  <td style={{ color: 'var(--ink-quiet)' }}>{row.performedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: '1px solid var(--rule)' }}>
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
          </div>
        </>
      )}
    </OrdoPanel>
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

  const entries = useMemo<WalletEntry[]>(() => wallet ?? [], [wallet]);
  const totalGold = useMemo(
    () => entries.reduce((sum, w) => sum + (w.goldEquivalent ?? 0), 0),
    [entries],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Selected character header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <h4 className="ao-h4">{character.name}</h4>
        {character.status && <CharStatusBadge status={character.status} />}
        <span className="ao-codex" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
          {t('camp.dash.owner', { name: character.ownerUsername })}
        </span>
      </div>

      <div
        className="ao-rgrid"
        style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)', gap: 18, alignItems: 'start' }}
      >
        {/* LEFT — wallet + total + journal */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <OrdoPanel frame padding={0}>
            <PanelHeader title={t('camp.balances.walletTitle')} glyph="coin" tone="gold" />
            {isLoading ? (
              <div className="ao-breathe" style={{ padding: 18 }}>
                <div className="ao-ph" style={{ width: '60%', height: 14, marginBottom: 10 }} />
                <div className="ao-ph" style={{ width: '40%', height: 14 }} />
              </div>
            ) : error ? (
              <div style={{ padding: '24px 18px', textAlign: 'center' }}>
                <p className="ao-italic" style={{ color: 'var(--ink-faint)', marginBottom: 14 }}>{t('camp.balances.loadError')}</p>
                <button className="ao-btn ao-btn--sm" onClick={() => refetch()}>{t('common.retry')}</button>
              </div>
            ) : entries.length === 0 ? (
              <div style={{ padding: 18 }}>
                <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 13 }}>{t('camp.balances.walletEmpty')}</p>
              </div>
            ) : (
              <div style={{ padding: '4px 16px 12px' }}>
                {entries.map((w) => (
                  <div
                    key={w.currencyTypeId}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--hairline)' }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: 'var(--ink-bright)', fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
                        {w.currencyName}
                      </div>
                      <div className="ao-codex" style={{ fontSize: 10, color: 'var(--ink-faint)', marginTop: 2 }}>
                        {t('cmp.wallet.gp', { amount: (w.goldEquivalent ?? 0).toLocaleString() })}
                      </div>
                    </div>
                    <span className="ao-num" style={{ fontSize: 18, color: 'var(--ink-bright)' }}>{w.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </OrdoPanel>

          {entries.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--abyss)', border: '1px solid var(--rule)' }}>
              <span className="ao-overline" style={{ color: 'var(--ink-faint)' }}>{t('camp.wallet.total')}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Rune kind="coin" size={12} color="var(--gold)" />
                <span className="ao-num" style={{ color: 'var(--gold)', fontSize: 18 }}>
                  {t('cmp.wallet.gp', { amount: totalGold.toLocaleString() })}
                </span>
              </span>
            </div>
          )}

          <PagedJournal campaignId={campaignId} characterId={character.id} />
        </div>

        {/* RIGHT — add/deduct form */}
        <BalanceForm campaignId={campaignId} characterId={character.id} currencies={currencies} wallet={entries} />
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
        <OrdoPanel frame padding={0}>
          <PanelHeader title={t('camp.balances.pickTitle')} sub={t('camp.balances.pickSub')} glyph="helm" />
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
            <div>
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
                      gap: 10,
                      padding: '11px 16px',
                      borderBottom: '1px solid var(--hairline)',
                      borderLeft: `2px solid ${active ? 'var(--gold)' : 'transparent'}`,
                      background: active ? 'rgba(176,141,78,0.08)' : 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="ao-h6" style={{ fontSize: 13, color: active ? 'var(--ink-bright)' : 'var(--ink)' }}>{ch.name}</span>
                        {ch.status && <CharStatusBadge status={ch.status} />}
                      </div>
                      <div className="ao-codex" style={{ fontSize: 10, color: 'var(--ink-faint)', marginTop: 2 }}>
                        {t('camp.dash.owner', { name: ch.ownerUsername })}
                      </div>
                    </div>
                    <Rune kind="chev-r" size={10} color={active ? 'var(--gold)' : 'var(--ink-faint)'} />
                  </button>
                );
              })}
            </div>
          )}
        </OrdoPanel>

        {/* RIGHT — editor or prompt */}
        {selected ? (
          <BalanceEditor campaignId={campaignId!} character={selected} currencies={currencies ?? []} />
        ) : (
          <OrdoPanel frame padding={0}>
            <EmptyVault glyph="coin" title={t('camp.balances.selectPrompt.title')} body={t('camp.balances.selectPrompt.body')} />
          </OrdoPanel>
        )}
      </div>
    </div>
  );
}
