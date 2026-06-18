import { OrdoChip, Rune } from '@/components/ordo';
import { useI18n, useT } from '@/i18n/I18nContext';
import { localizedName } from '@/lib/contentAdapters';
import { cn } from '@/lib/utils';
import { RewardGroupView } from './RewardGroupRenderer';
import { grantKind } from './grants';
import {
  abilityTotalRequired,
  activeGrants,
  grantChildSatisfied,
  grantNeedsChild,
  type ChildSelections,
  type GrantChildSelection,
} from '@/pages/gm/campaigns/contentLevelUp';
import type { ContentRewardGrant, RewardGroup } from '@/types';
import s from './RewardGroupPicker.module.css';

export interface RewardGroupPickerProps {
  group: RewardGroup;
  optionIds: string[];
  onOptionsChange: (ids: string[]) => void;
  child: ChildSelections;
  onChildChange: (grantId: string, sel: GrantChildSelection) => void;
}

/**
 * Reward group picker: option selection (via RewardGroupView) plus the
 * per-grant child choices required to build a ContentRewardSelection — ability
 * point distribution and skill picks. Spell picks stay a manual/dedicated step.
 */
export function RewardGroupPicker({
  group,
  optionIds,
  onOptionsChange,
  child,
  onChildChange,
}: RewardGroupPickerProps) {
  const childGrants = activeGrants(group, optionIds).filter(grantNeedsChild);
  return (
    <div className={s.wrap}>
      <RewardGroupView group={group} selectedOptionIds={optionIds} onChange={onOptionsChange} />
      {childGrants.map((g) => (
        <GrantChild key={g.id} grant={g} sel={child[g.id]} onChange={(sel) => onChildChange(g.id, sel)} />
      ))}
    </div>
  );
}

function GrantChild({
  grant,
  sel,
  onChange,
}: {
  grant: ContentRewardGrant;
  sel?: GrantChildSelection;
  onChange: (sel: GrantChildSelection) => void;
}) {
  const kind = grantKind(grant.grantType);
  if (kind === 'ABILITY') return <AbilityChild grant={grant} sel={sel} onChange={onChange} />;
  if (kind === 'SKILL') return <SkillChild grant={grant} sel={sel} onChange={onChange} />;
  return null;
}

function AbilityChild({
  grant,
  sel,
  onChange,
}: {
  grant: ContentRewardGrant;
  sel?: GrantChildSelection;
  onChange: (sel: GrantChildSelection) => void;
}) {
  const t = useT();
  const { lang } = useI18n();
  const abilities = grant.abilityOptions ?? [];
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
}: {
  grant: ContentRewardGrant;
  sel?: GrantChildSelection;
  onChange: (sel: GrantChildSelection) => void;
}) {
  const t = useT();
  const { lang } = useI18n();
  const options = grant.skillOptions ?? [];
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
        <span className="ao-overline">{grant.label || 'Skills'}</span>
        <div className="ao-row ao-gap-6">
          <span className={cn('ao-codex', s.hint)}>{t('camp.lvl.child.chooseSkills', { count: need, chosen: chosen.length })}</span>
          {ok && <OrdoChip tone="gold" glyph="check">ok</OrdoChip>}
        </div>
      </div>
      <div className={s.skills}>
        {options.map((o) => {
          const on = chosen.includes(o.id);
          const atLimit = chosen.length >= need && !on;
          return (
            <button
              key={o.id}
              type="button"
              className={cn(s.skillChip, on && s.on)}
              disabled={atLimit}
              onClick={() => toggle(o.id)}
            >
              {on && <Rune kind="check" size={10} color="var(--ink-bright)" />}
              {localizedName(o, lang)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
