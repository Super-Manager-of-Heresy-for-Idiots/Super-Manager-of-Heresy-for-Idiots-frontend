import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Panel, PanelHeader, Button, Input, Label, Rune } from '@/components/ao';

const teamSchema = z.object({
  name: z.string().min(1, 'Team name is required').max(80, 'Team name must be 80 characters or less'),
});

type TeamFormData = z.infer<typeof teamSchema>;

interface TeamFormProps {
  defaultName?: string;
  onSubmit: (data: TeamFormData) => void;
  isSubmitting: boolean;
  title: string;
}

export function TeamForm({ defaultName, onSubmit, isSubmitting, title }: TeamFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
    defaultValues: { name: defaultName || '' },
  });

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <Panel frame padding={24}>
        <PanelHeader title={title} glyph="helm" tone="gold" />

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 20 }}>
          <div>
            <Label htmlFor="name">Team Name</Label>
            <Input id="name" {...register('name')} placeholder="Enter team name" />
            {errors.name && <p style={{ fontSize: 12, color: 'var(--ember)', marginTop: 4 }}>{errors.name.message}</p>}
          </div>
          <Button
            type="submit"
            variant="primary"
            block
            disabled={isSubmitting}
            icon={isSubmitting ? <Rune kind="sigil-3" size={14} className="ao-spin" /> : undefined}
          >
            {defaultName ? 'Update Team' : 'Create Team'}
          </Button>
        </form>
      </Panel>
    </div>
  );
}
