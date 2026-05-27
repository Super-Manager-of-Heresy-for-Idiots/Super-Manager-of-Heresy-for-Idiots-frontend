import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TeamCard } from '@/components/teams/TeamCard';
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
        <Button variant="gold" onClick={() => navigate('/gm/teams/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Team
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : !teams || teams.length === 0 ? (
        <div className="text-center py-16">
          <Shield className="h-16 w-16 text-gold/30 mx-auto mb-4" />
          <h2 className="text-xl font-heading font-semibold mb-2">No Teams Yet</h2>
          <p className="text-muted-foreground mb-6">Create your first team and invite players!</p>
          <Button variant="gold" onClick={() => navigate('/gm/teams/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Team
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              onDelete={(id) => setDeleteId(id)}
              onRegenerate={(id) => setRegenerateId(id)}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This team and all its data will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Regenerate confirmation */}
      <AlertDialog open={!!regenerateId} onOpenChange={() => setRegenerateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate Invite Code?</AlertDialogTitle>
            <AlertDialogDescription>
              The current invite code will stop working. A new code will be generated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRegenerate}>Regenerate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
