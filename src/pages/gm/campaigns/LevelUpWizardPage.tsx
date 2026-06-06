import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Sparkles, Heart, Loader2, Lock, Check } from 'lucide-react';
import { OrdoPanel, PanelHeader, Rune, OrdoDivider } from '@/components/ordo';
import { useCharacterV2 } from '@/hooks/useCharacterV2';
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

export default function LevelUpWizardPage() {
  const navigate = useNavigate();
  const { campaignId, characterId } = useParams<{ campaignId: string; characterId: string }>();
  const { data: character } = useCharacterV2(campaignId!, characterId!);
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

  const charLine = character
    ? `${character.name} · ${character.classLevels?.map((cl) => `${cl.className} ${cl.classLevel}`).join(' / ') || `LVL ${character.totalLevel}`}`
    : null;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p className="ao-overline" style={{ color: 'var(--gold)' }}>— Rite of Ascent —</p>
          <h3 className="ao-h3" style={{ marginTop: 4 }}>Восхождение</h3>
          {charLine && (
            <p className="ao-italic" style={{ color: 'var(--ink-quiet)', fontSize: 13, marginTop: 4 }}>
              {charLine}
            </p>
          )}
        </div>
        <button className="ao-btn ao-btn--ghost" onClick={backToCharacter}>
          <ArrowLeft className="h-3 w-3" /> Отложить
        </button>
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
        <div className="ao-seal ao-breathe" style={{ width: 56, height: 56, margin: '0 auto 18px' }}>
          <Rune kind={glyph} size={22} color="var(--gold)" />
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
                {isDone ? <Check className="h-3 w-3" /> : idx + 1}
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
}: {
  options: AvailableClassOption[];
  currentTotal: number;
  selectedClassId: string | null;
  onSelect: (id: string) => void;
  onNext: () => void;
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

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
  const choicesValid = allChoiceGroups.every((g) => {
    const allAlready = g.rewards.length > 0 && g.rewards.every((r) => r.alreadyAcquired);
    if (allAlready) return true;
    return !!choiceSelections[g.rewardType];
  });
  const asiTotal = asiGroup ? Object.values(asi.points).reduce((sum, v) => sum + v, 0) : 0;
  const asiValid = asiGroup ? asiTotal === 2 : true;

  const pendingCount = allChoiceGroups.length + (asiGroup ? 1 : 0);

  return (
    <div>
      <RiteBanner
        characterName={characterName}
        className={option.className}
        from={currentTotal}
        to={currentTotal + 1}
        fromClass={option.currentLevelInClass}
        toClass={option.newLevelInClass}
      />

      {/* Granted by the Ascent */}
      <OrdoPanel frame padding={0} style={{ marginBottom: 16 }}>
        <PanelHeader title="Дарованное Восхождением" glyph="flame" tone="gold" />
        <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
          <GrantCard glyph="flame" label="Виталис · Хиты" value="+по классу" />
          {automatic.length === 0 ? (
            <GrantCard glyph="diamond" label="Прочее" value="Применится при печати" muted />
          ) : (
            automatic.flatMap((g) =>
              g.rewards.length === 0
                ? [<GrantCard key={g.rewardType} glyph="diamond" label={REWARD_TYPE_LABELS[g.rewardType] || g.rewardType} value="Автоматически" muted />]
                : g.rewards.map((r) => (
                    <GrantCard
                      key={r.rewardEntryId}
                      glyph="diamond-fill"
                      label={REWARD_TYPE_LABELS[g.rewardType] || g.rewardType}
                      value={r.name}
                      hint={r.description}
                    />
                  )),
            )
          )}
        </div>
      </OrdoPanel>

      {pendingCount > 0 && (
        <div className="ao-overline" style={{ margin: '6px 2px 12px', color: 'var(--gold)' }}>
          Дары, что должно избрать — {pendingCount}
        </div>
      )}

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

      {pendingCount === 0 && (
        <OrdoPanel frame padding={0} style={{ marginBottom: 16 }}>
          <div style={{ padding: 18 }} className="ao-italic">
            На этой ступени нет избираемых даров. Виталис и уровень будут возвышены при печати.
          </div>
        </OrdoPanel>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button className="ao-btn ao-btn--ghost" onClick={onBack}>
          <ArrowLeft className="h-3 w-3" /> Назад
        </button>
        <button className="ao-btn ao-btn--primary" onClick={onNext} disabled={!choicesValid || !asiValid}>
          К печати <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function RiteBanner({
  characterName,
  className,
  from,
  to,
  fromClass,
  toClass,
}: {
  characterName?: string;
  className: string;
  from: number;
  to: number;
  fromClass: number;
  toClass: number;
}) {
  return (
    <div className="ao-panel ao-frame ao-grain" style={{ position: 'relative', padding: 24, marginBottom: 16, overflow: 'hidden' }}>
      <span className="ao-frame-c" />
      <div className="ao-seal ao-breathe" style={{ position: 'absolute', top: 16, right: 16, width: 44, height: 44 }}>
        <Rune kind="flame" size={18} color="var(--gold)" />
      </div>

      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
        <div className="ao-overline" style={{ color: 'var(--gold)' }}>— Rite of Ascent —</div>
        <div className="ao-italic" style={{ color: 'var(--ink-quiet)', fontSize: 13, marginTop: 4 }}>
          По свидетельству Ордо
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, margin: '18px 0 10px' }}>
          <RomanMark label="Было" value={from} />
          <Rune kind="arrow-r" size={20} color="var(--brass)" />
          <RomanMark label="Стало" value={to} highlight />
        </div>

        <div className="ao-h4" style={{ fontSize: 22 }}>
          {className} · {roman(fromClass)} → {roman(toClass)}
        </div>
        {characterName && (
          <div className="ao-italic" style={{ color: 'var(--ink-quiet)', fontSize: 14, marginTop: 10, maxWidth: 560, marginInline: 'auto', lineHeight: 1.5 }}>
            {characterName}, Ордо признаёт твоё бдение. Дары, что грядут, избираются с тщанием и
            скрепляются печатью в анналах Капитула.
          </div>
        )}
      </div>
    </div>
  );
}

function RomanMark({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <span className="ao-overline" style={{ fontSize: 9 }}>{label}</span>
      <span
        className="ao-h2"
        style={{ fontSize: 44, lineHeight: 1, color: highlight ? 'var(--gold-pale)' : 'var(--ink-faint)' }}
      >
        {roman(value)}
      </span>
    </div>
  );
}

function GrantCard({
  glyph,
  label,
  value,
  hint,
  muted,
}: {
  glyph: string;
  label: string;
  value: string;
  hint?: string;
  muted?: boolean;
}) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px', background: 'var(--abyss)', border: '1px solid var(--rule)' }}>
      <Rune kind={glyph} size={16} color={muted ? 'var(--ink-faint)' : 'var(--gold)'} />
      <div style={{ minWidth: 0 }}>
        <div className="ao-overline" style={{ fontSize: 9 }}>{label}</div>
        <div className="ao-h5" style={{ fontSize: 15, color: muted ? 'var(--ink-quiet)' : 'var(--ink-bright)' }}>{value}</div>
        {hint && (
          <div className="ao-italic" style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 2 }}>{hint}</div>
        )}
      </div>
    </div>
  );
}

