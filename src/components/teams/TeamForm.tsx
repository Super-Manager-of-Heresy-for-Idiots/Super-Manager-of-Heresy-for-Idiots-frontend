import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
    <Card className="max-w-lg mx-auto border-gold/20">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Team Name</Label>
            <Input id="name" {...register('name')} placeholder="Enter team name" />
            {errors.name && <p className="text-sm text-dnd-red">{errors.name.message}</p>}
          </div>
          <Button type="submit" variant="gold" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {defaultName ? 'Update Team' : 'Create Team'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
