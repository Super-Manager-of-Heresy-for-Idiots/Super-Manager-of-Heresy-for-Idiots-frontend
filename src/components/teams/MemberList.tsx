import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Panel, Button, Rune, Chip } from '@/components/ao';
import { formatDate } from '@/lib/ao-utils';
import type { TeamMember } from '@/types';

interface MemberListProps {
  members: TeamMember[];
  characterBasePath?: string;
}

export function MemberList({ members, characterBasePath = '/gm/characters' }: MemberListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const toggleExpand = (playerId: string) => {
    const newSet = new Set(expandedIds);
    if (newSet.has(playerId)) {
      newSet.delete(playerId);
    } else {
      newSet.add(playerId);
    }
    setExpandedIds(newSet);
  };

  if (members.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--ink-muted)' }}>
        No members yet. Share the invite code to get players!
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {members.map((member) => {
        const isExpanded = expandedIds.has(member.player.id);
        return (
          <Panel key={member.player.id} inset>
            <button
              onClick={() => toggleExpand(member.player.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 0',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--ink)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Rune kind={isExpanded ? 'chev-d' : 'chev-r'} size={14} />
                <span style={{ fontWeight: 600 }}>{member.player.username}</span>
                <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
                  ({member.characters.length} character{member.characters.length !== 1 ? 's' : ''})
                </span>
              </div>
              <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
                Joined {formatDate(member.joinedAt)}
              </span>
            </button>
            {isExpanded && member.characters.length > 0 && (
              <div style={{ paddingLeft: 28, paddingBottom: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {member.characters.map((char) => (
                  <Button
                    key={char.id}
                    variant="ghost"
                    size="sm"
                    icon={<Rune kind="sword" size={14} color="var(--gold)" />}
                    onClick={() => navigate(`${characterBasePath}/${char.id}`)}
                    style={{ justifyContent: 'flex-start', width: '100%' }}
                  >
                    {char.name}
                    <span style={{ color: 'var(--ink-muted)', marginLeft: 8 }}>
                      Lv.{char.level} {char.race?.name} {char.characterClass?.name}
                    </span>
                  </Button>
                ))}
              </div>
            )}
            {isExpanded && member.characters.length === 0 && (
              <div style={{ paddingLeft: 28, paddingBottom: 12, fontSize: 13, color: 'var(--ink-muted)', fontStyle: 'italic' }}>
                No characters created yet
              </div>
            )}
          </Panel>
        );
      })}
    </div>
  );
}
