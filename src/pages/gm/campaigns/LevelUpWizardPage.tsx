import { useState, type ReactNode, type CSSProperties } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Sparkles, Heart, Loader2 } from 'lucide-react';
import {
  OrdoPanel,
  PanelHeader,
  Rune,
  OrdoDivider,
  Sigil,
} from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import { useCharacter } from '@/hooks/useCharacter';
import { useLevelUpOptions, useLevelUp } from '@/hooks/useLevelUp';
import {
  rewardGroupKey,
  rewardGroupLabel,
  isContentRewardGroup,
  isContentGroupSatisfied,
} from '@/lib/contentAdapters';
import { RewardGroupPicker } from '@/components/content-rewards/RewardGroupPicker';
import { isMigrationBlocked } from '@/lib/characterMigration';
import {
  buildContentLevelUpRequest,
  contentLevelUpComplete,
  type ChildSelections,
} from './contentLevelUp';
import type {
  AvailableClassOption,
  LevelUpResultResponse,
  RewardDetail,
  RewardGroup,
} from '@/types';
import { REWARD_TYPE_LABELS } from '@/types';
import { cn } from '@/lib/utils';
import s from './LevelUpWizardPage.module.css';

type WizardStep = 'pick-class' | 'rewards' | 'confirm' | 'result';

type Tone = 'gold' | 'arcane' | 'ember';

export default function LevelUpWizardPage() {
  const t = useT();
  const navigate = useNavigate();
  const { campaignId, characterId } = useParams<{ campaignId: string; characterId: string }>();
  const { data: character } = useCharacter(campaignId!, characterId!);
  const { data: options, isLoading, error } = useLevelUpOptions(characterId!);
  const levelUpMutation = useLevelUp();

  const [step, setStep] = useState<WizardStep>('pick-class');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  // content-shaped groups: reward group key -> selected option ids
  const [contentSelections, setContentSelections] = useState<Record<string, string[]>>({});
  // content grant child picks: grantId -> abilities/skills/spells
  const [childSelections, setChildSelections] = useState<ChildSelections>({});
  const [result, setResult] = useState<LevelUpResultResponse | null>(null);

  const backToCharacter = () => navigate(`/campaigns/${campaignId}/characters/${characterId}`);

  if (isLoading) {
    return (
      <div className={cn('ao-panel ao-frame ao-breathe', s.loadingPanel)}>
        <span className="ao-frame-c" />
        <div className={cn('ao-ph', s.phTitle)} />
        <div className={cn('ao-ph', s.phLine)} />
      </div>
    );
  }

  if (error || !options) {
    return (
      <RiteGate
        glyph="scroll"
        message={
          (error as { response?: { data?: { message?: string } } })?.response?.data?.message
          || t('camp.lvl.notReady')
        }
        onBack={backToCharacter}
      />
    );
  }

  if (options.xpToNextLevel > 0) {
    return (
      <RiteGate
        glyph="lock"
        message={t('camp.lvl.needXp', { xp: options.xpToNextLevel.toLocaleString() })}
        onBack={backToCharacter}
      />
    );
  }

  // Migration window: block content-changing flow for un-mappable characters.
  if (isMigrationBlocked(character)) {
    return <RiteGate glyph="lock" message={t('camp2.migration.blocked')} onBack={backToCharacter} />;
  }

  const selectedClass: AvailableClassOption | undefined = options.availableClasses.find(
    (cl) => cl.classId === selectedClassId,
  );

  return (
    <div>
      {/* Ceremonial header */}
      <div className={s.ceremonyHead}>
        <Sigil size={72} glyph="sigil-2" />
        <div className={cn('ao-codex ao-flicker', s.ceremonyCodex)}>
          {t('camp.lvl.riteOfAscent')}
        </div>
        {character && (
          <div className={cn('ao-italic', s.ceremonySub)}>
            {character.name} · {character.classLevels?.map((cl) => `${cl.className} ${cl.classLevel}`).join(' / ') || `LVL ${character.totalLevel}`}
          </div>
        )}
      </div>

      <StepRail step={step} hasResult={!!result} />

      {step === 'pick-class' && (
        <StepPickClass
          options={options.availableClasses}
          currentTotal={options.currentTotalLevel}
          selectedClassId={selectedClassId}
          onSelect={(id) => {
            setSelectedClassId(id);
            setContentSelections({});
            setChildSelections({});
          }}
          onNext={() => setStep('rewards')}
          onBack={backToCharacter}
        />
      )}

      {step === 'rewards' && selectedClass && (
        <StepRewards
          option={selectedClass}
          currentTotal={options.currentTotalLevel}
          characterName={character?.name}
          contentSelections={contentSelections}
          setContentSelections={setContentSelections}
          childSelections={childSelections}
          setChildSelections={setChildSelections}
          onBack={() => setStep('pick-class')}
          onNext={() => setStep('confirm')}
        />
      )}

      {step === 'confirm' && selectedClass && (
        <StepConfirm
          option={selectedClass}
          contentSelections={contentSelections}
          childSelections={childSelections}
          submitting={levelUpMutation.isPending}
          onBack={() => setStep('rewards')}
          onConfirm={() => {
            const data = buildContentLevelUpRequest(
              selectedClass.classId,
              selectedClass.rewardGroups,
              contentSelections,
              childSelections,
            );
            levelUpMutation.mutate(
              { characterId: characterId!, data },
              {
                onSuccess: (res) => {
                  if (res.data) {
                    setResult(res.data);
                    setStep('result');
                  }
                },
              },
            );
          }}
        />
      )}

      {step === 'result' && result && (
        <StepResult result={result} onDone={backToCharacter} />
      )}
    </div>
  );
}

