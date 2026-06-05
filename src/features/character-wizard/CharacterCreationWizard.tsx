import { useEffect, useMemo, useReducer } from 'react';
import toast from 'react-hot-toast';
import { OrdoPanel, PanelHeader, Rune, Sigil } from '@/components/ordo';
import type { AvailableContentEntry } from '@/types';
import type { CreateFullCharacterRequest } from '@/api/characters-full.api';
import {
  ABILITIES,
  CLASSES,
  RACES,
  SKILLS,
  abilityMod,
  fmtMod,
  profByLevel,
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
import type { WizardAvailability } from './parts';

interface CharacterCreationWizardProps {
  campaignId: string;
  availableClasses: AvailableContentEntry[];
  availableRaces: AvailableContentEntry[];
  submitting: boolean;
  onSubmit: (req: CreateFullCharacterRequest) => void;
  onCancel: () => void;
}

function buildAvailability(
  availableClasses: AvailableContentEntry[],
  availableRaces: AvailableContentEntry[],
): WizardAvailability {
  const classIdByKey: Record<string, string> = {};
  const raceIdByKey: Record<string, string> = {};
  CLASSES.forEach((cl) => {
    const match = availableClasses.find((e) => e.name.trim().toLowerCase() === cl.label.toLowerCase());
    if (match) classIdByKey[cl.key] = match.id;
  });
  RACES.forEach((r) => {
    const match = availableRaces.find((e) => e.name.trim().toLowerCase() === r.label.toLowerCase());
    if (match) raceIdByKey[r.key] = match.id;
  });
  return { classIdByKey, raceIdByKey };
}

export function CharacterCreationWizard({
  campaignId,
  availableClasses,
  availableRaces,
  submitting,
  onSubmit,
  onCancel,
}: CharacterCreationWizardProps) {
  const [st, dispatch] = useReducer(reducer, undefined, freshState);
  const { c } = st;

  const availability = useMemo(
    () => buildAvailability(availableClasses, availableRaces),
    [availableClasses, availableRaces],
  );

  const steps = ALL_STEPS.filter((s) => !s.spellOnly || c.isSpellcaster);
  const stepIdx = Math.min(Math.max(st.step, 0), steps.length - 1);
  const current = steps[stepIdx];

  const setC = (val: WizardChar) => dispatch({ type: 'setC', c: val });
  const A = makeActions(c, setC);

  const canNext = validate(current.id, c);
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
    const req: CreateFullCharacterRequest = {
      campaignId,
      name: c.name.trim(),
      playerName: c.player || undefined,
      alignment: c.alignment || undefined,
      level: c.level,
      classId,
      raceId,
      raceKey: c.raceKey,
      subraceKey: c.subraceKey || undefined,
      classKey: c.classKey,
      backgroundKey: c.backgroundKey || undefined,
      abilities: ABILITIES.map((a) => ({ ability: a.key, base: c.baseScores[a.key] || 0 })),
      scoreMethod: c.scoreMethod,
      skills: Object.keys(c.skills),
      classSkills: c.classSkills,
      backgroundSkills: c.bgSkills,
      cantrips: c.spells.cantrips,
      spells: c.spells.known,
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
          {isSummary ? 'Review & seal the record' : (canNext ? 'Ready to continue' : requirementHint(current.id, c))}
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

// ── Summary / review ───────────────────────────────────────
function SummaryReview({
  c,
  submitting,
  onEdit,
  onForge,
}: {
  c: WizardChar;
  submitting: boolean;
  onEdit: () => void;
  onForge: () => void;
}) {
  const prof = profByLevel(c.level);
  const chosenSkills = SKILLS.filter((s) => c.skills[s.key]);
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

      <div className="wiz-summary-grid">
        <OrdoPanel frame padding={0}>
          <PanelHeader title="Identity" glyph="helm" />
          <div style={{ display: 'flex', gap: 16, padding: 16 }}>
            <div className="wiz-avatar-preview" style={{ width: 96, height: 96, flexShrink: 0 }}>
              {c.avatar ? <img src={c.avatar} alt="portrait" /> : <span className="ao-codex" style={{ fontSize: 10 }}>no portrait</span>}
            </div>
            <div style={{ flex: 1 }}>
              <div className="ao-h4" style={{ fontSize: 24 }}>{c.name || 'Unnamed'}</div>
              <div className="ao-italic" style={{ fontSize: 14, marginBottom: 8 }}>
                {[c.race, c.cls ? c.cls + ' ' + c.level : '', c.background].filter(Boolean).join(' · ')}
              </div>
              <div className="ao-codex" style={{ fontSize: 11 }}>
                {c.alignment || 'Unaligned'}{c.player ? ' · Kept by ' + c.player : ''}
              </div>
            </div>
          </div>
          <div className="wiz-summary-defense">
            <Defense label="Armour Class" value={c.ac} />
            <Defense label="Hit Points" value={c.hp.max} />
            <Defense label="Speed" value={c.speed + ' ft'} />
            <Defense label="Prof. Bonus" value={fmtMod(prof)} />
            <Defense label="Hit Dice" value={c.hitDiceTotal || '—'} />
          </div>
        </OrdoPanel>

        <OrdoPanel frame padding={0}>
          <PanelHeader title="Abilities" glyph="cir-dot" />
          <div className="wiz-summary-abil">
            {ABILITIES.map((a) => {
              const score = c.scores[a.key];
              const isSave = !!c.saves[a.key];
              return (
                <div key={a.key} className="ao-stat" style={{ position: 'relative' }}>
                  {isSave && (
                    <span title="Save proficiency" style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, transform: 'rotate(45deg)', background: 'var(--gold)', border: '1px solid var(--brass)' }} />
                  )}
                  <span className="ao-stat-label">{a.abbr}</span>
                  <span className="ao-stat-value">{score}</span>
                  <span className="ao-stat-mod">{fmtMod(abilityMod(score))}</span>
                </div>
              );
            })}
          </div>
        </OrdoPanel>

        <OrdoPanel frame padding={0}>
          <PanelHeader title="Skills" glyph="diamond-fill" right={<span className="ao-codex">{chosenSkills.length}</span>} />
          <div style={{ padding: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {chosenSkills.length ? chosenSkills.map((s) => (
              <span key={s.key} className="ao-chip ao-chip--gold">{s.label}</span>
            )) : <span className="ao-codex">No skill proficiencies.</span>}
          </div>
        </OrdoPanel>

        {c.isSpellcaster && (
          <OrdoPanel frame padding={0}>
            <PanelHeader title="Spells" glyph="book" tone="arcane" />
            <div style={{ padding: 16 }}>
              {c.spells.cantrips.length > 0 && (
                <>
                  <div className="ao-overline" style={{ marginBottom: 6 }}>Cantrips</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {c.spells.cantrips.map((s) => <span key={s} className="ao-chip ao-chip--arcane">{s}</span>)}
                  </div>
                </>
              )}
              {c.spells.known.length > 0 && (
                <>
                  <div className="ao-overline" style={{ marginBottom: 6 }}>Known spells</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {c.spells.known.map((s) => <span key={s} className="ao-chip ao-chip--arcane">{s}</span>)}
                  </div>
                </>
              )}
              {!c.spells.cantrips.length && !c.spells.known.length && (
                <span className="ao-codex">No spells selected.</span>
              )}
            </div>
          </OrdoPanel>
        )}

        {c.proficiencies && (
          <OrdoPanel frame padding={0}>
            <PanelHeader title="Proficiencies" glyph="shield" />
            <div className="ao-italic" style={{ padding: 16, fontSize: 14, whiteSpace: 'pre-line' }}>{c.proficiencies}</div>
          </OrdoPanel>
        )}
      </div>
    </div>
  );
}

function Defense({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="wiz-defense">
      <span className="ao-stat-value" style={{ fontSize: 26 }}>{value}</span>
      <span className="ao-stat-label">{label}</span>
    </div>
  );
}
