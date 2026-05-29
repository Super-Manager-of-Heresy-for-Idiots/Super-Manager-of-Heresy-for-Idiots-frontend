import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Rune, Sigil, OrdoDivider, OrdoPanel, OrdoChip } from '@/components/ordo';
import { useCharacter } from '@/hooks/useCharacters';
import { useLevelUpOptions, useLevelUp } from '@/hooks/useLevelUp';
import type {
  AvailableClassOption,
  RewardGroup,
  RewardSelection,
  LevelUpResultResponse,
} from '@/types';

/* ── helpers ── */
const toRoman = (n: number): string => {
  const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
  const syms = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];
  let result = '';
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]) { result += syms[i]; n -= vals[i]; }
  }
  return result;
};

const REWARD_TYPE_COLORS: Record<string, { c: string; glyph: string }> = {
  SKILL:    { c: '#6f93c4', glyph: 'eye' },
  SUBCLASS: { c: '#9a7ec0', glyph: 'hex' },
  FEAT:     { c: '#c06a32', glyph: 'sigil-3' },
};

export default function LevelUpPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: character, isLoading: charLoading, error: charError, refetch: refetchChar } = useCharacter(id!);
  const { data: options, isLoading: optLoading, error: optError, refetch: refetchOpt } = useLevelUpOptions(id!);
  const levelUpMutation = useLevelUp();

  const [selectedClass, setSelectedClass] = useState<AvailableClassOption | null>(null);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [result, setResult] = useState<LevelUpResultResponse | null>(null);

  const getGroupKey = (group: RewardGroup) => `${group.rewardType}-${group.isChoice}`;

  const handleSelectReward = (group: RewardGroup, rewardEntryId: string) => {
    if (!group.isChoice) return;
    setSelections((prev) => ({
      ...prev,
      [getGroupKey(group)]: rewardEntryId,
    }));
  };

  const allSelectionsComplete = useMemo(() => {
    if (!selectedClass) return false;
    return selectedClass.rewardGroups
      .filter((g) => g.isChoice && g.rewards.some((r) => !r.alreadyAcquired))
      .every((g) => selections[getGroupKey(g)]);
  }, [selectedClass, selections]);

  const handleConfirm = () => {
    if (!selectedClass) return;

    const rewardSelections: RewardSelection[] = [];

    selectedClass.rewardGroups.forEach((group) => {
      if (group.isChoice) {
        const selected = selections[getGroupKey(group)];
        if (selected) {
          rewardSelections.push({
            rewardType: group.rewardType,
            rewardEntryId: selected,
          });
        }
      } else {
        group.rewards.forEach((r) => {
          if (!r.alreadyAcquired) {
            rewardSelections.push({
              rewardType: group.rewardType,
              rewardEntryId: r.rewardEntryId,
            });
          }
        });
      }
    });

    levelUpMutation.mutate(
      {
        characterId: id!,
        data: {
          classId: selectedClass.classId,
          selections: rewardSelections,
        },
      },
      {
        onSuccess: (response) => {
          setResult(response.data!);
        },
      }
    );
  };

  /* ── current step ── */
  const currentStep = result ? 3 : selectedClass ? 2 : 1;

  /* ── loading ── */
  if (charLoading || optLoading) {
    return (
      <div style={{ position: 'relative', width: '100%', minHeight: '100vh', background: 'var(--void)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(50% 40% at 50% 45%, transparent 0%, rgba(0,0,0,0.85) 80%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(40% 30% at 50% 45%, rgba(176, 141, 78, 0.12), transparent 70%)' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="ao-breathe" style={{ textAlign: 'center' }}>
            <Sigil size={88} glyph="sigil-2" />
            <div className="ao-codex ao-flicker" style={{ marginTop: 12, color: 'var(--gold-pale)' }}>&mdash; RITE OF ASCENT &mdash;</div>
          </div>
        </div>
      </div>
    );
  }

  /* ── error ── */
  if (charError || optError || !character || !options) {
    return (
      <div style={{ position: 'relative', width: '100%', minHeight: '100vh', background: 'var(--void)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Sigil size={56} glyph="eye" />
          <p className="ao-italic" style={{ color: 'var(--ink-faint)', margin: '16px 0' }}>
            Failed to load the rite of ascent
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
            <button className="ao-btn ao-btn--ghost" onClick={() => { refetchChar(); refetchOpt(); }}>Retry</button>
            <button className="ao-btn ao-btn--ghost" onClick={() => navigate(-1)}>Go Back</button>
          </div>
        </div>
      </div>
    );
  }

  /* ── success screen (Step 3) ── */
  if (result) {
    return (
      <div style={{ position: 'relative', width: '100%', minHeight: '100vh', background: 'var(--void)', overflow: 'hidden' }}>
        {/* Vignette + glow */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(50% 40% at 50% 45%, transparent 0%, rgba(0,0,0,0.85) 80%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(40% 30% at 50% 45%, rgba(176, 141, 78, 0.12), transparent 70%)' }} />
        <div className="ao-grain" style={{ position: 'absolute', inset: 0 }} />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 40 }}>
          <div style={{ width: 720, maxWidth: '100%' }} className="ao-rise">
            {/* Sigil */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 18 }}>
              <Sigil size={88} glyph="sigil-2" />
              <div className="ao-codex ao-flicker" style={{ marginTop: 12, color: 'var(--gold-pale)' }}>&mdash; ASCENT COMPLETE &mdash;</div>
            </div>

            <OrdoPanel frame padding={0} style={{ background: 'linear-gradient(180deg, #221d1a 0%, #14110f 100%)', boxShadow: '0 4px 0 rgba(0,0,0,0.6), 0 32px 80px rgba(0,0,0,0.8), 0 0 60px rgba(176, 141, 78, 0.06)' }}>
              {/* Number reveal */}
              <div style={{ padding: '32px 48px', textAlign: 'center' }}>
                <div className="ao-codex" style={{ color: 'var(--ink-faint)' }}>Cohort &middot; Folio {character.name}</div>
                <OrdoDivider glyph="diamond-fill" />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32, margin: '24px 0' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div className="ao-overline">Previous</div>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: 64, color: 'var(--ink-faint)', lineHeight: 1, fontStyle: 'italic' }}>{toRoman(options.currentTotalLevel)}</div>
                  </div>
                  <Rune kind="arrow-r" size={28} color="var(--gold)" />
                  <div className="ao-breathe">
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 120, fontWeight: 700, color: 'var(--gold-pale)', lineHeight: 1, textShadow: '0 0 32px rgba(176, 141, 78, 0.4)' }}>{toRoman(result.newTotalLevel)}</div>
                  </div>
                </div>

                <div className="ao-h4" style={{ marginTop: 18, fontStyle: 'italic' }}>
                  {character.name} &mdash; {result.classLeveled} Level {result.newClassLevel}
                </div>
              </div>

              {/* Rewards */}
              {result.rewardsAcquired.length > 0 && (
                <div style={{ padding: '0 32px 32px' }}>
                  <OrdoDivider glyph="diamond-fill">Granted by the Ascent</OrdoDivider>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
                    {result.rewardsAcquired.map((r, i) => {
                      const rc = REWARD_TYPE_COLORS[r.rewardType] || { c: 'var(--gold)', glyph: 'diamond-fill' };
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--abyss)', border: '1px solid rgba(176, 141, 78, 0.4)' }}>
                          <span style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--brass)', background: 'var(--bronze)' }}>
                            <Rune kind="check" size={10} color="var(--ink-bright)" />
                          </span>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 7, padding: '3px 9px',
                            background: 'rgba(0,0,0,0.4)', border: `1px solid ${rc.c}66`, borderLeft: `2px solid ${rc.c}`,
                          }}>
                            <Rune kind={rc.glyph} size={11} color={rc.c} />
                            <span style={{ fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: '0.16em', color: rc.c, textTransform: 'uppercase' }}>{r.rewardType}</span>
                          </span>
                          <span style={{ flex: 1, color: 'var(--ink-bright)', fontFamily: 'var(--font-serif)', fontSize: 14 }}>{r.name}</span>
                          <span className="ao-overline" style={{ color: 'var(--gold-pale)' }}>Sealed</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div style={{ display: 'flex', gap: 12, padding: '24px 32px', justifyContent: 'center' }}>
                <button className="ao-btn ao-btn--primary ao-btn--lg" onClick={() => navigate(`/characters/${id}`)}>
                  <Rune kind="diamond-fill" size={9} /> Return to Folio
                </button>
              </div>

              <div style={{ padding: '12px 24px', borderTop: '1px solid var(--rule)', background: 'var(--abyss)', display: 'flex', justifyContent: 'space-between', color: 'var(--ink-faint)' }}>
                <span className="ao-codex">Witnessed by the Ordo</span>
                <span className="ao-codex">Sealed by candle and seal</span>
              </div>
            </OrdoPanel>

            {/* Progress */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, alignItems: 'center', marginTop: 18 }}>
              {[1, 2, 3].map((s) => (
                <Rune key={s} kind={s <= currentStep ? 'diamond-fill' : 'diamond'} size={10} color="var(--gold)" />
              ))}
              <span className="ao-codex" style={{ marginLeft: 8, color: 'var(--ink-faint)' }}>Step 3 of 3</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Step 1: Class Selection ── */
  if (!selectedClass) {
    return (
      <div style={{ position: 'relative', width: '100%', minHeight: '100vh', background: 'var(--void)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(50% 40% at 50% 45%, transparent 0%, rgba(0,0,0,0.85) 80%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(40% 30% at 50% 45%, rgba(176, 141, 78, 0.12), transparent 70%)' }} />
        <div className="ao-grain" style={{ position: 'absolute', inset: 0 }} />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 40 }}>
          <div style={{ width: 720, maxWidth: '100%' }} className="ao-rise">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 18 }}>
              <Sigil size={88} glyph="sigil-2" />
              <div className="ao-codex ao-flicker" style={{ marginTop: 12, color: 'var(--gold-pale)' }}>&mdash; RITE OF ASCENT &mdash;</div>
            </div>

            <OrdoPanel frame padding={0} style={{ background: 'linear-gradient(180deg, #221d1a 0%, #14110f 100%)', boxShadow: '0 4px 0 rgba(0,0,0,0.6), 0 32px 80px rgba(0,0,0,0.8), 0 0 60px rgba(176, 141, 78, 0.06)' }}>
              <div style={{ padding: '24px 48px 0', textAlign: 'center' }}>
                <div className="ao-codex" style={{ color: 'var(--ink-faint)' }}>Folio &middot; {character.name}</div>
                <div className="ao-engraved" style={{ fontSize: 13, color: 'var(--ink-quiet)', marginTop: 6 }}>By the witnessing of the Ordo</div>
                <OrdoDivider glyph="diamond-fill" />
              </div>

              <div style={{ padding: '0 48px', textAlign: 'center' }}>
                <div className="ao-breathe">
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 100, fontWeight: 700, color: 'var(--gold-pale)', lineHeight: 1, textShadow: '0 0 32px rgba(176, 141, 78, 0.4)' }}>
                    {toRoman(options.currentTotalLevel + 1)}
                  </div>
                </div>
                <div className="ao-h4" style={{ marginTop: 18, fontStyle: 'italic' }}>
                  The {toRoman(options.currentTotalLevel + 1)} Mantle is offered
                </div>
                <p className="ao-italic" style={{ fontSize: 16, marginTop: 8, color: 'var(--ink)', maxWidth: 540, margin: '8px auto 0' }}>
                  {character.name}, the Ordo recognises thy vigil. Choose the path of thy ascent.
                </p>
              </div>

              <div style={{ padding: 32, paddingTop: 24 }}>
                <OrdoDivider glyph="diamond-fill">Choose Thy Path</OrdoDivider>

                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(options.availableClasses.length, 3)}, 1fr)`, gap: 12, marginTop: 14 }}>
                  {options.availableClasses.map((cls) => (
                    <button
                      key={cls.classId}
                      onClick={() => { setSelectedClass(cls); setSelections({}); }}
                      style={{
                        padding: 16, background: 'var(--abyss)', border: '1px solid var(--rule-strong)', textAlign: 'center',
                        cursor: 'pointer', transition: 'all 200ms',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--brass)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--rule-strong)'; }}
                    >
                      <Rune kind="sigil-3" size={22} color="var(--gold)" />
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--ink-bright)', lineHeight: 1, marginTop: 6 }}>{cls.className}</div>
                      <div className="ao-codex" style={{ marginTop: 4 }}>
                        Level {cls.currentLevelInClass} → {cls.newLevelInClass}
                      </div>
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'space-between', alignItems: 'center' }}>
                  <button className="ao-btn ao-btn--ghost" onClick={() => navigate(-1)}>
                    <Rune kind="arrow-l" size={11} /> Postpone
                  </button>
                  <span className="ao-codex">Step 1 of 3</span>
                </div>
              </div>

              <div style={{ padding: '12px 24px', borderTop: '1px solid var(--rule)', background: 'var(--abyss)', display: 'flex', justifyContent: 'center', color: 'var(--ink-faint)' }}>
                <span className="ao-codex">The rite remains open until dawn</span>
              </div>
            </OrdoPanel>

            {/* Progress */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, alignItems: 'center', marginTop: 18 }}>
              {[1, 2, 3].map((s) => (
                <Rune key={s} kind={s <= currentStep ? 'diamond-fill' : 'diamond'} size={10} color="var(--gold)" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Step 2: Reward Selection ── */
  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh', background: 'var(--void)', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(60% 50% at 50% 30%, rgba(176, 141, 78, 0.08), transparent 60%)' }} />
      <div className="ao-grain" style={{ position: 'absolute', inset: 0 }} />

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: '40px 56px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
          <Sigil size={48} glyph="sigil-3" />
          <div style={{ flex: 1 }}>
            <div className="ao-overline">Rite of Ascent &middot; Step II of III</div>
            <div className="ao-h3" style={{ fontSize: 32, marginTop: 4 }}>Choose Thy Boon</div>
          </div>
          <div className="ao-codex">{character.name} &middot; Folio open</div>
          <button className="ao-btn ao-btn--ghost ao-btn--sm" onClick={() => setSelectedClass(null)}>
            <Rune kind="arrow-l" size={11} /> Back
          </button>
        </div>

        <p className="ao-italic" style={{ fontSize: 16, color: 'var(--ink-quiet)', maxWidth: 720 }}>
          {selectedClass.className} Level {selectedClass.newLevelInClass} &mdash; the unchosen are returned to the Vault.
        </p>

        <OrdoDivider glyph="diamond-fill">Offerings</OrdoDivider>

        {/* Reward groups */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20, marginTop: 8 }}>
          {selectedClass.rewardGroups.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <p className="ao-italic" style={{ color: 'var(--ink-faint)' }}>No rewards bound to this level. Proceed to seal.</p>
            </div>
          ) : (
            selectedClass.rewardGroups.map((group, gi) => {
              const groupKey = getGroupKey(group);
              const rc = REWARD_TYPE_COLORS[group.rewardType] || { c: 'var(--gold)', glyph: 'diamond' };
              return (
                <div key={gi}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <Rune kind={rc.glyph} size={14} color={rc.c} />
                    <span className="ao-engraved" style={{ fontSize: 12, color: rc.c }}>{group.rewardType}</span>
                    <span style={{ flex: 1, height: 1, background: 'var(--hairline)' }} />
                    {group.isChoice ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--gold-pale)', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em' }}>
                        <Rune kind="sword" size={11} color="var(--gold-pale)" /> CHOOSE ONE
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--arcane)', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em' }}>
                        <Rune kind="diamond-fill" size={9} color="var(--arcane)" /> AUTO-GRANTED
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(group.rewards.length, 3)}, 1fr)`, gap: 14 }}>
                    {group.rewards.map((reward) => {
                      const isSelected = selections[groupKey] === reward.rewardEntryId;
                      const isDisabled = reward.alreadyAcquired;
                      const isAutoGranted = !group.isChoice && !isDisabled;

                      return (
                        <OrdoPanel
                          key={reward.rewardEntryId}
                          frame
                          padding={0}
                          onClick={() => {
                            if (!isDisabled && group.isChoice) handleSelectReward(group, reward.rewardEntryId);
                          }}
                          style={{
                            cursor: isDisabled ? 'not-allowed' : group.isChoice ? 'pointer' : 'default',
                            opacity: isDisabled ? 0.5 : 1,
                            borderColor: isSelected ? rc.c : isAutoGranted ? 'var(--arcane)' : undefined,
                            background: isSelected ? `linear-gradient(180deg, ${rc.c}0a, var(--panel))` : isAutoGranted ? 'linear-gradient(180deg, rgba(90,142,148,0.04), var(--panel))' : undefined,
                            transition: 'border-color 200ms, background 200ms',
                          }}
                        >
                          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--rule)', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 7, padding: '3px 9px',
                              background: 'rgba(0,0,0,0.4)', border: `1px solid ${rc.c}66`, borderLeft: `2px solid ${rc.c}`,
                            }}>
                              <Rune kind={rc.glyph} size={10} color={rc.c} />
                              <span style={{ fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: '0.16em', color: rc.c, textTransform: 'uppercase' }}>{group.rewardType}</span>
                            </span>
                            {isSelected && <OrdoChip tone="gold" glyph="check">Sealing</OrdoChip>}
                            {isAutoGranted && <OrdoChip tone="arcane" glyph="diamond-fill">Auto</OrdoChip>}
                            {isDisabled && <OrdoChip tone="rune" glyph="lock">Acquired</OrdoChip>}
                          </div>
                          <div style={{ padding: 18 }}>
                            <div className="ao-h6" style={{ fontSize: 16 }}>{reward.name}</div>
                            {reward.description && (
                              <p className="ao-italic" style={{ fontSize: 13, marginTop: 6, color: 'var(--ink-quiet)' }}>{reward.description}</p>
                            )}
                          </div>
                        </OrdoPanel>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'var(--abyss)', border: '1px solid var(--rule-strong)', marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Rune kind="lock" size={14} color="var(--ember)" />
            <span className="ao-italic" style={{ fontSize: 13 }}>This choice cannot be unwritten.</span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="ao-btn ao-btn--ghost" onClick={() => setSelectedClass(null)}>
              <Rune kind="arrow-l" size={11} /> Back to Rite
            </button>
            <button
              className="ao-btn ao-btn--primary ao-btn--lg"
              onClick={handleConfirm}
              disabled={!allSelectionsComplete || levelUpMutation.isPending}
            >
              <Rune kind="diamond-fill" size={9} />
              {levelUpMutation.isPending ? 'Sealing...' : 'Seal Ascent'}
            </button>
          </div>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, alignItems: 'center', marginTop: 18 }}>
          {[1, 2, 3].map((s) => (
            <Rune key={s} kind={s <= currentStep ? 'diamond-fill' : 'diamond'} size={10} color="var(--gold)" />
          ))}
          <span className="ao-codex" style={{ marginLeft: 8, color: 'var(--ink-faint)' }}>Step {currentStep} of 3</span>
        </div>
      </div>
    </div>
  );
}
