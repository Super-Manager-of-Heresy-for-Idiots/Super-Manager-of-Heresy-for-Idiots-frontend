import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Rune, OrdoPanel, OrdoField } from '@/components/ordo';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    <OrdoPanel frame padding={28} style={{ maxWidth: 560, margin: '0 auto' }}>
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <OrdoField label="Soul Name" required>
          <input
            className="ao-input"
            {...register('name')}
            placeholder="Enter the name"
          />
          {errors.name && (
            <span style={{ color: 'var(--ember)', fontSize: 12 }}>{errors.name.message}</span>
          )}
        </OrdoField>

        {!isEditing && (
          <OrdoField label="Class" required>
            <Select
              value={selectedClassId}
              onValueChange={(value) => setValue('classId', value, { shouldValidate: true })}
              disabled={classesLoading}
            >
              <SelectTrigger className="ao-input" style={{ width: '100%' }}>
                <SelectValue placeholder={classesLoading ? 'Loading...' : 'Select a class'} />
              </SelectTrigger>
              <SelectContent>
                {classes?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.classId && (
              <span style={{ color: 'var(--ember)', fontSize: 12 }}>{errors.classId.message}</span>
            )}
          </OrdoField>
        )}

        <OrdoField label="Race" required>
          <Select
            value={selectedRaceId}
            onValueChange={(value) => setValue('raceId', value, { shouldValidate: true })}
            disabled={racesLoading}
          >
            <SelectTrigger className="ao-input" style={{ width: '100%' }}>
              <SelectValue placeholder={racesLoading ? 'Loading...' : 'Select a race'} />
            </SelectTrigger>
            <SelectContent>
              {races?.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.raceId && (
            <span style={{ color: 'var(--ember)', fontSize: 12 }}>{errors.raceId.message}</span>
          )}
        </OrdoField>

        <button
          type="submit"
          className="ao-btn ao-btn--primary ao-btn--block"
          disabled={isSubmitting}
          style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          {isSubmitting ? (
            <span className="ao-breathe"><Rune kind="sigil-1" size={16} /></span>
          ) : (
            <Rune kind="scroll" size={14} />
          )}
          {isEditing ? 'Amend the Record' : 'Inscribe New Soul'}
        </button>
      </form>
    </OrdoPanel>
  );
}
