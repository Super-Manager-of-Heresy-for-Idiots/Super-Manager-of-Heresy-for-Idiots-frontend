import { useQuery } from '@tanstack/react-query';
import { useStatTypes, useSkills, useFeats } from '@/hooks/useAdmin';
import { referenceApi } from '@/api/reference.api';

export interface RefOption {
  id: string;
  name: string;
  /** optional secondary text (spell level, feat prereq, …) */
  hint?: string;
}

export interface BuilderRefData {
  abilities: RefOption[];
  skills: RefOption[];
  feats: RefOption[];
  spells: RefOption[];
  loading: boolean;
}

/** Known modifier keys suggested for NUMERIC_MODIFIER (free text still allowed). */
export const MODIFIER_KEYS = ['speed', 'ac', 'hp_max', 'initiative', 'spell_save_dc', 'attack'] as const;

/** Reference lookups for the class builder dropdowns. */
export function useBuilderRefData(): BuilderRefData {
  const statTypes = useStatTypes();
  const skills = useSkills();
  const feats = useFeats();
  const spells = useQuery({
    queryKey: ['reference', 'spells', 'builder'],
    queryFn: async () => (await referenceApi.getSpells()).data ?? [],
  });

  return {
    abilities: (statTypes.data ?? []).map((s) => ({ id: s.id, name: s.name })),
    skills: (skills.data ?? []).map((s) => ({ id: s.id, name: s.name })),
    feats: (feats.data ?? []).map((f) => ({ id: f.id, name: f.name })),
    spells: (spells.data ?? []).map((s) => ({ id: s.id, name: s.name, hint: `lvl ${s.level}` })),
    loading: statTypes.isLoading || skills.isLoading || feats.isLoading || spells.isLoading,
  };
}
