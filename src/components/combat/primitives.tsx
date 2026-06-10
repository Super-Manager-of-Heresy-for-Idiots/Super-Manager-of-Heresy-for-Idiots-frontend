import type { CSSProperties, ReactNode } from 'react';
import { Rune } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';

/* ── Tabs ────────────────────────────────────────────────────── */

export interface TabItem {
  id: string;
  label: string;
}

interface TabsProps {
  active: string;
  onChange: (id: string) => void;
  items: TabItem[];
}

export function Tabs({ active, onChange, items }: TabsProps) {
  return (
    <div className="ao-tabs">
      {items.map((it) => (
        <button
          key={it.id}
          className={`ao-tab ${active === it.id ? 'is-active' : ''}`}
          onClick={() => onChange(it.id)}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

/* ── Toggle ──────────────────────────────────────────────────── */

interface ToggleProps {
  on: boolean;
  onChange?: (next: boolean) => void;
  disabled?: boolean;
}

export function Toggle({ on, onChange, disabled = false }: ToggleProps) {
  return (
    <button
      onClick={() => !disabled && onChange && onChange(!on)}
      style={{
        width: 40,
        height: 22,
        flexShrink: 0,
        background: on ? 'linear-gradient(180deg, #6a522d, #4a3a20)' : 'var(--abyss)',
        border: `1px solid ${on ? 'var(--brass)' : 'var(--rule)'}`,
        position: 'relative',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'all 180ms',
        padding: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: on ? 20 : 2,
          width: 16,
          height: 16,
          background: on ? 'var(--gold-pale)' : 'var(--ink-faint)',
          transition: 'all 180ms',
        }}
      />
    </button>
  );
}

/* ── Stepper ─────────────────────────────────────────────────── */

interface StepperProps {
  value: number;
  onChange?: (next: number) => void;
  min?: number;
  max?: number;
  big?: boolean;
}

export function Stepper({ value, onChange, min = 0, max = 999, big = false }: StepperProps) {
  const sz = big ? 44 : 32;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'stretch', border: '1px solid var(--rule-strong)', background: 'var(--abyss)' }}>
      <button
        className="ao-iconbtn"
        style={{ width: sz, height: sz, border: 'none', borderRight: '1px solid var(--rule)' }}
        onClick={() => onChange && onChange(Math.max(min, value - 1))}
      >
        <Rune kind="minus" size={13} />
      </button>
      <div
        className="ao-num"
        style={{
          minWidth: big ? 72 : 52,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: big ? 24 : 16,
          fontWeight: 600,
          color: 'var(--ink-bright)',
        }}
      >
        {value}
      </div>
      <button
        className="ao-iconbtn"
        style={{ width: sz, height: sz, border: 'none', borderLeft: '1px solid var(--rule)' }}
        onClick={() => onChange && onChange(Math.min(max, value + 1))}
      >
        <Rune kind="plus" size={13} />
      </button>
    </div>
  );
}

/* ── Die button ──────────────────────────────────────────────── */

interface DieButtonProps {
  label?: string;
  onClick?: () => void;
  size?: number;
  title?: string;
}

export function DieButton({ label, onClick, size = 30, title }: DieButtonProps) {
  const t = useT();
  return (
    <button
      className="cb-die"
      onClick={onClick}
      title={title ?? t('combat.rollD20')}
      style={{
        position: 'relative',
        width: size + 4,
        height: size + 4,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: 'var(--gold-pale)',
        flexShrink: 0,
        padding: 0,
      }}
    >
      <Rune kind="hex" size={size} color="currentColor" />
      <span style={{ position: 'absolute', fontFamily: 'var(--font-mono)', fontSize: size * 0.3, letterSpacing: 0 }}>
        {label ?? t('combat.d20')}
      </span>
    </button>
  );
}

/* ── Filter pill ─────────────────────────────────────────────── */

interface FilterPillProps {
  label: string;
  active?: boolean;
  count?: number;
  onClick?: () => void;
}

export function FilterPill({ label, active = false, count, onClick }: FilterPillProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        padding: '8px 12px',
        background: active ? 'rgba(176,141,78,0.08)' : 'var(--abyss)',
        border: `1px solid ${active ? 'var(--brass)' : 'var(--rule)'}`,
        color: active ? 'var(--gold-pale)' : 'var(--ink-quiet)',
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        letterSpacing: '0.05em',
        cursor: 'pointer',
        transition: 'all 150ms',
      }}
    >
      {active && <Rune kind="check" size={9} />}
      {label}
      {count != null && <span style={{ color: 'var(--ink-faint)' }}>{count}</span>}
    </button>
  );
}

