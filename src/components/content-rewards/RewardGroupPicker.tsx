import { OrdoChip, Rune } from '@/components/ordo';
import { useI18n, useT } from '@/i18n/I18nContext';
import { localizedName } from '@/lib/contentAdapters';
import { cn } from '@/lib/utils';
import { RewardGroupView } from './RewardGroupRenderer';
import { SpellGrantPicker } from './SpellGrantPicker';
import { grantKind } from './grants';
import {
  abilityTotalRequired,
  activeGrants,
  grantChildSatisfied,
  grantNeedsChild,
  type ChildSelections,
  type GrantChildSelection,
} from '@/pages/gm/campaigns/contentLevelUp';
import type { ContentLabel, ContentRewardGrant, RewardGroup, SpellReferenceResponse } from '@/types';
import s from './RewardGroupPicker.module.css';

/**
 * Reference data the pickers use to resolve the id-lists the backend emits
 * (ability/skill/spell ids) into displayable labels and selectable pools.
 * Optional throughout: when omitted, grants that already carry pre-resolved label
 * arrays (test fixtures) still render.
 */
export interface RewardPickerCatalogs {
  /** All abilities/stat types (id -> label) for ABILITY_SCORE grants. */
  abilities?: ContentLabel[];
  /** All proficiency skills (id -> label) for SKILL grants, incl. ANY mode. */
  skills?: ContentLabel[];
  /** All spells (with level + class availability) for SPELL grant pools. */
  spells?: SpellReferenceResponse[];
  /** Class being leveled — narrows the spell pool to that class's list. */
  classId?: string;
  /** Skill ids the character already has — required for Expertise grants. */
  proficientSkillIds?: string[];
  /** Active campaign — lets the spell detail pane fetch campaign-scoped spell data. */
  campaignId?: string;
}

const byId = (catalog: ContentLabel[] | undefined, ids: string[] | undefined): ContentLabel[] =>
  (ids ?? []).map((id) => catalog?.find((c) => c.id === id) ?? { id, name: id });

/** Resolves the ability candidates for an ABILITY_SCORE grant (labels or id-list). */
function abilityPoolFor(grant: ContentRewardGrant, catalogs?: RewardPickerCatalogs): ContentLabel[] {
  if (grant.abilityOptions?.length) return grant.abilityOptions;
  return byId(catalogs?.abilities, grant.abilityOptionIds);
}

/** Resolves the selectable skills for a SKILL grant (fixtures, id-list, or ANY). */
function skillPoolFor(grant: ContentRewardGrant, catalogs?: RewardPickerCatalogs): ContentLabel[] {
  let pool: ContentLabel[];
  if (grant.skillOptions?.length) pool = grant.skillOptions;
  else if (grant.anySkill) pool = catalogs?.skills ?? [];
  else pool = byId(catalogs?.skills, grant.skillOptionIds);
  // Expertise: only skills the character is already proficient in are eligible.
  if (grant.grantsExpertise && catalogs?.proficientSkillIds) {
    const proficient = new Set(catalogs.proficientSkillIds);
    pool = pool.filter((sk) => proficient.has(sk.id));
  }
  return pool;
}

/** Resolves the selectable spells for a SPELL grant, filtered by class + level.
   Returns full references (level/school/description) so the grouped picker can
   bucket by circle + school and seed its detail pane without a refetch. */
function spellPoolFor(grant: ContentRewardGrant, catalogs?: RewardPickerCatalogs): SpellReferenceResponse[] {
  const all = catalogs?.spells ?? [];
  const classId = catalogs?.classId;
  const exactLevel = grant.spellLevel;
  const lo = grant.minLevel;
  const hi = grant.maxLevel;
  return all
    .filter((sp) => (classId ? sp.availableToClassIds?.includes(classId) : true))
    .filter((sp) => {
      if (exactLevel != null) return sp.level === exactLevel;
      if (lo != null || hi != null) return sp.level >= (lo ?? 0) && sp.level <= (hi ?? 9);
      return true;
    });
}

