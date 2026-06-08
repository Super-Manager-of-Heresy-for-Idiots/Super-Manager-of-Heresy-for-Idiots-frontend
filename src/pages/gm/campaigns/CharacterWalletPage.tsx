import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { OrdoPanel, PanelHeader, Rune, OrdoField, EmptyVault } from '@/components/ordo';
import { BackLink } from '@/components/campaigns';
import { WalletPanel } from '@/components/characters';
import {
  useCharacter,
  useCharacterWallet,
  useCampaignCurrencies,
  useModifyWallet,
  useWalletHistory,
} from '@/hooks/useCharacter';
import { useAuthStore } from '@/store/authStore';
import { useT } from '@/i18n/I18nContext';
import type { WalletEntry, WalletHistoryEntry, PageResponse, CurrencyTypeResponse } from '@/types';

/* ── Add / deduct form (owner & Chronicler only) ─────────────── */

interface ModifyFormProps {
  campaignId: string;
  characterId: string;
  wallet: WalletEntry[];
  currencies: CurrencyTypeResponse[];
}

function WalletModifyForm({ campaignId, characterId, wallet, currencies }: ModifyFormProps) {
  const t = useT();
  const modifyWallet = useModifyWallet();

  const [currencyTypeId, setCurrencyTypeId] = useState(currencies[0]?.id ?? '');
  const [mode, setMode] = useState<'add' | 'deduct'>('add');
  const [amount, setAmount] = useState(0);

  if (currencies.length === 0) {
    return (
      <OrdoPanel frame>
        <PanelHeader title={t('camp.wallet.form.title')} sub={t('camp.wallet.form.sub')} glyph="scroll" tone="gold" />
        <div style={{ padding: 20 }}>
          <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 13 }}>
            {t('camp.wallet.form.noCurrencies')}
          </p>
        </div>
      </OrdoPanel>
    );
  }

  const walletEntry = wallet.find((w) => w.currencyTypeId === currencyTypeId);
  const current = walletEntry?.amount ?? 0;
  const delta = mode === 'add' ? amount : -amount;
  const projected = current + delta;
  const insufficient = projected < 0;
  const canSubmit = amount > 0 && !insufficient && !modifyWallet.isPending;

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

        {/* Currency select */}
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
              const bal = wallet.find((w) => w.currencyTypeId === c.id)?.amount ?? 0;
              return (
                <option key={c.id} value={c.id}>
                  {c.name} · {bal.toLocaleString()}
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

/* ── Operations journal (hidden until backend serves history) ── */

function WalletJournal({ history }: { history: PageResponse<WalletHistoryEntry> }) {
  const t = useT();
  const [showAll, setShowAll] = useState(false);
  const rows = showAll ? history.content : history.content.slice(0, 5);

  return (
    <OrdoPanel frame padding={0}>
      <PanelHeader title={t('camp.wallet.journal.title')} sub={t('camp.wallet.journal.sub')} glyph="book" />
      {history.content.length === 0 ? (
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
                <th>{t('camp.wallet.journal.col.reason')}</th>
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
                  <td className="ao-italic" style={{ color: 'var(--ink-faint)' }}>{row.reason ?? '—'}</td>
                  <td style={{ color: 'var(--ink-quiet)' }}>{row.performedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!showAll && history.totalElements > rows.length && (
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--rule)' }}>
              <button className="ao-btn ao-btn--ghost ao-btn--sm" onClick={() => setShowAll(true)}>
                <Rune kind="chev-r" size={9} /> {t('camp.wallet.journal.showAll')}
              </button>
            </div>
          )}
        </>
      )}
    </OrdoPanel>
  );
}

/* ── Page ────────────────────────────────────────────────────── */

export default function CharacterWalletPage() {
  const t = useT();
  const { campaignId, characterId } = useParams<{ campaignId: string; characterId: string }>();
  const { user } = useAuthStore();

  const { data: character } = useCharacter(campaignId!, characterId!);
  const { data: wallet, isLoading, error, refetch } = useCharacterWallet(campaignId!, characterId!);
  const { data: currencies } = useCampaignCurrencies(campaignId!);
  const { data: history } = useWalletHistory(campaignId!, characterId!);

  const entries = useMemo<WalletEntry[]>(() => wallet ?? [], [wallet]);
  const totalGold = useMemo(
    () => entries.reduce((sum, w) => sum + (w.goldEquivalent ?? 0), 0),
    [entries],
  );

  const isOwner = !!user && !!character && user.id === character.ownerId;
  const isPrivileged = user?.role === 'GAME_MASTER' || user?.role === 'ADMIN';
  const canWrite = isOwner || isPrivileged;

  const backTo = `/campaigns/${campaignId}/characters/${characterId}`;

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

      {/* Loading skeleton */}
      {isLoading ? (
        <div className="ao-panel ao-frame ao-breathe" style={{ padding: 24, minHeight: 180 }}>
          <span className="ao-frame-c" />
          <div className="ao-ph" style={{ width: '40%', height: 20, marginBottom: 16 }} />
          <div className="ao-ph" style={{ width: '70%', height: 12, marginBottom: 10 }} />
          <div className="ao-ph" style={{ width: '55%', height: 12 }} />
        </div>
      ) : error ? (
        /* Error banner with retry */
        <OrdoPanel frame>
          <div style={{ padding: '28px 24px', textAlign: 'center' }}>
            <p className="ao-italic" style={{ color: 'var(--ink-faint)', marginBottom: 16 }}>{t('camp.wallet.loadError')}</p>
            <button className="ao-btn" onClick={() => refetch()}>{t('common.retry')}</button>
          </div>
        </OrdoPanel>
      ) : entries.length === 0 && !canWrite ? (
        /* Empty + read-only viewer */
        <OrdoPanel frame padding={0}>
          <EmptyVault glyph="coin" title={t('camp.wallet.empty.title')} body={t('camp.wallet.empty.body')} />
        </OrdoPanel>
      ) : (
        <div
          className="ao-rgrid"
          style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 18, alignItems: 'start' }}
        >
          {/* LEFT — currencies + total */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {entries.length === 0 ? (
              <OrdoPanel frame padding={0}>
                <EmptyVault glyph="coin" title={t('camp.wallet.empty.title')} body={t('camp.wallet.empty.body')} />
              </OrdoPanel>
            ) : (
              <>
                <WalletPanel
                  characterId={characterId!}
                  campaignId={campaignId}
                  wallet={entries}
                  canEdit={canWrite}
                />
                {/* Total in gold (Σ goldEquivalent) */}
                <div
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', background: 'var(--abyss)', border: '1px solid var(--rule)',
                  }}
                >
                  <span className="ao-overline" style={{ color: 'var(--ink-faint)' }}>{t('camp.wallet.total')}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Rune kind="coin" size={12} color="var(--gold)" />
                    <span className="ao-num" style={{ color: 'var(--gold)', fontSize: 18 }}>
                      {t('cmp.wallet.gp', { amount: totalGold.toLocaleString() })}
                    </span>
                  </span>
                </div>
              </>
            )}

            {/* Journal — only when the backend actually serves history */}
            {history && <WalletJournal history={history} />}
          </div>

          {/* RIGHT — add/deduct form (owner & Chronicler only) */}
          {canWrite && (
            <WalletModifyForm campaignId={campaignId!} characterId={characterId!} wallet={entries} currencies={currencies ?? []} />
          )}
        </div>
      )}
    </div>
  );
}
