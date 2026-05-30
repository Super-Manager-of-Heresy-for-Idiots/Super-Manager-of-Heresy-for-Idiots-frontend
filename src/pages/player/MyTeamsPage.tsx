import { useNavigate } from 'react-router-dom';
import { Rune, Sigil, OrdoPanel, OrdoChip } from '@/components/ordo';
import { useTeams } from '@/hooks/useTeams';

export default function MyTeamsPage() {
  const navigate = useNavigate();
  const { data: teams, isLoading, error, refetch } = useTeams();

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <Sigil size={56} glyph="eye" />
        <p className="ao-italic" style={{ color: 'var(--ink-faint)', margin: '16px 0' }}>
          Failed to summon conclave records
        </p>
        <button className="ao-btn ao-btn--ghost" onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 className="ao-h3" style={{ margin: 0 }}>My Conclaves</h1>
        <button className="ao-btn ao-btn--primary" onClick={() => navigate('/teams/join')}>
          <Rune kind="scroll" size={14} color="currentColor" />
          <span style={{ marginLeft: 6 }}>Enter Cipher</span>
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="ao-breathe" style={{ height: 128, background: 'var(--abyss)', borderRadius: 4 }} />
          ))}
        </div>
      ) : !teams || teams.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <Sigil size={72} glyph="sigil-3" />
          <h2 className="ao-h5" style={{ marginTop: 16, color: 'var(--ink-faint)' }}>
            Not yet sworn to any fellowship
          </h2>
          <p className="ao-italic" style={{ color: 'var(--ink-faint)', marginTop: 8 }}>
            Seek a Cipher from your Game Master to join a Conclave.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {teams.map((team) => (
            <OrdoPanel key={team.id} frame padding={20}>
              <h3 className="ao-h5" style={{ margin: '0 0 10px' }}>{team.name}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span className="ao-codex" style={{ color: 'var(--ink-faint)' }}>
                  GM: {team.gameMasterUsername || 'Unknown'}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--ink-faint)', fontSize: 13 }}>
                  <Rune kind="shield" size={14} color="var(--ink-faint)" />
                  {team.members?.length || 0} members
                </span>
              </div>
              <div style={{ marginTop: 12 }}>
                <OrdoChip tone="gold" glyph="diamond">Member</OrdoChip>
              </div>
            </OrdoPanel>
          ))}
        </div>
      )}
    </div>
  );
}
