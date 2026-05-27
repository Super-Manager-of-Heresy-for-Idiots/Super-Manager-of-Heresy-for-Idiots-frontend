import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, Sword } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
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
      <div className="text-center py-8 text-muted-foreground">
        No members yet. Share the invite code to get players!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {members.map((member) => {
        const isExpanded = expandedIds.has(member.player.id);
        return (
          <div key={member.player.id} className="border border-border rounded-lg">
            <button
              onClick={() => toggleExpand(member.player.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <span className="font-medium">{member.player.username}</span>
                <span className="text-sm text-muted-foreground">
                  ({member.characters.length} character{member.characters.length !== 1 ? 's' : ''})
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                Joined {formatDate(member.joinedAt)}
              </span>
            </button>
            {isExpanded && member.characters.length > 0 && (
              <div className="px-4 pb-4 pl-12 space-y-2">
                {member.characters.map((char) => (
                  <Button
                    key={char.id}
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => navigate(`${characterBasePath}/${char.id}`)}
                  >
                    <Sword className="h-4 w-4 text-gold" />
                    <span>{char.name}</span>
                    <span className="text-muted-foreground">
                      Lv.{char.level} {char.race?.name} {char.characterClass?.name}
                    </span>
                  </Button>
                ))}
              </div>
            )}
            {isExpanded && member.characters.length === 0 && (
              <div className="px-4 pb-4 pl-12 text-sm text-muted-foreground italic">
                No characters created yet
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
