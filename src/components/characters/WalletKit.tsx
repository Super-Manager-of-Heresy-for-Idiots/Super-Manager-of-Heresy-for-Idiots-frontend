// ============================================================
// Wallet & Treasury — shared building blocks (dark grimoire).
// Reused by the player wallet (CharacterWalletPage) and the GM
// treasury (BalanceManagementPage). Pure presentation: data,
// permissions and mutations are owned by the pages.
// ============================================================
import { useState } from 'react';
import type { ReactNode } from 'react';
import { OrdoPanel, PanelHeader, Rune, OrdoField, Sigil } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import type { WalletEntry, WalletHistoryEntry } from '@/types';

/* ── semantic delta colours ─────────────────────────────────── */
const POS = '#7a9866';
const NEG = 'var(--ember)';
const NEG_SOFT = '#d8896a';

const fmt = (n: number) => Math.round(n).toLocaleString();

export const walletTotalGold = (entries: WalletEntry[]): number =>
  entries.reduce((s, w) => s + (w.goldEquivalent ?? 0), 0);

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
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: '1px solid var(--hairline)' }}>
      <span style={{ width: 30, height: 30, flexShrink: 0, border: '1px solid var(--rule)', background: 'var(--abyss)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 1px 0 rgba(0,0,0,0.5)' }}>
        <Rune kind="coin" size={14} color="var(--gold-pale)" />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: 'var(--ink-bright)', fontSize: 13.5 }}>{entry.currencyName}</div>
        <div className="ao-num" style={{ fontSize: 10, marginTop: 2, color: 'var(--ink-faint)' }}>{eq}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: editable ? 8 : 0 }}>
        {editable && onAdjust && (
          <button
            onClick={() => onAdjust(entry.currencyTypeId, -1)}
            disabled={pending}
            title="−1"
            style={{ width: 28, height: 28, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--abyss)', border: '1px solid var(--rule)', cursor: pending ? 'default' : 'pointer', opacity: pending ? 0.5 : 1 }}
          >
            <Rune kind="minus" size={12} color={NEG_SOFT} />
          </button>
        )}
        <span className="ao-num" style={{ minWidth: 72, textAlign: 'right', color: 'var(--ink-bright)', fontSize: 22, lineHeight: 1 }}>{fmt(entry.amount)}</span>
        {editable && onAdjust && (
          <button
            onClick={() => onAdjust(entry.currencyTypeId, 1)}
            disabled={pending}
            title="+1"
            style={{ width: 28, height: 28, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--abyss)', border: '1px solid var(--rule)', cursor: pending ? 'default' : 'pointer', opacity: pending ? 0.5 : 1 }}
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
        right={<span className="ao-num" style={{ color: 'var(--gold-pale)', fontSize: 12 }}>≈ {t('cmp.wallet.gp', { amount: fmt(total) })}</span>}
      />
      {entries.length === 0 ? (
        <div className="ao-italic" style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--ink-faint)', fontSize: 12 }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'linear-gradient(180deg, rgba(176,141,78,0.10), transparent)', borderTop: '1px solid var(--rule)' }}>
            <span style={{ width: 34, height: 34, flexShrink: 0, border: '1px solid var(--brass)', background: 'radial-gradient(circle at 30% 30%, #2a241f, #0d0a08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Rune kind="coin" size={16} color="var(--gold-pale)" />
            </span>
            <div style={{ flex: 1 }}>
              <div className="ao-overline" style={{ color: 'var(--ink-quiet)' }}>{t('camp.wallet.total')}</div>
              <div className="ao-codex" style={{ marginTop: 2, fontSize: 10, color: 'var(--ink-faint)' }}>{t('camp.wallet.totalSub')}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span className="ao-num" style={{ color: 'var(--gold-pale)', fontSize: 28, lineHeight: 1 }}>{fmt(total)}</span>
              <span className="ao-num" style={{ color: 'var(--brass)', fontSize: 13 }}>{t('camp.wallet.goldUnit')}</span>
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
        <div style={{ padding: 20 }}>
          <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 13 }}>{t('camp.wallet.form.noCurrencies')}</p>
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
      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Mode toggle */}
        <div style={{ display: 'flex', border: '1px solid var(--rule)' }}>
          {([['add', t('camp.wallet.form.modeAdd'), POS, 'plus'], ['deduct', t('camp.wallet.form.modeDeduct'), NEG, 'minus']] as const).map(([m, label, col, gl]) => {
            const on = mode === m;
            return (
              <button
                key={m}
                onClick={() => setMode(m as 'add' | 'deduct')}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px', fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', cursor: 'pointer', border: 'none', borderRight: m === 'add' ? '1px solid var(--rule)' : 'none', background: on ? `linear-gradient(180deg, ${col}22, transparent)` : 'transparent', color: on ? col : 'var(--ink-faint)', boxShadow: on ? `inset 0 -2px 0 ${col}` : 'none' }}
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
            style={{ width: '100%', padding: '9px 10px', background: 'var(--abyss)', border: '1px solid var(--rule)', color: 'var(--ink-bright)', fontSize: 13, fontFamily: 'var(--font-display)', cursor: 'pointer' }}
          >
            {options.map((o) => {
              const have = wallet.find((w) => w.currencyTypeId === o.id)?.amount ?? 0;
              return <option key={o.id} value={o.id}>{o.name} · {fmt(have)}</option>;
            })}
          </select>
        </OrdoField>

        {/* Amount with sign prefix + colored frame */}
        <OrdoField label={t('camp.wallet.form.amount')}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--font-display)', fontSize: 24, color: accent, pointerEvents: 'none' }}>{isAdd ? '+' : '−'}</span>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
              inputMode="numeric"
              placeholder="0"
              style={{ width: '100%', background: 'var(--abyss)', border: `1px solid ${accent}`, color: 'var(--ink-bright)', fontFamily: 'var(--font-mono, monospace)', fontSize: 26, textAlign: 'right', padding: '12px 14px', outline: 'none', boxShadow: `0 0 0 1px ${accent}33` }}
            />
          </div>
        </OrdoField>

        {/* Presets */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[10, 50, 100, 500].map((p) => (
            <button key={p} onClick={() => setAmount(String(p))} style={{ flex: 1, padding: '6px 0', background: 'transparent', border: '1px solid var(--rule)', color: 'var(--ink-quiet)', fontFamily: 'var(--font-mono, monospace)', fontSize: 12, cursor: 'pointer' }}>{p}</button>
          ))}
        </div>

        {/* Reason (optional) */}
        <OrdoField label={t('camp.wallet.form.reason')}>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={isAdd ? t('camp.wallet.form.reasonAddPh') : t('camp.wallet.form.reasonDeductPh')}
            style={{ width: '100%', padding: '9px 10px', background: 'var(--abyss)', border: '1px solid var(--rule)', color: 'var(--ink-bright)', fontSize: 13 }}
          />
        </OrdoField>

        {/* Preview: current → new */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: 'var(--abyss)', border: '1px solid var(--rule)' }}>
          <div style={{ flex: 1 }}>
            <div className="ao-overline" style={{ fontSize: 9, color: 'var(--ink-faint)' }}>{t('camp.wallet.form.current')}</div>
            <div className="ao-num" style={{ color: 'var(--ink-quiet)', fontSize: 18, marginTop: 2 }}>{fmt(cur)}</div>
          </div>
          <Rune kind="arrow-r" size={15} color={accent} />
          <div style={{ flex: 1, textAlign: 'right' }}>
            <div className="ao-overline" style={{ fontSize: 9, color: 'var(--ink-faint)' }}>{t('camp.wallet.form.preview')}</div>
            <div className="ao-num" style={{ color: lack > 0 ? NEG_SOFT : 'var(--ink-bright)', fontSize: 22, marginTop: 2 }}>{fmt(next)}</div>
          </div>
        </div>

        {/* Insufficient warning */}
        {lack > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(179,70,26,0.10)', border: '1px solid rgba(179,70,26,0.4)', borderLeft: '2px solid var(--ember)' }}>
            <Rune kind="flame" size={13} color={NEG_SOFT} />
            <div style={{ fontSize: 12.5, color: 'var(--ink)' }}>{t('camp.wallet.form.lacking', { amount: fmt(lack) })}</div>
          </div>
        )}

        <button
          className={`ao-btn ${isAdd ? 'ao-btn--primary' : 'ao-btn--danger'}`}
          onClick={apply}
          disabled={disabled}
          style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
        >
          <Rune kind={isAdd ? 'plus' : 'minus'} size={11} color="currentColor" />
          <span style={{ marginLeft: 6 }}>{pending ? t('camp.wallet.form.submitting') : t('camp.wallet.form.submit')}</span>
        </button>
      </div>
    </OrdoPanel>
  );
}

/* ── operations journal (table) ─────────────────────────────── */
function DeltaCell({ delta }: { delta: number }) {
  const pos = delta >= 0;
  return (
    <span className="ao-num" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end', color: pos ? POS : NEG_SOFT }}>
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
                  <td className="ao-italic" style={{ color: 'var(--ink-faint)', whiteSpace: 'nowrap' }}>{new Date(row.createdAt).toLocaleString()}</td>
                  <td style={{ color: 'var(--ink-bright)' }}>{row.currencyName}</td>
                  <td style={{ textAlign: 'right' }}><DeltaCell delta={row.delta} /></td>
                  <td className="ao-num" style={{ textAlign: 'right', color: 'var(--ink-quiet)' }}>{fmt(row.balanceAfter)}</td>
                  <td className="ao-italic" style={{ color: 'var(--ink-faint)' }}>{row.reason ?? '—'}</td>
                  <td><span className="ao-codex" style={{ color: 'var(--ink-quiet)' }}>{row.performedBy}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {footer && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: '1px solid var(--rule)' }}>{footer}</div>}
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
      <div style={{ padding: '4px 0' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 16px', borderBottom: '1px solid var(--hairline)' }}>
            <span className="ao-ph" style={{ width: 30, height: 30, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="ao-ph" style={{ width: `${42 + (i % 3) * 14}%`, height: 13, marginBottom: 7 }} />
              <div className="ao-ph" style={{ width: '30%', height: 10 }} />
            </div>
            <span className="ao-ph" style={{ width: 72, height: 22 }} />
          </div>
        ))}
      </div>
    </OrdoPanel>
  );
}