export interface RewardGroupPickerProps {
  group: RewardGroup;
  optionIds: string[];
  onOptionsChange: (ids: string[]) => void;
  child: ChildSelections;
  onChildChange: (grantId: string, sel: GrantChildSelection) => void;
  catalogs?: RewardPickerCatalogs;
}

/**
 * Reward group picker: option selection (via RewardGroupView) plus the
 * per-grant child choices required to build a ContentRewardSelection — ability
 * point distribution, skill picks (incl. Expertise) and spell/cantrip picks.
 */
export function RewardGroupPicker({
  group,
  optionIds,
  onOptionsChange,
  child,
  onChildChange,
  catalogs,
}: RewardGroupPickerProps) {
  const childGrants = activeGrants(group, optionIds).filter(grantNeedsChild);
  return (
    <div className={s.wrap}>
      <RewardGroupView group={group} selectedOptionIds={optionIds} onChange={onOptionsChange} />
      {childGrants.map((g) => (
        <GrantChild
          key={g.id}
          grant={g}
          sel={child[g.id]}
          onChange={(sel) => onChildChange(g.id, sel)}
          catalogs={catalogs}
        />
      ))}
    </div>
  );
}

function GrantChild({
  grant,
  sel,
  onChange,
  catalogs,
}: {
  grant: ContentRewardGrant;
  sel?: GrantChildSelection;
  onChange: (sel: GrantChildSelection) => void;
  catalogs?: RewardPickerCatalogs;
}) {
  const kind = grantKind(grant.grantType);
  if (kind === 'ABILITY') return <AbilityChild grant={grant} sel={sel} onChange={onChange} catalogs={catalogs} />;
  if (kind === 'SKILL') return <SkillChild grant={grant} sel={sel} onChange={onChange} catalogs={catalogs} />;
  if (kind === 'SPELL') return <SpellChild grant={grant} sel={sel} onChange={onChange} catalogs={catalogs} />;
  return null;
}

