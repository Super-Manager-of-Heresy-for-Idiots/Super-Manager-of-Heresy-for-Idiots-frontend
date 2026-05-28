import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Panel, Button, Rune, AlertDialog } from '@/components/ao';
import { TeamCard } from '@/components/teams/TeamCard';
import { useTeams, useDeleteTeam, useRegenerateInvite } from '@/hooks/useTeams';

export default function GmTeamsListPage() {
  const navigate = useNavigate();
  const { data: teams, isLoading, error, refetch } = useTeams();
  const deleteMutation = useDeleteTeam();
  const regenerateMutation = useRegenerateInvite();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [regenerateId, setRegenerateId] = useState<string | null>(null);

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };

  const handleRegenerate = () => {
    if (regenerateId) {
      regenerateMutation.mutate(regenerateId, {
        onSuccess: () => setRegenerateId(null),
      });
    }
  };

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <p style={{ fontSize: 16, color: 'var(--ink-muted)', marginBottom: 16 }}>Failed to load teams</p>
        <Button variant="ghost" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 className="ao-h2">My Teams</h1>
        <Button
          variant="primary"
          icon={<Rune kind="plus" size={14} />}
          onClick={() => navigate('/gm/teams/new')}
        >
          Create Team
        </Button>
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Panel key={i} style={{ height: 192 }} className="ao-breathe">
              <div style={{ background: 'var(--surface)', height: '100%', borderRadius: 4 }} />
            </Panel>
          ))}
        </div>
      ) : !teams || teams.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <Rune kind="shield" size={64} color="var(--gold-dim)" style={{ marginBottom: 16 }} />
          <h2 className="ao-h3" style={{ marginBottom: 8 }}>No Teams Yet</h2>
          <p style={{ color: 'var(--ink-muted)', marginBottom: 24 }}>
            Create your first team and invite players!
          </p>
          <Button
            variant="primary"
            icon={<Rune kind="plus" size={14} />}
            onClick={() => navigate('/gm/teams/new')}
          >
            Create Your First Team
          </Button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              onDelete={(id) => setDeleteId(id)}
              onRegenerate={(id) => setRegenerateId(id)}
            />
          ))}
        </div>
      )}

      <AlertDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Team?"
        description="This action cannot be undone. This team and all its data will be permanently deleted."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      <AlertDialog
        open={!!regenerateId}
        onClose={() => setRegenerateId(null)}
        onConfirm={handleRegenerate}
        title="Regenerate Invite Code?"
        description="The current invite code will stop working. A new code will be generated."
        confirmText="Regenerate"
        cancelText="Cancel"
      />
    </div>
  );
}
