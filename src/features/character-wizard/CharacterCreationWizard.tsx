import { useEffect, useMemo, useReducer } from 'react';
import toast from 'react-hot-toast';
import { Rune, Sigil } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import type { AvailableContentEntry } from '@/types';
import type { CreateFullCharacterRequest } from '@/api/characters-full.api';
import type { ReferenceCurrencyType } from '@/api/reference.api';
import {
  ABILITIES,
  SKILLS,
  abilityKeyByStatName,
  type AbilityKey,
} from '@/data/wizard5e';
import {
  ALL_STEPS,
  freshState,
  makeActions,
  reducer,
  requirementHint,
  validate,
  type RequirementHint,
  type StepId,
  type WizardChar,
} from './wizardState';
import {
  StepAbilities,
  StepBackground,
  StepBasics,
  StepClass,
  StepRace,
  StepSpells,
  type StepProps,
} from './steps';
import { type WizardAvailability } from './parts';
import { ForgeSheetBody } from './ForgeSheetBody';
import {
  initialContentRewardGroupsOf,
  initialRewardSelectionsComplete,
  initialUnsatisfiedRewardCount,
} from './rewardSelection';
import { normalizeClassDetail } from '@/lib/contentAdapters';
import { buildContentLevelUpRequest } from '@/pages/gm/campaigns/contentLevelUp';
import css from './CharacterCreationWizard.module.css';
import type {
  BackgroundResponse,
  CharacterClassDetailResponse,
  CharacterRaceDetailResponse,
  ProficiencySkillResponse,
  SpellReferenceResponse,
  StatTypeResponse,
} from '@/types';

interface CharacterCreationWizardProps {
  campaignId: string;
  availableClasses: AvailableContentEntry[];
  availableRaces: AvailableContentEntry[];
  availableSkills?: AvailableContentEntry[];
  availableFeats?: AvailableContentEntry[];
  availableItemTypes?: AvailableContentEntry[];
  referenceClasses?: CharacterClassDetailResponse[];
  referenceRaces?: CharacterRaceDetailResponse[];
  referenceBackgrounds?: BackgroundResponse[];
  referenceProficiencySkills?: ProficiencySkillResponse[];
  referenceStatTypes?: StatTypeResponse[];
  referenceSpells?: SpellReferenceResponse[];
  availableCurrencies?: ReferenceCurrencyType[];
  submitting: boolean;
  onSubmit: (req: CreateFullCharacterRequest) => void;
  onCancel: () => void;
}

const normalizeContentName = (value: string): string => value.trim().toLowerCase();
// Spell names come from the local 5e catalog (English) and must resolve to content
// spell ids by English name; curly/straight apostrophes are unified.
const normalizeSpellName = (value: string): string =>
  value.trim().toLowerCase().replace(/[‘’]/g, "'");

function resolveSpellIds(
  names: string[] | undefined,
  byName: Map<string, string>,
): { ids: string[]; missing: string[] } {
  const ids: string[] = [];
  const missing: string[] = [];
  for (const name of names ?? []) {
    const id = byName.get(normalizeSpellName(name));
    if (id) ids.push(id);
    else missing.push(name);
  }
  return { ids, missing };
}
const scoreMethodForApi = (method: WizardChar['scoreMethod']): string => {
  if (method === 'pointbuy') return 'POINT_BUY';
  if (method === 'roll') return 'ROLL';
  return 'STANDARD_ARRAY';
};

// Traits / Ideals / Bonds / Flaws → backend biography object (omit when empty).
function buildBiography(c: WizardChar): CreateFullCharacterRequest['biography'] {
  const trim = (v: string) => (v.trim() ? v.trim() : undefined);
  const bio = {
    personalityTraits: trim(c.traits),
    ideals: trim(c.ideals),
    bonds: trim(c.bonds),
    flaws: trim(c.flaws),
  };
  return Object.values(bio).some(Boolean) ? bio : undefined;
}

// Wizard coin pools (pp/gp/ep/sp/cp) → wallet entries keyed by currency id.
function buildStartingCoins(
  c: WizardChar,
  currencies: ReferenceCurrencyType[],
): CreateFullCharacterRequest['startingCoins'] {
  if (!currencies.length) return undefined;
  const byAbbr = new Map(
    currencies
      .filter((cur) => cur.abbreviation)
      .map((cur) => [cur.abbreviation!.toLowerCase(), cur.id]),
  );
  const entries = (Object.keys(c.coins) as (keyof WizardChar['coins'])[])
    .map((key) => {
      const amount = Number(c.coins[key]) || 0;
      const currencyTypeId = byAbbr.get(key.toLowerCase());
      return amount > 0 && currencyTypeId ? { currencyTypeId, amount } : null;
    })
    .filter((entry): entry is { currencyTypeId: string; amount: number } => entry !== null);
  return entries.length ? entries : undefined;
}

