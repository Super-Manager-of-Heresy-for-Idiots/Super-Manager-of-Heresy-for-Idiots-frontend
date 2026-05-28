import { useNavigate } from 'react-router-dom';
import { Panel, Button, Rune, Divider } from '@/components/ao';
import { InviteCodeDisplay } from './InviteCodeDisplay';
import type { Team } from '@/types';

interface TeamCardProps {
  team: Team;
  onDelete?: (id: string) => void;
  onRegenerate?: (id: string) => void;
  basePath?: string;
  readOnly?: boolean;
}

export function TeamCard({ team, onDelete, onRegenerate, basePath = '/gm/teams', readOnly = false }: TeamCardProps) {
  const navigate = useNavigate();

  return (
    <Panel frame className="ao-rise">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div className="ao-h4" style={{ margin: 0 }}>{team.name}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 2 }}>
            GM: {team.gameMaster?.username || 'Unknown'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink-muted)' }}>
          <Rune kind="shield" size={14} />
          <span style={{ fontSize: 13 }}>{team.members?.length || team.memberCount || 0}</span>
        </div>
      </div>

      {!readOnly && team.inviteCode && (
        <div style={{ marginBottom: 12 }}>
          <InviteCodeDisplay code={team.inviteCode} />
        </div>
      )}

      <Divider />

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <Button
          variant="ghost"
          size="sm"
          icon={<Rune kind="eye" size={14} />}
          onClick={() => navigate(`${basePath}/${team.id}`)}
          style={{ flex: 1 }}
        >
          View
        </Button>
        {!readOnly && (
          <>
            {onRegenerate && (
              <Button
                variant="ghost"
                size="sm"
                icon={<Rune kind="sigil-3" size={14} />}
                onClick={() => onRegenerate(team.id)}
                title="Regenerate invite code"
              />
            )}
            {onDelete && (
              <Button
                variant="danger"
                size="sm"
                icon={<Rune kind="x" size={14} />}
                onClick={() => onDelete(team.id)}
              />
            )}
          </>
        )}
      </div>
    </Panel>
  );
}
