import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rune, Sigil, OrdoDivider, OrdoPanel } from '@/components/ordo';
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

  const totalMembers = teams?.reduce((sum, t) => sum + (t.members?.length || 0), 0) || 0;

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <p className="ao-italic" style={{ color: 'var(--ink-faint)', marginBottom: 16 }}>
          The registry could not be consulted. The ink has faded.
        </p>
        <button className="ao-btn" onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <p className="ao-overline" style={{ color: 'var(--gold)' }}>
          Fellowships under thy charter
        </p>
        <h3 className="ao-h3" style={{ marginTop: 4 }}>The Conclaves</h3>
      </div>

      <OrdoDivider glyph="diamond" color="var(--rule)" />

      {/* Stats row */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 48, margin: '24px 0' }}>
        <div className="ao-stat" style={{ textAlign: 'center' }}>
          <span className="ao-stat-value" style={{ color: 'var(--gold)' }}>
            {isLoading ? '\u2014' : (teams?.length || 0)}
          </span>
          <span className="ao-stat-label">Conclaves</span>
        </div>
        <div className="ao-stat" style={{ textAlign: 'center' }}>
          <span className="ao-stat-value" style={{ color: 'var(--arcane)' }}>
            {isLoading ? '\u2014' : totalMembers}
          </span>
          <span className="ao-stat-label">Total Members</span>
        </div>
      </div>

      <OrdoDivider glyph="diamond" color="var(--rule)" />

      {/* Action bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '20px 0' }}>
        <button
          className="ao-btn ao-btn--primary"
          onClick={() => navigate('/gm/teams/new')}
        >
          <Rune kind="plus" size={14} color="currentColor" />
          <span style={{ marginLeft: 6 }}>Found New Conclave</span>
        </button>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="ao-panel ao-frame ao-breathe" style={{ padding: 24, minHeight: 180 }}>
              <span className="ao-frame-c" />
              <div className="ao-ph" style={{ width: '60%', height: 20, marginBottom: 12 }} />
              <div className="ao-ph" style={{ width: '40%', height: 14 }} />
            </div>
          ))}
        </div>
      ) : !teams || teams.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <Sigil size={80} glyph="shield" color="var(--gold-pale)" />
          <h4 className="ao-h4" style={{ marginTop: 20 }}>No Conclaves Yet</h4>
          <p className="ao-italic" style={{ color: 'var(--ink-faint)', marginTop: 8, marginBottom: 24 }}>
            Forge thy first fellowship and summon thy players.
          </p>
          <button
            className="ao-btn ao-btn--primary ao-btn--lg"
            onClick={() => navigate('/gm/teams/new')}
          >
            <Rune kind="plus" size={14} color="currentColor" />
            <span style={{ marginLeft: 6 }}>Found Thy First Conclave</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {teams.map((team) => (
            <OrdoPanel key={team.id} frame padding={0}>
              <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <Sigil size={44} glyph="shield" color="var(--gold)" />
                  <div style={{ flex: 1 }}>
                    <h4 className="ao-h4" style={{ margin: 0 }}>{team.name}</h4>
                    <p className="ao-codex" style={{ color: 'var(--ink-faint)', marginTop: 2 }}>
                      GM: {team.gameMasterUsername || 'Unknown'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14 }}>
                  <Rune kind="helm" size={14} color="var(--ink-quiet)" />
                  <span className="ao-codex" style={{ color: 'var(--ink-quiet)' }}>
                    {team.members?.length || 0} {(team.members?.length || 0) === 1 ? 'member' : 'members'}
                  </span>
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: 6,
                padding: '12px 20px',
                borderTop: '1px solid var(--rule)',
                background: 'var(--abyss)',
              }}>
                <button
                  className="ao-btn ao-btn--primary ao-btn--sm"
                  style={{ flex: 1 }}
                  onClick={() => navigate(`/gm/teams/${team.id}`)}
                >
                  <Rune kind="eye" size={12} color="currentColor" />
                  <span style={{ marginLeft: 4 }}>View Conclave</span>
                </button>
                <button
                  className="ao-btn ao-btn--ghost ao-btn--sm"
                  onClick={() => setRegenerateId(team.id)}
                  title="Regenerate invite code"
                >
                  <Rune kind="cross-pat" size={14} color="var(--arcane)" />
                </button>
                <button
                  className="ao-btn ao-btn--danger ao-btn--sm"
                  onClick={() => setDeleteId(team.id)}
                  title="Unmake conclave"
                >
                  <Rune kind="x" size={14} color="currentColor" />
                </button>
              </div>
            </OrdoPanel>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unmake this Conclave?</AlertDialogTitle>
            <AlertDialogDescription>
              This rite cannot be undone. The conclave and all its records shall be erased from the registry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Withhold</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Unmake
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Regenerate confirmation */}
      <AlertDialog open={!!regenerateId} onOpenChange={() => setRegenerateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Re-forge Invite Sigil?</AlertDialogTitle>
            <AlertDialogDescription>
              The current invite sigil shall be voided. A new cipher shall be conjured in its place.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Withhold</AlertDialogCancel>
            <AlertDialogAction onClick={handleRegenerate}>Re-forge</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
