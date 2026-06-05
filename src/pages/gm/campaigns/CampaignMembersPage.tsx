import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { OrdoPanel, PanelHeader, Rune, OrdoChip, EmptyVault } from '@/components/ordo';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCampaign, useKickMember } from '@/hooks/useCampaigns';
import type { CampaignMember } from '@/types';

/* ── page ────────────────────────────────────────────────────── */

export default function CampaignMembersPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const { data: campaign, isLoading, error, refetch } = useCampaign(campaignId!);
  const kickMutation = useKickMember();

  const [kickUserId, setKickUserId] = useState<string | null>(null);

  const handleKick = () => {
    if (!kickUserId || !campaignId) return;
    kickMutation.mutate(
      { campaignId, userId: kickUserId },
      { onSuccess: () => setKickUserId(null) },
    );
  };

  /* ── loading ─────────────────────────────────────────────── */

  if (isLoading) {
    return (
      <div>
        <div style={{ marginBottom: 32 }}>
          <p className="ao-overline" style={{ color: 'var(--gold)' }}>Campaign Roster</p>
          <h3 className="ao-h3" style={{ marginTop: 4 }}>Members</h3>
        </div>
        <div className="ao-panel ao-frame ao-breathe" style={{ padding: 24, minHeight: 200 }}>
          <span className="ao-frame-c" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <div className="ao-ph" style={{ width: '30%', height: 14 }} />
              <div className="ao-ph" style={{ width: '15%', height: 14 }} />
              <div className="ao-ph" style={{ width: '20%', height: 14 }} />
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
          The roster could not be retrieved. The sigils remain unreadable.
        </p>
        <button className="ao-btn" onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  const members: CampaignMember[] = campaign.members ?? [];

  /* ── main ────────────────────────────────────────────────── */

  return (
    <div>
      {/* Back button */}
      <button
        className="ao-btn ao-btn--ghost ao-btn--sm"
        onClick={() => navigate(`/campaigns/${campaignId}`)}
        style={{ marginBottom: 16 }}
      >
        <Rune kind="chev-l" size={12} color="currentColor" />
        <span style={{ marginLeft: 4 }}>Back to Dashboard</span>
      </button>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <p className="ao-overline" style={{ color: 'var(--gold)' }}>Campaign Roster</p>
          <h3 className="ao-h3" style={{ marginTop: 4 }}>Members</h3>
          <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 13, marginTop: 4 }}>
            {members.length} {members.length === 1 ? 'soul' : 'souls'} sworn to this campaign.
          </p>
        </div>
      </div>

      {/* Member List */}
      {members.length === 0 ? (
        <EmptyVault
          glyph="helm"
          title="No Members"
          body="No souls have been sworn to this campaign."
        />
      ) : (
        <OrdoPanel frame padding={0}>
          <PanelHeader
            title="SWORN MEMBERS"
            glyph="helm"
            sub={`${members.length} total`}
          />

          {/* Column headers */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 120px 140px 80px',
              gap: 12,
              padding: '10px 18px',
              borderBottom: '1px solid var(--rule)',
              background: 'var(--abyss)',
            }}
          >
            <span className="ao-overline" style={{ fontSize: 9, color: 'var(--ink-faint)' }}>Username</span>
            <span className="ao-overline" style={{ fontSize: 9, color: 'var(--ink-faint)' }}>Role</span>
            <span className="ao-overline" style={{ fontSize: 9, color: 'var(--ink-faint)' }}>Joined</span>
            <span />
          </div>

          {/* Rows */}
          {members.map((member: CampaignMember) => (
            <div
              key={member.userId}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 120px 140px 80px',
                gap: 12,
                padding: '14px 18px',
                borderBottom: '1px solid var(--hairline)',
                alignItems: 'center',
              }}
            >
              {/* Username */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <Rune kind="helm" size={14} color="var(--brass)" />
                <span style={{ fontSize: 14, color: 'var(--ink-bright)', fontWeight: 500 }}>
                  {member.username}
                </span>
                {member.isCreator && (
                  <span className="ao-overline" style={{ fontSize: 8, color: 'var(--gold)' }}>
                    CREATOR
                  </span>
                )}
              </div>

              {/* Role */}
              <div>
                <OrdoChip
                  tone={member.roleInCampaign === 'GAME_MASTER' ? 'arcane' : 'gold'}
                  glyph={member.roleInCampaign === 'GAME_MASTER' ? 'sigil-1' : 'helm'}
                >
                  {member.roleInCampaign}
                </OrdoChip>
              </div>

              {/* Joined date */}
              <div>
                <span className="ao-codex" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
                  {new Date(member.joinedAt).toLocaleDateString()}
                </span>
              </div>

              {/* Kick button */}
              <div>
                {campaign.isCreator && !member.isCreator && (
                  <button
                    className="ao-btn ao-btn--danger ao-btn--sm"
                    onClick={() => setKickUserId(member.userId)}
                    title="Exile member"
                  >
                    <Rune kind="x" size={10} color="currentColor" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </OrdoPanel>
      )}

      {/* Kick Confirmation */}
      <AlertDialog open={!!kickUserId} onOpenChange={() => setKickUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exile this Member?</AlertDialogTitle>
            <AlertDialogDescription>
              This soul shall be cast from the campaign. Their characters will remain but they will lose access until re-invited.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Withhold</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleKick}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {kickMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Exile
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