function validateCampaignReferences(id: StepId, c: WizardChar, availability: WizardAvailability): boolean {
  if (id === 'race') {
    const selectedRace = availability.raceOptions.find((race) => race.key === c.raceKey);
    if (selectedRace?.detail?.subraces?.length) return !!c.subraceKey;
    return true;
  }
  if (id === 'class') {
    // Gate on level-1 content reward groups (choose-one subclass, ASI, etc.).
    const selectedClass = availability.classOptions.find((cl) => cl.key === c.classKey);
    return initialRewardSelectionsComplete(
      selectedClass?.detail?.rewardGroups,
      c.contentRewardSelections,
      c.contentRewardChildSelections,
    );
  }
  if (id !== 'background') return true;
  const selectedClass = availability.classOptions.find((cl) => cl.key === c.classKey);
  const expected = selectedClass?.detail?.skillChoiceCount;
  if (expected === undefined) return true;
  return (c.classSkills || []).length === expected;
}

function campaignReferenceHint(id: StepId, c: WizardChar, availability: WizardAvailability): RequirementHint {
  if (id === 'race') {
    const selectedRace = availability.raceOptions.find((race) => race.key === c.raceKey);
    if (selectedRace?.detail?.subraces?.length && !c.subraceKey) return { key: 'wiz.hint.chooseSubrace' };
    return { key: '' };
  }
  if (id === 'class') {
    if (!c.classKey) return { key: 'wiz.hint.chooseClass' };
    const selectedClass = availability.classOptions.find((cl) => cl.key === c.classKey);
    const pending = initialUnsatisfiedRewardCount(
      selectedClass?.detail?.rewardGroups,
      c.contentRewardSelections,
      c.contentRewardChildSelections,
    );
    return pending > 0 ? { key: 'wiz.hint.chooseRewards', vars: { count: pending } } : { key: '' };
  }
  if (id !== 'background') return { key: '' };
  const selectedClass = availability.classOptions.find((cl) => cl.key === c.classKey);
  const expected = selectedClass?.detail?.skillChoiceCount;
  if (expected === undefined) return { key: '' };
  return { key: 'wiz.hint.classSkills', vars: { count: expected, chosen: (c.classSkills || []).length } };
}

function buildAvailability(
  availableClasses: AvailableContentEntry[],
  availableRaces: AvailableContentEntry[],
  availableSkills: AvailableContentEntry[] = [],
  availableFeats: AvailableContentEntry[] = [],
  availableItemTypes: AvailableContentEntry[] = [],
  referenceClasses: CharacterClassDetailResponse[] = [],
  referenceRaces: CharacterRaceDetailResponse[] = [],
  referenceBackgrounds: BackgroundResponse[] = [],
  referenceProficiencySkills: ProficiencySkillResponse[] = [],
  referenceStatTypes: StatTypeResponse[] = [],
  referenceSpells: SpellReferenceResponse[] = [],
  availableCurrencies: ReferenceCurrencyType[] = [],
): WizardAvailability {
  const classIdByKey: Record<string, string> = {};
  const raceIdByKey: Record<string, string> = {};
  const classDetailById = new Map(referenceClasses.map((cl) => {
    const detail = normalizeClassDetail(cl);
    return [detail.id, detail] as const;
  }));
  const raceDetailById = new Map(referenceRaces.map((r) => [r.id, r]));

  const seenClassIds = new Set<string>();
  const classOptions = availableClasses
    .filter((entry) => {
      if (seenClassIds.has(entry.id)) return false;
      seenClassIds.add(entry.id);
      return true;
    })
    .map((entry) => {
      const key = `db-class:${entry.id}`;
      classIdByKey[key] = entry.id;
      return { key, entry, detail: classDetailById.get(entry.id) };
    });

  const seenRaceIds = new Set<string>();
  const raceOptions = availableRaces
    .filter((entry) => {
      if (seenRaceIds.has(entry.id)) return false;
      seenRaceIds.add(entry.id);
      return true;
    })
    .map((entry) => {
      const key = `db-race:${entry.id}`;
      raceIdByKey[key] = entry.id;
      return { key, entry, detail: raceDetailById.get(entry.id) };
    });

  return {
    classIdByKey,
    raceIdByKey,
    classOptions,
    raceOptions,
    skills: availableSkills,
    feats: availableFeats,
    itemTypes: availableItemTypes,
    backgrounds: referenceBackgrounds,
    proficiencySkills: referenceProficiencySkills,
    statTypes: referenceStatTypes,
    spells: referenceSpells,
    currencies: availableCurrencies,
  };
}

