import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Panel, Button, Rune, Sigil, Divider } from '@/components/ao';
import { ClassSelection } from '@/components/levelup/ClassSelection';
import { RewardSelection } from '@/components/levelup/RewardSelection';
import { LevelUpConfirmation } from '@/components/levelup/LevelUpConfirmation';
import { LevelUpCelebration } from '@/components/levelup/LevelUpCelebration';
import { useLevelUpPreview, useCommitLevelUp } from '@/hooks/useLevelUp';
import { showToast } from '@/components/ao';
import type { Reward, LevelUpClassOption } from '@/types';

type Step = 'class' | 'rewards' | 'confirm' | 'celebrate';

export default function LevelUpPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: preview, isLoading, error } = useLevelUpPreview(id!);
  const commitMutation = useCommitLevelUp(id!);

  const [step, setStep] = useState<Step>('class');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedRewardIds, setSelectedRewardIds] = useState<Set<string>>(new Set());

  const selectedClass = useMemo(() => {
    return preview?.availableClasses.find((c) => c.classId === selectedClassId) || null;
  }, [preview, selectedClassId]);

  // When only one class available, auto-select it
  const effectiveClasses = preview?.availableClasses || [];
  if (effectiveClasses.length === 1 && !selectedClassId && effectiveClasses[0]) {
    setSelectedClassId(effectiveClasses[0].classId);
  }

  const handleClassSelect = (classId: string) => {
    setSelectedClassId(classId);
    setSelectedRewardIds(new Set());
  };

  const handleToggleReward = (rewardId: string, groupIndex: number) => {
    if (!selectedClass) return;
    const group = selectedClass.rewardGroups[groupIndex];
    if (!group || !group.isChoice) return;

    const newSet = new Set(selectedRewardIds);
    // For choice groups, only one selection per group
    // Remove any existing selections from this group
    for (const r of group.rewards) {
      newSet.delete(r.id);
    }
    newSet.add(rewardId);
    setSelectedRewardIds(newSet);
  };

  const canProceedToRewards = !!selectedClassId;
  const choiceGroups = selectedClass?.rewardGroups.filter((g) => g.isChoice) || [];
  const allChoicesMade = choiceGroups.every((group) =>
    group.rewards.some((r) => selectedRewardIds.has(r.id))
  );

  const automaticRewards: Reward[] = useMemo(() => {
    if (!selectedClass) return [];
    return selectedClass.rewardGroups
      .filter((g) => !g.isChoice)
      .flatMap((g) => g.rewards);
  }, [selectedClass]);

  const chosenRewards: Reward[] = useMemo(() => {
    if (!selectedClass) return [];
    return selectedClass.rewardGroups
      .filter((g) => g.isChoice)
      .flatMap((g) => g.rewards.filter((r) => selectedRewardIds.has(r.id)));
  }, [selectedClass, selectedRewardIds]);

  const handleConfirm = () => {
    if (!selectedClassId) return;
    const allSelectedIds = [
      ...automaticRewards.map((r) => r.id),
      ...Array.from(selectedRewardIds),
    ];
    commitMutation.mutate(
      { classId: selectedClassId, selectedRewardIds: allSelectedIds },
      {
        onSuccess: () => setStep('celebrate'),
        onError: (err: unknown) => {
          const message = err instanceof Error ? err.message : 'Level-up failed';
          showToast.error(message);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <Panel style={{ height: 96 }} className="ao-breathe">
          <div style={{ background: 'var(--surface)', height: '100%', borderRadius: 4 }} />
        </Panel>
        <Panel style={{ height: 256 }} className="ao-breathe">
          <div style={{ background: 'var(--surface)', height: '100%', borderRadius: 4 }} />
        </Panel>
      </div>
    );
  }

  if (error || !preview) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <Rune kind="x" size={32} color="var(--ember)" style={{ marginBottom: 12 }} />
        <p style={{ fontSize: 16, color: 'var(--ink-muted)', marginBottom: 16 }}>
          Unable to load level-up data. Your character may not be eligible for advancement.
        </p>
        <Button variant="ghost" onClick={() => navigate(`/characters/${id}`)}>
          Return to Character
        </Button>
      </div>
    );
  }

  if (step === 'celebrate' && selectedClass) {
    return (
      <LevelUpCelebration
        selectedClass={selectedClass}
        newTotalLevel={preview.newTotalLevel}
        allRewards={[...automaticRewards, ...chosenRewards]}
        onReturn={() => navigate(`/characters/${id}`)}
      />
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Button
          variant="ghost"
          icon={<Rune kind="arrow-l" size={14} />}
          onClick={() => {
            if (step === 'rewards') setStep('class');
            else if (step === 'confirm') setStep('rewards');
            else navigate(`/characters/${id}`);
          }}
        >
          {step === 'class' ? 'Cancel' : 'Back'}
        </Button>
        <div style={{ textAlign: 'center' }}>
          <div className="ao-overline" style={{ color: 'var(--gold)' }}>Rite of Ascent</div>
          <div className="ao-h4" style={{ margin: 0 }}>
            Level {preview.currentTotalLevel} &rarr; {preview.newTotalLevel}
          </div>
        </div>
        <div style={{ width: 80 }} />
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
        {(['class', 'rewards', 'confirm'] as Step[]).map((s, i) => (
          <div
            key={s}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: step === s ? 'var(--gold)' : 'var(--rule)',
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>

      {/* Step content */}
      {step === 'class' && (
        <>
          <ClassSelection
            classes={effectiveClasses}
            selectedClassId={selectedClassId}
            onSelect={handleClassSelect}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="primary"
              disabled={!canProceedToRewards}
              onClick={() => {
                // If no choice groups, skip rewards step
                if (choiceGroups.length === 0) {
                  setStep('confirm');
                } else {
                  setStep('rewards');
                }
              }}
              icon={<Rune kind="chev-r" size={14} />}
            >
              Continue
            </Button>
          </div>
        </>
      )}

      {step === 'rewards' && selectedClass && (
        <>
          <RewardSelection
            rewardGroups={selectedClass.rewardGroups}
            selectedRewardIds={selectedRewardIds}
            onToggleReward={handleToggleReward}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="primary"
              disabled={!allChoicesMade}
              onClick={() => setStep('confirm')}
              icon={<Rune kind="chev-r" size={14} />}
            >
              Review &amp; Confirm
            </Button>
          </div>
        </>
      )}

      {step === 'confirm' && selectedClass && (
        <LevelUpConfirmation
          selectedClass={selectedClass}
          selectedRewards={chosenRewards}
          automaticRewards={automaticRewards}
          currentTotalLevel={preview.currentTotalLevel}
          newTotalLevel={preview.newTotalLevel}
          onConfirm={handleConfirm}
          onBack={() => {
            if (choiceGroups.length > 0) {
              setStep('rewards');
            } else {
              setStep('class');
            }
          }}
          isSubmitting={commitMutation.isPending}
        />
      )}
    </div>
  );
}
