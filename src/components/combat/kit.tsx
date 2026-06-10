import type { ReactNode } from 'react';
import { Rune, OrdoChip, OrdoPanel, PanelHeader, Placeholder } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import {
  CONDITIONS,
  ENC_STATUS,
  QUEST_STATUS,
  ATTITUDE,
  healthWord,
  type Participant,
  type ParticipantKind,
  type EncStatus,
  type QuestStatus,
  type Attitude,
  type LogType,
} from './data';

/* ── Condition chip ──────────────────────────────────────────── */

interface ConditionChipProps {
  id: string;
  active?: boolean;
  onClick?: () => void;
  removable?: boolean;
  size?: 'sm' | 'md';
}

export function ConditionChip({ id, active = true, onClick, removable = false, size = 'md' }: ConditionChipProps) {
  const t = useT();
  const m = CONDITIONS[id] || { labelKey: id, glyph: 'diamond', c: 'var(--ink-quiet)' };
  const sm = size === 'sm';
  const label = CONDITIONS[id] ? t(m.labelKey) : id;
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: sm ? 4 : 6,
        padding: sm ? '2px 6px' : '5px 10px',
        background: active ? 'rgba(0,0,0,0.5)' : 'transparent',
        border: `1px solid ${active ? m.c + '88' : 'var(--rule)'}`,
        fontFamily: 'var(--font-mono)',
        fontSize: sm ? 9 : 11,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: active ? m.c : 'var(--ink-faint)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 150ms',
        whiteSpace: 'nowrap',
      }}
    >
      <Rune kind={m.glyph} size={sm ? 8 : 10} color={active ? m.c : 'var(--ink-ghost)'} />
      {label}
      {removable && <Rune kind="x" size={8} color={m.c} />}
    </button>
  );
}

/* ── Health word badge ───────────────────────────────────────── */

interface HealthWordBadgeProps {
  cur: number;
  max: number;
  size?: 'sm' | 'md';
}

export function HealthWordBadge({ cur, max, size = 'md' }: HealthWordBadgeProps) {
  const t = useT();
  const h = healthWord(cur, max);
  const sm = size === 'sm';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: 'var(--font-display)',
        textTransform: 'uppercase',
        letterSpacing: '0.14em',
        fontSize: sm ? 10 : 12,
        color: h.c,
      }}
    >
      <Rune kind={h.glyph} size={sm ? 9 : 10} color={h.c} />
      {t(h.key)}
    </span>
  );
}

/* ── HP bar ──────────────────────────────────────────────────── */

interface CombatHPBarProps {
  cur: number;
  max: number;
  temp?: number;
  size?: 'md' | 'lg';
  showNumbers?: boolean;
}

