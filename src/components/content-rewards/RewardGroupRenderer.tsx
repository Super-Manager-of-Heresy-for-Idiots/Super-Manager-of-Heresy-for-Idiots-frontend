import { OrdoPanel, PanelHeader, OrdoChip, Rune } from '@/components/ordo';
import { useI18n, useT } from '@/i18n/I18nContext';
import { localizedName, rewardGroupChoose } from '@/lib/contentAdapters';
import { cn } from '@/lib/utils';
import type { Lang } from '@/i18n/translations';
import type { ContentLabel, ContentRewardGrant, ContentRewardOption, RewardGroup } from '@/types';
import s from './RewardGroupRenderer.module.css';

type T = (key: string, vars?: Record<string, string | number>) => string;

type GrantKind =
  | 'FEATURE' | 'SUBCLASS' | 'FEAT' | 'SPELL' | 'SKILL'
  | 'ABILITY' | 'MODIFIER' | 'CUSTOM' | 'UNKNOWN';

const GRANT_GLYPH: Record<GrantKind, string> = {
  FEATURE: 'sigil-1',
  SUBCLASS: 'shield',
  FEAT: 'diamond-fill',
  SPELL: 'sigil-3',
  SKILL: 'scroll',
  ABILITY: 'sigil-2',
  MODIFIER: 'diamond',
  CUSTOM: 'book',
  UNKNOWN: 'diamond',
};

function grantKind(grantType: string | undefined): GrantKind {
  const k = (grantType ?? '').toUpperCase().replace(/[\s-]+/g, '_');
  if (k.includes('FEATURE')) return 'FEATURE';
  if (k.includes('SUBCLASS')) return 'SUBCLASS';
  if (k.includes('FEAT')) return 'FEAT';
  if (k.includes('SPELL')) return 'SPELL';
  if (k.includes('SKILL')) return 'SKILL';
  if (k.includes('ABILITY')) return 'ABILITY';
  if (k.includes('MODIFIER') || k.includes('NUMERIC')) return 'MODIFIER';
  if (k.includes('CUSTOM') || k.includes('TEXT')) return 'CUSTOM';
  return 'UNKNOWN';
}

function grantTypeLabel(t: T, kind: GrantKind): string {
  return t(`camp.lvl.rg.${kind.toLowerCase()}`);
}

function chooseRuleLabel(t: T, optionCount: number, min: number, max: number): string {
  if (optionCount === 0) return t('camp.lvl.rg.auto');
  if (max === 1 && min <= 1) return t('camp.lvl.rg.chooseOne');
  if (max > 0 && min === max) return t('camp.lvl.rg.chooseN', { count: max });
  if (max > 0) return t('camp.lvl.rg.chooseRange', { min, max });
  return t('camp.lvl.rg.chooseAtLeast', { min: Math.max(min, 1) });
}

function abilityPrimary(grant: ContentRewardGrant, lang: Lang, t: T): string {
  const bonus = grant.bonusPerChoice ?? 1;
  if (grant.fixedAbility) {
    return t('camp.lvl.rg.abilityFixed', { bonus, ability: localizedName(grant.fixedAbility, lang) });
  }
  if (grant.totalBonus) return t('camp.lvl.rg.abilityTotal', { total: grant.totalBonus });
  return t('camp.lvl.rg.abilityChoose', { count: grant.chooseCount ?? 1, bonus });
}

function grantPrimaryText(grant: ContentRewardGrant, kind: GrantKind, lang: Lang, t: T): string {
  const name = (label?: ContentLabel) => (label ? localizedName(label, lang) : undefined);
  switch (kind) {
    case 'FEATURE': return grant.feature?.title || grant.label || t('camp.lvl.rg.feature');
    case 'SUBCLASS': return name(grant.subclass) || grant.label || t('camp.lvl.rg.subclassChoose');
    case 'FEAT': return name(grant.feat) || grant.label || t('camp.lvl.rg.featChoose');
    case 'SPELL': return name(grant.spell) || grant.label || t('camp.lvl.rg.spellChoose');
    case 'SKILL': return name(grant.fixedSkill) || grant.label || t('camp.lvl.rg.skillChoose');
    case 'ABILITY': return abilityPrimary(grant, lang, t);
    case 'MODIFIER': return grant.targetLabel || grant.modifierKey || grant.label || t('camp.lvl.rg.modifier');
    case 'CUSTOM': return grant.title || grant.label || t('camp.lvl.rg.custom');
    default: return grant.label || grant.grantType || t('camp.lvl.rg.unknown');
  }
}