// ── Gate (locked / error) ────────────────────────────────────────────

function RiteGate({ glyph, message, onBack }: { glyph: string; message: string; onBack: () => void }) {
  const t = useT();
  return (
    <OrdoPanel frame padding={0}>
      <div className={s.gateBody}>
        <div className={s.gateIcon}>
          <Sigil size={56} glyph={glyph} color="var(--gold)" />
        </div>
        <p className={cn('ao-italic', s.gateMsg)}>
          {message}
        </p>
        <button className="ao-btn" onClick={onBack}>
          <ArrowLeft className="h-3 w-3" /> {t('camp2.back.character')}
        </button>
      </div>
    </OrdoPanel>
  );
}

// ── Step rail ────────────────────────────────────────────────────────

function StepRail({ step, hasResult }: { step: WizardStep; hasResult: boolean }) {
  const t = useT();
  const steps: { id: WizardStep; label: string }[] = [
    { id: 'pick-class', label: t('camp.lvl.step.pickClass') },
    { id: 'rewards', label: t('camp.lvl.step.rewards') },
    { id: 'confirm', label: t('camp.lvl.step.confirm') },
    { id: 'result', label: t('camp.lvl.step.result') },
  ];
  const activeIdx = steps.findIndex((st) => st.id === step);
  return (
    <div className={cn('ao-tabs', s.rail)}>
      {steps.map((st, idx) => {
        const isActive = idx === activeIdx;
        const isDone = idx < activeIdx || (hasResult && idx <= 3);
        return (
          <div
            key={st.id}
            className={cn('ao-tab', isActive && 'is-active', s.railStep, !isActive && isDone && s.done)}
          >
            <span className={cn(s.railMarker, isActive && s.active)}>
              <span className={s.railMarkerInner}>
                {isDone ? <Rune kind="check" size={11} color="var(--gold-pale)" /> : idx + 1}
              </span>
            </span>
            {st.label}
          </div>
        );
      })}
    </div>
  );
}

// ── Step 1: choose calling (class) ───────────────────────────────────