export function CombatHPBar({ cur, max, temp = 0, size = 'md', showNumbers = true }: CombatHPBarProps) {
  const t = useT();
  const lg = size === 'lg';
  const pct = Math.max(0, Math.min(100, (cur / max) * 100));
  const tempPct = Math.min(100 - pct, (temp / max) * 100);
  const r = cur / max;
  const fill =
    r <= 0.25
      ? 'linear-gradient(90deg, #7d2f10, #b3461a)'
      : r <= 0.6
      ? 'linear-gradient(90deg, #836a3a, #b08d4e)'
      : 'linear-gradient(90deg, #3d5a44, #7a9866)';
  return (
    <div style={{ minWidth: 0 }}>
      {showNumbers && (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 3 }}>
          <span className="ao-num" style={{ fontSize: lg ? 22 : 15, fontWeight: 600, color: 'var(--ink-bright)' }}>{cur}</span>
          <span className="ao-num" style={{ fontSize: lg ? 14 : 11, color: 'var(--ink-faint)' }}>/ {max}</span>
          {temp > 0 && (
            <span className="ao-num" style={{ fontSize: lg ? 12 : 10, color: 'var(--arcane)' }}>
              +{temp} {t('combat.tempShort')}
            </span>
          )}
        </div>
      )}
      <div className="ao-bar" style={{ height: lg ? 8 : 6 }}>
        <div style={{ display: 'flex', height: '100%' }}>
          <div style={{ width: `${pct}%`, background: fill, boxShadow: '0 0 8px rgba(0,0,0,0.4)', transition: 'width 400ms ease-out' }} />
          {temp > 0 && (
            <div
              style={{
                width: `${tempPct}%`,
                background: 'repeating-linear-gradient(45deg, var(--arcane-deep) 0 4px, var(--arcane) 4px 8px)',
                opacity: 0.7,
                transition: 'width 400ms',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ── AC badge ────────────────────────────────────────────────── */

interface ACBadgeProps {
  value: number;
  size?: 'sm' | 'md';
}

export function ACBadge({ value, size = 'md' }: ACBadgeProps) {
  const t = useT();
  const sm = size === 'sm';
  return (
    <span
      title={t('combat.acTitle', { value })}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: sm ? 26 : 34, height: sm ? 28 : 38, flexShrink: 0 }}
    >
      <Rune kind="shield" size={sm ? 26 : 34} color="var(--bronze-warm)" />
      <span className="ao-num" style={{ position: 'absolute', fontSize: sm ? 10 : 12, fontWeight: 600, color: 'var(--ink-bright)', marginTop: -2 }}>
        {value}
      </span>
    </span>
  );
}

/* ── Combat portrait ─────────────────────────────────────────── */

interface CombatPortraitProps {
  kind?: ParticipantKind;
  size?: number;
  dim?: boolean;
  unknown?: boolean;
}

export function CombatPortrait({ kind = 'pc', size = 44, dim = false, unknown = false }: CombatPortraitProps) {
  const glyph = unknown ? 'cir' : kind === 'pc' ? 'helm' : kind === 'npc' ? 'scroll' : 'flame';
  return (
    <div
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        background: 'var(--abyss)',
        border: '1px solid var(--rule)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)',
        opacity: dim ? 0.45 : 1,
        position: 'relative',
      }}
    >
      {unknown ? (
        <span style={{ fontFamily: 'var(--font-serif)', fontSize: size * 0.55, color: 'var(--ink-faint)' }}>?</span>
      ) : (
        <Rune kind={glyph} size={size * 0.5} color={dim ? 'var(--ink-ghost)' : 'var(--ink-quiet)'} />
      )}
    </div>
  );
}

/* ── Participant card ────────────────────────────────────────── */

