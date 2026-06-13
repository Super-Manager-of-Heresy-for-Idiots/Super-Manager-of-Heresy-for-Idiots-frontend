import type { ReactNode } from 'react';
import { Rune } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { ASI, CharClass, Race } from '@/data/wizard5e';
import { ABILITIES } from '@/data/wizard5e';
import type {
  AvailableContentEntry,
  BackgroundResponse,
  CharacterClassDetailResponse,
  CharacterRaceDetailResponse,
  ProficiencySkillResponse,
  StatTypeResponse,
} from '@/types';
import type { ReferenceCurrencyType } from '@/api/reference.api';
import s from './parts.module.css';

// ── Shared availability + step props ───────────────────────
export interface WizardClassOption {
  key: string;
  entry: AvailableContentEntry;
  local?: CharClass;
  detail?: CharacterClassDetailResponse;
}

export interface WizardRaceOption {
  key: string;
  entry: AvailableContentEntry;
  local?: Race;
  detail?: CharacterRaceDetailResponse;
}

export interface WizardAvailability {
  classIdByKey: Record<string, string>;
  raceIdByKey: Record<string, string>;
  classOptions: WizardClassOption[];
  raceOptions: WizardRaceOption[];
  skills: AvailableContentEntry[];
  feats: AvailableContentEntry[];
  itemTypes: AvailableContentEntry[];
  backgrounds: BackgroundResponse[];
  proficiencySkills: ProficiencySkillResponse[];
  statTypes: StatTypeResponse[];
  currencies: ReferenceCurrencyType[];
}

// ── Selectable card ────────────────────────────────────────
interface WizCardProps {
  active: boolean;
  onClick: () => void;
  glyph: string;
  title: string;
  sub?: string;
  disabled?: boolean;
  children?: ReactNode;
}

export function WizCard({ active, onClick, glyph, title, sub, disabled, children }: WizCardProps) {
  return (
    <button
      type="button"
      className={'wiz-card' + (active ? ' is-active' : '')}
      onClick={onClick}
      disabled={disabled}
    >
      <div className="wiz-card-top">
        <Rune kind={glyph} size={18} color={active ? 'var(--gold)' : 'var(--ink-quiet)'} />
        <span className={cn('ao-engraved', s.cardTitle)}>{title}</span>
        {active && (
          <span className="wiz-card-check">
            <Rune kind="check" size={11} color="var(--gold-pale)" />
          </span>
        )}
      </div>
      {sub && <div className={cn('ao-codex', s.cardSub)}>{sub}</div>}
      {children}
    </button>
  );
}

interface StepHeadProps {
  n: number;
  total: number;
  title: string;
  sub?: string;
}

export function StepHead({ n, total, title, sub }: StepHeadProps) {
  const t = useT();
  return (
    <div className="wiz-step-head">
      <div className="wiz-step-eyebrow">
        <Rune kind="diamond-fill" size={8} color="var(--gold)" /> {t('wiz.parts.stepOf', { n, total })}
      </div>
      <div className={cn('ao-h4', s.stepTitle)}>{title}</div>
      {sub && <div className={cn('ao-italic', s.stepSub)}>{sub}</div>}
    </div>
  );
}

export function DetailLine({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="wiz-detail-line">
      <span className="ao-overline">{label}</span>
      <span className="wiz-detail-val">{children}</span>
    </div>
  );
}

export function asiText(asi: ASI, fmtAbbr: (s: string) => string = (s) => s): string {
  const parts = (Object.keys(asi || {}) as (keyof ASI)[]).map((k) => {
    const a = ABILITIES.find((x) => x.key === k);
    return fmtAbbr(a ? a.abbr : String(k).toUpperCase()) + ' +' + asi[k];
  });
  return parts.length ? parts.join(' \u00b7 ') : '\u2014';
}

// ── Portrait placeholder generator (data-URI SVG) ──────────
const PORTRAIT_GLYPHS: Record<string, string> = {
  diamond: '<path d="M60 28 92 60 60 92 28 60Z"/>',
  hex: '<path d="M60 26 89 43v34L60 94 31 77V43Z"/>',
  shield: '<path d="M60 28l26 10v22c0 16-10 26-26 30-16-4-26-14-26-30V38z"/>',
  flame: '<path d="M60 28c8 14 22 20 22 38a22 22 0 11-44 0c0-10 6-14 8-24 6 6 14 6 14-14z"/>',
  eye: '<path d="M24 60c14-20 58-20 72 0-14 20-58 20-72 0z"/><circle cx="60" cy="60" r="10"/>',
  cross: '<path d="M60 30v60M30 60h60"/>',
};

export function makePortrait(hue: number, glyph: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'>
    <defs><radialGradient id='g' cx='40%' cy='32%' r='80%'>
      <stop offset='0%' stop-color='hsl(${hue},32%,26%)'/><stop offset='100%' stop-color='hsl(${hue},38%,8%)'/>
    </radialGradient></defs>
    <rect width='120' height='120' fill='url(%23g)'/>
    <g fill='none' stroke='hsl(${hue},45%,62%)' stroke-width='2' opacity='0.85'>${PORTRAIT_GLYPHS[glyph]}</g>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg.replace(/%23/g, '#'));
}

export const PORTRAIT_GALLERY: { hue: number; glyph: string }[] = [
  { hue: 28, glyph: 'flame' }, { hue: 0, glyph: 'shield' }, { hue: 190, glyph: 'eye' },
  { hue: 150, glyph: 'hex' }, { hue: 268, glyph: 'diamond' }, { hue: 45, glyph: 'cross' },
];

export const CLASS_GLYPH: Record<string, string> = {
  barbarian: 'sword', bard: 'scroll', cleric: 'cross-pat', druid: 'flame', fighter: 'shield',
  monk: 'cir-dot', paladin: 'shield', ranger: 'tri', rogue: 'diamond', sorcerer: 'sigil-1',
  warlock: 'eye', wizard: 'book',
};
