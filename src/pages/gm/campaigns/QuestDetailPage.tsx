import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { OrdoPanel, PanelHeader, Rune, OrdoDivider, EmptyVault } from '@/components/ordo';
import { CodexID } from '@/components/homebrew/CodexID';
import { VisibilityToggle, QuestStatusBadge } from '@/components/narrative';
import { useQuest, useUpdateQuest } from '@/hooks/useQuests';
import type { QuestStatus, QuestReward } from '@/types';

/* ── constants ───────────────────────────────────────────────── */

const QUEST_STATUSES: QuestStatus[] = ['ACTIVE', 'COMPLETED', 'FAILED', 'HIDDEN', 'ARCHIVED'];

const STATUS_BUTTON_COLORS: Record<QuestStatus, string> = {
  ACTIVE:    '#d4b478',
  COMPLETED: '#6db86a',
  FAILED:    '#c87a3a',
  HIDDEN:    'var(--ink-ghost)',
  ARCHIVED:  'var(--ink-faint)',
};

/* ── reward icon helper ──────────────────────────────────────── */

function rewardGlyph(type: string): string {
  switch (type) {
    case 'ITEM': return 'sword';
    case 'GOLD': return 'coin';
    case 'XP':   return 'sigil-2';
    default:     return 'diamond';
  }
}

/* ── page ────────────────────────────────────────────────────── */

