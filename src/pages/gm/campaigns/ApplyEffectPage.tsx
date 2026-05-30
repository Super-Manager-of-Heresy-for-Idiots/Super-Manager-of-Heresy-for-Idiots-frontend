import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import {
  OrdoPanel,
  PanelHeader,
  Rune,
  OrdoDivider,
  OrdoChip,
  ModifierTag,
  EmptyVault,
} from '@/components/ordo';
import { EffectRow } from '@/components/gm/EffectRow';
import {
  useCharacterEffects,
  useApplyEffect,
  useRemoveEffect,
  useAdvanceRound,
} from '@/hooks/useEffects';
import { useCharacterV2 } from '@/hooks/useCharacterV2';
import { useBuffsDebuffs } from '@/hooks/useAdmin';
import type { BuffDebuffResponse } from '@/types';

/* ================================================================== */
/*  ApplyEffectPage                                                   */
/* ================================================================== */
export default function ApplyEffectPage() {
  const { campaignId, characterId } = useParams<{
    campaignId: string;
    characterId: string;
  }>();

  const {
    data: character,
    isLoading: charLoading,
    error: charError,
  } = useCharacterV2(characterId!);

  const {
    data: effects,
    isLoading: effectsLoading,
    error: effectsError,
    refetch: refetchEffects,
  } = useCharacterEffects(characterId!);

  const { data: buffsDebuffs, isLoading: bdLoading } = useBuffsDebuffs();

  const applyMutation = useApplyEffect();
  const removeMutation = useRemoveEffect();
  const advanceMutation = useAdvanceRound();

  /* ---- local state ---- */
  const [searchTerm, setSearchTerm] = useState('');
  const [durationRounds, setDurationRounds] = useState('');
  const [selectedBdId, setSelectedBdId] = useState<string | null>(null);

  /* ---- filter picker list ---- */
  const filteredBd = useMemo(() => {
    if (!buffsDebuffs) return [];
    const q = searchTerm.toLowerCase();
    return buffsDebuffs.filter(
      (bd) =>
        bd.name.toLowerCase().includes(q) ||
        (bd.description ?? '').toLowerCase().includes(q),
    );
  }, [buffsDebuffs, searchTerm]);

  /* ---- derived counts ---- */
  const buffCount =
    effects?.filter((e) => e.buffDebuff.isBuff).length ?? 0;
  const debuffCount =
    effects?.filter((e) => !e.buffDebuff.isBuff).length ?? 0;

  /* ---- handlers ---- */
  const handleApply = () => {
    if (!characterId || !selectedBdId) return;
    const rounds = Number(durationRounds);
    applyMutation.mutate(
      {
        characterId,
        data: {
          buffDebuffId: selectedBdId,
          remainingRounds: rounds > 0 ? rounds : undefined,
        },
      },
      {
        onSuccess: () => {
          setSelectedBdId(null);
          setDurationRounds('');
        },
      },
    );
  };

  const handleRemove = (effectId: string) => {
    if (!characterId) return;
    removeMutation.mutate({ characterId, effectId });
  };

  const handleAdvanceRound = () => {
    if (!characterId) return;
    advanceMutation.mutate(characterId);
  };

  /* ---- loading ---- */
  const isLoading = charLoading || effectsLoading;
  if (isLoading) {
    return (
      <div>
        <div style={{ marginBottom: 32 }}>
          <p className="ao-overline" style={{ color: 'var(--gold)' }}>
            GM Tools
          </p>
          <h3 className="ao-h3" style={{ marginTop: 4 }}>
            Apply Effects
          </h3>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.2fr',
            gap: 20,
          }}
        >
          {[0, 1].map((i) => (
            <div
              key={i}
              className="ao-panel ao-frame ao-breathe"
              style={{ padding: 24, minHeight: 320 }}
            >
              <span className="ao-frame-c" />
              <div
                className="ao-ph"
                style={{ width: '50%', height: 16, marginBottom: 16 }}
              />
              <div
                className="ao-ph"
                style={{ width: '80%', height: 14, marginBottom: 8 }}
              />
              <div
                className="ao-ph"
                style={{ width: '60%', height: 14 }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ---- error ---- */
  if (charError || effectsError) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <p
          className="ao-italic"
          style={{ color: 'var(--ink-faint)', marginBottom: 16 }}
        >
          The effects ledger could not be opened. The wards remain
          unbroken.
        </p>
        <button className="ao-btn" onClick={() => refetchEffects()}>
          Retry
        </button>
      </div>
    );
  }

  /* ---- render ---- */
  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div>
          <p className="ao-overline" style={{ color: 'var(--gold)' }}>
            GM Tools
          </p>
          <h3 className="ao-h3" style={{ marginTop: 4 }}>
            Apply Effects
          </h3>
          {character && (
            <p
              className="ao-italic"
              style={{
                color: 'var(--ink-quiet)',
                fontSize: 13,
                marginTop: 4,
              }}
            >
              Managing buffs &amp; debuffs for{' '}
              <strong>{character.name}</strong>
            </p>
          )}
        </div>
        <OrdoChip tone="arcane" glyph="sigil-1">
          Game-Master
        </OrdoChip>
      </div>

      {/* Main Grid: Picker + Active Ledger */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.2fr',
          gap: 20,
          alignItems: 'start',
        }}
      >
        {/* ════════════ Picker Panel ════════════ */}
        <OrdoPanel frame padding={0}>
          <PanelHeader
            title="EFFECT PICKER"
            sub={`${filteredBd.length} available`}
            glyph="flame"
            tone="ember"
          />

          {/* Search */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--rule)' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 10px',
                border: '1px solid var(--rule)',
                background: 'var(--abyss)',
              }}
            >
              <Rune kind="search" size={14} color="var(--ink-faint)" />
              <input
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--ink)',
                  fontFamily: 'var(--font-body)',
                  fontSize: 13,
                }}
                placeholder="Search buffs & debuffs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* List */}
          <div style={{ maxHeight: 340, overflowY: 'auto' }}>
            {bdLoading ? (
              <div
                style={{
                  padding: 24,
                  textAlign: 'center',
                }}
              >
                <Loader2
                  className="h-5 w-5 animate-spin"
                  style={{ color: 'var(--ink-faint)', margin: '0 auto' }}
                />
              </div>
            ) : filteredBd.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                <p
                  className="ao-italic"
                  style={{ color: 'var(--ink-faint)', fontSize: 13 }}
                >
                  No effects match thy inquiry
                </p>
              </div>
            ) : (
              filteredBd.map((bd) => {
                const isActive = selectedBdId === bd.id;
                return (
                  <div
                    key={bd.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 16px',
                      borderBottom: '1px solid var(--hairline)',
                      background: isActive
                        ? 'rgba(212,180,120,0.08)'
                        : 'transparent',
                      cursor: 'pointer',
                    }}
                    onClick={() =>
                      setSelectedBdId(isActive ? null : bd.id)
                    }
                  >
                    <Rune
                      kind={bd.isBuff ? 'arrow-up' : 'minus'}
                      size={14}
                      color={bd.isBuff ? '#7a9866' : '#c9803a'}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <span
                          className="ao-h5"
                          style={{ fontSize: 12 }}
                        >
                          {bd.name}
                        </span>
                        <span
                          className="ao-overline"
                          style={{
                            fontSize: 8,
                            color: bd.isBuff
                              ? '#7a9866'
                              : '#c9803a',
                          }}
                        >
                          {bd.isBuff ? 'BUFF' : 'DEBUFF'}
                        </span>
                      </div>
                      {bd.targetStatName &&
                        bd.modifierValue != null && (
                          <div
                            style={{
                              marginTop: 3,
                            }}
                          >
                            <ModifierTag
                              stat={bd.targetStatName}
                              value={bd.modifierValue}
                              size="sm"
                            />
                          </div>
                        )}
                    </div>
                    {isActive && (
                      <Rune
                        kind="check"
                        size={14}
                        color="var(--gold)"
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Duration + Apply */}
          {selectedBdId && (
            <div
              style={{
                padding: '14px 16px',
                borderTop: '1px solid var(--rule)',
                background: 'var(--abyss)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <label
                  className="ao-label"
                  style={{ marginBottom: 0, fontSize: 11 }}
                >
                  Duration (rounds)
                </label>
                <input
                  className="ao-input"
                  type="number"
                  min="0"
                  value={durationRounds}
                  onChange={(e) =>
                    setDurationRounds(e.target.value)
                  }
                  placeholder="permanent"
                  style={{
                    width: 100,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 13,
                    textAlign: 'center',
                  }}
                />
              </div>
              <button
                className="ao-btn ao-btn--primary"
                style={{ width: '100%' }}
                onClick={handleApply}
                disabled={applyMutation.isPending}
              >
                {applyMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Rune
                      kind="flame"
                      size={14}
                      color="currentColor"
                    />
                    <span style={{ marginLeft: 6 }}>
                      Impose Effect
                    </span>
                  </>
                )}
              </button>
            </div>
          )}
        </OrdoPanel>

        {/* ════════════ Active Effects Ledger ════════════ */}
        <OrdoPanel frame padding={0}>
          <PanelHeader
            title="ACTIVE EFFECTS"
            sub={`${buffCount} buffs, ${debuffCount} debuffs`}
            glyph="sigil-2"
            right={
              <button
                className="ao-btn ao-btn--ghost ao-btn--sm"
                onClick={handleAdvanceRound}
                disabled={
                  advanceMutation.isPending ||
                  !effects ||
                  effects.length === 0
                }
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {advanceMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <Rune
                      kind="arrow-r"
                      size={12}
                      color="currentColor"
                    />
                    Advance Round
                  </>
                )}
              </button>
            }
          />

          {/* Effect Rows */}
          {!effects || effects.length === 0 ? (
            <div
              style={{
                padding: '36px 20px',
                textAlign: 'center',
              }}
            >
              <p
                className="ao-italic"
                style={{
                  color: 'var(--ink-faint)',
                  fontSize: 13,
                }}
              >
                No effects are presently active. The sworn stands
                unburdened.
              </p>
            </div>
          ) : (
            <div>
              {/* Buffs section */}
              {buffCount > 0 && (
                <>
                  <div
                    style={{
                      padding: '6px 16px',
                      background: 'rgba(122,152,102,0.04)',
                      borderBottom: '1px solid var(--hairline)',
                    }}
                  >
                    <span
                      className="ao-overline"
                      style={{
                        fontSize: 9,
                        color: '#7a9866',
                      }}
                    >
                      Boons ({buffCount})
                    </span>
                  </div>
                  {effects
                    .filter((e) => e.buffDebuff.isBuff)
                    .map((effect) => (
                      <EffectRow
                        key={effect.id}
                        effect={effect}
                        onRemove={() =>
                          handleRemove(effect.id)
                        }
                      />
                    ))}
                </>
              )}

              {/* Debuffs section */}
              {debuffCount > 0 && (
                <>
                  <div
                    style={{
                      padding: '6px 16px',
                      background: 'rgba(201,128,58,0.04)',
                      borderBottom: '1px solid var(--hairline)',
                    }}
                  >
                    <span
                      className="ao-overline"
                      style={{
                        fontSize: 9,
                        color: '#c9803a',
                      }}
                    >
                      Banes ({debuffCount})
                    </span>
                  </div>
                  {effects
                    .filter((e) => !e.buffDebuff.isBuff)
                    .map((effect) => (
                      <EffectRow
                        key={effect.id}
                        effect={effect}
                        onRemove={() =>
                          handleRemove(effect.id)
                        }
                      />
                    ))}
                </>
              )}
            </div>
          )}
        </OrdoPanel>
      </div>
    </div>
  );
}
