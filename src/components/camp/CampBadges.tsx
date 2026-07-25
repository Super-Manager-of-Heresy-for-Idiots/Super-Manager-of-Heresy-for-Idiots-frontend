import type { CSSProperties } from 'react';
import { Rune } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import type { CampParticipantState, CampStatus, LocationRestSafety } from '@/types';
import s from './CampBadges.module.css';

/* ── Camp status ─────────────────────────────────────────── */

interface StatusVisual {
  tone: string;
  glyph: string;
}

const STATUS_VISUAL: Record<CampStatus, StatusVisual> = {
  SETTING_UP:  { tone: 'var(--ink-quiet)', glyph: 'square-rot' },
  ACTIVE:      { tone: 'var(--gold)',      glyph: 'flame' },
  RESTING:     { tone: 'var(--arcane)',    glyph: 'cir-dot' },
  INTERRUPTED: { tone: 'var(--ember)',     glyph: 'sword' },
  COMPLETED:   { tone: '#7a9866',          glyph: 'check' },
};

interface CampStatusBadgeProps {
  status: CampStatus;
  size?: 'md' | 'lg';
  /** Pulse for the states where something is actively happening. */
  pulse?: boolean;
}

export function CampStatusBadge({ status, size = 'md', pulse }: CampStatusBadgeProps) {
  const t = useT();
  const visual = STATUS_VISUAL[status];
  const large = size === 'lg';

  return (
    <span
      className={`${s.status} ${large ? s.statusLg : ''} ${pulse ? s.pulse : ''}`}
      style={{ '--tone': visual.tone } as CSSProperties}
    >
      <Rune kind={visual.glyph} size={large ? 16 : 11} color={visual.tone} />
      {t(large ? `campfire.status.${status}` : `campfire.statusShort.${status}`)}
    </span>
  );
}

/* ── Location rest safety ────────────────────────────────── */

const SAFETY_VISUAL: Record<LocationRestSafety, StatusVisual> = {
  SAFE:      { tone: '#7a9866',       glyph: 'shield' },
  RISKY:     { tone: 'var(--gold)',   glyph: 'eye' },
  DANGEROUS: { tone: 'var(--ember)',  glyph: 'sword' },
};

interface CampSafetyBadgeProps {
  level: LocationRestSafety;
}

export function CampSafetyBadge({ level }: CampSafetyBadgeProps) {
  const t = useT();
  const visual = SAFETY_VISUAL[level];

  return (
    <span className={s.safety} style={{ '--tone': visual.tone } as CSSProperties}>
      <Rune kind={visual.glyph} size={11} color={visual.tone} />
      {t(`campfire.safety.${level}`)}
    </span>
  );
}

/* ── Participant rest state ──────────────────────────────── */

const REST_VISUAL: Record<CampParticipantState | 'ON_WATCH', StatusVisual> = {
  NOT_RESTED: { tone: 'var(--ink-faint)', glyph: 'minus' },
  RESTING:    { tone: 'var(--arcane)',    glyph: 'cir-dot' },
  RESTED:     { tone: '#7a9866',          glyph: 'check' },
  PARTIAL:    { tone: 'var(--gold-pale)', glyph: 'tri-inv' },
  FAILED:     { tone: '#d8896a',          glyph: 'x' },
  ON_WATCH:   { tone: 'var(--gold)',      glyph: 'eye' },
};

interface CampRestStateTagProps {
  state: CampParticipantState;
  /** A member who hasn't rested yet but holds a watch slot reads as "on watch". */
  onWatch?: boolean;
}

export function CampRestStateTag({ state, onWatch }: CampRestStateTagProps) {
  const t = useT();
  const key = onWatch && state === 'NOT_RESTED' ? 'ON_WATCH' : state;
  const visual = REST_VISUAL[key];

  return (
    <span className={s.restState} style={{ '--tone': visual.tone } as CSSProperties}>
      <Rune kind={visual.glyph} size={10} color={visual.tone} />
      {t(`campfire.rest.${key}`)}
    </span>
  );
}
