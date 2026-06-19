import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { OrdoPanel, PanelHeader, Rune, OrdoField, EmptyVault, ErrorAltar } from '@/components/ordo';
import { BackLink } from '@/components/campaigns';
import { WalletPanel } from '@/components/characters';
import {
  useCharacter,
  useCharacterWallet,
  useCampaignCurrencies,
  useModifyWallet,
  useWalletHistory,
} from '@/hooks/useCharacter';
import type { CSSProperties } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { WalletEntry, WalletHistoryEntry, PageResponse, CurrencyTypeResponse } from '@/types';
import s from './CharacterWalletPage.module.css';

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
        <div className={s.noCurrencies}>
          <p className={cn('ao-italic', s.noCurrenciesText)}>
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
      <div className={s.formBox}>
        {/* Mode toggle */}
        <div className={s.modeToggle}>
          {(['add', 'deduct'] as const).map((m) => {
            const active = mode === m;
            const c = m === 'add' ? '#7a9866' : 'var(--ember)';
            return (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(s.modeBtn, active && s.active)}
                style={{ '--c': c } as CSSProperties}
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
            className={s.select}
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
            className={s.amountInput}
            style={{ '--accent': accent } as CSSProperties}
          />
        </OrdoField>

        {/* Preview */}
        <div className={s.preview} style={{ '--accent': accent } as CSSProperties}>
          <span className={cn('ao-overline', s.previewLabel)}>{t('camp.wallet.form.preview')}</span>
          <span className={s.previewVals}>
            <span className={cn('ao-num', s.previewCurrent)}>{current.toLocaleString()}</span>
            <span className={s.previewArrow}>&rarr;</span>
            <span className={cn('ao-num', s.previewProjected, insufficient && s.insufficient)}>
              {Math.max(0, projected).toLocaleString()}
            </span>
          </span>
        </div>

        {insufficient && (
          <p className={s.insufficientMsg}>
            <Rune kind="cross-pat" size={10} color="var(--ember)" />
            {t('camp.wallet.form.insufficient')}
          </p>
        )}

        <button
          className={cn('ao-btn ao-btn--primary', s.submitBtn)}
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          <Rune kind={isAdd ? 'plus' : 'minus'} size={11} color="currentColor" />
          <span className={s.ml6}>
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
        <div className={s.journalEmpty}>
          <p className={cn('ao-italic', s.journalEmptyText)}>{t('camp.wallet.journal.empty')}</p>
        </div>
      ) : (
        <>
          <table className="ao-table">
            <thead>
              <tr>
                <th>{t('camp.wallet.journal.col.when')}</th>
                <th>{t('camp.wallet.journal.col.currency')}</th>
                <th className={s.alignRight}>{t('camp.wallet.journal.col.delta')}</th>
                <th className={s.alignRight}>{t('camp.wallet.journal.col.balance')}</th>
                <th>{t('camp.wallet.journal.col.reason')}</th>
                <th>{t('camp.wallet.journal.col.by')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className={cn('ao-italic', s.cellWhen)}>
                    {new Date(row.createdAt).toLocaleString()}
                  </td>
                  <td className={s.cellCurrency}>{row.currencyName}</td>
                  <td className={cn('ao-num', s.cellDelta, row.delta >= 0 ? s.pos : s.neg)}>
                    {row.delta >= 0 ? `+${row.delta}` : row.delta}
                  </td>
                  <td className={cn('ao-num', s.cellBalance)}>{row.balanceAfter}</td>
                  <td className={cn('ao-italic', s.cellReason)}>{row.reason ?? '—'}</td>
                  <td className={s.cellBy}>{row.performedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!showAll && history.totalElements > rows.length && (
            <div className={s.journalFooter}>
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
      <BackLink to={backTo} label={t('camp2.back.character')} className={s.backLink} />

      {/* Header */}
      <div className={s.header}>
        <p className={cn('ao-overline', s.overlineGold)}>{t('camp.wallet.overline')}</p>
        <div className={s.titleRow}>
          <h3 className="ao-h3">{t('camp.wallet.title')}</h3>
        </div>
        <p className={cn('ao-italic', s.subtitle)}>
          {character ? character.name : t('camp.wallet.sub')}
        </p>
      </div>

      {/* Loading skeleton */}
      {isLoading ? (
        <div className={cn('ao-panel ao-frame ao-breathe', s.skelPanel)}>
          <span className="ao-frame-c" />
          <div className={cn('ao-ph', s.phW40H20)} />
          <div className={cn('ao-ph', s.phW70H12)} />
          <div className={cn('ao-ph', s.phW55H12)} />
        </div>
      ) : error ? (
        /* Error banner with retry */
        <OrdoPanel frame padding={0}>
          <ErrorAltar
            title={t('camp.wallet.loadError')}
            error={error}
            onRetry={() => refetch()}
            retryLabel={t('common.retry')}
          />
        </OrdoPanel>
      ) : entries.length === 0 && !canWrite ? (
        /* Empty + read-only viewer */
        <OrdoPanel frame padding={0}>
          <EmptyVault glyph="coin" title={t('camp.wallet.empty.title')} body={t('camp.wallet.empty.body')} />
        </OrdoPanel>
      ) : (
        <div className={cn('ao-rgrid', s.mainGrid)}>
          {/* LEFT — currencies + total */}
          <div className={s.leftCol}>
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
                <div className={s.totalBar}>
                  <span className={cn('ao-overline', s.totalLabel)}>{t('camp.wallet.total')}</span>
                  <span className={s.totalValueWrap}>
                    <Rune kind="coin" size={12} color="var(--gold)" />
                    <span className={cn('ao-num', s.totalValue)}>
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
