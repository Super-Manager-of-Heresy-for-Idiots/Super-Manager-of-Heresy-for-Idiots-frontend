import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Sparkles, Heart, Loader2 } from 'lucide-react';
import {
  OrdoPanel,
  PanelHeader,
  Rune,
  OrdoDivider,
  Sigil,
  OrdoChip,
  Placeholder,
} from '@/components/ordo';
import { CodexID } from '@/components/homebrew';
import { useCharacter } from '@/hooks/useCharacter';
import { useLevelUpOptions, useLevelUp } from '@/hooks/useLevelUp';
import type {
  AvailableClassOption,
  LevelUpResultResponse,
  RewardEntry,
  RewardGroup,
  RewardSelection,
} from '@/types';
import { REWARD_TYPE_LABELS } from '@/types';

type WizardStep = 'pick-class' | 'rewards' | 'confirm' | 'result';

interface AsiAllocation {
  // rewardEntryId -> points (0..2)
  points: Record<string, number>;
}

type Tone = 'gold' | 'arcane' | 'ember';

export default function LevelUpWizardPage() {
  const navigate = useNavigate();
  const { campaignId, characterId } = useParams<{ campaignId: string; characterId: string }>();
  const { data: character } = useCharacter(campaignId!, characterId!);
  const { data: options, isLoading, error } = useLevelUpOptions(characterId!);
  const levelUpMutation = useLevelUp();

  const [step, setStep] = useState<WizardStep>('pick-class');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  // groupKey (rewardType) -> selected rewardEntryId
  const [choiceSelections, setChoiceSelections] = useState<Record<string, string>>({});
  // ASI: rewardEntryId -> point count
  const [asi, setAsi] = useState<AsiAllocation>({ points: {} });
  const [result, setResult] = useState<LevelUpResultResponse | null>(null);

  const backToCharacter = () => navigate(`/campaigns/${campaignId}/characters/${characterId}`);

  if (isLoading) {
    return (
      <div className="ao-panel ao-frame ao-breathe" style={{ padding: 24, minHeight: 200 }}>
        <span className="ao-frame-c" />
        <div className="ao-ph" style={{ width: '40%', height: 22, marginBottom: 12 }} />
        <div className="ao-ph" style={{ width: '60%', height: 14 }} />
      </div>
    );
  }

  if (error || !options) {
    return (
      <RiteGate
        glyph="scroll"
        message={
          (error as { response?: { data?: { message?: string } } })?.response?.data?.message
          || 'Этот персонаж пока не готов к Восхождению.'
        }
        onBack={backToCharacter}
      />
    );
  }

  if (options.xpToNextLevel > 0) {
    return (
      <RiteGate
        glyph="lock"
        message={`До следующего Восхождения недостаёт ${options.xpToNextLevel.toLocaleString()} опыта.`}
        onBack={backToCharacter}
      />
    );
  }

  const selectedClass: AvailableClassOption | undefined = options.availableClasses.find(
    (cl) => cl.classId === selectedClassId,
  );

  return (
    <div>
      {/* Ceremonial header */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 18 }}>
        <Sigil size={72} glyph="sigil-2" />
        <div className="ao-codex ao-flicker" style={{ marginTop: 10, color: 'var(--gold-pale)' }}>
          — RITE OF ASCENT —
        </div>
        {character && (
          <div className="ao-italic" style={{ color: 'var(--ink-quiet)', fontSize: 13, marginTop: 4 }}>
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
            setChoiceSelections({});
            setAsi({ points: {} });
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
          choiceSelections={choiceSelections}
          setChoiceSelections={setChoiceSelections}
          asi={asi}
          setAsi={setAsi}
          onBack={() => setStep('pick-class')}
          onNext={() => setStep('confirm')}
        />
      )}

      {step === 'confirm' && selectedClass && (
        <StepConfirm
          option={selectedClass}
          choiceSelections={choiceSelections}
          asi={asi}
          submitting={levelUpMutation.isPending}
          onBack={() => setStep('rewards')}
          onConfirm={() => {
            const selections = buildSelections(selectedClass, choiceSelections, asi);
            levelUpMutation.mutate(
              { characterId: characterId!, data: { classId: selectedClass.classId, selections } },
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
  return (
    <OrdoPanel frame padding={0}>
      <div style={{ padding: '56px 24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          <Sigil size={56} glyph={glyph} color="var(--gold)" />
        </div>
        <p className="ao-italic" style={{ color: 'var(--ink-quiet)', marginBottom: 20, fontSize: 15 }}>
          {message}
        </p>
        <button className="ao-btn" onClick={onBack}>
          <ArrowLeft className="h-3 w-3" /> К персонажу
        </button>
      </div>
    </OrdoPanel>
  );
}

// ── Step rail ────────────────────────────────────────────────────────

function StepRail({ step, hasResult }: { step: WizardStep; hasResult: boolean }) {
  const steps: { id: WizardStep; label: string }[] = [
    { id: 'pick-class', label: 'Призвание' },
    { id: 'rewards', label: 'Дары' },
    { id: 'confirm', label: 'Печать' },
    { id: 'result', label: 'Свершилось' },
  ];
  const activeIdx = steps.findIndex((s) => s.id === step);
  return (
    <div className="ao-tabs" style={{ marginBottom: 22 }}>
      {steps.map((s, idx) => {
        const isActive = idx === activeIdx;
        const isDone = idx < activeIdx || (hasResult && idx <= 3);
        return (
          <div
            key={s.id}
            className={`ao-tab${isActive ? ' is-active' : ''}`}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'default',
              color: isActive ? undefined : isDone ? 'var(--ink-quiet)' : undefined,
            }}
          >
            <span
              style={{
                width: 22,
                height: 22,
                flexShrink: 0,
                border: `1px solid ${isActive ? 'var(--brass)' : 'var(--rule)'}`,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                transform: 'rotate(45deg)',
                color: isActive ? 'var(--gold-pale)' : 'var(--ink-faint)',
              }}
            >
              <span style={{ transform: 'rotate(-45deg)', display: 'inline-flex' }}>
                {isDone ? <Rune kind="check" size={11} color="var(--gold-pale)" /> : idx + 1}
              </span>
            </span>
            {s.label}
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
  const existing = options.filter((o) => o.currentLevelInClass > 0);
  const multi = options.filter((o) => o.currentLevelInClass === 0);
  return (
    <div>
      <OrdoPanel frame padding={0} style={{ marginBottom: 16 }}>
        <PanelHeader
          title="Избери призвание"
          glyph="helm"
          sub={`Общий уровень: ${roman(currentTotal)} → ${roman(currentTotal + 1)}`}
        />
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {existing.length > 0 && (
            <ClassGroup
              title="Углубить путь"
              options={existing}
              selectedClassId={selectedClassId}
              onSelect={onSelect}
            />
          )}
          {multi.length > 0 && (
            <ClassGroup
              title="Принять новый обет — мультикласс"
              options={multi}
              selectedClassId={selectedClassId}
              onSelect={onSelect}
            />
          )}
          {options.length === 0 && (
            <div className="ao-codex" style={{ padding: 12 }}>Нет доступных призваний для Восхождения.</div>
          )}
        </div>
      </OrdoPanel>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button className="ao-btn ao-btn--ghost" onClick={onBack}>
          <ArrowLeft className="h-3 w-3" /> Отложить
        </button>
        <button className="ao-btn ao-btn--primary" onClick={onNext} disabled={!selectedClassId}>
          К дарам <ArrowRight className="h-3 w-3" />
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
  return (
    <div>
      <div className="ao-overline" style={{ marginBottom: 8 }}>{title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
        {options.map((opt) => {
          const isMulti = opt.currentLevelInClass === 0;
          const isActive = selectedClassId === opt.classId;
          const previewRewards = opt.rewardGroups
            .map((g) => g.rewards[0]?.name)
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
                <span className="ao-h5" style={{ fontSize: 16, flex: 1 }}>{opt.className}</span>
                {isMulti && <span className="ao-chip ao-chip--arcane">Обет</span>}
                {isActive && <Rune kind="check" size={14} color="var(--gold-pale)" />}
              </div>
              <div className="ao-codex" style={{ fontSize: 11 }}>
                {roman(opt.currentLevelInClass)} → {roman(opt.newLevelInClass)}
              </div>
              {previewRewards ? (
                <div className="ao-italic" style={{ fontSize: 13, color: 'var(--ink-quiet)' }}>
                  {previewRewards}
                </div>
              ) : (
                <div className="ao-italic" style={{ fontSize: 13, color: 'var(--ink-faint)' }}>
                  Без избираемых даров
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
  choiceSelections,
  setChoiceSelections,
  asi,
  setAsi,
  onBack,
  onNext,
}: {
  option: AvailableClassOption;
  currentTotal: number;
  characterName?: string;
  choiceSelections: Record<string, string>;
  setChoiceSelections: (s: Record<string, string>) => void;
  asi: AsiAllocation;
  setAsi: (a: AsiAllocation) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const automatic = option.rewardGroups.filter((g) => !g.isChoice);
  const choices = option.rewardGroups.filter((g) => g.isChoice);
  const asiGroup = choices.find((g) => g.rewardType === 'ABILITY_SCORE_IMPROVEMENT');
  const subclassGroups = choices.filter((g) => g.rewardType === 'SUBCLASS');
  const normalChoices = choices.filter(
    (g) => g.rewardType !== 'ABILITY_SCORE_IMPROVEMENT' && g.rewardType !== 'SUBCLASS',
  );

  const allChoiceGroups = [...subclassGroups, ...normalChoices];
  const asiTotal = asiGroup ? Object.values(asi.points).reduce((sum, v) => sum + v, 0) : 0;
  const asiValid = asiGroup ? asiTotal === 2 : true;
  const choicesValid = allChoiceGroups.every((g) => {
    const allAlready = g.rewards.length > 0 && g.rewards.every((r) => r.alreadyAcquired);
    if (allAlready) return true;
    return !!choiceSelections[g.rewardType];
  });

  // Build the "rites yet to be chosen" checklist from real groups
  const rites: { name: string; complete: boolean }[] = [
    ...allChoiceGroups.map((g) => {
      const allAlready = g.rewards.length > 0 && g.rewards.every((r) => r.alreadyAcquired);
      return {
        name: `Избрать · ${REWARD_TYPE_LABELS[g.rewardType] || g.rewardType}`,
        complete: allAlready || !!choiceSelections[g.rewardType],
      };
    }),
    ...(asiGroup ? [{ name: 'Возвысить аспекты · 2 очка', complete: asiValid }] : []),
  ];

  // Grants granted automatically by the ascent (always Vitae first)
  const grants: { glyph: string; label: string; value: string; sub?: string; tone: Tone }[] = [
    { glyph: 'flame', label: 'Виталис', value: '+по классу', sub: 'Хиты', tone: 'ember' },
    ...automatic.flatMap((g) =>
      g.rewards.length === 0
        ? [{ glyph: 'scroll', label: REWARD_TYPE_LABELS[g.rewardType] || g.rewardType, value: 'Авто', sub: 'При печати', tone: 'arcane' as Tone }]
        : g.rewards.map((r) => ({
            glyph: 'sigil-3',
            label: REWARD_TYPE_LABELS[g.rewardType] || g.rewardType,
            value: r.name,
            sub: r.description,
            tone: 'gold' as Tone,
          })),
    ),
  ];

  return (
    <div>
      {/* The ceremony scroll — dramatic reveal */}
      <div
        className="ao-panel ao-frame"
        style={{
          position: 'relative',
          marginBottom: 16,
          padding: 0,
          background: 'linear-gradient(180deg, #221d1a 0%, #14110f 100%)',
          boxShadow: '0 4px 0 rgba(0,0,0,0.6), 0 24px 60px rgba(0,0,0,0.7), 0 0 60px rgba(176, 141, 78, 0.06)',
        }}
      >
        <span className="ao-frame-c" />

        {/* Top band */}
        <div style={{ padding: '24px 48px 0', textAlign: 'center' }}>
          <div className="ao-codex" style={{ color: 'var(--ink-faint)' }}>
            {option.className} · Folio V-{String(option.newLevelInClass).padStart(3, '0')}
          </div>
          <div className="ao-engraved" style={{ fontSize: 13, color: 'var(--ink-quiet)', marginTop: 6 }}>
            По свидетельству Ордо
          </div>
          <OrdoDivider glyph="diamond-fill" />
        </div>

        {/* Number reveal */}
        <div style={{ padding: '0 48px', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
            <div style={{ textAlign: 'right' }}>
              <div className="ao-overline">Было</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 64, color: 'var(--ink-faint)', lineHeight: 1, fontStyle: 'italic' }}>
                {roman(currentTotal)}
              </div>
            </div>
            <Rune kind="arrow-r" size={28} color="var(--gold)" />
            <div className="ao-breathe">
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 120, fontWeight: 700, color: 'var(--gold-pale)', lineHeight: 1, textShadow: '0 0 32px rgba(176, 141, 78, 0.4)' }}>
                {roman(currentTotal + 1)}
              </div>
            </div>
          </div>
          <div className="ao-h4" style={{ marginTop: 18, fontStyle: 'italic' }}>
            {option.className} · {roman(option.currentLevelInClass)} → {roman(option.newLevelInClass)}
          </div>
          {characterName && (
            <p className="ao-italic" style={{ fontSize: 16, marginTop: 8, color: 'var(--ink)', maxWidth: 540, margin: '8px auto 0', lineHeight: 1.5 }}>
              {characterName}, Ордо признаёт твоё бдение. Дары, что грядут, избираются с тщанием и
              скрепляются печатью в анналах Капитула.
            </p>
          )}
        </div>

        {/* Grants summary */}
        <div style={{ padding: 32, paddingTop: 24 }}>
          <OrdoDivider glyph="diamond-fill">Дарованное Восхождением</OrdoDivider>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginTop: 14 }}>
            {grants.map((g, i) => (
              <GrantCard key={i} glyph={g.glyph} label={g.label} value={g.value} sub={g.sub} tone={g.tone} />
            ))}
          </div>

          {rites.length > 0 && (
            <>
              <OrdoDivider glyph="cross-pat">Дары, что должно избрать</OrdoDivider>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {rites.map((r, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 14px',
                      background: 'var(--abyss)',
                      border: `1px solid ${r.complete ? 'rgba(176, 141, 78, 0.4)' : 'var(--hairline)'}`,
                    }}
                  >
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `1px solid ${r.complete ? 'var(--brass)' : 'var(--rule)'}`,
                        background: r.complete ? 'var(--bronze)' : 'transparent',
                      }}
                    >
                      <Rune kind={r.complete ? 'check' : 'diamond'} size={10} color={r.complete ? 'var(--ink-bright)' : 'var(--ink-faint)'} />
                    </span>
                    <span style={{ flex: 1, color: r.complete ? 'var(--ink-quiet)' : 'var(--ink-bright)', textDecoration: r.complete ? 'line-through' : 'none' }}>
                      {r.name}
                    </span>
                    <span className="ao-overline" style={{ color: r.complete ? 'var(--gold-pale)' : 'var(--ember)' }}>
                      {r.complete ? 'Скреплено' : 'Открыто'}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Subclass — Choosing of Oaths */}
      {subclassGroups.map((g) => (
        <OathGroup
          key={g.rewardType}
          group={g}
          selectedId={choiceSelections[g.rewardType] || ''}
          onSelect={(id) => setChoiceSelections({ ...choiceSelections, [g.rewardType]: id })}
        />
      ))}

      {/* Other choices — Three Offerings */}
      {normalChoices.map((g) => (
        <ChoiceGroup
          key={g.rewardType}
          group={g}
          selectedId={choiceSelections[g.rewardType] || ''}
          onSelect={(id) => setChoiceSelections({ ...choiceSelections, [g.rewardType]: id })}
        />
      ))}

      {asiGroup && <AsiGroup group={asiGroup} asi={asi} setAsi={setAsi} />}

      {rites.length === 0 && (
        <OrdoPanel frame padding={0} style={{ marginBottom: 16 }}>
          <div style={{ padding: 18 }} className="ao-italic">
            На этой ступени нет избираемых даров. Виталис и уровень будут возвышены при печати.
          </div>
        </OrdoPanel>
      )}

      {/* Footer ribbon */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <button className="ao-btn ao-btn--ghost" onClick={onBack}>
          <ArrowLeft className="h-3 w-3" /> Назад к Восхождению
        </button>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="ao-codex">Ступень II из III</span>
          <span style={{ display: 'flex', gap: 4 }}>
            <span style={{ width: 16, height: 4, background: 'var(--gold)' }} />
            <span style={{ width: 16, height: 4, background: 'var(--gold)' }} />
            <span style={{ width: 16, height: 4, background: 'var(--rule)' }} />
          </span>
        </div>
        <button className="ao-btn ao-btn--primary ao-btn--lg" onClick={onNext} disabled={!choicesValid || !asiValid}>
          <Rune kind="diamond-fill" size={9} /> К печати
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
    <div style={{ padding: 16, background: 'var(--abyss)', border: '1px solid var(--rule-strong)', textAlign: 'center', position: 'relative' }}>
      <Rune kind={glyph} size={22} color={color} />
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 32, color: 'var(--ink-bright)', lineHeight: 1.1, marginTop: 6, wordBreak: 'break-word' }}>
        {value}
      </div>
      <div className="ao-overline" style={{ marginTop: 4 }}>{label}</div>
      {sub && <div className="ao-codex" style={{ fontSize: 10, marginTop: 2, color: 'var(--ink-faint)' }}>{sub}</div>}
    </div>
  );
}

// ── Subclass oaths (banner cards) ────────────────────────────────────

function OathGroup({
  group,
  selectedId,
  onSelect,
}: {
  group: RewardGroup;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const allAlready = group.rewards.length > 0 && group.rewards.every((r) => r.alreadyAcquired);
  return (
    <OrdoPanel frame padding={0} style={{ marginBottom: 16 }}>
      <PanelHeader
        title="Избрание обета"
        glyph="shield"
        sub="Обет нельзя обменять — лишь углубить или преступить"
        tone="arcane"
      />
      <div style={{ padding: 16 }}>
        {group.rewards.length === 0 ? (
          <EmptyChoiceNote text="Список обетов недоступен — возможно, выбор более не требуется." />
        ) : allAlready ? (
          <EmptyChoiceNote text="Все обеты уже приняты ранее." />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
            {group.rewards.map((r, i) => (
              <OathCard
                key={r.rewardEntryId}
                reward={r}
                tone={cycleTone(i)}
                selected={selectedId === r.rewardEntryId}
                onSelect={() => !r.alreadyAcquired && onSelect(r.rewardEntryId)}
              />
            ))}
          </div>
        )}
      </div>
    </OrdoPanel>
  );
}

function OathCard({
  reward,
  tone,
  selected,
  onSelect,
}: {
  reward: RewardEntry;
  tone: Tone;
  selected: boolean;
  onSelect: () => void;
}) {
  const disabled = reward.alreadyAcquired;
  const color = toneVar(tone);
  return (
    <div
      onClick={onSelect}
      className="ao-panel ao-frame"
      style={{
        position: 'relative',
        padding: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        borderColor: selected ? color : undefined,
        background: selected ? 'linear-gradient(180deg, rgba(176, 141, 78, 0.06) 0%, var(--panel) 100%)' : undefined,
        transition: 'border-color 200ms',
      }}
    >
      <span className="ao-frame-c" />
      {/* Banner area */}
      <div style={{ position: 'relative', height: 140, borderBottom: '1px solid var(--rule)', overflow: 'hidden' }}>
        <Placeholder style={{ position: 'absolute', inset: 0 }}>знамя · иконография «{reward.name}»</Placeholder>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 0%, var(--panel) 100%)' }} />
        <div style={{ position: 'absolute', top: 14, left: 14 }}>
          <Sigil size={36} glyph="shield" color={color} />
        </div>
        <div style={{ position: 'absolute', bottom: 14, left: 14, right: 14 }}>
          <div className="ao-overline" style={{ color }}>обет · священный</div>
          <div className="ao-h5" style={{ fontSize: 22, marginTop: 2 }}>{reward.name}</div>
        </div>
        {selected && (
          <div style={{ position: 'absolute', top: 14, right: 14 }}>
            <OrdoChip glyph="diamond-fill" tone={tone}>Рассматривается</OrdoChip>
          </div>
        )}
      </div>

      {reward.description && (
        <div style={{ padding: 16 }}>
          <p className="ao-italic" style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.45 }}>«{reward.description}»</p>
        </div>
      )}

      <div style={{ padding: '12px 16px', background: 'var(--abyss)', borderTop: '1px solid var(--rule)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="ao-codex" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
          {disabled ? 'Уже принят' : selected ? 'Избран к печати' : 'Принять обет'}
        </span>
        <Rune kind="chev-r" size={12} color={selected ? color : 'var(--ink-faint)'} />
      </div>
    </div>
  );
}

// ── Generic choice (offerings — framed relic cards) ──────────────────

function ChoiceGroup({
  group,
  selectedId,
  onSelect,
}: {
  group: RewardGroup;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const allAlready = group.rewards.length > 0 && group.rewards.every((r) => r.alreadyAcquired);
  return (
    <OrdoPanel frame padding={0} style={{ marginBottom: 16 }}>
      <PanelHeader
        title={`Подношения: ${REWARD_TYPE_LABELS[group.rewardType] || group.rewardType}`}
        glyph="sigil-1"
        sub="Избери один — прочие вернутся в Хранилище"
        tone="arcane"
      />
      <div style={{ padding: 16 }}>
        {group.rewards.length === 0 ? (
          <EmptyChoiceNote text="Список вариантов недоступен — возможно, выбор более не требуется." />
        ) : allAlready ? (
          <EmptyChoiceNote text="Все варианты уже получены ранее." />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 22 }}>
            {group.rewards.map((r, i) => (
              <OfferingCard
                key={r.rewardEntryId}
                reward={r}
                tone={cycleTone(i)}
                typeLabel={REWARD_TYPE_LABELS[group.rewardType] || group.rewardType}
                selected={selectedId === r.rewardEntryId}
                onSelect={() => !r.alreadyAcquired && onSelect(r.rewardEntryId)}
              />
            ))}
          </div>
        )}
      </div>
    </OrdoPanel>
  );
}

function OfferingCard({
  reward,
  tone,
  typeLabel,
  selected,
  onSelect,
}: {
  reward: RewardEntry;
  tone: Tone;
  typeLabel: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const disabled = reward.alreadyAcquired;
  const color = toneVar(tone);
  const glow =
    tone === 'arcane' ? 'rgba(90,142,148,0.25)' : tone === 'ember' ? 'rgba(179,70,26,0.25)' : 'rgba(176,141,78,0.25)';
  return (
    <div
      onClick={onSelect}
      className="ao-panel ao-frame"
      style={{
        position: 'relative',
        padding: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transform: selected ? 'translateY(-6px)' : 'none',
        transition: 'transform 300ms cubic-bezier(0.2, 0.7, 0.2, 1), box-shadow 300ms',
        boxShadow: selected
          ? `var(--shadow-inset), 0 8px 0 rgba(0,0,0,0.6), 0 24px 60px rgba(0,0,0,0.65), 0 0 24px ${glow}`
          : undefined,
        borderColor: selected ? color : undefined,
        background: selected ? 'linear-gradient(180deg, #2a241f 0%, var(--panel) 100%)' : undefined,
      }}
    >
      <span className="ao-frame-c" />
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--rule)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <CodexID>{typeLabel}</CodexID>
        {selected ? (
          <OrdoChip glyph="check" tone={tone}>Скрепляется</OrdoChip>
        ) : (
          <span className="ao-codex" style={{ fontSize: 11 }}>{disabled ? 'уже получено' : 'нажми, чтобы скрепить'}</span>
        )}
      </div>

      <div style={{ padding: 20, textAlign: 'center' }}>
        <div
          style={{
            width: 130,
            height: 130,
            margin: '0 auto',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${color}`,
            background: 'radial-gradient(circle at 50% 30%, rgba(20,17,15,0.5), var(--abyss))',
            boxShadow: `inset 0 0 24px ${selected ? color : 'rgba(0,0,0,0.5)'}`,
          }}
        >
          <div style={{ position: 'absolute', inset: 6, border: '1px solid var(--hairline)' }} />
          <Rune kind={glyphFor(tone)} size={56} color={color} />
        </div>

        <div className="ao-overline" style={{ marginTop: 16, color }}>{typeLabel}</div>
        <div className="ao-h5" style={{ marginTop: 4, fontSize: 22 }}>{reward.name}</div>
      </div>

      <div style={{ padding: '0 18px' }}>
        <OrdoDivider glyph="diamond" color={color} />
      </div>

      {reward.description && (
        <div style={{ padding: '12px 18px', background: 'var(--abyss)', borderTop: '1px solid var(--rule)' }}>
          <div className="ao-overline" style={{ marginBottom: 4 }}>Инскрипция</div>
          <div className="ao-italic" style={{ fontSize: 12, color: 'var(--ink)', lineHeight: 1.45 }}>«{reward.description}»</div>
        </div>
      )}
    </div>
  );
}

function EmptyChoiceNote({ text }: { text: string }) {
  return (
    <div className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 13 }}>{text}</div>
  );
}

// ── ASI ──────────────────────────────────────────────────────────────

function AsiGroup({
  group,
  asi,
  setAsi,
}: {
  group: RewardGroup;
  asi: AsiAllocation;
  setAsi: (a: AsiAllocation) => void;
}) {
  const total = Object.values(asi.points).reduce((sum, v) => sum + v, 0);
  const remaining = 2 - total;
  const change = (rewardEntryId: string, delta: number) => {
    const current = asi.points[rewardEntryId] || 0;
    const next = Math.max(0, Math.min(2, current + delta));
    if (delta > 0 && remaining <= 0) return;
    if (next === current) return;
    setAsi({ points: { ...asi.points, [rewardEntryId]: next } });
  };
  return (
    <OrdoPanel frame padding={0} style={{ marginBottom: 16 }}>
      <PanelHeader
        title="Возвышение аспектов"
        glyph="sigil-2"
        sub="Распредели два очка характеристик"
        tone="arcane"
        right={
          <span className="ao-codex" style={{ fontSize: 11, color: remaining === 0 ? 'var(--gold-pale)' : 'var(--ink-quiet)' }}>
            Осталось: {remaining}
          </span>
        }
      />
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {group.rewards.length === 0 && (
          <EmptyChoiceNote text="Нет доступных аспектов для возвышения на этой ступени." />
        )}
        {group.rewards.map((r) => {
          const value = asi.points[r.rewardEntryId] || 0;
          const disabled = r.alreadyAcquired;
          return (
            <div
              key={r.rewardEntryId}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto auto auto',
                gap: 12,
                alignItems: 'center',
                padding: '8px 12px',
                background: value > 0 ? 'rgba(176,141,78,0.06)' : 'var(--abyss)',
                border: `1px solid ${value > 0 ? 'var(--bronze-warm)' : 'var(--hairline)'}`,
                opacity: disabled ? 0.5 : 1,
              }}
            >
              <span style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="ao-h5" style={{ fontSize: 14 }}>{r.name}</span>
                {r.description && (
                  <span className="ao-italic" style={{ fontSize: 11, color: 'var(--ink-quiet)' }}>{r.description}</span>
                )}
              </span>
              <button className="ao-iconbtn" disabled={disabled || value <= 0} onClick={() => change(r.rewardEntryId, -1)}>
                <Rune kind="minus" size={11} />
              </button>
              <span style={{ minWidth: 28, textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--gold)' }}>+{value}</span>
              <button className="ao-iconbtn" disabled={disabled || remaining <= 0 || value >= 2} onClick={() => change(r.rewardEntryId, 1)}>
                <Rune kind="plus" size={11} />
              </button>
            </div>
          );
        })}
      </div>
    </OrdoPanel>
  );
}

// ── Step 3: confirm — the Seal ───────────────────────────────────────

function StepConfirm({
  option,
  choiceSelections,
  asi,
  submitting,
  onBack,
  onConfirm,
}: {
  option: AvailableClassOption;
  choiceSelections: Record<string, string>;
  asi: AsiAllocation;
  submitting: boolean;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const automatic = option.rewardGroups.filter((g) => !g.isChoice);
  const chosenLines: { type: string; name: string; tag: 'auto' | 'choice' }[] = [];
  for (const g of automatic) {
    for (const r of g.rewards) chosenLines.push({ type: g.rewardType, name: r.name, tag: 'auto' });
  }
  for (const g of option.rewardGroups) {
    if (!g.isChoice || g.rewardType === 'ABILITY_SCORE_IMPROVEMENT') continue;
    const id = choiceSelections[g.rewardType];
    const r = g.rewards.find((x) => x.rewardEntryId === id);
    if (r) chosenLines.push({ type: g.rewardType, name: r.name, tag: 'choice' });
  }
  const asiGroup = option.rewardGroups.find((g) => g.rewardType === 'ABILITY_SCORE_IMPROVEMENT');
  if (asiGroup) {
    for (const [entryId, points] of Object.entries(asi.points)) {
      if (!points) continue;
      const r = asiGroup.rewards.find((x) => x.rewardEntryId === entryId);
      if (r) chosenLines.push({ type: 'ABILITY_SCORE_IMPROVEMENT', name: `${r.name} +${points}`, tag: 'choice' });
    }
  }

  return (
    <div>
      <OrdoPanel frame padding={0} style={{ marginBottom: 16 }}>
        <PanelHeader title="Печать Восхождения" glyph="diamond" sub="Скреплённое не переписать" />
        <div style={{ padding: 16 }}>
          <div className="ao-codex" style={{ fontSize: 13, marginBottom: 8 }}>
            Призвание: <strong style={{ color: 'var(--gold)' }}>{option.className}</strong>{' '}
            {roman(option.currentLevelInClass)} → {roman(option.newLevelInClass)}
          </div>
          <OrdoDivider glyph="diamond" />
          <div className="ao-overline" style={{ marginTop: 10, marginBottom: 8 }}>Дары, что будут скреплены</div>
          {chosenLines.length === 0 ? (
            <div className="ao-italic" style={{ color: 'var(--ink-faint)' }}>Виталис и уровень будут возвышены.</div>
          ) : (
            chosenLines.map((line, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--hairline)' }}>
                <Rune kind={line.tag === 'auto' ? 'diamond' : 'diamond-fill'} size={12} color={line.tag === 'auto' ? 'var(--ink-quiet)' : 'var(--gold)'} />
                <span className="ao-codex" style={{ fontSize: 11, color: 'var(--ink-faint)', minWidth: 120 }}>
                  {REWARD_TYPE_LABELS[line.type] || line.type}
                </span>
                <span style={{ color: 'var(--ink-bright)' }}>{line.name}</span>
              </div>
            ))
          )}
        </div>
      </OrdoPanel>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 20px',
          background: 'var(--abyss)',
          border: '1px solid var(--rule-strong)',
          marginBottom: 16,
        }}
      >
        <Rune kind="lock" size={14} color="var(--ember)" />
        <span className="ao-italic" style={{ fontSize: 13 }}>
          Этот выбор не переписать. Неизбранное не вернётся.
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="ao-btn ao-btn--ghost" onClick={onBack} disabled={submitting}>
          <ArrowLeft className="h-3 w-3" /> Назад
        </button>
        <button className="ao-btn ao-btn--primary ao-btn--lg" onClick={onConfirm} disabled={submitting}>
          {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          Скрепить печатью
        </button>
      </div>
    </div>
  );
}

// ── Step 4: result ───────────────────────────────────────────────────

function StepResult({ result, onDone }: { result: LevelUpResultResponse; onDone: () => void }) {
  return (
    <div>
      <div
        className="ao-panel ao-frame ao-grain"
        style={{
          position: 'relative',
          padding: 28,
          marginBottom: 16,
          overflow: 'hidden',
          textAlign: 'center',
          background: 'linear-gradient(180deg, #221d1a 0%, #14110f 100%)',
          boxShadow: '0 0 60px rgba(176, 141, 78, 0.08)',
        }}
      >
        <span className="ao-frame-c" />
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <Sigil size={64} glyph="flame" color="var(--gold-pale)" />
        </div>
        <div className="ao-codex ao-flicker" style={{ color: 'var(--gold-pale)' }}>— ВОСХОЖДЕНИЕ СВЕРШИЛОСЬ —</div>
        <div className="ao-breathe" style={{ marginTop: 10 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 72, fontWeight: 700, color: 'var(--gold-pale)', lineHeight: 1, textShadow: '0 0 32px rgba(176, 141, 78, 0.4)' }}>
            {roman(result.newTotalLevel)}
          </div>
        </div>
        <div className="ao-h4" style={{ marginTop: 12, fontStyle: 'italic' }}>
          {result.classLeveled} · {roman(result.newClassLevel)}
        </div>
      </div>

      <OrdoPanel frame padding={0} style={{ marginBottom: 16 }}>
        <PanelHeader title="Скреплённые дары" glyph="check" tone="gold" />
        <div style={{ padding: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
            <GrantCard glyph="helm" label="Призвание" value={`${result.classLeveled} ${roman(result.newClassLevel)}`} tone="gold" />
            <GrantCard glyph="sigil-2" label="Общий уровень" value={roman(result.newTotalLevel)} tone="arcane" />
            {result.hpIncrease !== undefined && (
              <GrantCard
                glyph="flame"
                label="Виталис"
                value={`+${result.hpIncrease}`}
                sub={result.newMaxHp ? `Всего ${result.newMaxHp}` : undefined}
                tone="ember"
              />
            )}
          </div>
          <OrdoDivider glyph="diamond-fill">Полученные дары</OrdoDivider>
          {result.rewardsAcquired.length === 0 ? (
            <div className="ao-italic" style={{ color: 'var(--ink-faint)', marginTop: 8 }}>—</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, marginTop: 12 }}>
              {result.rewardsAcquired.map((r, idx) => (
                <div key={idx} style={{ padding: '8px 10px', border: '1px solid var(--hairline)', background: 'var(--abyss)', display: 'flex', flexDirection: 'column' }}>
                  <span className="ao-codex" style={{ fontSize: 10, color: 'var(--ink-faint)' }}>
                    {REWARD_TYPE_LABELS[r.rewardType] || r.rewardType}
                  </span>
                  <span style={{ color: 'var(--ink-bright)' }}>{r.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </OrdoPanel>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="ao-btn ao-btn--primary" onClick={onDone}>
          <Heart className="h-3 w-3" /> К персонажу <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────

function toneVar(tone: Tone): string {
  return tone === 'arcane' ? 'var(--arcane)' : tone === 'ember' ? 'var(--ember)' : 'var(--gold)';
}

function cycleTone(i: number): Tone {
  return (['gold', 'arcane', 'ember'] as const)[i % 3];
}

function glyphFor(tone: Tone): string {
  return tone === 'arcane' ? 'sigil-1' : tone === 'ember' ? 'flame' : 'shield';
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

function buildSelections(
  option: AvailableClassOption,
  choiceSelections: Record<string, string>,
  asi: AsiAllocation,
): RewardSelection[] {
  const out: RewardSelection[] = [];
  for (const g of option.rewardGroups) {
    if (!g.isChoice) continue;
    if (g.rewardType === 'ABILITY_SCORE_IMPROVEMENT') continue;
    const id = choiceSelections[g.rewardType];
    if (id) out.push({ rewardType: g.rewardType, rewardEntryId: id });
  }
  for (const [entryId, points] of Object.entries(asi.points)) {
    for (let i = 0; i < points; i++) {
      out.push({ rewardType: 'ABILITY_SCORE_IMPROVEMENT', rewardEntryId: entryId });
    }
  }
  return out;
}
