import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTeams } from '@/hooks/useTeams';

export default function MyTeamsPage() {
  const { data: teams, isLoading, error, refetch } = useTeams();

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground mb-4">Failed to load teams</p>
        <Button variant="outline" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold">My Teams</h1>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : !teams || teams.length === 0 ? (
        <div className="text-center py-16">
          <Users className="h-16 w-16 text-gold/30 mx-auto mb-4" />
          <h2 className="text-xl font-heading font-semibold mb-2">Not in Any Teams</h2>
          <p className="text-muted-foreground">Ask your Game Master for an invite code to join a team.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <Card key={team.id} className="border-gold/20">
              <CardContent className="p-6">
                <h3 className="font-heading font-semibold text-lg mb-2">{team.name}</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>GM: {team.gameMaster?.username || 'Unknown'}</p>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{team.members?.length || team.memberCount || 0} members</span>
                  </div>
                </div>
                <Badge variant="outline" className="mt-3">Member</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