function AbilityChild({
  grant,
  sel,
  onChange,
  catalogs,
}: {
  grant: ContentRewardGrant;
  sel?: GrantChildSelection;
  onChange: (sel: GrantChildSelection) => void;
  catalogs?: RewardPickerCatalogs;
}) {
  const t = useT();
  const { lang } = useI18n();
  const abilities = abilityPoolFor(grant, catalogs);
  const total = abilityTotalRequired(grant);
  const maxPer = grant.maxPerAbility ?? grant.bonusPerChoice ?? total;
  const points = sel?.abilities ?? {};
  const used = Object.values(points).reduce((sum, v) => sum + v, 0);
  const left = total - used;
  const ok = grantChildSatisfied(grant, sel);

  const set = (id: string, value: number) => {
    const next = { ...points, [id]: value };
    if (value <= 0) delete next[id];
    onChange({ ...sel, abilities: next });
  };

  return (
    <div className={cn('ao-panel ao-frame', s.child)}>
      <span className="ao-frame-c" />
      <div className={s.head}>
        <span className="ao-overline">{grant.label || t('camp.lvl.asi.title')}</span>
        <div className="ao-row ao-gap-6">
          <span className={cn('ao-codex', s.hint)}>{t('camp.lvl.child.distribute', { total, left })}</span>
          {maxPer < total && <span className={cn('ao-codex', s.hint)}>· {t('camp.lvl.child.maxPer', { max: maxPer })}</span>}
          {ok && <OrdoChip tone="gold" glyph="check">ok</OrdoChip>}
        </div>
      </div>
      <div className={s.abilities}>
        {abilities.map((a) => {
          const value = points[a.id] ?? 0;
          return (
            <div key={a.id} className={cn(s.abilityRow, value > 0 && s.active)}>
              <span className={s.abilityName}>{localizedName(a, lang)}</span>
              <button
                className="ao-iconbtn"
                disabled={value <= 0}
                onClick={() => set(a.id, value - 1)}
              >
                <Rune kind="minus" size={11} />
              </button>
              <span className={s.abilityVal}>+{value}</span>
              <button
                className="ao-iconbtn"
                disabled={left <= 0 || value >= maxPer}
                onClick={() => set(a.id, value + 1)}
              >
                <Rune kind="plus" size={11} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SkillChild({
  grant,
  sel,
  onChange,
  catalogs,
}: {
  grant: ContentRewardGrant;
  sel?: GrantChildSelection;
  onChange: (sel: GrantChildSelection) => void;
  catalogs?: RewardPickerCatalogs;
}) {
  const t = useT();
  const { lang } = useI18n();
  const options = skillPoolFor(grant, catalogs);
  const need = grant.chooseCount ?? 1;
  const chosen = sel?.skills ?? [];
  const ok = grantChildSatisfied(grant, sel);

  const toggle = (id: string) => {
    if (chosen.includes(id)) {
      onChange({ ...sel, skills: chosen.filter((x) => x !== id) });
    } else if (chosen.length < need) {
      onChange({ ...sel, skills: [...chosen, id] });
    }
  };

  return (
    <div className={cn('ao-panel ao-frame', s.child)}>
      <span className="ao-frame-c" />
      <div className={s.head}>
        <span className="ao-overline">
          {grant.label || (grant.grantsExpertise ? t('camp.lvl.expertise') : t('camp.lvl.skills'))}
        </span>
        <div className="ao-row ao-gap-6">
          <span className={cn('ao-codex', s.hint)}>{t('camp.lvl.child.chooseSkills', { count: need, chosen: chosen.length })}</span>
          {ok && <OrdoChip tone="gold" glyph="check">ok</OrdoChip>}
        </div>
      </div>
      {options.length === 0 ? (
        <span className={cn('ao-codex', s.empty)}>{t('camp.lvl.child.noSkills')}</span>
      ) : (
        <div className={s.chips}>
          {options.map((o) => {
            const on = chosen.includes(o.id);
            const atLimit = chosen.length >= need && !on;
            return (
              <button
                key={o.id}
                type="button"
                className={cn(s.chip, on && s.on)}
                disabled={atLimit}
                onClick={() => toggle(o.id)}
              >
                {on && <Rune kind="check" size={10} color="var(--ink-bright)" />}
                {localizedName(o, lang)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SpellChild({
  grant,
  sel,
  onChange,
  catalogs,
}: {
  grant: ContentRewardGrant;
  sel?: GrantChildSelection;
  onChange: (sel: GrantChildSelection) => void;
  catalogs?: RewardPickerCatalogs;
}) {
  const t = useT();
  const options = spellPoolFor(grant, catalogs);
  const need = grant.chooseCount ?? 1;
  const chosen = sel?.spells ?? [];
  const ok = grantChildSatisfied(grant, sel);
  const isCantrip = grant.spellLevel === 0;

  const toggle = (id: string) => {
    if (chosen.includes(id)) {
      onChange({ ...sel, spells: chosen.filter((x) => x !== id) });
    } else if (chosen.length < need) {
      onChange({ ...sel, spells: [...chosen, id] });
    }
  };

  return (
    <div className={cn('ao-panel ao-frame', s.child)}>
      <span className="ao-frame-c" />
      <div className={s.head}>
        <span className="ao-overline">
          {grant.label || (isCantrip ? t('camp.lvl.cantrips') : t('camp.lvl.spells'))}
        </span>
        <div className="ao-row ao-gap-6">
          <span className={cn('ao-codex', s.hint)}>{t('camp.lvl.child.chooseSpells', { count: need, chosen: chosen.length })}</span>
          {ok && <OrdoChip tone="gold" glyph="check">ok</OrdoChip>}
        </div>
      </div>
      {options.length === 0 ? (
        <span className={cn('ao-codex', s.empty)}>{t('camp.lvl.child.noSpells')}</span>
      ) : (
        <SpellGrantPicker
          pool={options}
          chosen={chosen}
          need={need}
          onToggle={toggle}
          campaignId={catalogs?.campaignId}
        />
      )}
    </div>
  );
}
