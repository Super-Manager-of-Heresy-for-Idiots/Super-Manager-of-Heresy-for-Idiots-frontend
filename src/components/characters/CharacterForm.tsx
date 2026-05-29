import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCharacterClasses, useCharacterRaces } from '@/hooks/useAdmin';
import type { CharacterResponse } from '@/types';

const createSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  classId: z.string().min(1, 'Class is required'),
  raceId: z.string().min(1, 'Race is required'),
});

const editSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  raceId: z.string().min(1, 'Race is required'),
});

type CreateFormData = z.infer<typeof createSchema>;
type EditFormData = z.infer<typeof editSchema>;

interface CharacterFormProps {
  character?: CharacterResponse;
  onSubmit: (data: CreateFormData | EditFormData) => void;
  isSubmitting: boolean;
  title: string;
}

export function CharacterForm({ character, onSubmit, isSubmitting, title }: CharacterFormProps) {
  const { data: classes, isLoading: classesLoading } = useCharacterClasses();
  const { data: races, isLoading: racesLoading } = useCharacterRaces();

  const isEditing = !!character;
  const schema = isEditing ? editSchema : createSchema;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: isEditing
      ? {
          name: character.name || '',
          raceId: character.race?.id || '',
        }
      : {
          name: '',
          classId: '',
          raceId: '',
        },
  });

  const selectedRaceId = watch('raceId');
  const selectedClassId = !isEditing ? watch('classId') : undefined;

  return (
    <Card className="max-w-2xl mx-auto border-gold/20">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Character Name</Label>
            <Input id="name" {...register('name')} placeholder="Enter character name" />
            {errors.name && <p className="text-sm text-dnd-red">{errors.name.message}</p>}
          </div>

          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="classId">Class</Label>
              <Select
                value={selectedClassId}
                onValueChange={(value) => setValue('classId', value, { shouldValidate: true })}
                disabled={classesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={classesLoading ? 'Loading...' : 'Select a class'} />
                </SelectTrigger>
                <SelectContent>
                  {classes?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.classId && <p className="text-sm text-dnd-red">{errors.classId.message}</p>}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="raceId">Race</Label>
            <Select
              value={selectedRaceId}
              onValueChange={(value) => setValue('raceId', value, { shouldValidate: true })}
              disabled={racesLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={racesLoading ? 'Loading...' : 'Select a race'} />
              </SelectTrigger>
              <SelectContent>
                {races?.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.raceId && <p className="text-sm text-dnd-red">{errors.raceId.message}</p>}
          </div>

          <Button type="submit" variant="gold" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Update Character' : 'Create Character'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
