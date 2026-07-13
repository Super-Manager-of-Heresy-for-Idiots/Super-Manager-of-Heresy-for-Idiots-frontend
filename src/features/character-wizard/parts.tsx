import type { ReactNode } from 'react';
import { OrdoInterfaceIcon, Rune, entityIconForGlyph, type OrdoInterfaceIconKey } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type {
  AvailableContentEntry,
  BackgroundResponse,
  CharacterClassDetailResponse,
  CharacterRaceDetailResponse,
  ProficiencySkillResponse,
  SpellReferenceResponse,
  StatTypeResponse,
} from '@/types';
import type { ReferenceCurrencyType } from '@/api/reference.api';
import s from './parts.module.css';

// ── Shared availability + step props ───────────────────────
export interface WizardClassOption {
  key: string;
  entry: AvailableContentEntry;
  detail?: CharacterClassDetailResponse;
}

export interface WizardRaceOption {
  key: string;
  entry: AvailableContentEntry;
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
  spells: SpellReferenceResponse[];
  currencies: ReferenceCurrencyType[];
}

// ── Selectable card ────────────────────────────────────────
interface WizCardProps {
  active: boolean;
  onClick: () => void;
  glyph: string;
  icon?: OrdoInterfaceIconKey;
  title: string;
  sub?: string;
  /** Опциональный бейдж рядом с названием (например, маркер происхождения homebrew). */
  badge?: ReactNode;
  disabled?: boolean;
  children?: ReactNode;
}

export function WizCard({ active, onClick, glyph, icon, title, sub, badge, disabled, children }: WizCardProps) {
  const interfaceIcon = icon ?? entityIconForGlyph(glyph);
  return (
    <button
      type="button"
      className={'wiz-card' + (active ? ' is-active' : '')}
      onClick={onClick}
      disabled={disabled}
    >
      <div className="wiz-card-top">
        {interfaceIcon ? (
          <OrdoInterfaceIcon icon={interfaceIcon} size={18} style={{ color: active ? 'var(--gold)' : 'var(--ink-quiet)' }} />
        ) : (
          <Rune kind={glyph} size={18} color={active ? 'var(--gold)' : 'var(--ink-quiet)'} />
        )}
        <span className={cn('ao-engraved', s.cardTitle)}>{title}</span>
        {badge}
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