export default function QuestDetailPage() {
  const { campaignId, questId } = useParams<{ campaignId: string; questId: string }>();
  const { data: quest, isLoading, error, refetch } = useQuest(campaignId!, questId!);
  const updateMutation = useUpdateQuest();

  const toggleVisibility = () => {
    if (!quest) return;
    updateMutation.mutate({
      campaignId: campaignId!,
      questId: questId!,
      data: { visible: !quest.visible },
    });
  };

  const setStatus = (status: QuestStatus) => {
    updateMutation.mutate({
      campaignId: campaignId!,
      questId: questId!,
      data: { status },
    });
  };

  /* ── loading ─────────────────────────────────────────────── */

  if (isLoading) {
    return (
      <div style={{ display: 'flex', gap: 24 }}>
        <div style={{ flex: '1.5 1 0' }}>
          <div className="ao-panel ao-frame ao-breathe" style={{ padding: 24, minHeight: 300 }}>
            <span className="ao-frame-c" />
            <div className="ao-ph" style={{ width: '30%', height: 14, marginBottom: 12 }} />
            <div className="ao-ph" style={{ width: '50%', height: 24, marginBottom: 16 }} />
            <div className="ao-ph" style={{ width: '80%', height: 14, marginBottom: 8 }} />
            <div className="ao-ph" style={{ width: '60%', height: 14 }} />
          </div>
        </div>
        <div style={{ flex: '1 1 0' }}>
          <div className="ao-panel ao-frame ao-breathe" style={{ padding: 24, minHeight: 200 }}>
            <span className="ao-frame-c" />
            <div className="ao-ph" style={{ width: '60%', height: 14, marginBottom: 12 }} />
            <div className="ao-ph" style={{ width: '40%', height: 14 }} />
          </div>
        </div>
      </div>
    );
  }

  /* ── error ───────────────────────────────────────────────── */

  if (error || !quest) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <p className="ao-italic" style={{ color: 'var(--ink-faint)', marginBottom: 16 }}>
          This quest could not be found within the chronicle.
        </p>
        <button className="ao-btn" onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  /* ── linked entities ─────────────────────────────────────── */

  const linkedNpcs: { id: string; name: string }[] = quest.linkedNpcs ?? [];
  const linkedLocations: { id: string; name: string }[] = quest.linkedLocations ?? [];
  const linkedItems: { id: string; name: string }[] = quest.linkedItems ?? [];
  const rewards: QuestReward[] = quest.rewards ?? [];

  /* ── main ────────────────────────────────────────────────── */

  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
      {/* ═══ Left column ═══ */}
      <div style={{ flex: '1.5 1 0', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Identity block */}
        <OrdoPanel frame padding={20}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <CodexID>{quest.id.slice(0, 8).toUpperCase()}</CodexID>
            <QuestStatusBadge status={quest.status} />
            <VisibilityToggle visible={quest.visible} onToggle={toggleVisibility} />
          </div>

          <h3 className="ao-h3" style={{ marginTop: 10, color: 'var(--ink-bright)' }}>
            {quest.name}
          </h3>

          {quest.description && (
            <p style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.6, marginTop: 10 }}>
              {quest.description}
            </p>
          )}
        </OrdoPanel>

        {/* GM-only description */}
        <OrdoPanel
          frame
          padding={0}
          style={{
            borderColor: 'rgba(140,40,50,0.3)',
            background: 'rgba(100,20,30,0.06)',
          }}
        >
          <PanelHeader title="GM-ONLY NOTES" glyph="lock" tone="ember" sub="Hidden from players" />
          <div style={{ padding: 16 }}>
            <p style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.6, margin: 0 }}>
              {quest.gmDescription || (
                <span className="ao-italic" style={{ color: 'var(--ink-ghost)' }}>
                  No private notes inscribed for this quest.
                </span>
              )}
            </p>
          </div>
        </OrdoPanel>

        {/* Rewards panel */}
        <OrdoPanel frame padding={0}>
          <PanelHeader title="REWARDS" glyph="coin" tone="gold" />
          <div style={{ padding: 16 }}>
            {rewards.length === 0 ? (
              <p className="ao-italic" style={{ color: 'var(--ink-ghost)', fontSize: 13 }}>
                No rewards have been decreed for this quest.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {rewards.map((reward, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      background: 'rgba(0,0,0,0.2)',
                      border: '1px solid var(--rule)',
                    }}
                  >
                    <Rune kind={rewardGlyph(reward.type)} size={14} color="var(--gold)" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 13, color: 'var(--ink-bright)' }}>
                        {reward.name || reward.type}
                      </span>
                      {reward.amount != null && (
                        <span
                          className="ao-codex"
                          style={{ marginLeft: 8, color: 'var(--brass)' }}
                        >
                          x{reward.amount}
                        </span>
                      )}
                    </div>
                    <span
                      className="ao-overline"
                      style={{ fontSize: 8, color: 'var(--ink-faint)' }}
                    >
                      {reward.type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </OrdoPanel>
      </div>

      {/* ═══ Right column ═══ */}
      <div style={{ flex: '1 1 0', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Linked entities */}
        <OrdoPanel frame padding={0}>
          <PanelHeader title="LINKED ENTITIES" glyph="sigil-1" tone="gold" />
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* NPCs */}
            <div>
              <span className="ao-overline" style={{ fontSize: 9, color: 'var(--brass)', marginBottom: 6, display: 'block' }}>
                NPCs
              </span>
              {linkedNpcs.length === 0 ? (
                <p className="ao-italic" style={{ color: 'var(--ink-ghost)', fontSize: 12, margin: 0 }}>None</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {linkedNpcs.map((npc) => (
                    <div key={npc.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--rule)' }}>
                      <Rune kind="helm" size={11} color="var(--brass)" />
                      <span style={{ fontSize: 12, color: 'var(--ink-bright)' }}>{npc.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <OrdoDivider glyph="diamond" />

            {/* Locations */}
            <div>
              <span className="ao-overline" style={{ fontSize: 9, color: 'var(--arcane)', marginBottom: 6, display: 'block' }}>
                Locations
              </span>
              {linkedLocations.length === 0 ? (
                <p className="ao-italic" style={{ color: 'var(--ink-ghost)', fontSize: 12, margin: 0 }}>None</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {linkedLocations.map((loc) => (
                    <div key={loc.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--rule)' }}>
                      <Rune kind="sigil-3" size={11} color="var(--arcane)" />
                      <span style={{ fontSize: 12, color: 'var(--ink-bright)' }}>{loc.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <OrdoDivider glyph="diamond" />

            {/* Items */}
            <div>
              <span className="ao-overline" style={{ fontSize: 9, color: 'var(--gold)', marginBottom: 6, display: 'block' }}>
                Items
              </span>
              {linkedItems.length === 0 ? (
                <p className="ao-italic" style={{ color: 'var(--ink-ghost)', fontSize: 12, margin: 0 }}>None</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {linkedItems.map((item) => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--rule)' }}>
                      <Rune kind="sword" size={11} color="var(--gold)" />
                      <span style={{ fontSize: 12, color: 'var(--ink-bright)' }}>{item.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </OrdoPanel>

        {/* Status setter */}
        <OrdoPanel frame padding={0}>
          <PanelHeader title="SET STATUS" glyph="diamond-fill" tone="gold" />
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {QUEST_STATUSES.map((status) => {
              const isActive = quest.status === status;
              const c = STATUS_BUTTON_COLORS[status];
              return (
                <button
                  key={status}
                  onClick={() => setStatus(status)}
                  disabled={updateMutation.isPending}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 14px',
                    background: isActive ? 'rgba(0,0,0,0.4)' : 'transparent',
                    border: `1px solid ${isActive ? c : 'var(--hairline)'}`,
                    fontFamily: 'var(--font-display)',
                    fontSize: 10,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase' as const,
                    color: isActive ? c : 'var(--ink-faint)',
                    cursor: 'pointer',
                    width: '100%',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        background: isActive ? c : 'transparent',
                        border: `1px solid ${c}`,
                        transform: 'rotate(45deg)',
                      }}
                    />
                  )}
                  {status.charAt(0) + status.slice(1).toLowerCase()}
                </button>
              );
            })}
          </div>
        </OrdoPanel>
      </div>
    </div>
  );
}