/* ── Pagination ──────────────────────────────────────────────── */

interface PaginationProps {
  page?: number;
  pages?: number;
}

export function Pagination({ page = 1, pages = 4 }: PaginationProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
      <button className="ao-iconbtn" disabled={page === 1} style={{ opacity: page === 1 ? 0.35 : 1 }}>
        <Rune kind="chev-r" size={12} color="currentColor" />
      </button>
      {Array.from({ length: pages }).map((_, i) => (
        <button
          key={i}
          className="ao-iconbtn"
          style={{
            width: 32,
            height: 32,
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: page === i + 1 ? 'var(--gold-pale)' : 'var(--ink-faint)',
            borderColor: page === i + 1 ? 'var(--brass)' : 'var(--rule)',
            background: page === i + 1 ? 'var(--panel-raised)' : 'transparent',
          }}
        >
          {i + 1}
        </button>
      ))}
      <button className="ao-iconbtn">
        <Rune kind="chev-r" size={12} />
      </button>
    </div>
  );
}

/* ── Skeletons ───────────────────────────────────────────────── */

interface SkeletonLineProps {
  w?: number | string;
  h?: number;
  style?: CSSProperties;
}

export function SkeletonLine({ w = '100%', h = 12, style }: SkeletonLineProps) {
  return <div className="cb-sk" style={{ width: w, height: h, ...style }} />;
}

export function SkeletonRow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderBottom: '1px solid var(--hairline)' }}>
      <SkeletonLine w={36} h={36} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
        <SkeletonLine w="42%" h={11} />
        <SkeletonLine w="26%" h={9} />
      </div>
      <SkeletonLine w={70} h={20} />
      <SkeletonLine w={28} h={20} />
    </div>
  );
}

/* ── Visibility eye ──────────────────────────────────────────── */

interface VisibilityEyeProps {
  visible: boolean;
  onToggle?: () => void;
  size?: number;
}

export function VisibilityEye({ visible, onToggle, size = 28 }: VisibilityEyeProps) {
  const t = useT();
  return (
    <button
      className="ao-iconbtn"
      title={visible ? t('combat.visHide') : t('combat.visShow')}
      onClick={onToggle}
      style={{
        width: size,
        height: size,
        color: visible ? 'var(--gold-pale)' : 'var(--ink-faint)',
        borderColor: visible ? 'var(--brass)' : 'var(--rule)',
        position: 'relative',
      }}
    >
      <Rune kind="eye" size={size * 0.5} />
      {!visible && (
        <span style={{ position: 'absolute', width: size * 0.8, height: 1.5, background: 'currentColor', transform: 'rotate(-35deg)' }} />
      )}
    </button>
  );
}

/* ── Inline edit ─────────────────────────────────────────────── */

interface InlineEditProps {
  value: string;
  editing?: boolean;
  heading?: boolean;
  onStart?: () => void;
}

export function InlineEdit({ value, editing = false, heading = false, onStart }: InlineEditProps) {
  const t = useT();
  if (editing) {
    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          className="ao-input"
          defaultValue={value}
          style={heading ? { fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 500, padding: '6px 12px' } : {}}
          autoFocus
        />
        <button className="ao-iconbtn" title={t('common.save')} style={{ color: '#7a9866', borderColor: '#7a986655' }}>
          <Rune kind="check" size={14} />
        </button>
        <button className="ao-iconbtn" title={t('common.cancel')}>
          <Rune kind="x" size={13} />
        </button>
      </div>
    );
  }
  return (
    <span className="cb-inline" onClick={onStart} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'text' }}>
      <span className={heading ? 'ao-h4' : ''} style={heading ? {} : { color: 'var(--ink)' }}>
        {value}
      </span>
      <Rune kind="cross" size={heading ? 14 : 11} color="var(--ink-ghost)" />
    </span>
  );
}

/* ── Disabled button with tooltip reason ─────────────────────── */

interface DisabledWithTipProps {
  label: string;
  tip: string;
  primary?: boolean;
  lg?: boolean;
}