function grantDetailText(grant: ContentRewardGrant, kind: GrantKind, lang: Lang, t: T): string | undefined {
  const join = (parts: (string | undefined)[]) => {
    const real = parts.filter((p): p is string => !!p);
    return real.length ? real.join(' · ') : undefined;
  };
  switch (kind) {
    case 'SPELL':
      return join([
        grant.spellLevel != null ? t('camp.lvl.rg.spellLevel', { level: grant.spellLevel }) : undefined,
        grant.rawFilterText || undefined,
      ]);
    case 'SKILL': {
      if (grant.fixedSkill) return undefined;
      const count = grant.chooseCount ?? 1;
      if (grant.anySkill) return t('camp.lvl.rg.chooseSkillsAny', { count });
      const opts = (grant.skillOptions ?? []).map((o) => localizedName(o, lang)).join(', ');
      return opts
        ? t('camp.lvl.rg.chooseSkillsFrom', { count, options: opts })
        : t('camp.lvl.rg.chooseSkills', { count });
    }
    case 'ABILITY': {
      const opts = (grant.abilityOptions ?? []).map((o) => localizedName(o, lang)).join(', ');
      return join([
        !grant.fixedAbility && opts ? t('camp.lvl.rg.fromList', { options: opts }) : undefined,
        grant.maxScore != null ? t('camp.lvl.rg.maxScore', { max: grant.maxScore }) : undefined,
      ]);
    }
    case 'MODIFIER':
      return join([
        grant.amount != null
          ? `${grant.amount > 0 ? '+' : ''}${grant.amount}${grant.unitText ? ` ${grant.unitText}` : ''}`
          : undefined,
        grant.durationText || undefined,
      ]);
    case 'CUSTOM': return grant.body || undefined;
    default: return undefined;
  }
}

function GrantView({ grant, compact }: { grant: ContentRewardGrant; compact?: boolean }) {
  const t = useT();
  const { lang } = useI18n();
  const kind = grantKind(grant.grantType);
  const detail = grantDetailText(grant, kind, lang, t);
  return (
    <div className={cn(s.grant, compact && s.grantCompact)}>
      <Rune kind={GRANT_GLYPH[kind]} size={compact ? 13 : 16} color="var(--brass)" />
      <div className={s.grantMain}>
        <div className={s.grantHead}>
          <span className={cn('ao-overline', s.grantType)}>{grantTypeLabel(t, kind)}</span>
          <span className={s.grantName}>{grantPrimaryText(grant, kind, lang, t)}</span>
        </div>
        {detail && <span className={cn('ao-codex', s.grantDetail)}>{detail}</span>}
        {grant.description && <span className={cn('ao-italic', s.grantDesc)}>{grant.description}</span>}
      </div>
    </div>
  );
}

function OptionCard({
  option,
  selected,
  single,
  onToggle,
}: {
  option: ContentRewardOption;
  selected: boolean;
  single: boolean;
  onToggle: () => void;
}) {
  const t = useT();
  const grants = option.grants ?? [];
  return (
    <div
      onClick={onToggle}
      className={cn('ao-panel ao-frame', s.option, selected && s.optionSelected)}
    >
      <span className="ao-frame-c" />
      <div className={s.optionHead}>
        <span className={cn(s.optionMark, single ? s.radio : s.check, selected && s.markOn)}>
          {selected && <Rune kind="check" size={10} color="var(--ink-bright)" />}
        </span>
        <span className={cn('ao-h5', s.optionName)}>{option.label}</span>
        {option.recommended && (
          <OrdoChip glyph="diamond-fill" tone="gold">{t('camp.lvl.rg.recommended')}</OrdoChip>
        )}
      </div>
      {option.description && <p className={cn('ao-italic', s.optionDesc)}>{option.description}</p>}
      {grants.length > 0 && (
        <div className={s.optionGrants}>
          {grants.map((g) => <GrantView key={g.id} grant={g} compact />)}
        </div>
      )}
    </div>
  );
}

export interface RewardGroupRendererProps {
  group: RewardGroup;
  selectedOptionIds: string[];
  onChange: (optionIds: string[]) => void;
}

/**
 * Renders a content-shaped reward group (direct grants + selectable options) using
 * the normalized `grants`/`options` payload. Read-only for grants; options support
 * radio (chooseMax=1) or checkbox (min/max) selection. Submit wiring is deferred until
 * the backend accepts ContentLevelUpRequest.
 */
export function RewardGroupRenderer({ group, selectedOptionIds, onChange }: RewardGroupRendererProps) {
  const t = useT();
  const options = group.options ?? [];
  const directGrants = group.grants ?? [];
  const { min, max } = rewardGroupChoose(group);
  const single = max === 1;

  const toggle = (id: string) => {
    if (single) {
      onChange(selectedOptionIds.includes(id) && min === 0 ? [] : [id]);
      return;
    }
    if (selectedOptionIds.includes(id)) {
      onChange(selectedOptionIds.filter((x) => x !== id));
    } else if (max <= 0 || selectedOptionIds.length < max) {
      onChange([...selectedOptionIds, id]);
    }
  };

  const title = group.prompt || group.groupKind || t('camp.lvl.rg.reward');
  return (
    <OrdoPanel frame padding={0} className={s.group}>
      <PanelHeader title={title} glyph="scroll" sub={chooseRuleLabel(t, options.length, min, max)} tone="arcane" />
      <div className={s.body}>
        {group.description && <p className={cn('ao-italic', s.desc)}>{group.description}</p>}
        {directGrants.length > 0 && (
          <div className={s.grants}>
            {directGrants.map((g) => <GrantView key={g.id} grant={g} />)}
          </div>
        )}
        {options.length > 0 && (
          <div className={s.options}>
            {options.map((opt) => (
              <OptionCard
                key={opt.id}
                option={opt}
                selected={selectedOptionIds.includes(opt.id)}
                single={single}
                onToggle={() => toggle(opt.id)}
              />
            ))}
          </div>
        )}
      </div>
    </OrdoPanel>
  );
}
