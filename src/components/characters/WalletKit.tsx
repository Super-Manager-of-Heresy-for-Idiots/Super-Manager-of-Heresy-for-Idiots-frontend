// ============================================================
// Wallet & Treasury — shared building blocks (dark grimoire).
// Reused by the player wallet (CharacterWalletPage) and the GM
// treasury (BalanceManagementPage). Pure presentation: data,
// permissions and mutations are owned by the pages.
// ============================================================
import { useState } from 'react';
import type { ReactNode, CSSProperties } from 'react';
import { OrdoPanel, PanelHeader, Rune, OrdoField, Sigil } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { WalletEntry, WalletHistoryEntry } from '@/types';
import { walletTotalGold } from './WalletKit.helpers';
import s from './WalletKit.module.css';

/* ── semantic delta colours ─────────────────────────────────── */
const POS = '#7a9866';
const NEG = 'var(--ember)';
const NEG_SOFT = '#d8896a';

const fmt = (n: number) => Math.round(n).toLocaleString();

/* ── one currency row ───────────────────────────────────────── */
function CurrencyRow({
  entry, editable, onAdjust, pending,
}: {
  entry: WalletEntry;
  editable: boolean;
  onAdjust?: (currencyTypeId: string, delta: number) => void;
  pending?: boolean;
}) {
  const t = useT();
  const eq = entry.goldEquivalent != null
    ? `≈ ${t('cmp.wallet.gp', { amount: fmt(entry.goldEquivalent) })}`
    : t('camp.wallet.noExchange');
  return (
    <div className={s.row}>
      <span className={s.coin}>
        <Rune kind="coin" size={14} color="var(--gold-pale)" />
      </span>
      <div className={s.info}>
        <div className={s.name}>{entry.currencyName}</div>
        <div className={cn('ao-num', s.eq)}>{eq}</div>
      </div>
      <div className={cn(s.rowControls, !editable && s.tight)}>
        {editable && onAdjust && (
          <button
            onClick={() => onAdjust(entry.currencyTypeId, -1)}
            disabled={pending}
            title="−1"
            className="ao-stepbtn"
          >
            <Rune kind="minus" size={12} color={NEG_SOFT} />
          </button>
        )}
        <span className={cn('ao-num', s.amount)}>{fmt(entry.amount)}</span>
        {editable && onAdjust && (
          <button
            onClick={() => onAdjust(entry.currencyTypeId, 1)}
            disabled={pending}
            title="+1"
            className="ao-stepbtn"
          >
            <Rune kind="plus" size={12} color={POS} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ── currencies panel + "total in gold" footer ──────────────── */
export function CurrencyPanel({
  entries, editable, onAdjust, pending,
}: {
  entries: WalletEntry[];
  editable: boolean;
  onAdjust?: (currencyTypeId: string, delta: number) => void;
  pending?: boolean;
}) {
  const t = useT();
  const total = walletTotalGold(entries);
  return (
    <OrdoPanel frame padding={0}>
      <PanelHeader
        title={t('camp.wallet.currencies')}
        sub={editable ? t('camp.wallet.subEditable') : t('camp.wallet.subReadonly')}
        glyph="coin"
        right={<span className={cn('ao-num', s.headTotal)}>≈ {t('cmp.wallet.gp', { amount: fmt(total) })}</span>}
      />
      {entries.length === 0 ? (
        <div className={cn('ao-italic', s.empty)}>
          {t('cmp.wallet.empty')}
        </div>
      ) : (
        <>
          <div>
            {entries.map((e) => (
              <CurrencyRow key={e.currencyTypeId} entry={e} editable={editable} onAdjust={onAdjust} pending={pending} />
            ))}
          </div>
          {/* Total in gold */}
          <div className={s.totalRow}>
            <span className={s.totalCoin}>
              <Rune kind="coin" size={16} color="var(--gold-pale)" />
            </span>
            <div className={s.totalInfo}>
              <div className={cn('ao-overline', s.totalLabel)}>{t('camp.wallet.total')}</div>
              <div className={cn('ao-codex', s.totalSub)}>{t('camp.wallet.totalSub')}</div>
            </div>
            <div className={s.totalVal}>
              <span className={cn('ao-num', s.totalNum)}>{fmt(total)}</span>
              <span className={cn('ao-num', s.totalUnit)}>{t('camp.wallet.goldUnit')}</span>
            </div>
          </div>
        </>
      )}
    </OrdoPanel>
  );
}

/* ── add / deduct form ──────────────────────────────────────── */
export function TopupForm({
  options, wallet, onApply, pending, overline,
}: {
  /** Currencies offered in the selector (player: owned; GM: all campaign). */
  options: { id: string; name: string }[];
  /** Current balances, for the live "current → new" preview. */
  wallet: WalletEntry[];
  onApply: (currencyTypeId: string, signedDelta: number, reason: string) => void;
  pending?: boolean;
  overline?: string;
}) {
  const t = useT();
  const [mode, setMode] = useState<'add' | 'deduct'>('add');
  const [code, setCode] = useState(options[0]?.id ?? '');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  if (options.length === 0) {
    return (
      <OrdoPanel frame>
        <PanelHeader title={t('camp.wallet.form.title')} sub={t('camp.wallet.form.sub')} glyph="scroll" tone="gold" />
        <div className={s.formPad}>
          <p className={cn('ao-italic', s.muted)}>{t('camp.wallet.form.noCurrencies')}</p>
        </div>
      </OrdoPanel>
    );
  }

  const selectedCode = options.some((o) => o.id === code) ? code : options[0].id;
  const isAdd = mode === 'add';
  const accent = isAdd ? POS : NEG;
  const amt = Math.max(0, parseInt(amount, 10) || 0);
  const cur = wallet.find((w) => w.currencyTypeId === selectedCode)?.amount ?? 0;
  const signed = isAdd ? amt : -amt;
  const next = Math.max(0, cur + signed);
  const lack = !isAdd ? Math.max(0, amt - cur) : 0;
  const disabled = amt === 0 || lack > 0 || !!pending;

  function apply() {
    if (disabled) return;
    onApply(selectedCode, signed, reason.trim());
    setAmount('');
    setReason('');
  }

  return (
    <OrdoPanel frame>
      <PanelHeader title={t('camp.wallet.form.title')} sub={overline ?? t('camp.wallet.form.overlineOwner')} glyph="scroll" tone="gold" />
      <div className={s.body}>
        {/* Mode toggle */}
        <div className={s.modeToggle}>
          {([['add', t('camp.wallet.form.modeAdd'), POS, 'plus'], ['deduct', t('camp.wallet.form.modeDeduct'), NEG, 'minus']] as const).map(([m, label, col, gl]) => {
            const on = mode === m;
            return (
              <button
                key={m}
                onClick={() => setMode(m as 'add' | 'deduct')}
                className={cn(s.modeBtn, m === 'add' && s.first, on && s.on)}
                style={{ '--col': col } as CSSProperties}
              >
                <Rune kind={gl} size={11} color={on ? col : 'var(--ink-faint)'} />{label}
              </button>
            );
          })}
        </div>

        {/* Currency select */}
        <OrdoField label={t('camp.wallet.form.currency')}>
          <select
            value={selectedCode}
            onChange={(e) => setCode(e.target.value)}
            className={s.select}
          >
            {options.map((o) => {
              const have = wallet.find((w) => w.currencyTypeId === o.id)?.amount ?? 0;
              return <option key={o.id} value={o.id}>{o.name} · {fmt(have)}</option>;
            })}
          </select>
        </OrdoField>

        {/* Amount with sign prefix + colored frame */}
        <OrdoField label={t('camp.wallet.form.amount')}>
          <div className={s.amountWrap} style={{ '--accent': accent } as CSSProperties}>
            <span className={s.amountSign}>{isAdd ? '+' : '−'}</span>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
              inputMode="numeric"
              placeholder="0"
              className={s.amountInput}
            />
          </div>
        </OrdoField>

        {/* Presets */}
        <div className={s.presets}>
          {[10, 50, 100, 500].map((p) => (
            <button key={p} onClick={() => setAmount(String(p))} className={s.preset}>{p}</button>
          ))}
        </div>

        {/* Reason (optional) */}
        <OrdoField label={t('camp.wallet.form.reason')}>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={isAdd ? t('camp.wallet.form.reasonAddPh') : t('camp.wallet.form.reasonDeductPh')}
            className={s.reasonInput}
          />
        </OrdoField>

        {/* Preview: current → new */}
        <div className={s.preview} style={{ '--accent': accent } as CSSProperties}>
          <div className={s.previewCol}>
            <div className={cn('ao-overline', s.previewLabel)}>{t('camp.wallet.form.current')}</div>
            <div className={cn('ao-num', s.previewCur)}>{fmt(cur)}</div>
          </div>
          <Rune kind="arrow-r" size={15} color={accent} />
          <div className={s.previewColRight}>
            <div className={cn('ao-overline', s.previewLabel)}>{t('camp.wallet.form.preview')}</div>
            <div className={cn('ao-num', s.previewNext)} style={{ color: lack > 0 ? NEG_SOFT : 'var(--ink-bright)' }}>{fmt(next)}</div>
          </div>
        </div>

        {/* Insufficient warning */}
        {lack > 0 && (
          <div className={s.warn}>
            <Rune kind="flame" size={13} color={NEG_SOFT} />
            <div className={s.warnText}>{t('camp.wallet.form.lacking', { amount: fmt(lack) })}</div>
          </div>
        )}

        <button
          className={`ao-btn ${isAdd ? 'ao-btn--primary' : 'ao-btn--danger'}`}
          onClick={apply}
          disabled={disabled}
        >
          <Rune kind={isAdd ? 'plus' : 'minus'} size={11} color="currentColor" />
          <span className={s.submitLabel}>{pending ? t('camp.wallet.form.submitting') : t('camp.wallet.form.submit')}</span>
        </button>
      </div>
    </OrdoPanel>
  );
}

/* ── operations journal (table) ─────────────────────────────── */
function DeltaCell({ delta }: { delta: number }) {
  const pos = delta >= 0;
  return (
    <span className={cn('ao-num', s.delta, pos ? s.deltaPos : s.deltaNeg)}>
      <Rune kind={pos ? 'arrow-up' : 'minus'} size={9} color={pos ? POS : NEG_SOFT} />
      {pos ? `+${fmt(delta)}` : `−${fmt(Math.abs(delta))}`}
    </span>
  );
}

export function WalletJournal({ rows, footer }: { rows: WalletHistoryEntry[]; footer?: ReactNode }) {
  const t = useT();
  return (
    <OrdoPanel frame padding={0}>
      <PanelHeader title={t('camp.wallet.journal.title')} sub={t('camp.wallet.journal.sub')} glyph="book" />
      {rows.length === 0 ? (
        <div className={s.formPad}>
          <p className={cn('ao-italic', s.muted)}>{t('camp.wallet.journal.empty')}</p>
        </div>
      ) : (
        <>
          <table className="ao-table">
            <thead>
              <tr>
                <th>{t('camp.wallet.journal.col.when')}</th>
                <th>{t('camp.wallet.journal.col.currency')}</th>
                <th className={s.right}>{t('camp.wallet.journal.col.delta')}</th>
                <th className={s.right}>{t('camp.wallet.journal.col.balance')}</th>
                <th>{t('camp.wallet.journal.col.reason')}</th>
                <th>{t('camp.wallet.journal.col.by')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className={cn('ao-italic', s.when)}>{new Date(row.createdAt).toLocaleString()}</td>
                  <td className={s.curName}>{row.currencyName}</td>
                  <td className={s.right}><DeltaCell delta={row.delta} /></td>
                  <td className={cn('ao-num', s.balance)}>{fmt(row.balanceAfter)}</td>
                  <td className={cn('ao-italic', s.reason)}>{row.reason ?? '—'}</td>
                  <td><span className={cn('ao-codex', s.by)}>{row.performedBy}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {footer && <div className={s.journalFoot}>{footer}</div>}
        </>
      )}
    </OrdoPanel>
  );
}

/* ── states: skeleton · error · read-only banner ────────────── */
export function WalletSkeleton() {
  const t = useT();
  return (
    <OrdoPanel frame padding={0}>
      <PanelHeader title={t('camp.wallet.currencies')} glyph="coin" />
      <div className={s.skelList}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={s.skelRow}>
            <span className={cn('ao-ph', s.skelCoin)} />
            <div className={s.skelInfo}>
              <div className={cn('ao-ph', s.skelLine1)} style={{ width: `${42 + (i % 3) * 14}%` }} />
              <div className={cn('ao-ph', s.skelLine2)} />
            </div>
            <span className={cn('ao-ph', s.skelAmount)} />
          </div>
        ))}
      </div>
    </OrdoPanel>
  );
}

export function WalletErrorBanner({ onRetry }: { onRetry: () => void }) {
  const t = useT();
  return (
    <OrdoPanel frame className={s.errPanel}>
      <div className={s.errBox}>
        <Sigil size={48} glyph="flame" color="var(--ember)" />
        <div className={s.errInfo}>
          <div className={cn('ao-overline', s.errOverline)}>{t('camp.wallet.errorOverline')}</div>
          <div className={cn('ao-h6', s.errTitle)}>{t('camp.wallet.loadError')}</div>
          <div className={cn('ao-italic', s.errBody)}>{t('camp.wallet.errorBody')}</div>
        </div>
        <button onClick={onRetry} className={cn('ao-btn ao-btn--danger', s.errBtn)}>{t('common.retry')}</button>
      </div>
    </OrdoPanel>
  );
}

export function WalletReadOnlyBanner() {
  const t = useT();
  return (
    <div className={s.roBanner}>
      <Rune kind="lock" size={14} color="#b06a6a" />
      <div className={cn('ao-italic', s.roText)}>{t('camp.wallet.readonlyDead')}</div>
    </div>
  );
}
