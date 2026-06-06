import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import {
  OrdoPanel,
  PanelHeader,
  Rune,
  OrdoDivider,
  OrdoChip,
  Bar,
  EmptyVault,
} from '@/components/ordo';
import { BackLink, CharStatusBadge } from '@/components/campaigns';
import { useCampaignCharacters } from '@/hooks/useCharacterV2';
import { useGrantXp } from '@/hooks/useXp';
import type { CharacterV2Response, XpTarget } from '@/types';

/* ── D&D 5e-style XP thresholds (level -> cumulative XP needed) ── */
const XP_THRESHOLDS: Record<number, number> = {
  1: 0,     2: 300,    3: 900,    4: 2700,   5: 6500,
  6: 14000, 7: 23000,  8: 34000,  9: 48000,  10: 64000,
  11: 85000, 12: 100000, 13: 120000, 14: 140000, 15: 165000,
  16: 195000, 17: 225000, 18: 265000, 19: 305000, 20: 355000,
};

function xpForNextLevel(currentLevel: number): number {
  return XP_THRESHOLDS[currentLevel + 1] ?? Infinity;
}

type TargetMode = 'ALL' | 'SELECTED' | 'SINGLE';

/* ================================================================== */
/*  XPGrantPage                                                       */
/* ================================================================== */
export default function XPGrantPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const { data: characters, isLoading, error, refetch } = useCampaignCharacters(campaignId!);
  const grantMutation = useGrantXp();

  const [targetMode, setTargetMode] = useState<TargetMode>('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [xpAmount, setXpAmount] = useState('');

  const amount = Number(xpAmount) || 0;

  /* ---- resolve who receives XP ---- */
  const activeCharacters = useMemo(
    () => (characters ?? []).filter((c) => c.status === 'ACTIVE'),
    [characters],
  );

  const recipients = useMemo<CharacterV2Response[]>(() => {
    if (targetMode === 'ALL') return activeCharacters;
    return activeCharacters.filter((c) => selectedIds.has(c.id));
  }, [targetMode, activeCharacters, selectedIds]);

  /* ---- threshold preview ---- */
  const levelUps = useMemo(() => {
    if (amount <= 0) return [];
    return recipients.filter((c) => {
      const threshold = xpForNextLevel(c.totalLevel);
      return c.experience + amount >= threshold;
    });
  }, [recipients, amount]);

  /* ---- selection helpers ---- */
  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () =>
    setSelectedIds(new Set(activeCharacters.map((c) => c.id)));
  const selectNone = () => setSelectedIds(new Set());

  /* ---- grant handler ---- */
  const handleGrant = () => {
    if (!campaignId || amount <= 0 || recipients.length === 0) return;

    const target: XpTarget =
      targetMode === 'ALL' ? 'ALL' : targetMode === 'SELECTED' ? 'SELECTED' : 'SINGLE';

    grantMutation.mutate(
      {
        campaignId,
        data: {
          amount,
          target,
          characterIds: recipients.map((c) => c.id),
        },
      },
      {
        onSuccess: () => {
          setXpAmount('');
        },
      },
    );
  };

  /* ---- loading ---- */
  if (isLoading) {
    return (
      <div>
        <BackLink to={`/campaigns/${campaignId}`} label="К кампании" style={{ marginBottom: 12 }} />
        <div style={{ marginBottom: 32 }}>
          <p className="ao-overline" style={{ color: 'var(--gold)' }}>
            Game Master Tools
          </p>
          <h3 className="ao-h3" style={{ marginTop: 4 }}>
            Grant Experience
          </h3>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 1fr',
            gap: 20,
          }}
        >
          {[0, 1].map((i) => (
            <div
              key={i}
              className="ao-panel ao-frame ao-breathe"
              style={{ padding: 24, minHeight: 280 }}
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
  if (error) {
    return (
      <div>
        <BackLink to={`/campaigns/${campaignId}`} label="К кампании" style={{ marginBottom: 12 }} />
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <p
            className="ao-italic"
            style={{ color: 'var(--ink-faint)', marginBottom: 16 }}
          >
            The roster could not be retrieved. The XP coffers remain sealed.
          </p>
          <button className="ao-btn" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!activeCharacters.length) {
    return (
      <div>
        <BackLink to={`/campaigns/${campaignId}`} label="К кампании" style={{ marginBottom: 12 }} />
        <div style={{ marginBottom: 32 }}>
          <p className="ao-overline" style={{ color: 'var(--gold)' }}>
            Game Master Tools
          </p>
          <h3 className="ao-h3" style={{ marginTop: 4 }}>
            Grant Experience
          </h3>
        </div>
        <EmptyVault
          glyph="sigil-3"
          overline="No Active Characters"
          title="There are no sworn to receive experience"
          body="Create characters in this campaign before granting XP."
        />
      </div>
    );
  }

  /* ---- render ---- */
  return (
    <div>
      <BackLink to={`/campaigns/${campaignId}`} label="К кампании" style={{ marginBottom: 12 }} />

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
            Game Master Tools
          </p>
          <h3 className="ao-h3" style={{ marginTop: 4 }}>
            Grant Experience
          </h3>
          <p
            className="ao-italic"
            style={{ color: 'var(--ink-quiet)', fontSize: 13, marginTop: 4 }}
          >
            Bestow the fruits of labour upon the sworn
          </p>
        </div>
        <OrdoChip tone="arcane" glyph="sigil-1">
          Game-Master
        </OrdoChip>
      </div>

      {/* Main Grid: Recipients + Grant Panel */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.5fr 1fr',
          gap: 20,
          alignItems: 'start',
        }}
      >
        {/* ════════════ Recipients Panel ════════════ */}
        <OrdoPanel frame padding={0}>
          <PanelHeader
            title="RECIPIENTS"
            sub={`${recipients.length} of ${activeCharacters.length} sworn`}
            glyph="helm"
            right={
              targetMode === 'SELECTED' ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    className="ao-btn ao-btn--ghost ao-btn--sm"
                    onClick={selectAll}
                  >
                    All
                  </button>
                  <button
                    className="ao-btn ao-btn--ghost ao-btn--sm"
                    onClick={selectNone}
                  >
                    None
                  </button>
                </div>
              ) : undefined
            }
          />

          {/* Segmented Tabs */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid var(--rule)',
            }}
          >
            {(['ALL', 'SELECTED', 'SINGLE'] as TargetMode[]).map((mode) => {
              const active = targetMode === mode;
              return (
                <button
                  key={mode}
                  style={{
                    flex: 1,
                    padding: '10px 8px',
                    background: active
                      ? 'rgba(212,180,120,0.06)'
                      : 'transparent',
                    border: 'none',
                    borderBottom: active
                      ? '2px solid var(--gold)'
                      : '2px solid transparent',
                    color: active ? 'var(--gold)' : 'var(--ink-quiet)',
                    fontFamily: 'var(--font-display)',
                    fontSize: 10,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase' as const,
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    setTargetMode(mode);
                    if (mode === 'ALL') selectAll();
                    if (mode === 'SINGLE') selectNone();
                  }}
                >
                  {mode}
                </button>
              );
            })}
          </div>

          {/* Character list */}
          <div style={{ maxHeight: 460, overflowY: 'auto' }}>
            {activeCharacters.map((ch) => {
              const isSelected =
                targetMode === 'ALL' || selectedIds.has(ch.id);
              const nextLevelXp = xpForNextLevel(ch.totalLevel);
              const xpProgress =
                nextLevelXp === Infinity ? 100 : (ch.experience / nextLevelXp) * 100;

              return (
                <div
                  key={ch.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 16px',
                    borderBottom: '1px solid var(--hairline)',
                    background: isSelected
                      ? 'rgba(212,180,120,0.04)'
                      : 'transparent',
                    cursor:
                      targetMode !== 'ALL' ? 'pointer' : 'default',
                    opacity: isSelected ? 1 : 0.45,
                  }}
                  onClick={() => {
                    if (targetMode === 'ALL') return;
                    if (targetMode === 'SINGLE') {
                      setSelectedIds(new Set([ch.id]));
                    } else {
                      toggleSelection(ch.id);
                    }
                  }}
                >
                  {/* Checkbox (only for SELECTED/SINGLE) */}
                  {targetMode !== 'ALL' && (
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        flexShrink: 0,
                        border: `1px solid ${isSelected ? 'var(--gold)' : 'var(--rule)'}`,
                        background: isSelected
                          ? 'rgba(212,180,120,0.15)'
                          : 'var(--abyss)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isSelected && (
                        <Rune
                          kind="check"
                          size={12}
                          color="var(--gold)"
                        />
                      )}
                    </div>
                  )}

                  {/* Character info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 4,
                      }}
                    >
                      <span className="ao-h5" style={{ fontSize: 13 }}>
                        {ch.name}
                      </span>
                      <CharStatusBadge status={ch.status ?? 'ACTIVE'} />
                      <span
                        className="ao-codex"
                        style={{
                          fontSize: 10,
                          color: 'var(--ink-faint)',
                        }}
                      >
                        LVL {ch.totalLevel}
                      </span>
                    </div>

                    {/* HP bar */}
                    <div style={{ marginBottom: 3 }}>
                      <Bar
                        value={ch.currentHp ?? 0}
                        max={ch.maxHp ?? 1}
                        tone="ember"
                        height={5}
                      />
                    </div>

                    {/* XP progress bar */}
                    <Bar
                      value={ch.experience}
                      max={nextLevelXp === Infinity ? ch.experience : nextLevelXp}
                      tone="arcane"
                      height={4}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </OrdoPanel>

        {/* ════════════ Grant Panel ════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <OrdoPanel frame padding={0}>
            <PanelHeader
              title="GRANT XP"
              glyph="flame"
              tone="ember"
            />

            <div style={{ padding: '20px 20px 24px' }}>
              {/* XP Input */}
              <div style={{ marginBottom: 16 }}>
                <label
                  className="ao-label"
                  style={{ display: 'block', marginBottom: 8 }}
                >
                  Experience Amount
                </label>
                <input
                  className="ao-input"
                  type="number"
                  min="0"
                  value={xpAmount}
                  onChange={(e) => setXpAmount(e.target.value)}
                  placeholder="0"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 28,
                    textAlign: 'center',
                    letterSpacing: '0.05em',
                    padding: '12px 16px',
                  }}
                />
              </div>

              {/* Quick-add buttons */}
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  marginBottom: 20,
                }}
              >
                {[250, 500, 1000].map((val) => (
                  <button
                    key={val}
                    className="ao-btn ao-btn--ghost"
                    style={{
                      flex: 1,
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                    }}
                    onClick={() =>
                      setXpAmount((prev) =>
                        String((Number(prev) || 0) + val),
                      )
                    }
                  >
                    +{val.toLocaleString()}
                  </button>
                ))}
              </div>

              <OrdoDivider glyph="diamond" />

              {/* Grant button */}
              <button
                className="ao-btn ao-btn--primary"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: 14,
                  marginTop: 16,
                }}
                onClick={handleGrant}
                disabled={
                  amount <= 0 ||
                  recipients.length === 0 ||
                  grantMutation.isPending
                }
              >
                {grantMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Rune
                      kind="flame"
                      size={14}
                      color="currentColor"
                    />
                    <span style={{ marginLeft: 8 }}>
                      Grant to {recipients.length} Sworn
                    </span>
                  </>
                )}
              </button>
            </div>
          </OrdoPanel>

          {/* ════════════ Threshold Preview ════════════ */}
          <OrdoPanel frame padding={0}>
            <PanelHeader
              title="THRESHOLD PREVIEW"
              sub={
                amount > 0
                  ? `${levelUps.length} will level up`
                  : 'Enter XP to preview'
              }
              glyph="arrow-up"
              tone="arcane"
            />

            <div style={{ padding: 0 }}>
              {amount <= 0 || recipients.length === 0 ? (
                <div
                  style={{
                    padding: '24px 20px',
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
                    Specify an XP amount to see who crosses the threshold
                  </p>
                </div>
              ) : levelUps.length === 0 ? (
                <div
                  style={{
                    padding: '24px 20px',
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
                    No character will cross a level threshold with this
                    amount
                  </p>
                </div>
              ) : (
                <div>
                  {levelUps.map((ch) => {
                    const nextXp = xpForNextLevel(ch.totalLevel);
                    return (
                      <div
                        key={ch.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 16px',
                          borderBottom:
                            '1px solid var(--hairline)',
                          background:
                            'rgba(122,152,102,0.05)',
                        }}
                      >
                        <Rune
                          kind="arrow-up"
                          size={14}
                          color="#7a9866"
                        />
                        <div style={{ flex: 1 }}>
                          <span
                            className="ao-h5"
                            style={{ fontSize: 13 }}
                          >
                            {ch.name}
                          </span>
                        </div>
                        <span
                          className="ao-codex"
                          style={{
                            fontSize: 10,
                            color: '#7a9866',
                          }}
                        >
                          LVL {ch.totalLevel} {'\u2192'}{' '}
                          {ch.totalLevel + 1}
                        </span>
                        <span
                          className="ao-codex"
                          style={{
                            fontSize: 10,
                            color: 'var(--ink-faint)',
                          }}
                        >
                          ({ch.experience.toLocaleString()} +{' '}
                          {amount.toLocaleString()} /{' '}
                          {nextXp === Infinity
                            ? 'MAX'
                            : nextXp.toLocaleString()}
                          )
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </OrdoPanel>
        </div>
      </div>
    </div>
  );
}
