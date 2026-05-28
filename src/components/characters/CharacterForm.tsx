import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Panel, PanelHeader, Button, Input, Label, Select, Rune } from '@/components/ao';
import { useCharacterClasses, useCharacterRaces } from '@/hooks/useAdmin';
import type { Character } from '@/types';

const characterSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  level: z.coerce.number().int().min(1, 'Level must be at least 1').max(20, 'Level must be at most 20'),
  classId: z.string().min(1, 'Class is required'),
  raceId: z.string().min(1, 'Race is required'),
});

type CharacterFormData = z.infer<typeof characterSchema>;

interface CharacterFormProps {
  character?: Character;
  onSubmit: (data: CharacterFormData) => void;
  isSubmitting: boolean;
  title: string;
}

export function CharacterForm({ character, onSubmit, isSubmitting, title }: CharacterFormProps) {
  const { data: classes, isLoading: classesLoading } = useCharacterClasses();
  const { data: races, isLoading: racesLoading } = useCharacterRaces();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CharacterFormData>({
    resolver: zodResolver(characterSchema),
    defaultValues: {
      name: character?.name || '',
      level: character?.level || 1,
      classId: character?.characterClass?.id || '',
      raceId: character?.race?.id || '',
    },
  });

  const selectedClassId = watch('classId');
  const selectedRaceId = watch('raceId');

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <Panel frame padding={24}>
        <PanelHeader
          title={title}
          glyph={character ? 'scroll' : 'sword'}
          tone="gold"
        />

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 20 }}>
          <div>
            <Label htmlFor="name">Character Name</Label>
            <Input id="name" {...register('name')} placeholder="Enter character name" />
            {errors.name && <p style={{ fontSize: 12, color: 'var(--ember)', marginTop: 4 }}>{errors.name.message}</p>}
          </div>

          <div>
            <Label htmlFor="classId">Class</Label>
            <Select
              id="classId"
              value={selectedClassId}
              onChange={(e) => setValue('classId', e.target.value, { shouldValidate: true })}
              disabled={classesLoading}
            >
              <option value="">{classesLoading ? 'Loading...' : 'Select a class'}</option>
              {classes?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
            {errors.classId && <p style={{ fontSize: 12, color: 'var(--ember)', marginTop: 4 }}>{errors.classId.message}</p>}
          </div>

          <div>
            <Label htmlFor="raceId">Race</Label>
            <Select
              id="raceId"
              value={selectedRaceId}
              onChange={(e) => setValue('raceId', e.target.value, { shouldValidate: true })}
              disabled={racesLoading}
            >
              <option value="">{racesLoading ? 'Loading...' : 'Select a race'}</option>
              {races?.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </Select>
            {errors.raceId && <p style={{ fontSize: 12, color: 'var(--ember)', marginTop: 4 }}>{errors.raceId.message}</p>}
          </div>

          <div>
            <Label htmlFor="level">Level</Label>
            <Input id="level" type="number" min={1} max={20} {...register('level')} />
            {errors.level && <p style={{ fontSize: 12, color: 'var(--ember)', marginTop: 4 }}>{errors.level.message}</p>}
          </div>

          <Button
            type="submit"
            variant="primary"
            block
            disabled={isSubmitting}
            icon={isSubmitting ? <Rune kind="sigil-3" size={14} className="ao-spin" /> : undefined}
          >
            {character ? 'Update Character' : 'Create Character'}
          </Button>
        </form>
      </Panel>
    </div>
  );
}