interface ParticipantCardProps {
  p: Participant;
  active?: boolean;
  view?: 'gm' | 'player';
  isSelf?: boolean;
  targeted?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

export function ParticipantCard({ p, active = false, view = 'gm', isSelf = false, targeted = false, onClick, compact = false }: ParticipantCardProps) {
  const t = useT();
  const down = p.cur <= 0;
  const hiddenForPlayer = view === 'player' && p.hidden;
  const showNumbers = view === 'gm' || isSelf;
  const dim = down;
  const name = hiddenForPlayer ? t('combat.unknownCreature') : p.name;
  const quick: [string, string][] = [
    ['sword', t('combat.kind.damage')],
    ['plus', t('combat.kind.heal')],
    ['eye', t('combat.npc.visible')],
    ['dots', t('combat.menu')],
  ];
  return (
    <div
      className={`cb-card ${active ? 'cb-card--active' : ''}`}
      onClick={onClick}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: compact ? '8px 10px' : '10px 12px',
        background: active
          ? 'linear-gradient(90deg, rgba(176,141,78,0.10), var(--panel))'
          : down
          ? 'var(--stone)'
          : 'linear-gradient(180deg, var(--panel-raised), var(--panel))',
        border: `1px solid ${active ? 'var(--gold)' : targeted ? 'var(--ember)' : 'var(--rule)'}`,
        boxShadow: active
          ? 'var(--shadow-inset), 0 0 16px rgba(176,141,78,0.18)'
          : targeted
          ? 'var(--shadow-inset), 0 0 12px rgba(179,70,26,0.2)'
          : 'var(--shadow-inset)',
        opacity: down ? 0.6 : 1,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 180ms',
      }}
    >
      {active && (
        <span
          style={{
            position: 'absolute',
            left: -1,
            top: -1,
            bottom: -1,
            width: 3,
            background: 'linear-gradient(180deg, var(--gold-pale), var(--gold-deep))',
            boxShadow: '0 0 8px rgba(176,141,78,0.5)',
          }}
        />
      )}
      <div style={{ width: 34, flexShrink: 0, textAlign: 'center' }}>
        <div className="ao-num" style={{ fontSize: 20, fontWeight: 600, color: active ? 'var(--gold-pale)' : hiddenForPlayer ? 'var(--ink-faint)' : 'var(--ink)' }}>
          {hiddenForPlayer ? '—' : p.init}
        </div>
        <div className="ao-overline" style={{ fontSize: 8, letterSpacing: '0.16em' }}>{t('combat.initShort')}</div>
      </div>
      <CombatPortrait kind={p.kind} size={compact ? 38 : 44} dim={dim} unknown={hiddenForPlayer} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {down && <Rune kind="cir-dot" size={11} color="var(--ink-faint)" />}
          <span
            className="ao-h6"
            style={{
              fontSize: 14,
              color: down ? 'var(--ink-faint)' : hiddenForPlayer ? 'var(--ink-quiet)' : 'var(--ink-bright)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontStyle: hiddenForPlayer ? 'italic' : 'normal',
            }}
          >
            {name}
          </span>
          {view === 'gm' && p.hidden && <Rune kind="eye" size={12} color="var(--ink-faint)" />}
          {isSelf && <OrdoChip tone="gold">{t('combat.you')}</OrdoChip>}
        </div>
        {down ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>
              ☠ {t('combat.downCap')}
            </span>
          </div>
        ) : hiddenForPlayer ? (
          <div className="ao-italic" style={{ fontSize: 12, marginTop: 3, color: 'var(--ink-faint)' }}>{t('combat.detailsHidden')}</div>
        ) : showNumbers ? (
          <div style={{ marginTop: 3 }}>
            <CombatHPBar cur={p.cur} max={p.max} temp={p.temp} />
          </div>
        ) : (
          <div style={{ marginTop: 5 }}>
            <HealthWordBadge cur={p.cur} max={p.max} size="sm" />
          </div>
        )}
        {!down && !hiddenForPlayer && p.conds && p.conds.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
            {p.conds.map((c) => (
              <ConditionChip key={c} id={c} size="sm" />
            ))}
          </div>
        )}
      </div>
      {!hiddenForPlayer && !down && <ACBadge value={p.ac} size={compact ? 'sm' : 'md'} />}
      {view === 'gm' && !down && (
        <div
          className="cb-quick"
          style={{ position: 'absolute', right: 8, top: -13, display: 'flex', gap: 4, background: 'var(--abyss)', border: '1px solid var(--brass)', padding: 3, boxShadow: 'var(--shadow-mid)', zIndex: 4 }}
        >
          {quick.map(([g, title]) => (
            <button key={g} className="ao-iconbtn" title={title} style={{ width: 26, height: 26, borderColor: 'transparent' }}>
              <Rune kind={g} size={13} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Encounter status badge ──────────────────────────────────── */

interface EncounterStatusBadgeProps {
  status?: EncStatus;
  round?: number;
}

export function EncounterStatusBadge({ status = 'DRAFT', round }: EncounterStatusBadgeProps) {
  const t = useT();
  const m = ENC_STATUS[status];
  const pulse = status === 'ACTIVE';
  const label = t(m.labelKey);
  return (
    <span
      className={pulse ? 'cb-pulse' : ''}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        padding: '4px 10px',
        background: 'rgba(0,0,0,0.45)',
        border: `1px solid ${m.c}`,
        fontFamily: 'var(--font-display)',
        fontSize: 10,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color: m.c,
      }}
    >
      <Rune kind={m.glyph} size={9} color={m.c} />
      {pulse && round ? t('combat.encStatus.round', { label, round }) : label}
    </span>
  );
}

/* ── Avatar stack ────────────────────────────────────────────── */

interface AvatarStackProps {
  kinds?: ParticipantKind[];
  extra?: number;
  size?: number;
}

export function AvatarStack({ kinds = [], extra = 0, size = 28 }: AvatarStackProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {kinds.map((k, i) => (
        <div
          key={i}
          style={{
            width: size,
            height: size,
            marginLeft: i === 0 ? 0 : -8,
            background: 'var(--panel-raised)',
            border: '1px solid var(--rule-strong)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
          }}
        >
          <Rune kind={k === 'pc' ? 'helm' : k === 'npc' ? 'scroll' : 'flame'} size={size * 0.5} color="var(--ink-quiet)" />
        </div>
      ))}
      {extra > 0 && (
        <div style={{ width: size, height: size, marginLeft: -8, background: 'var(--abyss)', border: '1px solid var(--rule)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="ao-codex" style={{ fontSize: 9 }}>+{extra}</span>
        </div>
      )}
    </div>
  );
}

/* ── Attack result card ──────────────────────────────────────── */

type AtkMode = 'MISS' | 'HIT' | 'CRIT';

interface AttackResultCardProps {
  mode?: AtkMode;
  roll?: number;
  bonus?: number;
  vsAC?: number;
  dmg?: number | null;
  dmgType?: string;
  compact?: boolean;
}

export function AttackResultCard({ mode = 'HIT', roll = 14, bonus = 5, vsAC = 15, dmg, dmgType = 'slashing', compact = false }: AttackResultCardProps) {
  const t = useT();
  const palette: Record<AtkMode, { c: string; glyph: string; bg: string }> = {
    MISS: { c: 'var(--ink-quiet)', glyph: 'x', bg: 'var(--stone)' },
    HIT: { c: '#7a9866', glyph: 'check', bg: 'rgba(122,152,102,0.06)' },
    CRIT: { c: 'var(--gold-pale)', glyph: 'sigil-2', bg: 'rgba(176,141,78,0.08)' },
  };
  const M = palette[mode];
  const total = roll + bonus;
  const dmgTypeKey = `combat.dmgType.${dmgType.toLowerCase()}`;
  return (
    <div
      className={mode === 'CRIT' ? 'cb-pulse' : ''}
      style={{
        border: `1px solid ${M.c}`,
        background: `linear-gradient(180deg, ${M.bg}, var(--panel))`,
        boxShadow: mode === 'CRIT' ? '0 0 24px rgba(212,180,120,0.25), var(--shadow-inset)' : 'var(--shadow-inset)',
        padding: compact ? 14 : 20,
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            width: compact ? 44 : 56,
            height: compact ? 44 : 56,
            flexShrink: 0,
            border: `1px solid ${M.c}`,
            background: 'var(--abyss)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `inset 0 0 14px ${mode === 'MISS' ? 'rgba(0,0,0,0.5)' : M.c + '22'}`,
          }}
        >
          <Rune kind={M.glyph} size={compact ? 20 : 26} color={M.c} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: compact ? 13 : 16, color: M.c, fontWeight: 600 }}>
            {t(`combat.atk.${mode}`)}
          </div>
          <div className="ao-codex" style={{ marginTop: 4 }}>
            {t('combat.d20')}: <span style={{ color: mode === 'CRIT' ? 'var(--gold-pale)' : 'var(--ink-bright)' }}>{roll}</span> + {bonus} ={' '}
            <span style={{ color: 'var(--ink-bright)' }}>{total}</span> {t('combat.atk.against')} {vsAC}
          </div>
          <div className="ao-italic" style={{ fontSize: 12, marginTop: 2 }}>{t(`combat.atk.${mode}.note`)}</div>
        </div>
        {mode !== 'MISS' && dmg != null && (
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div className="ao-num" style={{ fontSize: compact ? 26 : 34, fontWeight: 600, color: M.c, lineHeight: 1 }}>−{dmg}</div>
            <div className="ao-codex" style={{ marginTop: 3, color: 'var(--ink-faint)' }}>{t(dmgTypeKey)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Combat log ──────────────────────────────────────────────── */

const LOG_GLYPH: Record<string, string> = {
  attack: 'sword',
  heal: 'plus',
  cond: 'flame',
  note: 'scroll',
  turn: 'chev-r',
  down: 'x',
  roll: 'hex',
};

interface LogEntryProps {
  type?: LogType;
  text?: string;
  detail?: string;
  time?: string;
  open?: boolean;
}

export function LogEntry({ type = 'attack', text, detail, time = '00:00', open = false }: LogEntryProps) {
  const t = useT();
  const tone = type === 'down' ? '#d8896a' : type === 'heal' ? '#7a9866' : type === 'note' ? 'var(--arcane)' : 'var(--ink-quiet)';
  return (
    <div className="cb-log-row" style={{ padding: '8px 12px', borderBottom: '1px solid var(--hairline)' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <Rune kind={LOG_GLYPH[type] || 'diamond'} size={12} color={tone} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, color: 'var(--ink)', lineHeight: 1.45 }}>{text}</div>
          {detail && open && (
            <div className="ao-codex" style={{ marginTop: 6, padding: '6px 10px', background: 'var(--abyss)', border: '1px solid var(--hairline)' }}>{detail}</div>
          )}
          {detail && !open && <button className="cb-linkbtn">{t('combat.detailsToggle')} ▾</button>}
        </div>
        <span className="ao-codex" style={{ fontSize: 9, flexShrink: 0 }}>{time}</span>
      </div>
    </div>
  );
}

interface RoundDividerProps {
  n: number;
}

export function RoundDivider({ n }: RoundDividerProps) {
  const t = useT();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px 4px' }}>
      <span style={{ flex: 1, height: 1, background: 'var(--rule)' }} />
      <span className="ao-overline" style={{ color: 'var(--gold)' }}>{t('combat.round', { n })}</span>
      <span style={{ flex: 1, height: 1, background: 'var(--rule)' }} />
    </div>
  );
}

/* ── Toast card ──────────────────────────────────────────────── */

interface ToastCardProps {
  tone?: 'success' | 'error' | 'turn';
  title: string;
  body?: string;
  action?: ReactNode;
}

export function ToastCard({ tone = 'success', title, body, action }: ToastCardProps) {
  const m = { success: { c: '#7a9866', glyph: 'check' }, error: { c: '#d8896a', glyph: 'x' }, turn: { c: 'var(--gold-pale)', glyph: 'sword' } }[tone];
  return (
    <div className="ao-toast" style={{ borderLeftColor: m.c, alignItems: 'flex-start' }}>
      <span style={{ width: 30, height: 30, flexShrink: 0, border: `1px solid ${m.c}`, background: 'var(--abyss)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Rune kind={m.glyph} size={14} color={m.c} />
      </span>
      <div style={{ flex: 1 }}>
        <div className="ao-engraved" style={{ fontSize: 12, color: m.c === '#d8896a' ? '#d8896a' : 'var(--ink-bright)' }}>{title}</div>
        {body && <div style={{ fontSize: 12.5, marginTop: 3, color: 'var(--ink-quiet)' }}>{body}</div>}
        {action && <div style={{ marginTop: 8 }}>{action}</div>}
      </div>
      <Rune kind="x" size={11} color="var(--ink-faint)" />
    </div>
  );
}

/* ── State banner ────────────────────────────────────────────── */

interface StateBannerProps {
  kind?: 'paused' | 'reconnect';
}

export function StateBanner({ kind = 'paused' }: StateBannerProps) {
  const t = useT();
  const paused = kind === 'paused';
  const c = paused ? 'var(--gold-pale)' : 'var(--arcane)';
  return (
    <div
      className={paused ? '' : 'cb-pulse'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 16px',
        background: paused
          ? 'linear-gradient(90deg, rgba(176,141,78,0.10), rgba(176,141,78,0.03))'
          : 'linear-gradient(90deg, rgba(90,142,148,0.12), rgba(90,142,148,0.03))',
        border: `1px solid ${paused ? 'var(--brass)' : 'var(--arcane-deep)'}`,
      }}
    >
      <Rune kind={paused ? 'minus' : 'cir-dot'} size={13} color={c} />
      <span className="ao-engraved" style={{ fontSize: 12, color: c }}>{paused ? t('combat.banner.pausedTag') : t('combat.banner.reconnectTag')}</span>
      <span className="ao-italic" style={{ fontSize: 12.5, color: 'var(--ink-quiet)' }}>{paused ? t('combat.banner.pausedBody') : t('combat.banner.reconnectBody')}</span>
      <span style={{ flex: 1 }} />
      {paused ? <button className="ao-btn ao-btn--sm">{t('combat.banner.resume')}</button> : <span className="ao-codex">{t('combat.banner.attempt')}</span>}
    </div>
  );
}

/* ── Attitude badge ──────────────────────────────────────────── */

interface AttitudeBadgeProps {
  kind?: Attitude;
}

export function AttitudeBadge({ kind = 'friendly' }: AttitudeBadgeProps) {
  const t = useT();
  const m = ATTITUDE[kind];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        padding: '4px 11px',
        background: 'rgba(0,0,0,0.45)',
        border: `1px solid ${m.c}`,
        borderLeft: `2px solid ${m.c}`,
        fontFamily: 'var(--font-display)',
        fontSize: 10,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: m.c,
      }}
    >
      <Rune kind={m.glyph} size={9} color={m.c} />
      {t(m.labelKey)}
    </span>
  );
}

/* ── Quest status badge ──────────────────────────────────────── */

interface QuestStatusBadgeProps {
  s: QuestStatus;
}

export function QuestStatusBadge({ s }: QuestStatusBadgeProps) {
  const t = useT();
  const m = QUEST_STATUS[s];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 9px',
        border: `1px solid ${m.c}66`,
        background: 'rgba(0,0,0,0.4)',
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: m.c,
      }}
    >
      {t(m.labelKey)}
    </span>
  );
}

/* ── Linked panel ────────────────────────────────────────────── */

interface LinkedPanelProps {
  title: string;
  glyph: string;
  items: string[];
  addLabel: string;
}

export function LinkedPanel({ title, glyph, items, addLabel }: LinkedPanelProps) {
  const t = useT();
  return (
    <OrdoPanel padding={0}>
      <PanelHeader title={title} glyph={glyph} right={<span className="ao-codex">{items.length}</span>} />
      <div style={{ padding: 14, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {items.map((it) => (
          <span
            key={it}
            className="cb-linkchip"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 11px', background: 'var(--abyss)', border: '1px solid var(--rule-strong)', fontSize: 12.5, color: 'var(--ink)', cursor: 'pointer' }}
          >
            <Rune kind={glyph} size={11} color="var(--ink-quiet)" />
            {it}
            <button title={t('combat.quest.unlink')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', padding: 0, display: 'flex' }}>
              <Rune kind="x" size={10} />
            </button>
          </span>
        ))}
        <button className="ao-btn ao-btn--sm ao-btn--ghost">
          <Rune kind="plus" size={9} /> {addLabel}
        </button>
      </div>
    </OrdoPanel>
  );
}

/* ── Portrait uploader (state machine preview) ───────────────── */

interface PortraitUploaderProps {
  state?: 'empty' | 'preview' | 'uploading' | 'error';
  size?: number;
}

export function PortraitUploader({ state = 'empty', size = 132 }: PortraitUploaderProps) {
  const t = useT();
  const base = {
    width: size,
    height: size,
    border: '1px solid var(--rule-strong)',
    position: 'relative' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    background: 'var(--abyss)',
    flexShrink: 0,
  };
  if (state === 'preview') {
    return (
      <div style={base}>
        <Placeholder style={{ position: 'absolute', inset: 0 }}>{t('combat.portrait.npc')}</Placeholder>
        <div className="cb-quick" style={{ position: 'absolute', inset: 'auto 0 0 0', display: 'flex', gap: 0, background: 'rgba(5,4,3,0.85)' }}>
          <button className="ao-btn ao-btn--sm" style={{ flex: 1, border: 'none' }}>{t('combat.portrait.replace')}</button>
          <button className="ao-btn ao-btn--sm" style={{ flex: 1, border: 'none', color: '#d8896a' }}>{t('combat.portrait.remove')}</button>
        </div>
      </div>
    );
  }
  if (state === 'uploading') {
    return (
      <div style={base}>
        <Rune kind="cir-dot" size={26} color="var(--arcane)" />
        <span className="ao-codex">{t('combat.portrait.uploading')}</span>
        <div className="ao-bar" style={{ width: '70%' }}>
          <div className="ao-bar-fill ao-bar-fill--arcane" style={{ width: '64%' }} />
        </div>
      </div>
    );
  }
  if (state === 'error') {
    return (
      <div style={{ ...base, borderColor: 'rgba(179,70,26,0.6)' }}>
        <Rune kind="x" size={24} color="#d8896a" />
        <span style={{ fontSize: 11, color: '#d8896a', textAlign: 'center', padding: '0 10px' }}>{t('combat.portrait.tooBig')}</span>
        <button className="ao-btn ao-btn--sm">{t('combat.portrait.retry')}</button>
      </div>
    );
  }
  return (
    <div style={{ ...base, borderStyle: 'dashed', cursor: 'pointer' }} className="cb-hoverable">
      <Rune kind="plus" size={22} color="var(--ink-faint)" />
      <span className="ao-codex" style={{ textAlign: 'center', padding: '0 8px' }}>{t('combat.portrait.drop')}</span>
    </div>
  );
}
