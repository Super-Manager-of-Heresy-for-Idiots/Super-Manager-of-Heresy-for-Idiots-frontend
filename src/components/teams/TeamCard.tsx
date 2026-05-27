import { useNavigate } from 'react-router-dom';
import { Eye, Pencil, Trash2, Users, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
    <Card className="border-gold/20 hover:border-gold/40 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-heading font-semibold text-lg">{team.name}</h3>
            <p className="text-sm text-muted-foreground">
              GM: {team.gameMaster?.username || 'Unknown'}
            </p>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="text-sm">{team.members?.length || team.memberCount || 0}</span>
          </div>
        </div>

        {!readOnly && team.inviteCode && (
          <div className="mb-4">
            <InviteCodeDisplay code={team.inviteCode} />
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`${basePath}/${team.id}`)}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          {!readOnly && (
            <>
              {onRegenerate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRegenerate(team.id)}
                  title="Regenerate invite code"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(team.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
