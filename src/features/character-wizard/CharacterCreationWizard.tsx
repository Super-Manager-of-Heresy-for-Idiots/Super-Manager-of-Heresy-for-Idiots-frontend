import { useEffect, useMemo, useReducer } from 'react';
import toast from 'react-hot-toast';
import { Rune, Sigil } from '@/components/ordo';
import type { AvailableContentEntry } from '@/types';
import type { CreateFullCharacterRequest } from '@/api/characters-full.api';
import {
  ABILITIES,
  BACKGROUNDS,
  CLASSES,
  RACES,
  SKILLS,
} from '@/data/wizard5e';
import {
  ALL_STEPS,
  freshState,
  makeActions,
  reducer,
  requirementHint,
  validate,
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
import type {
  BackgroundResponse,
  CharacterClassDetailResponse,
  CharacterRaceDetailResponse,
  ProficiencySkillResponse,
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
  submitting: boolean;
  onSubmit: (req: CreateFullCharacterRequest) => void;
  onCancel: () => void;
}

const normalizeContentName = (value: string): string => value.trim().toLowerCase();
const scoreMethodForApi = (method: WizardChar['scoreMethod']): string => {
  if (method === 'pointbuy') return 'POINT_BUY';
  if (method === 'roll') return 'ROLL';
  return 'STANDARD_ARRAY';
};

function validateCampaignReferences(id: StepId, c: WizardChar, availability: WizardAvailability): boolean {
  if (id === 'race') {
    const selectedRace = availability.raceOptions.find((race) => race.key === c.raceKey);
    if (selectedRace?.detail?.subraces?.length) return !!c.subraceKey;
    return true;
  }
  if (id !== 'background') return true;
  const selectedClass = availability.classOptions.find((cl) => cl.key === c.classKey);
  const expected = selectedClass?.detail?.skillChoiceCount;
  if (expected === undefined) return true;
  return (c.classSkills || []).length === expected;
}

function campaignReferenceHint(id: StepId, c: WizardChar, availability: WizardAvailability): string {
  if (id === 'race') {
    const selectedRace = availability.raceOptions.find((race) => race.key === c.raceKey);
    if (selectedRace?.detail?.subraces?.length && !c.subraceKey) return 'Choose a subrace';
    return '';
  }
  if (id !== 'background') return '';
  const selectedClass = availability.classOptions.find((cl) => cl.key === c.classKey);
  const expected = selectedClass?.detail?.skillChoiceCount;
  if (expected === undefined) return '';
  return 'Choose ' + expected + ' class skills (' + (c.classSkills || []).length + '/' + expected + ')';
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
): WizardAvailability {
  const classIdByKey: Record<string, string> = {};
  const raceIdByKey: Record<string, string> = {};
  const classByName = new Map(CLASSES.map((cl) => [normalizeContentName(cl.label), cl]));
  const raceByName = new Map(RACES.map((r) => [normalizeContentName(r.label), r]));
  const classDetailById = new Map(referenceClasses.map((cl) => [cl.id, cl]));
  const raceDetailById = new Map(referenceRaces.map((r) => [r.id, r]));

  const seenClassIds = new Set<string>();
  const usedClassKeys = new Set<string>();
  const classOptions = availableClasses
    .filter((entry) => {
      if (seenClassIds.has(entry.id)) return false;
      seenClassIds.add(entry.id);
      return true;
    })
    .map((entry) => {
      const local = classByName.get(normalizeContentName(entry.name));
      const localKeyAvailable = local && !usedClassKeys.has(local.key);
      const key = localKeyAvailable ? local.key : `db-class:${entry.id}`;
      usedClassKeys.add(key);
      classIdByKey[key] = entry.id;
      return { key, entry, local, detail: classDetailById.get(entry.id) };
    });

  const seenRaceIds = new Set<string>();
  const usedRaceKeys = new Set<string>();
  const raceOptions = availableRaces
    .filter((entry) => {
      if (seenRaceIds.has(entry.id)) return false;
      seenRaceIds.add(entry.id);
      return true;
    })
    .map((entry) => {
      const local = raceByName.get(normalizeContentName(entry.name));
      const localKeyAvailable = local && !usedRaceKeys.has(local.key);
      const key = localKeyAvailable ? local.key : `db-race:${entry.id}`;
      usedRaceKeys.add(key);
      raceIdByKey[key] = entry.id;
      return { key, entry, local, detail: raceDetailById.get(entry.id) };
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
  submitting,
  onSubmit,
  onCancel,
}: CharacterCreationWizardProps) {
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
    ],
  );

  const steps = ALL_STEPS.filter((s) => !s.spellOnly || c.isSpellcaster);
  const stepIdx = Math.min(Math.max(st.step, 0), steps.length - 1);
  const current = steps[stepIdx];

  const setC = (val: WizardChar) => dispatch({ type: 'setC', c: val });
  const A = makeActions(c, setC);

  const canNext = validate(current.id, c) && validateCampaignReferences(current.id, c, availability);
  const hint = requirementHint(current.id, c) || campaignReferenceHint(current.id, c, availability);
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
      toast.error('Selected class or race is not available in this campaign.');
      return;
    }
    const statByName = new Map(availability.statTypes.map((stat) => [normalizeContentName(stat.name), stat]));
    const abilityScores = ABILITIES.map((a) => {
      const stat = statByName.get(normalizeContentName(a.label));
      return stat ? { statId: stat.id, baseValue: c.baseScores[a.key] || 0 } : null;
    });
    if (abilityScores.some((entry) => !entry)) {
      toast.error('Ability stat types are not loaded for this campaign.');
      return;
    }

    const localBackground = BACKGROUNDS.find((b) => b.key === c.backgroundKey);
    const backgroundName = localBackground?.label || c.background;
    const background = c.backgroundKey.startsWith('db-background:')
      ? availability.backgrounds.find((b) => c.backgroundKey === `db-background:${b.id}`)
      : availability.backgrounds.find((b) => normalizeContentName(b.name) === normalizeContentName(backgroundName));
    if (!background) {
      toast.error('Selected background is not available in this campaign.');
      return;
    }

    const proficiencyByName = new Map(availability.proficiencySkills.map((skill) => [normalizeContentName(skill.name), skill]));
    const proficiencyById = new Map(availability.proficiencySkills.map((skill) => [skill.id, skill]));
    const chosenSkillProficiencyIds = (c.classSkills || []).map((skillKey) => {
      const byId = proficiencyById.get(skillKey);
      if (byId) return byId.id;
      const skillLabel = SKILLS.find((skill) => skill.key === skillKey)?.label || skillKey;
      return proficiencyByName.get(normalizeContentName(skillLabel))?.id;
    });
    if (chosenSkillProficiencyIds.some((id) => !id)) {
      toast.error('Selected class skills are not available in this campaign.');
      return;
    }
    const selectedClass = availability.classOptions.find((cl) => cl.key === c.classKey);
    const expectedSkillChoices = selectedClass?.detail?.skillChoiceCount;
    if (expectedSkillChoices !== undefined && chosenSkillProficiencyIds.length !== expectedSkillChoices) {
      toast.error(`Choose ${expectedSkillChoices} class skills before forging.`);
      return;
    }

    const selectedRace = availability.raceOptions.find((r) => r.key === c.raceKey);
    const localRace = RACES.find((race) => race.key === c.raceKey);
    const localSubrace = localRace?.subraces.find((subrace) => subrace.key === c.subraceKey);
    const selectedSubrace = selectedRace?.detail?.subraces?.find((subrace) => {
      if (c.subraceKey === subrace.id) return true;
      if (localSubrace && normalizeContentName(subrace.name) === normalizeContentName(localSubrace.label)) return true;
      return normalizeContentName(subrace.name) === normalizeContentName(c.subraceKey);
    });
    const req: CreateFullCharacterRequest = {
      campaignId,
      name: c.name.trim(),
      playerName: c.player || undefined,
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
      chosenSkillProficiencyIds: chosenSkillProficiencyIds as string[],
      backgroundSkills: c.bgSkills,
      cantrips: c.spells.cantrips,
      cantripIds: [],
      spells: c.spells.known,
      spellIds: [],
      speed: c.speed,
      armorClass: c.ac,
      maxHp: c.hp.max,
      hitDice: c.hitDiceTotal,
      avatar: c.avatar,
      features: c.features,
      proficiencies: c.proficiencies,
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
            <div className="ao-engraved" style={{ fontSize: 13 }}>Rite of Creation</div>
            <div className="ao-codex" style={{ fontSize: 10 }}>
              {c.name || 'New soul'}{c.cls ? ' · ' + c.cls + ' ' + c.level : ''}
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
                  <span className="wiz-rail-label">{s.label}</span>
                </button>
                {i < steps.length - 1 && <span className={'wiz-rail-link' + (i < stepIdx ? ' is-done' : '')} />}
              </li>
            );
          })}
        </ol>

        <div className="wiz-compact">
          <span className="ao-engraved" style={{ fontSize: 12 }}>{current.label}</span>
          <span className="ao-codex">Step {stepIdx + 1} of {steps.length}</span>
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
            <Rune kind="x" size={11} /> Cancel
          </button>
        ) : (
          <button className="ao-btn ao-btn--ghost" onClick={goBack}>
            <Rune kind="arrow-l" size={11} /> Back
          </button>
        )}
        <div className="wiz-nav-mid ao-codex">
          {isSummary ? 'Review & seal the record' : (canNext ? 'Ready to continue' : hint)}
        </div>
        {isSummary ? (
          <button className="ao-btn ao-btn--primary" onClick={handleForge} disabled={submitting}>
            <Rune kind="flame" size={11} /> {submitting ? 'Forging…' : 'Forge character'}
          </button>
        ) : (
          <button className="ao-btn ao-btn--primary" onClick={goNext} disabled={!canNext}>
            {stepIdx === steps.length - 2 ? 'Finish · Review' : 'Next'} <Rune kind="arrow-r" size={11} />
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
  return (
    <div className="wiz-summary">
      <div className="wiz-summary-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Sigil size={42} glyph="sigil-2" />
          <div>
            <div className="ao-engraved" style={{ fontSize: 14 }}>The Folio is Forged</div>
            <div className="ao-codex">Review the soul, then seal the record.</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="ao-btn ao-btn--ghost" onClick={onEdit}>
            <Rune kind="arrow-l" size={11} /> Edit steps
          </button>
          <button className="ao-btn ao-btn--primary" onClick={onForge} disabled={submitting}>
            <Rune kind="flame" size={11} /> {submitting ? 'Forging…' : 'Forge character'}
          </button>
        </div>
      </div>

      <ForgeSheetBody c={c} onChange={onChange} />
    </div>
  );
}
