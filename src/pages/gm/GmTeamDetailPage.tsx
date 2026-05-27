import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { InviteCodeDisplay } from '@/components/teams/InviteCodeDisplay';
import { MemberList } from '@/components/teams/MemberList';
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
import { useTeam, useRegenerateInvite } from '@/hooks/useTeams';

export default function GmTeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: team, isLoading, error, refetch } = useTeam(id!);
  const regenerateMutation = useRegenerateInvite();
  const [showRegenerate, setShowRegenerate] = useState(false);

  const handleRegenerate = () => {
    regenerateMutation.mutate(id!, {
      onSuccess: () => {
        setShowRegenerate(false);
        refetch();
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground mb-4">Failed to load team</p>
        <Button variant="outline" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate('/gm/teams')} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to Teams
      </Button>

      {/* Team Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">{team.name}</h1>
          <p className="text-muted-foreground mt-1">
            {team.members?.length || 0} member{(team.members?.length || 0) !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Invite Code Section */}
      {team.inviteCode && (
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-2">Invite Code</p>
            <InviteCodeDisplay code={team.inviteCode} />
          </div>
          <Button variant="outline" onClick={() => setShowRegenerate(true)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerate
          </Button>
        </div>
      )}

      <Separator className="bg-gold/20" />

      {/* Members */}
      <div>
        <h2 className="text-xl font-heading font-semibold mb-4">Members</h2>
        <MemberList members={team.members || []} />
      </div>

      {/* Regenerate confirmation */}
      <AlertDialog open={showRegenerate} onOpenChange={setShowRegenerate}>
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