// ── Subclass oaths ───────────────────────────────────────────────────

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
      <PanelHeader title="Избрание обета" glyph="shield" sub="Обет нельзя обменять — лишь углубить или преступить" tone="arcane" />
      <div style={{ padding: 16 }}>
        {group.rewards.length === 0 ? (
          <EmptyChoiceNote text="Список обетов недоступен — возможно, выбор более не требуется." />
        ) : allAlready ? (
          <EmptyChoiceNote text="Все обеты уже приняты ранее." />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            {group.rewards.map((r) => (
              <OathCard
                key={r.rewardEntryId}
                reward={r}
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

function OathCard({ reward, selected, onSelect }: { reward: RewardEntry; selected: boolean; onSelect: () => void }) {
  const disabled = reward.alreadyAcquired;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={`wiz-card${selected ? ' is-active' : ''}`}
      style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 56, marginBottom: 8, border: '1px solid var(--hairline)', background: 'var(--abyss)' }}>
        <Rune kind="shield" size={26} color={selected ? 'var(--gold-pale)' : 'var(--ink-faint)'} />
      </div>
      <div className="ao-overline" style={{ fontSize: 9, color: selected ? 'var(--gold)' : 'var(--ink-faint)' }}>
        {selected ? 'Рассматривается' : disabled ? 'Уже принят' : 'Обет · священный'}
      </div>
      <div className="ao-h5" style={{ fontSize: 16 }}>{reward.name}</div>
      {reward.description && (
        <div className="ao-italic" style={{ fontSize: 13, color: 'var(--ink-quiet)', lineHeight: 1.45 }}>
          «{reward.description}»
        </div>
      )}
    </button>
  );
}

// ── Generic choice (offerings) ───────────────────────────────────────

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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {group.rewards.map((r) => (
              <OfferingCard
                key={r.rewardEntryId}
                reward={r}
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

function OfferingCard({ reward, selected, onSelect }: { reward: RewardEntry; selected: boolean; onSelect: () => void }) {
  const disabled = reward.alreadyAcquired;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={`wiz-card${selected ? ' is-active' : ''}`}
      style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      <div className="wiz-card-top">
        <span className="ao-overline" style={{ fontSize: 9, flex: 1, color: selected ? 'var(--gold)' : 'var(--ink-faint)' }}>
          {selected ? 'Скрепляется' : disabled ? 'Уже получено' : 'Нажми, чтобы скрепить'}
        </span>
        {selected && <Rune kind="check" size={14} color="var(--gold-pale)" />}
      </div>
      <div className="ao-h5" style={{ fontSize: 16 }}>{reward.name}</div>
      {reward.description && (
        <div className="ao-italic" style={{ fontSize: 13, color: 'var(--ink-quiet)', lineHeight: 1.45 }}>
          {reward.description}
        </div>
      )}
    </button>
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
      <div className="ao-panel ao-frame ao-grain" style={{ position: 'relative', padding: 24, marginBottom: 16, overflow: 'hidden', textAlign: 'center' }}>
        <span className="ao-frame-c" />
        <div className="ao-seal ao-flicker" style={{ width: 56, height: 56, margin: '0 auto 14px' }}>
          <Rune kind="flame" size={24} color="var(--gold-pale)" />
        </div>
        <div className="ao-overline" style={{ color: 'var(--gold)' }}>— Восхождение свершилось —</div>
        <div className="ao-h3" style={{ marginTop: 6 }}>
          {result.classLeveled} {roman(result.newClassLevel)}
        </div>
        <div className="ao-italic" style={{ color: 'var(--ink-quiet)', fontSize: 14, marginTop: 4 }}>
          Общий уровень — {roman(result.newTotalLevel)}
        </div>
      </div>

      <OrdoPanel frame padding={0} style={{ marginBottom: 16 }}>
        <PanelHeader title="Скреплённые дары" glyph="check" tone="gold" />
        <div style={{ padding: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
            <Stat label="Призвание" value={`${result.classLeveled} ${roman(result.newClassLevel)}`} />
            <Stat label="Общий уровень" value={roman(result.newTotalLevel)} />
            {result.hpIncrease !== undefined && (
              <Stat
                label={<><Heart className="inline h-3 w-3" /> Виталис</>}
                value={`+${result.hpIncrease}${result.newMaxHp ? ` (${result.newMaxHp})` : ''}`}
              />
            )}
          </div>
          <div className="ao-overline" style={{ marginBottom: 8 }}>Полученные дары</div>
          {result.rewardsAcquired.length === 0 ? (
            <div className="ao-italic" style={{ color: 'var(--ink-faint)' }}>—</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
              {result.rewardsAcquired.map((r, idx) => (
                <div key={idx} style={{ padding: '8px 10px', border: '1px solid var(--hairline)', display: 'flex', flexDirection: 'column' }}>
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
        <button className="ao-btn ao-btn--primary" onClick={onDone}>К персонажу <ArrowRight className="h-3 w-3" /></button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '10px 12px', border: '1px solid var(--hairline)', background: 'var(--abyss)' }}>
      <span className="ao-overline">{label}</span>
      <span className="ao-h4" style={{ fontSize: 22 }}>{value}</span>
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────

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