export function WalletErrorBanner({ onRetry }: { onRetry: () => void }) {
  const t = useT();
  return (
    <OrdoPanel frame style={{ borderColor: 'rgba(179,70,26,0.5)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 22px', background: 'rgba(179,70,26,0.08)' }}>
        <Sigil size={48} glyph="flame" color="var(--ember)" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="ao-overline" style={{ color: NEG_SOFT }}>{t('camp.wallet.errorOverline')}</div>
          <div className="ao-h6" style={{ marginTop: 3, color: 'var(--ink-bright)' }}>{t('camp.wallet.loadError')}</div>
          <div className="ao-italic" style={{ marginTop: 3, fontSize: 13, color: 'var(--ink-quiet)' }}>{t('camp.wallet.errorBody')}</div>
        </div>
        <button onClick={onRetry} className="ao-btn ao-btn--danger" style={{ flexShrink: 0 }}>{t('common.retry')}</button>
      </div>
    </OrdoPanel>
  );
}

export function WalletReadOnlyBanner() {
  const t = useT();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', background: 'rgba(107,42,42,0.14)', border: '1px solid rgba(107,42,42,0.4)', borderLeft: '2px solid var(--burgundy, var(--ember))' }}>
      <Rune kind="lock" size={14} color="#b06a6a" />
      <div className="ao-italic" style={{ fontSize: 13, color: 'var(--ink)' }}>{t('camp.wallet.readonlyDead')}</div>
    </div>
  );
}