export function DisabledWithTip({ label, tip, primary = false, lg = false }: DisabledWithTipProps) {
  return (
    <span className="cb-tipwrap" style={{ position: 'relative', display: 'inline-block' }}>
      <button
        className={`ao-btn ${primary ? 'ao-btn--primary' : ''} ${lg ? 'ao-btn--lg' : ''}`}
        disabled
        style={{ opacity: 0.4, cursor: 'not-allowed', filter: 'saturate(0.4)' }}
      >
        {label}
      </button>
      <span
        className="cb-tip ao-tooltip"
        style={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)',
          left: '50%',
          transform: 'translateX(-50%)',
          whiteSpace: 'normal',
          width: 230,
          zIndex: 9,
          pointerEvents: 'none',
          textAlign: 'left',
          padding: '8px 10px',
          background: 'var(--panel-raised)',
          border: '1px solid var(--brass)',
          boxShadow: 'var(--shadow-mid)',
        }}
      >
        <span style={{ display: 'flex', gap: 8 }}>
          <Rune kind="tri-inv" size={12} color="var(--gold-pale)" />
          <span style={{ fontSize: 12 }}>{tip}</span>
        </span>
      </span>
    </span>
  );
}

/* ── Row "⋯" menu ────────────────────────────────────────────── */

interface RowMenuProps {
  open?: boolean;
}

export function RowMenu({ open = false }: RowMenuProps) {
  const t = useT();
  const items: [string, string][] = [
    ['arrow-r', t('combat.lists.menu.open')],
    ['cir-dot', t('combat.lists.menu.status')],
    ['book', t('combat.lists.menu.archive')],
  ];
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <button className="ao-iconbtn" title={t('combat.menu')} style={open ? { borderColor: 'var(--brass)', color: 'var(--ink-bright)' } : {}}>
        <Rune kind="dots" size={14} />
      </button>
      {open && (
        <div
          className="ao-rise"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 4px)',
            width: 200,
            background: 'linear-gradient(180deg, var(--panel-raised), var(--panel))',
            border: '1px solid var(--brass)',
            boxShadow: 'var(--shadow-mid)',
            zIndex: 20,
          }}
        >
          {items.map(([g, l]) => (
            <button
              key={l}
              className="cb-menu-item"
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--ink)', textAlign: 'left' }}
            >
              <Rune kind={g} size={12} color="var(--ink-quiet)" />
              {l}
            </button>
          ))}
          <div style={{ height: 1, background: 'var(--rule)' }} />
          <button
            className="cb-menu-item"
            style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, color: '#d8896a', textAlign: 'left' }}
          >
            <Rune kind="x" size={12} color="#d8896a" />
            {t('combat.lists.menu.delete')}
          </button>
        </div>
      )}
    </span>
  );
}

/* ── List toolbar ────────────────────────────────────────────── */

interface ListToolbarProps {
  search?: string;
  count?: string;
  sort?: string;
  filters?: ReactNode;
  right?: ReactNode;
}

export function ListToolbar({ search = '', count, sort, filters, right }: ListToolbarProps) {
  const t = useT();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: 280 }}>
        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)' }}>
          <Rune kind="search" size={13} />
        </span>
        <input className="ao-input" placeholder={t('combat.searchPh')} defaultValue={search} style={{ paddingLeft: 32, paddingTop: 8, paddingBottom: 8 }} />
      </div>
      {filters}
      {sort && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: '1px solid var(--rule)', background: 'var(--abyss)', cursor: 'pointer' }}>
          <Rune kind="arrow-up" size={11} color="var(--ink-faint)" />
          <span className="ao-codex" style={{ color: 'var(--ink)' }}>{sort}</span>
          <Rune kind="chev-d" size={11} color="var(--ink-faint)" />
        </div>
      )}
      {count && <span className="ao-codex" style={{ marginLeft: 'auto' }}>{count}</span>}
      {right}
    </div>
  );
}

/* ── Advantage segment control ───────────────────────────────── */

interface AdvSegmentProps {
  value: string;
  onChange: (id: string) => void;
}

export function AdvSegment({ value, onChange }: AdvSegmentProps) {
  const t = useT();
  const opts: [string, string][] = [
    ['dis', t('combat.adv.dis')],
    ['norm', t('combat.adv.norm')],
    ['adv', t('combat.adv.adv')],
  ];
  return (
    <div style={{ display: 'flex', border: '1px solid var(--rule-strong)', background: 'var(--abyss)' }}>
      {opts.map(([id, label], i) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          style={{
            flex: 1,
            padding: '9px 10px',
            background:
              value === id
                ? id === 'dis'
                  ? 'rgba(179,70,26,0.14)'
                  : id === 'adv'
                  ? 'rgba(122,152,102,0.12)'
                  : 'var(--panel-raised)'
                : 'transparent',
            border: 'none',
            borderLeft: i ? '1px solid var(--rule)' : 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-display)',
            fontSize: 10,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color:
              value === id
                ? id === 'dis'
                  ? '#d8896a'
                  : id === 'adv'
                  ? '#7a9866'
                  : 'var(--gold-pale)'
                : 'var(--ink-faint)',
            transition: 'all 150ms',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