export function CharacterCreationWizard({
  campaignId,
  availableClasses,
  availableRaces,
  availableSkills = [],
  availableFeats = [],
  availableItemTypes = [],
  referenceClasses = [],
  referenceRaces = [],
  referenceBackgrounds = [],
  referenceProficiencySkills = [],
  referenceStatTypes = [],
  referenceSpells = [],
  availableCurrencies = [],
  submitting,
  onSubmit,
  onCancel,
}: CharacterCreationWizardProps) {
  const t = useT();
  const currentUser = useAuthStore((s) => s.user);
  const [st, dispatch] = useReducer(reducer, undefined, freshState);
  const { c } = st;

  const availability = useMemo(
    () => buildAvailability(
      availableClasses,
      availableRaces,
      availableSkills,
      availableFeats,
      availableItemTypes,
      referenceClasses,
      referenceRaces,
      referenceBackgrounds,
      referenceProficiencySkills,
      referenceStatTypes,
      referenceSpells,
      availableCurrencies,
    ),
    [
      availableClasses,
      availableFeats,
      availableItemTypes,
      availableRaces,
      availableSkills,
      referenceBackgrounds,
      referenceClasses,
      referenceProficiencySkills,
      referenceRaces,
      referenceStatTypes,
      referenceSpells,
      availableCurrencies,
    ],
  );

  const spellIdByName = useMemo(() => {
    const map = new Map<string, string>();
    for (const sp of referenceSpells) {
      const key = sp.nameEn ?? sp.name;
      if (key) map.set(normalizeSpellName(key), sp.id);
    }
    return map;
  }, [referenceSpells]);

  const steps = ALL_STEPS.filter((s) => !s.spellOnly || c.isSpellcaster);
  const stepIdx = Math.min(Math.max(st.step, 0), steps.length - 1);
  const current = steps[stepIdx];

  const setC = (val: WizardChar) => dispatch({ type: 'setC', c: val });
  const A = makeActions(c, setC);

  const canNext = validate(current.id, c) && validateCampaignReferences(current.id, c, availability);
  const baseHint = requirementHint(current.id, c);
  const hint = baseHint.key ? baseHint : campaignReferenceHint(current.id, c, availability);
  const isSummary = current.id === 'summary';

  const goNext = () => {
    if (canNext && stepIdx < steps.length - 1) dispatch({ type: 'goto', step: stepIdx + 1 });
  };
  const goBack = () => {
    if (stepIdx > 0) dispatch({ type: 'setStep', step: stepIdx - 1 });
  };
  const goTo = (i: number) => {
    if (i <= st.furthest) dispatch({ type: 'setStep', step: i });
  };

  // keyboard: arrows to navigate when not typing
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = ((e.target as HTMLElement)?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goBack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const handleForge = () => {
    const classId = availability.classIdByKey[c.classKey];
    const raceId = availability.raceIdByKey[c.raceKey];
    if (!classId || !raceId) {
      toast.error(t('wiz.err.classOrRace'));
      return;
    }
    const statByAbility = new Map<AbilityKey, StatTypeResponse>();
    for (const stat of availability.statTypes) {
      const key = abilityKeyByStatName(stat.name);
      if (key && !statByAbility.has(key)) statByAbility.set(key, stat);
    }
    const abilityScores = ABILITIES.map((a) => {
      const stat = statByAbility.get(a.key);
      return stat ? { statId: stat.id, baseValue: c.baseScores[a.key] || 0 } : null;
    });
    if (abilityScores.some((entry) => !entry)) {
      toast.error(t('wiz.err.statTypes'));
      return;
    }

    const background = availability.backgrounds.find((b) => c.backgroundKey === `db-background:${b.id}`);
    if (!background) {
      toast.error(t('wiz.err.background'));
      return;
    }

    const proficiencyByName = new Map(availability.proficiencySkills.map((skill) => [normalizeContentName(skill.name), skill]));
    const proficiencyById = new Map(availability.proficiencySkills.map((skill) => [skill.id, skill]));
    const chosenSkillIds = (c.classSkills || []).map((skillKey) => {
      const byId = proficiencyById.get(skillKey);
      if (byId) return byId.id;
      const skillLabel = SKILLS.find((skill) => skill.key === skillKey)?.label || skillKey;
      return proficiencyByName.get(normalizeContentName(skillLabel))?.id;
    });
    if (chosenSkillIds.some((id) => !id)) {
      toast.error(t('wiz.err.classSkills'));
      return;
    }
    const selectedClass = availability.classOptions.find((cl) => cl.key === c.classKey);
    const expectedSkillChoices = selectedClass?.detail?.skillChoiceCount;
    if (expectedSkillChoices !== undefined && chosenSkillIds.length !== expectedSkillChoices) {
      toast.error(t('wiz.err.chooseSkillsBeforeForge', { count: expectedSkillChoices }));
      return;
    }

    const selectedRace = availability.raceOptions.find((r) => r.key === c.raceKey);
    const selectedSubrace = selectedRace?.detail?.subraces?.find((subrace) => subrace.id === c.subraceKey);
    const initialRewardGroups = initialContentRewardGroupsOf(selectedClass?.detail?.rewardGroups);
    const initialRewardSelections = buildContentLevelUpRequest(
      classId,
      initialRewardGroups,
      c.contentRewardSelections,
      c.contentRewardChildSelections,
    ).selections;

    const resolvedCantrips = resolveSpellIds(c.spells.cantrips, spellIdByName);
    const resolvedSpells = resolveSpellIds(c.spells.known, spellIdByName);
    const missingSpells = [...resolvedCantrips.missing, ...resolvedSpells.missing];
    if (missingSpells.length) {
      toast.error(t('wiz.err.spellsUnresolved', { spells: missingSpells.join(', ') }));
      return;
    }
    const req: CreateFullCharacterRequest = {
      campaignId,
      name: c.name.trim(),
      playerName: currentUser?.username || undefined,
      alignment: c.alignment || undefined,
      level: c.level,
      classId,
      raceId,
      selectedLineageId: selectedSubrace?.id ?? null,
      subraceId: selectedSubrace?.id,
      raceKey: c.raceKey,
      subraceKey: c.subraceKey || undefined,
      classKey: c.classKey,
      backgroundKey: c.backgroundKey || undefined,
      backgroundId: background.id,
      abilities: ABILITIES.map((a) => ({ ability: a.key, base: c.baseScores[a.key] || 0 })),
      abilityScores: abilityScores as { statId: string; baseValue: number }[],
      scoreMethod: scoreMethodForApi(c.scoreMethod),
      skills: Object.keys(c.skills),
      classSkills: c.classSkills,
      chosenSkillIds: chosenSkillIds as string[],
      backgroundSkills: c.bgSkills,
      cantrips: c.spells.cantrips,
      cantripIds: resolvedCantrips.ids,
      spells: c.spells.known,
      spellIds: resolvedSpells.ids,
      speed: c.speed,
      armorClass: c.ac,
      maxHp: c.hp.max,
      hitDice: c.hitDiceTotal,
      avatar: c.avatar,
      features: c.features,
      proficiencies: c.proficiencies,
      biography: buildBiography(c),
      startingCoins: buildStartingCoins(c, availability.currencies),
      initialRewardSelections: initialRewardSelections.length ? initialRewardSelections : undefined,
    };
    onSubmit(req);
  };

  const stepProps: StepProps = { c, A, n: stepIdx + 1, total: steps.length, availability };

  const renderStep = () => {
    switch (current.id) {
      case 'basics': return <StepBasics {...stepProps} />;
      case 'race': return <StepRace {...stepProps} />;
      case 'class': return <StepClass {...stepProps} />;
      case 'abilities': return <StepAbilities {...stepProps} />;
      case 'background': return <StepBackground {...stepProps} />;
      case 'spells': return <StepSpells {...stepProps} />;
      case 'summary': return (
        <SummaryReview
          c={c}
          submitting={submitting}
          onEdit={() => dispatch({ type: 'setStep', step: 0 })}
          onForge={handleForge}
          onChange={setC}
        />
      );
      default: return null;
    }
  };

  return (
    <div className="wiz-shell">
      <header className="wiz-progress">
        <div className="wiz-brand">
          <Sigil size={34} glyph="sigil-2" />
          <div>
            <div className={cn('ao-engraved', css.eng13)}>{t('wiz.rite')}</div>
            <div className={cn('ao-codex', css.codex10)}>
              {c.name || t('wiz.newSoul')}{c.cls ? ' · ' + c.cls + ' ' + c.level : ''}
            </div>
          </div>
        </div>

        <ol className="wiz-rail">
          {steps.map((s, i) => {
            const done = i < stepIdx && validate(s.id, c);
            const active = i === stepIdx;
            const reachable = i <= st.furthest;
            return (
              <li key={s.id} className="wiz-rail-item">
                <button
                  type="button"
                  className={'wiz-rail-btn' + (active ? ' is-active' : '') + (done ? ' is-done' : '') + (reachable ? '' : ' is-locked')}
                  onClick={() => goTo(i)}
                  disabled={!reachable}
                >
                  <span className="wiz-rail-node">
                    {done ? <Rune kind="check" size={12} color="var(--gold-pale)" /> : <span className="wiz-rail-num">{i + 1}</span>}
                  </span>
                  <span className="wiz-rail-label">{t(s.labelKey)}</span>
                </button>
                {i < steps.length - 1 && <span className={'wiz-rail-link' + (i < stepIdx ? ' is-done' : '')} />}
              </li>
            );
          })}
        </ol>

        <div className="wiz-compact">
          <span className={cn('ao-engraved', css.eng12)}>{t(current.labelKey)}</span>
          <span className="ao-codex">{t('wiz.stepOf', { current: stepIdx + 1, total: steps.length })}</span>
          <div className="wiz-compact-bar"><span style={{ width: ((stepIdx + 1) / steps.length * 100) + '%' }} /></div>
        </div>
      </header>

      <main className="wiz-main ao-scroll">
        <div key={current.id} className="wiz-anim">
          {renderStep()}
        </div>
      </main>

      <footer className="wiz-nav">
        {stepIdx === 0 ? (
          <button className="ao-btn ao-btn--ghost" onClick={onCancel}>
            <Rune kind="x" size={11} /> {t('wiz.cancel')}
          </button>
        ) : (
          <button className="ao-btn ao-btn--ghost" onClick={goBack}>
            <Rune kind="arrow-l" size={11} /> {t('wiz.back')}
          </button>
        )}
        <div className="wiz-nav-mid ao-codex">
          {isSummary ? t('wiz.reviewAndSeal') : (canNext ? t('wiz.readyToContinue') : (hint.key ? t(hint.key, hint.vars) : ''))}
        </div>
        {isSummary ? (
          <button className="ao-btn ao-btn--primary" onClick={handleForge} disabled={submitting}>
            <Rune kind="flame" size={11} /> {submitting ? t('wiz.forging') : t('wiz.forgeCharacter')}
          </button>
        ) : (
          <button className="ao-btn ao-btn--primary" onClick={goNext} disabled={!canNext}>
            {stepIdx === steps.length - 2 ? t('wiz.finishReview') : t('wiz.next')} <Rune kind="arrow-r" size={11} />
          </button>
        )}
      </footer>
    </div>
  );
}

// ── Summary / review — the full editable Forge sheet ───────
function SummaryReview({
  c,
  submitting,
  onEdit,
  onForge,
  onChange,
}: {
  c: WizardChar;
  submitting: boolean;
  onEdit: () => void;
  onForge: () => void;
  onChange: (next: WizardChar) => void;
}) {
  const t = useT();
  return (
    <div className="wiz-summary">
      <div className="wiz-summary-bar">
        <div className="ao-row ao-gap-12">
          <Sigil size={42} glyph="sigil-2" />
          <div>
            <div className={cn('ao-engraved', css.eng14)}>{t('wiz.summary.title')}</div>
            <div className="ao-codex">{t('wiz.summary.sub')}</div>
          </div>
        </div>
        <div className="ao-row ao-gap-8">
          <button className="ao-btn ao-btn--ghost" onClick={onEdit}>
            <Rune kind="arrow-l" size={11} /> {t('wiz.summary.editSteps')}
          </button>
          <button className="ao-btn ao-btn--primary" onClick={onForge} disabled={submitting}>
            <Rune kind="flame" size={11} /> {submitting ? t('wiz.forging') : t('wiz.forgeCharacter')}
          </button>
        </div>
      </div>

      <ForgeSheetBody c={c} onChange={onChange} />
    </div>
  );
}
