import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  OrdoPanel,
  PanelHeader,
  Rune,
  OrdoDivider,
  Bar,
  EmptyVault,
} from '@/components/ordo';
import {
  CampaignStatusPill,
  CharStatusBadge,
  DrillBlock,
  StatusSwitch,
} from '@/components/campaigns';
import { useCampaign, useSetCampaignStatus } from '@/hooks/useCampaigns';
import { useCampaignCharacters } from '@/hooks/useCharacterV2';
import type { CampaignStatus, CharacterV2Response } from '@/types';

/* ── page ────────────────────────────────────────────────────── */

export default function CampaignDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const { data: campaign, isLoading, error, refetch } = useCampaign(id!);
  const { data: characters, isLoading: charsLoading } = useCampaignCharacters(id!);
  const statusMutation = useSetCampaignStatus();

  /* ── derived counts ────────────────────────────────────────── */

  const charCounts = useMemo(() => {
    const list = characters ?? [];
    return {
      total: list.length,
      active: list.filter((c: CharacterV2Response) => c.status === 'ACTIVE').length,
      dead: list.filter((c: CharacterV2Response) => c.status === 'DEAD').length,
      reserve: list.filter((c: CharacterV2Response) => c.status === 'RESERVE').length,
    };
  }, [characters]);

  const activeChars = useMemo(
    () => (characters ?? []).filter((c: CharacterV2Response) => c.status === 'ACTIVE'),
    [characters],
  );

  const handleStatusChange = (status: CampaignStatus) => {
    if (!id) return;
    statusMutation.mutate({ id, data: { status } });
  };

  /* ── loading ─────────────────────────────────────────────── */

  if (isLoading) {
    return (
      <div>
        <div className="ao-panel ao-frame ao-breathe" style={{ padding: 24, minHeight: 120, marginBottom: 20 }}>
          <span className="ao-frame-c" />
          <div className="ao-ph" style={{ width: '40%', height: 24, marginBottom: 12 }} />
          <div className="ao-ph" style={{ width: '60%', height: 14 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="ao-panel ao-frame ao-breathe" style={{ padding: 24, minHeight: 80 }}>
              <span className="ao-frame-c" />
              <div className="ao-ph" style={{ width: '50%', height: 14, marginBottom: 8 }} />
              <div className="ao-ph" style={{ width: '30%', height: 14 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── error ───────────────────────────────────────────────── */

  if (error || !campaign) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <p className="ao-italic" style={{ color: 'var(--ink-faint)', marginBottom: 16 }}>
          The campaign chronicle could not be unfurled. Its wards remain unbroken.
        </p>
        <button className="ao-btn" onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  /* ── main ────────────────────────────────────────────────── */

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
        <div>
          <p className="ao-overline" style={{ color: 'var(--gold)' }}>Campaign</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
            <h3 className="ao-h3">{campaign.name}</h3>
            <CampaignStatusPill status={campaign.status} />
          </div>
          {campaign.description && (
            <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 13, marginTop: 6 }}>
              {campaign.description}
            </p>
          )}
        </div>
        {campaign.isCreator && (
          <StatusSwitch
            current={campaign.status}
            onChange={handleStatusChange}
          />
        )}
      </div>

      {/* Stat blocks */}
      <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 36, marginBottom: 24 }}>
        <div className="ao-stat" style={{ textAlign: 'center' }}>
          <span className="ao-stat-value" style={{ color: 'var(--gold)' }}>
            {campaign.members?.length || 0}
          </span>
          <span className="ao-stat-label">Members</span>
        </div>
        <div className="ao-stat" style={{ textAlign: 'center' }}>
          <span className="ao-stat-value" style={{ color: 'var(--arcane)' }}>
            {charsLoading ? '\u2014' : charCounts.total}
          </span>
          <span className="ao-stat-label">Characters</span>
        </div>
        <div className="ao-stat" style={{ textAlign: 'center' }}>
          <span className="ao-stat-value" style={{ color: '#7a9866' }}>
            {charsLoading ? '\u2014' : charCounts.active}
          </span>
          <span className="ao-stat-label">Active</span>
        </div>
        <div className="ao-stat" style={{ textAlign: 'center' }}>
          <span className="ao-stat-value" style={{ color: '#b06a6a' }}>
            {charsLoading ? '\u2014' : charCounts.dead}
          </span>
          <span className="ao-stat-label">Dead</span>
        </div>
        <div className="ao-stat" style={{ textAlign: 'center' }}>
          <span className="ao-stat-value" style={{ color: 'var(--ink-faint)' }}>
            {charsLoading ? '\u2014' : charCounts.reserve}
          </span>
          <span className="ao-stat-label">Reserve</span>
        </div>
      </div>

      <OrdoDivider glyph="diamond" />

      {/* DrillBlock grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 24, marginBottom: 28 }}>
        <DrillBlock label="Roster" glyph="helm" count={charCounts.total} to={`/gm/campaigns/${id}/roster`} />
        <DrillBlock label="NPCs" glyph="sigil-1" to={`/gm/campaigns/${id}/npcs`} />
        <DrillBlock label="Quests" glyph="scroll" to={`/gm/campaigns/${id}/quests`} />
        <DrillBlock label="Locations" glyph="sigil-3" to={`/gm/campaigns/${id}/locations`} />
        <DrillBlock label="Storage" glyph="sword" to={`/gm/campaigns/${id}/storage`} />
        <DrillBlock label="Invite Code" glyph="cross-pat" to={`/gm/campaigns/${id}/invite`} />
        <DrillBlock label="Session Notes" glyph="lock" to={`/gm/campaigns/${id}/notes`} />
      </div>

      <OrdoDivider glyph="diamond" />

      {/* Roster Summary */}
      <OrdoPanel frame padding={0} style={{ marginTop: 24 }}>
        <PanelHeader title="ROSTER SUMMARY" glyph="helm" tone="gold" sub={`${charCounts.active} active sworn`} />

        {charsLoading ? (
          <div className="ao-breathe" style={{ padding: 20 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                <div className="ao-ph" style={{ width: '30%', height: 14 }} />
                <div className="ao-ph" style={{ width: '20%', height: 14 }} />
                <div className="ao-ph" style={{ width: '50%', height: 8 }} />
              </div>
            ))}
          </div>
        ) : activeChars.length === 0 ? (
          <div style={{ padding: '24px 20px', textAlign: 'center' }}>
            <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 13 }}>
              No active characters have been sworn to this campaign.
            </p>
          </div>
        ) : (
          <div>
            {activeChars.map((ch: CharacterV2Response) => {
              const className = ch.classLevels?.[0]?.className ?? 'Unknown';
              return (
                <div
                  key={ch.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 16px',
                    borderBottom: '1px solid var(--hairline)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span className="ao-h5" style={{ fontSize: 13 }}>{ch.name}</span>
                      <CharStatusBadge status={ch.status ?? ''} />
                      <span className="ao-codex" style={{ fontSize: 10, color: 'var(--ink-faint)' }}>
                        {className} &middot; LVL {ch.totalLevel}
                      </span>
                    </div>
                    <Bar value={ch.currentHp ?? 0} max={ch.maxHp ?? 0} tone="ember" height={5} />
                  </div>
                  <span className="ao-codex" style={{ fontSize: 11, color: 'var(--ink-quiet)', flexShrink: 0 }}>
                    {ch.currentHp}/{ch.maxHp} HP
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </OrdoPanel>
    </div>
  );
}
