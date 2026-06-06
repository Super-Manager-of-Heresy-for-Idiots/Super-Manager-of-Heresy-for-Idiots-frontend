import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Sparkles, Heart, Loader2, Trophy, Lock, Check } from 'lucide-react';
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
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <p className="ao-italic" style={{ color: 'var(--ink-faint)', marginBottom: 16 }}>
          {(error as { response?: { data?: { message?: string } } })?.response?.data?.message
            || 'Этот персонаж пока не готов к повышению уровня.'}
        </p>
        <button className="ao-btn" onClick={backToCharacter}>← К персонажу</button>
      </div>
    );
  }

  if (options.xpToNextLevel > 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <Lock className="mx-auto mb-3" />
        <p className="ao-italic" style={{ color: 'var(--ink-faint)', marginBottom: 8 }}>
          Не хватает {options.xpToNextLevel.toLocaleString()} XP до следующего уровня.
        </p>
        <button className="ao-btn" onClick={backToCharacter}>← К персонажу</button>
      </div>
    );
  }

  const selectedClass: AvailableClassOption | undefined = options.availableClasses.find(
    (cl) => cl.classId === selectedClassId,
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <p className="ao-overline" style={{ color: 'var(--gold)' }}>Rite of Ascension</p>
          <h3 className="ao-h3" style={{ marginTop: 4 }}>Повышение уровня</h3>
          {character && (
            <p className="ao-italic" style={{ color: 'var(--ink-quiet)', fontSize: 13, marginTop: 4 }}>
              {character.name} · {character.classLevels?.map((cl) => `${cl.className} ${cl.classLevel}`).join(' / ') || `LVL ${character.totalLevel}`}
            </p>
          )}
        </div>
        <button className="ao-btn ao-btn--ghost" onClick={backToCharacter}>
          <ArrowLeft className="h-3 w-3" /> Отмена
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

// ── Steps ───────────────────────────────────────────────────────────

function StepRail({ step, hasResult }: { step: WizardStep; hasResult: boolean }) {
  const steps: { id: WizardStep; label: string }[] = [
    { id: 'pick-class', label: 'Класс' },
    { id: 'rewards', label: 'Награды' },
    { id: 'confirm', label: 'Подтверждение' },
    { id: 'result', label: 'Результат' },
  ];
  const activeIdx = steps.findIndex((s) => s.id === step);
  return (
    <div style={{ display: 'flex', gap: 0, marginBottom: 22, borderBottom: '1px solid var(--rule)' }}>
      {steps.map((s, idx) => {
        const isActive = idx === activeIdx;
        const isDone = idx < activeIdx || (hasResult && idx <= 3);
        return (
          <div
            key={s.id}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderBottom: isActive ? '2px solid var(--gold)' : '2px solid transparent',
              color: isActive ? 'var(--gold)' : isDone ? 'var(--ink-quiet)' : 'var(--ink-faint)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            <span style={{ width: 20, height: 20, border: '1px solid var(--rule)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>
              {isDone ? <Check className="h-3 w-3" /> : idx + 1}
            </span>
            {s.label}
          </div>
        );
      })}
    </div>
  );
}

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
        <PanelHeader title="Выберите класс" glyph="helm" sub={`Общий уровень: ${currentTotal} → ${currentTotal + 1}`} />
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {existing.length > 0 && (
            <ClassGroup
              title="Продолжить прокачку"
              options={existing}
              selectedClassId={selectedClassId}
              onSelect={onSelect}
            />
          )}
          {multi.length > 0 && (
            <ClassGroup
              title="Мультикласс — новый путь"
              options={multi}
              selectedClassId={selectedClassId}
              onSelect={onSelect}
            />
          )}
          {options.length === 0 && (
            <div className="ao-codex" style={{ padding: 12 }}>Нет доступных классов для повышения.</div>
          )}
        </div>
      </OrdoPanel>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="ao-btn ao-btn--primary" onClick={onNext} disabled={!selectedClassId}>
          Далее <ArrowRight className="h-3 w-3" />
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
              style={{
                textAlign: 'left',
                padding: '14px 16px',
                background: selectedClassId === opt.classId ? 'rgba(212,180,120,0.08)' : 'var(--panel)',
                border: selectedClassId === opt.classId ? '1px solid var(--gold)' : '1px solid var(--hairline)',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span className="ao-h5" style={{ fontSize: 14 }}>{opt.className}</span>
                {isMulti && (
                  <span className="ao-overline" style={{ fontSize: 9, color: 'var(--arcane)' }}>MULTI</span>
                )}
              </div>
              <div className="ao-codex" style={{ fontSize: 11, color: 'var(--ink-quiet)', marginBottom: 6 }}>
                {opt.currentLevelInClass} → {opt.newLevelInClass}
              </div>
              {previewRewards && (
                <div className="ao-italic" style={{ fontSize: 12, color: 'var(--ink-faint)' }}>
                  {previewRewards}
                </div>
              )}
              {opt.rewardGroups.length === 0 && (
                <div className="ao-italic" style={{ fontSize: 12, color: 'var(--ink-faint)' }}>
                  Без выбираемых наград
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepRewards({
  option,
  choiceSelections,
  setChoiceSelections,
  asi,
  setAsi,
  onBack,
  onNext,
}: {
  option: AvailableClassOption;
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
  const normalChoices = choices.filter((g) => g.rewardType !== 'ABILITY_SCORE_IMPROVEMENT');

  const choicesValid = normalChoices.every((g) => {
    const allAlready = g.rewards.length > 0 && g.rewards.every((r) => r.alreadyAcquired);
    if (allAlready) return true;
    return !!choiceSelections[g.rewardType];
  });
  const asiTotal = asiGroup ? Object.values(asi.points).reduce((sum, v) => sum + v, 0) : 0;
  const asiValid = asiGroup ? asiTotal === 2 : true;

  return (
    <div>
      {automatic.length > 0 && (
        <OrdoPanel frame padding={0} style={{ marginBottom: 16 }}>
          <PanelHeader title="Автоматические награды" glyph="check" tone="gold" />
          <div style={{ padding: 16 }}>
            {automatic.map((g) => (
              <div key={g.rewardType} style={{ marginBottom: 8 }}>
                <div className="ao-overline" style={{ marginBottom: 6 }}>
                  {REWARD_TYPE_LABELS[g.rewardType] || g.rewardType}
                </div>
                {g.rewards.length === 0 ? (
                  <div className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 12 }}>
                    Награда применится автоматически.
                  </div>
                ) : (
                  g.rewards.map((r) => (
                    <div key={r.rewardEntryId} style={{ marginBottom: 4, fontSize: 13 }}>
                      <span style={{ color: 'var(--ink-bright)', fontWeight: 500 }}>{r.name}</span>
                      {r.description && (
                        <span className="ao-italic" style={{ color: 'var(--ink-quiet)', marginLeft: 6, fontSize: 12 }}>
                          — {r.description}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        </OrdoPanel>
      )}

      {normalChoices.map((g) => (
        <ChoiceGroup
          key={g.rewardType}
          group={g}
          selectedId={choiceSelections[g.rewardType] || ''}
          onSelect={(id) => setChoiceSelections({ ...choiceSelections, [g.rewardType]: id })}
        />
      ))}

      {asiGroup && (
        <AsiGroup group={asiGroup} asi={asi} setAsi={setAsi} />
      )}

      {option.rewardGroups.length === 0 && (
        <OrdoPanel frame padding={0} style={{ marginBottom: 16 }}>
          <div style={{ padding: 18 }} className="ao-italic">
            На этом уровне нет выбираемых наград. HP и уровень будут повышены автоматически.
          </div>
        </OrdoPanel>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button className="ao-btn ao-btn--ghost" onClick={onBack}>
          <ArrowLeft className="h-3 w-3" /> Назад
        </button>
        <button className="ao-btn ao-btn--primary" onClick={onNext} disabled={!choicesValid || !asiValid}>
          К подтверждению <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

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
        title={`Выбор: ${REWARD_TYPE_LABELS[group.rewardType] || group.rewardType}`}
        glyph="sigil-1"
        tone="arcane"
      />
      <div style={{ padding: 16 }}>
        {group.rewards.length === 0 ? (
          <div className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 13 }}>
            Список вариантов недоступен. Это может означать, что выбор больше не требуется.
          </div>
        ) : allAlready ? (
          <div className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 13 }}>
            Все варианты уже получены ранее.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {group.rewards.map((r) => (
              <RewardOption
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

function RewardOption({
  reward,
  selected,
  onSelect,
}: {
  reward: RewardEntry;
  selected: boolean;
  onSelect: () => void;
}) {
  const disabled = reward.alreadyAcquired;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      style={{
        display: 'flex',
        gap: 12,
        padding: '12px 14px',
        textAlign: 'left',
        background: selected ? 'rgba(212,180,120,0.10)' : 'var(--panel)',
        border: selected ? '1px solid var(--gold)' : '1px solid var(--hairline)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span
        style={{
          width: 16,
          height: 16,
          flexShrink: 0,
          borderRadius: 999,
          border: `1px solid ${selected ? 'var(--gold)' : 'var(--rule)'}`,
          background: selected ? 'var(--gold)' : 'transparent',
          marginTop: 3,
        }}
      />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <span className="ao-h5" style={{ fontSize: 13 }}>{reward.name}</span>
          {disabled && (
            <span className="ao-overline" style={{ fontSize: 9, color: 'var(--ink-faint)' }}>уже получено</span>
          )}
        </span>
        {reward.description && (
          <span className="ao-italic" style={{ fontSize: 12, color: 'var(--ink-quiet)', lineHeight: 1.4 }}>
            {reward.description}
          </span>
        )}
      </span>
    </button>
  );
}

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
        title="Распределение характеристик (ASI)"
        glyph="sigil-2"
        tone="arcane"
        right={
          <span className="ao-codex" style={{ fontSize: 11, color: remaining === 0 ? 'var(--gold-pale)' : 'var(--ink-quiet)' }}>
            Осталось очков: {remaining}
          </span>
        }
      />
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {group.rewards.length === 0 && (
          <div className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 13 }}>
            Бэкенд не вернул вариантов для ASI на этом уровне.
          </div>
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
                background: 'var(--panel)',
                border: '1px solid var(--hairline)',
                opacity: disabled ? 0.5 : 1,
              }}
            >
              <span style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="ao-h5" style={{ fontSize: 13 }}>{r.name}</span>
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
  const chosenLines: { type: string; name: string; tag: string }[] = [];
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
        <PanelHeader title="Подтверждение повышения" glyph="diamond" />
        <div style={{ padding: 16 }}>
          <div className="ao-codex" style={{ fontSize: 13, marginBottom: 8 }}>
            Класс: <strong style={{ color: 'var(--gold)' }}>{option.className}</strong> {option.currentLevelInClass} → {option.newLevelInClass}
          </div>
          <OrdoDivider glyph="diamond" />
          <div className="ao-overline" style={{ marginTop: 10, marginBottom: 8 }}>Получаемые награды</div>
          {chosenLines.length === 0 ? (
            <div className="ao-italic" style={{ color: 'var(--ink-faint)' }}>HP и уровень будут повышены.</div>
          ) : (
            chosenLines.map((line, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                {line.tag === 'auto'
                  ? <Sparkles className="h-3 w-3" style={{ color: 'var(--ink-quiet)' }} />
                  : <Trophy className="h-3 w-3" style={{ color: 'var(--gold)' }} />}
                <span className="ao-codex" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
                  {REWARD_TYPE_LABELS[line.type] || line.type}
                </span>
                <span style={{ color: 'var(--ink-bright)' }}>{line.name}</span>
              </div>
            ))
          )}
        </div>
      </OrdoPanel>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button className="ao-btn ao-btn--ghost" onClick={onBack} disabled={submitting}>
          <ArrowLeft className="h-3 w-3" /> Назад
        </button>
        <button className="ao-btn ao-btn--primary" onClick={onConfirm} disabled={submitting}>
          {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          Подтвердить
        </button>
      </div>
    </div>
  );
}

function StepResult({ result, onDone }: { result: LevelUpResultResponse; onDone: () => void }) {
  return (
    <div>
      <OrdoPanel frame padding={0} style={{ marginBottom: 16 }}>
        <PanelHeader title="🎉 Уровень повышен" glyph="flame" tone="gold" />
        <div style={{ padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 16 }}>
            <Stat label="Класс" value={`${result.classLeveled} ${result.newClassLevel}`} />
            <Stat label="Общий уровень" value={result.newTotalLevel} />
            {result.hpIncrease !== undefined && (
              <Stat
                label={<><Heart className="inline h-3 w-3" /> HP</>}
                value={`+${result.hpIncrease}${result.newMaxHp ? ` (${result.newMaxHp})` : ''}`}
              />
            )}
          </div>
          <div className="ao-overline" style={{ marginBottom: 8 }}>Полученные награды</div>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '10px 12px', border: '1px solid var(--hairline)' }}>
      <span className="ao-overline">{label}</span>
      <span className="ao-h4" style={{ fontSize: 20 }}>{value}</span>
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────

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

