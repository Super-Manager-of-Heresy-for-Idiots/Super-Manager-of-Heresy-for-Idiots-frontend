import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { useAdminTeams } from '@/hooks/useAdmin';

export default function TeamsListPage() {
  const { data: teams, isLoading, error, refetch } = useAdminTeams();

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
      <h1 className="text-2xl font-heading font-bold mb-6">Teams Management</h1>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-semibold">Team Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Game Master</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Members</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Created</th>
              </tr>
            </thead>
            <tbody>
              {teams?.map((team) => (
                <tr key={team.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium">{team.name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{team.gameMasterUsername || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{team.members?.length || 0}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(team.createdAt)}</td>
                </tr>
              ))}
              {(!teams || teams.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    No teams found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
