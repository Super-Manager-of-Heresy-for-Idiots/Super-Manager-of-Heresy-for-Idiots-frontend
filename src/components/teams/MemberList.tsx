import { Users } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { TeamMemberResponse } from '@/types';

interface MemberListProps {
  members: TeamMemberResponse[];
}

export function MemberList({ members }: MemberListProps) {
  if (members.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No members yet. Share the invite code to get players!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {members.map((member) => (
        <div key={member.playerId} className="border border-border rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gold/20 flex items-center justify-center">
              <Users className="h-4 w-4 text-gold" />
            </div>
            <span className="font-medium">{member.playerUsername}</span>
          </div>
          <span className="text-sm text-muted-foreground">
            Joined {formatDate(member.joinedAt)}
          </span>
        </div>
      ))}
    </div>
  );
}
