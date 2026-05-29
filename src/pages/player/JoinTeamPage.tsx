import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Rune, Sigil, OrdoPanel, OrdoField } from '@/components/ordo';
import { useJoinTeam } from '@/hooks/useTeams';

const joinSchema = z.object({
  inviteCode: z
    .string()
    .min(1, 'Invite code is required')
    .max(20, 'Invalid invite code'),
});

type JoinFormData = z.infer<typeof joinSchema>;

export default function JoinTeamPage() {
  const navigate = useNavigate();
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
    <div style={{ maxWidth: 420, margin: '0 auto', padding: '48px 16px', textAlign: 'center' }}>
      <Sigil size={64} glyph="sigil-3" />

      <p className="ao-codex" style={{ color: 'var(--gold)', letterSpacing: 4, margin: '20px 0 8px' }}>
        &mdash; WRIT OF ADMISSION &mdash;
      </p>

      <OrdoPanel frame padding={28} style={{ marginTop: 24, textAlign: 'left' }}>
        <h2 className="ao-h5" style={{ textAlign: 'center', margin: '0 0 20px' }}>
          Speak the Cipher
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <OrdoField label="Invite Code" required>
            <input
              className="ao-input"
              {...register('inviteCode')}
              placeholder="Enter the cipher"
              style={{ textAlign: 'center', letterSpacing: 4, fontFamily: 'monospace', fontSize: 18 }}
            />
            {errors.inviteCode && (
              <span style={{ color: 'var(--ember)', fontSize: 12 }}>{errors.inviteCode.message}</span>
            )}
          </OrdoField>

          <button
            type="submit"
            className="ao-btn ao-btn--primary ao-btn--block"
            disabled={joinMutation.isPending}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {joinMutation.isPending ? (
              <span className="ao-breathe"><Rune kind="sigil-1" size={16} /></span>
            ) : (
              <Rune kind="scroll" size={14} />
            )}
            Submit Cipher
          </button>
        </form>
      </OrdoPanel>

      <button
        className="ao-btn ao-btn--ghost ao-btn--sm"
        onClick={() => navigate(-1)}
        style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 6 }}
      >
        <Rune kind="arrow-l" size={12} /> Back
      </button>
    </div>
  );
}
