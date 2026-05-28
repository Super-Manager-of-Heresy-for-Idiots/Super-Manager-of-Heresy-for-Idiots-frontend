import { Panel, Button, Chip, Rune, Divider } from '@/components/ao';
import { useTeams } from '@/hooks/useTeams';

export default function MyTeamsPage() {
  const { data: teams, isLoading, error, refetch } = useTeams();

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
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Panel key={i} style={{ height: 128 }} className="ao-breathe">
              <div style={{ background: 'var(--surface)', height: '100%', borderRadius: 4 }} />
            </Panel>
          ))}
        </div>
      ) : !teams || teams.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <Rune kind="helm" size={64} color="var(--gold-dim)" style={{ marginBottom: 16 }} />
          <h2 className="ao-h3" style={{ marginBottom: 8 }}>Not in Any Teams</h2>
          <p style={{ color: 'var(--ink-muted)' }}>
            Ask your Game Master for an invite code to join a team.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {teams.map((team) => (
            <Panel key={team.id} frame className="ao-rise">
              <div style={{ marginBottom: 8 }}>
                <div className="ao-h4" style={{ margin: 0 }}>{team.name}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--ink-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Rune kind="helm" size={14} color="var(--gold)" />
                  <span>GM: {team.gameMaster?.username || 'Unknown'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Rune kind="shield" size={14} color="var(--ink-muted)" />
                  <span>{team.members?.length || team.memberCount || 0} members</span>
                </div>
              </div>
              <Divider style={{ margin: '10px 0' }} />
              <Chip tone="muted">Member</Chip>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
