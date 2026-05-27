import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useJoinTeam } from '@/hooks/useTeams';

const joinSchema = z.object({
  inviteCode: z
    .string()
    .min(1, 'Invite code is required')
    .max(20, 'Invalid invite code'),
});

type JoinFormData = z.infer<typeof joinSchema>;

export default function JoinTeamPage() {
  const joinMutation = useJoinTeam();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<JoinFormData>({
    resolver: zodResolver(joinSchema),
  });

  const onSubmit = (data: JoinFormData) => {
    joinMutation.mutate(
      { inviteCode: data.inviteCode },
      { onSuccess: () => reset() }
    );
  };

  return (
    <div className="max-w-md mx-auto mt-8">
      <Card className="border-gold/20">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-3">
            <UserPlus className="h-10 w-10 text-gold" />
          </div>
          <CardTitle>Join a Team</CardTitle>
          <CardDescription>Enter the invite code provided by your Game Master</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inviteCode">Invite Code</Label>
              <Input
                id="inviteCode"
                {...register('inviteCode')}
                placeholder="Enter invite code"
                className="text-center text-lg tracking-widest font-mono"
              />
              {errors.inviteCode && (
                <p className="text-sm text-dnd-red">{errors.inviteCode.message}</p>
              )}
            </div>
            <Button type="submit" variant="gold" className="w-full" disabled={joinMutation.isPending}>
              {joinMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Join Team
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