function StepPickClass({
  options,
  currentTotal,
  selectedClassId,
  onSelect,
  onNext,
  onBack,
}: {
  options: AvailableClassOption[];
  currentTotal: number;
  selectedClassId: string | null;
  onSelect: (id: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const t = useT();
  const existing = options.filter((o) => o.currentLevelInClass > 0);
  const multi = options.filter((o) => o.currentLevelInClass === 0);
  return (
    <div>
      <OrdoPanel frame padding={0} className={s.mb16}>
        <PanelHeader
          title={t('camp.lvl.chooseClass')}
          glyph="helm"
          sub={t('camp.lvl.totalLevel', { from: roman(currentTotal), to: roman(currentTotal + 1) })}
        />
        <div className={s.pickBody}>
          {existing.length > 0 && (
            <ClassGroup
              title={t('camp.lvl.deepenPath')}
              options={existing}
              selectedClassId={selectedClassId}
              onSelect={onSelect}
            />
          )}
          {multi.length > 0 && (
            <ClassGroup
              title={t('camp.lvl.newOath')}
              options={multi}
              selectedClassId={selectedClassId}
              onSelect={onSelect}
            />
          )}
          {options.length === 0 && (
            <div className={cn('ao-codex', s.noClasses)}>{t('camp.lvl.noClasses')}</div>
          )}
        </div>
      </OrdoPanel>

      <div className={s.navRow}>
        <button className="ao-btn ao-btn--ghost" onClick={onBack}>
          <ArrowLeft className="h-3 w-3" /> {t('camp.lvl.postpone')}
        </button>
        <button className="ao-btn ao-btn--primary" onClick={onNext} disabled={!selectedClassId}>
          {t('camp.lvl.toRewards')} <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function ClassGroup({
  title,
  options,
  selectedClassId,
  onSelect,
}: {
  title: string;
  options: AvailableClassOption[];
  selectedClassId: string | null;
  onSelect: (id: string) => void;
}) {
  const t = useT();
  return (
    <div>
      <div className={cn('ao-overline', s.groupTitle)}>{title}</div>
      <div className={s.classGrid}>
        {options.map((opt) => {
          const isMulti = opt.currentLevelInClass === 0;
          const isActive = selectedClassId === opt.classId;
          const previewRewards = opt.rewardGroups
            .map((g) => g.prompt || g.options?.[0]?.label || g.grants?.[0]?.label || g.grants?.[0]?.feature?.title)
            .filter(Boolean)
            .slice(0, 3)
            .join(' · ');
          return (
            <button
              key={opt.classId}
              type="button"
              onClick={() => onSelect(opt.classId)}
              className={`wiz-card${isActive ? ' is-active' : ''}`}
            >
              <div className="wiz-card-top">
                <span className={cn('ao-h5', s.classCardName)}>{opt.className}</span>
                {isMulti && <span className="ao-chip ao-chip--arcane">{t('camp.lvl.oathChip')}</span>}
                {isActive && <Rune kind="check" size={14} color="var(--gold-pale)" />}
              </div>
              <div className={cn('ao-codex', s.classCardLevel)}>
                {roman(opt.currentLevelInClass)} → {roman(opt.newLevelInClass)}
              </div>
              {previewRewards ? (
                <div className={cn('ao-italic', s.classCardPreview)}>
                  {previewRewards}
                </div>
              ) : (
                <div className={cn('ao-italic', s.classCardPreview, s.faint)}>
                  {t('camp.lvl.noChoosableRewards')}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 2: rewards — the Rite of Ascent ─────────────────────────────

function StepRewards({
  option,
  currentTotal,
  characterName,
  contentSelections,
  setContentSelections,
  childSelections,
  setChildSelections,
  onBack,
  onNext,
}: {
  option: AvailableClassOption;
  currentTotal: number;
  characterName?: string;
  contentSelections: Record<string, string[]>;
  setContentSelections: (s: Record<string, string[]>) => void;
  childSelections: ChildSelections;
  setChildSelections: (s: ChildSelections) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const t = useT();

  // Final contract: every reward group is content-shaped (grants/options payload).
  const contentGroups = option.rewardGroups.filter(isContentRewardGroup);
  const contentSel = (g: RewardGroup) => contentSelections[rewardGroupKey(g)] ?? [];
  const contentValid = contentLevelUpComplete(option.rewardGroups, contentSelections, childSelections);

  // Checklist of choice groups still to resolve.
  const rites: { name: string; complete: boolean }[] = contentGroups
    .filter((g) => (g.options?.length ?? 0) > 0)
    .map((g) => ({
      name: t('camp.lvl.choose', { label: rewardGroupLabel(g) }),
      complete: isContentGroupSatisfied(g, contentSel(g)),
    }));

  // Vitae + derived stat tiles granted automatically by the ascent (Vitae always first).
  const hp = option.hpGain;
  const grants: { glyph: string; label: string; value: string; sub?: string; tone: Tone }[] = [
    {
      glyph: 'flame',
      label: t('camp.lvl.vitae'),
      value: hp?.average != null ? `+${hp.average}` : t('camp.lvl.vitaeValue'),
      sub:
        hp?.rolledMin != null && hp?.rolledMax != null
          ? t('camp.lvl.vitaeRange', { min: hp.rolledMin, max: hp.rolledMax })
          : t('camp.lvl.hits'),
      tone: 'ember',
    },
  ];
  if (hp?.currentMaxHp != null && hp?.average != null) {
    grants.push({
      glyph: 'flame',
      label: t('camp.lvl.hpTotal'),
      value: `≈${hp.currentMaxHp + hp.average}`,
      sub: t('camp.lvl.hpFrom', { from: hp.currentMaxHp }),
      tone: 'gold',
    });
  }
  const derived = option.derived;
  if (derived?.proficiencyBonusAfter != null && derived.proficiencyBonusAfter !== derived.proficiencyBonusBefore) {
    grants.push({
      glyph: 'sigil-1',
      label: t('camp.lvl.prof'),
      value: `+${derived.proficiencyBonusAfter}`,
      sub: derived.proficiencyBonusBefore != null ? t('camp.lvl.profFrom', { from: derived.proficiencyBonusBefore }) : undefined,
      tone: 'arcane',
    });
  }
  if (derived?.spellSlotsGained) {
    grants.push({ glyph: 'sigil-3', label: t('camp.lvl.slots'), value: derived.spellSlotsGained, tone: 'arcane' });
  }
  if (derived?.cantripsGained) {
    grants.push({ glyph: 'sigil-3', label: t('camp.lvl.cantrips'), value: `+${derived.cantripsGained}`, tone: 'arcane' });
  }

  return (
    <div>
      {/* The ceremony scroll — dramatic reveal */}
      <div className={cn('ao-panel ao-frame', s.scroll)}>
        <span className="ao-frame-c" />

        {/* Top band */}
        <div className={s.scrollBand}>
          <div className={cn('ao-codex', s.scrollFolio)}>
            {option.className} · Folio V-{String(option.newLevelInClass).padStart(3, '0')}
          </div>
          <div className={cn('ao-engraved', s.scrollByOrdo)}>
            {t('camp.lvl.byOrdo')}
          </div>
          <OrdoDivider glyph="diamond-fill" />
        </div>

        {/* Number reveal */}
        <div className={s.scrollReveal}>
          <div className={s.revealRow}>
            <div className={s.revealBefore}>
              <div className="ao-overline">{t('camp.lvl.before')}</div>
              <div className={s.revealBeforeNum}>
                {roman(currentTotal)}
              </div>
            </div>
            <Rune kind="arrow-r" size={28} color="var(--gold)" />
            <div className="ao-breathe">
              <div className={s.revealAfterNum}>
                {roman(currentTotal + 1)}
              </div>
            </div>
          </div>
          <div className={cn('ao-h4', s.revealClassLine)}>
            {option.className} · {roman(option.currentLevelInClass)} → {roman(option.newLevelInClass)}
          </div>
          {characterName && (
            <p className={cn('ao-italic', s.revealBlessing)}>
              {t('camp.lvl.charBlessing', { name: characterName })}
            </p>
          )}
        </div>

        {/* Grants summary */}
        <div className={s.grantsBody}>
          <OrdoDivider glyph="diamond-fill">{t('camp.lvl.grantedByAscent')}</OrdoDivider>
          <div className={s.grantsGrid}>
            {grants.map((g, i) => (
              <GrantCard key={i} glyph={g.glyph} label={g.label} value={g.value} sub={g.sub} tone={g.tone} />
            ))}
          </div>

          {rites.length > 0 && (
            <>
              <OrdoDivider glyph="cross-pat">{t('camp.lvl.ritesToChoose')}</OrdoDivider>
              <div className={s.colGap8}>
                {rites.map((r, i) => (
                  <div key={i} className={cn(s.riteRow, r.complete && s.complete)}>
                    <span className={cn(s.riteMark, r.complete && s.complete)}>
                      <Rune kind={r.complete ? 'check' : 'diamond'} size={10} color={r.complete ? 'var(--ink-bright)' : 'var(--ink-faint)'} />
                    </span>
                    <span className={cn(s.riteName, r.complete && s.complete)}>
                      {r.name}
                    </span>
                    <span className={cn('ao-overline', s.riteStatus, r.complete && s.complete)}>
                      {r.complete ? t('camp.lvl.sealed') : t('camp.lvl.open')}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content-shaped reward groups (final contract): option selection + typed-grant
          child picks (ability distribution / skill choice). Committed as
          ContentLevelUpRequest at the seal. */}
      {contentGroups.map((g) => (
        <RewardGroupPicker
          key={rewardGroupKey(g)}
          group={g}
          optionIds={contentSel(g)}
          onOptionsChange={(ids) => setContentSelections({ ...contentSelections, [rewardGroupKey(g)]: ids })}
          child={childSelections}
          onChildChange={(grantId, sel) => setChildSelections({ ...childSelections, [grantId]: sel })}
        />
      ))}

      {contentGroups.length === 0 && (
        <OrdoPanel frame padding={0} className={s.mb16}>
          <div className={cn('ao-italic', s.noChoosable)}>
            {t('camp.lvl.noChoosableThisStep')}
          </div>
        </OrdoPanel>
      )}

      {/* Footer ribbon */}
      <div className={s.navRow}>
        <button className="ao-btn ao-btn--ghost" onClick={onBack}>
          <ArrowLeft className="h-3 w-3" /> {t('camp.lvl.backToAscent')}
        </button>
        <div className={s.stepInd}>
          <span className="ao-codex">{t('camp.lvl.stepIndicator')}</span>
          <span className={s.stepDots}>
            <span className={cn(s.stepDot, s.on)} />
            <span className={cn(s.stepDot, s.on)} />
            <span className={s.stepDot} />
          </span>
        </div>
        <button className="ao-btn ao-btn--primary ao-btn--lg" onClick={onNext} disabled={!contentValid}>
          <Rune kind="diamond-fill" size={9} /> {t('camp.lvl.toSeal')}
        </button>
      </div>
    </div>
  );
}

function GrantCard({
  glyph,
  label,
  value,
  sub,
  tone,
}: {
  glyph: string;
  label: string;
  value: string;
  sub?: string;
  tone: Tone;
}) {
  const color = toneVar(tone);
  return (
    <div className={s.grantCard}>
      <Rune kind={glyph} size={22} color={color} />
      <div className={s.grantValue}>
        {value}
      </div>
      <div className={cn('ao-overline', s.grantLabel)}>{label}</div>
      {sub && <div className={cn('ao-codex', s.grantSub)}>{sub}</div>}
    </div>
  );
}

// ── Effect badges / structured mechanics ─────────────────────────────

function Tag({ children, tone }: { children: ReactNode; tone?: Tone }) {
  const color = tone ? toneVar(tone) : 'var(--ink-quiet)';
  return (
    <span className={s.tag} style={{ '--c': color } as CSSProperties}>
      {children}
    </span>
  );
}

/** Renders concrete mechanics (action type, damage, range, duration, prerequisites,
 *  buff/debuff effects) from RewardDetail. Renders nothing when no detail is present. */
function DetailBadges({ detail }: { detail?: RewardDetail }) {
  const t = useT();
  if (!detail) return null;

  const tags: { label: string; tone?: Tone }[] = [];

  if (detail.skillActivation) {
    tags.push({
      label: detail.skillActivation === 'ACTIVE' ? t('camp.lvl.fx.active') : t('camp.lvl.fx.passive'),
      tone: detail.skillActivation === 'ACTIVE' ? 'ember' : 'arcane',
    });
  }
  if (detail.damageDice || detail.damageBonus) {
    const dmg = [detail.damageDice, detail.damageBonus ? `+${detail.damageBonus}` : '']
      .filter(Boolean)
      .join(' ');
    const typ = detail.damageType ? ` ${detail.damageType.toLowerCase()}` : '';
    tags.push({ label: `${t('camp.lvl.fx.damage')}: ${dmg}${typ}`, tone: 'ember' });
  }
  if (detail.range) tags.push({ label: `${t('camp.lvl.fx.range')}: ${detail.range}` });
  if (detail.duration) tags.push({ label: `${t('camp.lvl.fx.duration')}: ${detail.duration}` });
  if (detail.usage) tags.push({ label: detail.usage });

  const effects = detail.effects ?? [];
  const hasContent = tags.length > 0 || !!detail.prerequisites || effects.length > 0;
  if (!hasContent) return null;

  return (
    <div className={s.tagWrap}>
      {tags.map((tg, i) => (
        <Tag key={`t${i}`} tone={tg.tone}>{tg.label}</Tag>
      ))}
      {effects.map((e, i) => {
        const bd = e.buffDebuff;
        const mod =
          bd?.modifierValue != null && bd.targetStatName
            ? ` (${bd.modifierValue >= 0 ? '+' : ''}${bd.modifierValue} ${bd.targetStatName})`
            : '';
        const chance = e.chancePercent != null && e.chancePercent < 100 ? ` · ${t('camp.lvl.fx.chance', { chance: e.chancePercent })}` : '';
        const rounds = bd?.durationRounds ? ` · ${t('camp.lvl.fx.rounds', { rounds: bd.durationRounds })}` : '';
        const arrow = e.effectRole === 'BUFF' ? '▲' : '▼';
        return (
          <Tag key={`e${i}`} tone={e.effectRole === 'BUFF' ? 'arcane' : 'ember'}>
            {arrow} {bd?.name ?? ''}{mod}{chance}{rounds}
          </Tag>
        );
      })}
      {detail.prerequisites && (
        <Tag tone="ember">{t('camp.lvl.fx.requires', { req: detail.prerequisites })}</Tag>
      )}
    </div>
  );
}

// ── Step 3: confirm — the Seal ───────────────────────────────────────

function StepConfirm({
  option,
  contentSelections,
  childSelections,
  submitting,
  onBack,
  onConfirm,
}: {
  option: AvailableClassOption;
  contentSelections: Record<string, string[]>;
  childSelections: ChildSelections;
  submitting: boolean;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const t = useT();
  // Summary built from the final content selections: auto grants, chosen options,
  // and the typed-grant child picks (ability distribution / skills).
  const chosenLines: { type: string; name: string; tag: 'auto' | 'choice' }[] = [];
  for (const g of option.rewardGroups.filter(isContentRewardGroup)) {
    const kindLabel = g.groupKind || 'REWARD';
    for (const gr of g.grants ?? []) {
      chosenLines.push({ type: kindLabel, name: gr.label || gr.feature?.title || gr.grantType, tag: 'auto' });
    }
    for (const optId of contentSelections[rewardGroupKey(g)] ?? []) {
      const opt = g.options?.find((o) => o.id === optId);
      if (!opt) continue;
      chosenLines.push({ type: kindLabel, name: opt.label, tag: 'choice' });
      for (const gr of opt.grants ?? []) {
        const child = childSelections[gr.id];
        if (child?.abilities) {
          for (const [abilityId, bonus] of Object.entries(child.abilities)) {
            if (bonus <= 0) continue;
            const ability = gr.abilityOptions?.find((x) => x.id === abilityId);
            chosenLines.push({ type: 'ABILITY_SCORE', name: `${ability?.name ?? abilityId} +${bonus}`, tag: 'choice' });
          }
        }
        if (child?.skills) {
          for (const skillId of child.skills) {
            const skill = gr.skillOptions?.find((x) => x.id === skillId);
            chosenLines.push({ type: 'SKILL_PROFICIENCY', name: skill?.name ?? skillId, tag: 'choice' });
          }
        }
      }
    }
  }

  return (
    <div>
      <OrdoPanel frame padding={0} className={s.mb16}>
        <PanelHeader title={t('camp.lvl.confirm.title')} glyph="diamond" sub={t('camp.lvl.confirm.sub')} />
        <div className={s.confirmBody}>
          <div className={cn('ao-codex', s.confirmCalling)}>
            {t('camp.lvl.confirm.calling')} <strong className={s.goldStrong}>{option.className}</strong>{' '}
            {roman(option.currentLevelInClass)} → {roman(option.newLevelInClass)}
          </div>
          {option.hpGain?.average != null && (
            <div className={cn('ao-codex', s.confirmVitae)}>
              {t('camp.lvl.confirm.vitaeGain', { hp: option.hpGain.average })}
              {option.hpGain.rolledMin != null && option.hpGain.rolledMax != null
                ? ` · ${t('camp.lvl.vitaeRange', { min: option.hpGain.rolledMin, max: option.hpGain.rolledMax })}`
                : ''}
            </div>
          )}
          {option.derived?.proficiencyBonusAfter != null
            && option.derived.proficiencyBonusAfter !== option.derived.proficiencyBonusBefore
            && option.derived.proficiencyBonusBefore != null && (
            <div className={cn('ao-codex', s.confirmProf)}>
              {t('camp.lvl.result.profGain', { from: option.derived.proficiencyBonusBefore, to: option.derived.proficiencyBonusAfter })}
            </div>
          )}
          <OrdoDivider glyph="diamond" />
          <div className={cn('ao-overline', s.confirmGifts)}>{t('camp.lvl.confirm.giftsToSeal')}</div>
          {chosenLines.length === 0 ? (
            <div className={cn('ao-italic', s.confirmEmpty)}>{t('camp.lvl.confirm.vitaeAndLevel')}</div>
          ) : (
            chosenLines.map((line, idx) => (
              <div key={idx} className={s.confirmLine}>
                <Rune kind={line.tag === 'auto' ? 'diamond' : 'diamond-fill'} size={12} color={line.tag === 'auto' ? 'var(--ink-quiet)' : 'var(--gold)'} />
                <span className={cn('ao-codex', s.confirmLineType)}>
                  {REWARD_TYPE_LABELS[line.type] || line.type}
                </span>
                <span className={s.confirmLineName}>{line.name}</span>
              </div>
            ))
          )}
        </div>
      </OrdoPanel>

      <div className={s.warnBox}>
        <Rune kind="lock" size={14} color="var(--ember)" />
        <span className={cn('ao-italic', s.warnText)}>
          {t('camp.lvl.confirm.warning')}
        </span>
      </div>

      <div className={s.navRow}>
        <button className="ao-btn ao-btn--ghost" onClick={onBack} disabled={submitting}>
          <ArrowLeft className="h-3 w-3" /> {t('camp.lvl.confirm.back')}
        </button>
        <button className="ao-btn ao-btn--primary ao-btn--lg" onClick={onConfirm} disabled={submitting}>
          {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          {t('camp.lvl.confirm.seal')}
        </button>
      </div>
    </div>
  );
}

// ── Step 4: result ───────────────────────────────────────────────────

function StepResult({ result, onDone }: { result: LevelUpResultResponse; onDone: () => void }) {
  const t = useT();
  const appliedGrants = result.appliedGrants ?? [];
  const manualActions = result.manualActions ?? [];
  return (
    <div>
      <div className={cn('ao-panel ao-frame ao-grain', s.resultBanner)}>
        <span className="ao-frame-c" />
        <div className={s.resultSigilWrap}>
          <Sigil size={64} glyph="flame" color="var(--gold-pale)" />
        </div>
        <div className={cn('ao-codex ao-flicker', s.resultComplete)}>{t('camp.lvl.result.ascentComplete')}</div>
        <div className={cn('ao-breathe', s.resultBreathe)}>
          <div className={s.resultBigNum}>
            {roman(result.newTotalLevel)}
          </div>
        </div>
        <div className={cn('ao-h4', s.resultClassLine)}>
          {result.classLeveled} · {roman(result.newClassLevel)}
        </div>
      </div>

      <OrdoPanel frame padding={0} className={s.mb16}>
        <PanelHeader title={t('camp.lvl.result.sealedGifts')} glyph="check" tone="gold" />
        <div className={s.resultBody}>
          <div className={s.resultGrantsGrid}>
            <GrantCard glyph="helm" label={t('camp.lvl.result.calling')} value={`${result.classLeveled} ${roman(result.newClassLevel)}`} tone="gold" />
            <GrantCard glyph="sigil-2" label={t('camp.lvl.result.totalLevel')} value={roman(result.newTotalLevel)} tone="arcane" />
            {result.hpIncrease !== undefined && (
              <GrantCard
                glyph="flame"
                label={t('camp.lvl.result.vitae')}
                value={`+${result.hpIncrease}`}
                sub={result.newMaxHp ? t('camp.lvl.result.totalHp', { hp: result.newMaxHp }) : undefined}
                tone="ember"
              />
            )}
            {result.proficiencyBonusAfter != null
              && result.proficiencyBonusAfter !== result.proficiencyBonusBefore && (
              <GrantCard
                glyph="sigil-1"
                label={t('camp.lvl.prof')}
                value={`+${result.proficiencyBonusAfter}`}
                sub={result.proficiencyBonusBefore != null ? t('camp.lvl.profFrom', { from: result.proficiencyBonusBefore }) : undefined}
                tone="arcane"
              />
            )}
          </div>
          <OrdoDivider glyph="diamond-fill">{t('camp.lvl.result.acquiredGifts')}</OrdoDivider>
          {appliedGrants.length === 0 && manualActions.length === 0 ? (
            <div className={cn('ao-italic', s.resultDash)}>—</div>
          ) : (
            <div className={s.resultAcqGrid}>
              {appliedGrants.map((r) => (
                <div key={`applied-${r.grantId}`} className={s.resultAcqCard}>
                  <span className={cn('ao-codex', s.resultAcqType)}>
                    {REWARD_TYPE_LABELS[r.grantType] || r.grantType}
                  </span>
                  <span className={s.resultAcqName}>{r.summary}</span>
                </div>
              ))}
              {manualActions.map((r) => (
                <div key={`manual-${r.grantId}`} className={s.resultAcqCard}>
                  <span className={cn('ao-codex', s.resultAcqType)}>
                    {REWARD_TYPE_LABELS[r.grantType] || r.grantType}
                  </span>
                  <span className={s.resultAcqName}>{r.instruction}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </OrdoPanel>
      <div className={s.navEnd}>
        <button className="ao-btn ao-btn--primary" onClick={onDone}>
          <Heart className="h-3 w-3" /> {t('camp.lvl.result.toCharacter')} <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────

function toneVar(tone: Tone): string {
  return tone === 'arcane' ? 'var(--arcane)' : tone === 'ember' ? 'var(--ember)' : 'var(--gold)';
}

function roman(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return String(n);
  const map: [string, number][] = [
    ['M', 1000], ['CM', 900], ['D', 500], ['CD', 400],
    ['C', 100], ['XC', 90], ['L', 50], ['XL', 40],
    ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1],
  ];
  let out = '';
  let rem = n;
  for (const [sym, val] of map) {
    while (rem >= val) {
      out += sym;
      rem -= val;
    }
  }
  return out;
}
