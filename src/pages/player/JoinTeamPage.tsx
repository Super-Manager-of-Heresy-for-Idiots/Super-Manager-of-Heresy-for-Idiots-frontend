import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Panel, PanelHeader, Button, Input, Label, Rune, Sigil } from '@/components/ao';
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
    <div style={{ maxWidth: 420, margin: '32px auto 0' }}>
      <Panel frame padding={28}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <Rune kind="scroll" size={40} color="var(--gold)" style={{ marginBottom: 12 }} />
          <h2 className="ao-h3" style={{ margin: '0 0 4px' }}>Join a Team</h2>
          <p style={{ color: 'var(--ink-muted)', fontSize: 14 }}>
            Enter the invite code provided by your Game Master
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <Label htmlFor="inviteCode">Invite Code</Label>
            <Input
              id="inviteCode"
              {...register('inviteCode')}
              placeholder="Enter invite code"
              style={{ textAlign: 'center', fontSize: 18, letterSpacing: '0.15em', fontFamily: 'var(--font-mono, monospace)' }}
            />
            {errors.inviteCode && (
              <p style={{ fontSize: 12, color: 'var(--ember)', marginTop: 4 }}>{errors.inviteCode.message}</p>
            )}
          </div>
          <Button
            type="submit"
            variant="primary"
            block
            disabled={joinMutation.isPending}
            icon={joinMutation.isPending ? <Rune kind="sigil-3" size={14} className="ao-spin" /> : undefined}
          >
            Join Team
          </Button>
        </form>
      </Panel>
    </div>
  );
}
