import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Panel, PanelHeader, Button, Rune, Divider, AlertDialog } from '@/components/ao';
import { InviteCodeDisplay } from '@/components/teams/InviteCodeDisplay';
import { MemberList } from '@/components/teams/MemberList';
import { useTeam, useRegenerateInvite } from '@/hooks/useTeams';

export default function GmTeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: team, isLoading, error, refetch } = useTeam(id!);
  const regenerateMutation = useRegenerateInvite();
  const [showRegenerate, setShowRegenerate] = useState(false);

  const handleRegenerate = () => {
    regenerateMutation.mutate(id!, {
      onSuccess: () => {
        setShowRegenerate(false);
        refetch();
      },
    });
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {[48, 96, 192].map((h, i) => (
          <Panel key={i} style={{ height: h }} className="ao-breathe">
            <div style={{ background: 'var(--surface)', height: '100%', borderRadius: 4 }} />
          </Panel>
        ))}
      </div>
    );
  }

  if (error || !team) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <p style={{ fontSize: 16, color: 'var(--ink-muted)', marginBottom: 16 }}>Failed to load team</p>
        <Button variant="ghost" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Button variant="ghost" onClick={() => navigate('/gm/teams')} icon={<Rune kind="arrow-l" size={14} />}>
        Back to Teams
      </Button>

      {/* Team Header */}
      <Panel frame padding={20}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 className="ao-h2" style={{ margin: 0 }}>{team.name}</h1>
            <p style={{ color: 'var(--ink-muted)', marginTop: 4 }}>
              {team.members?.length || 0} member{(team.members?.length || 0) !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </Panel>

      {/* Invite Code Section */}
      {team.inviteCode && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div className="ao-overline" style={{ color: 'var(--ink-muted)', marginBottom: 8 }}>Invite Code</div>
            <InviteCodeDisplay code={team.inviteCode} />
          </div>
          <Button
            variant="ghost"
            icon={<Rune kind="sigil-3" size={14} />}
            onClick={() => setShowRegenerate(true)}
          >
            Regenerate
          </Button>
        </div>
      )}

      <Divider />

      {/* Members */}
      <div>
        <PanelHeader title="Members" glyph="shield" />
        <div style={{ marginTop: 12 }}>
          <MemberList members={team.members || []} />
        </div>
      </div>

      <AlertDialog
        open={showRegenerate}
        onClose={() => setShowRegenerate(false)}
        onConfirm={handleRegenerate}
        title="Regenerate Invite Code?"
        description="The current invite code will stop working. A new code will be generated."
        confirmText="Regenerate"
        cancelText="Cancel"
      />
    </div>
  );
}
