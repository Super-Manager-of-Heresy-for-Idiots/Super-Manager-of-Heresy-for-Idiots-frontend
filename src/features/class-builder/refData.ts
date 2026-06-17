import { useQuery } from '@tanstack/react-query';
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
  modifierKeys: string[];
  loading: boolean;
}

/** Fallback modifier-key suggestions when the reference endpoint is unavailable. */
export const MODIFIER_KEYS = ['speed', 'ac', 'hp_max', 'initiative', 'spell_save_dc', 'attack'] as const;

/**
 * Reference lookups for the class builder dropdowns, sourced from the final
 * content-model reference endpoints (class-authoring contract §2).
 */
export function useBuilderRefData(): BuilderRefData {
  const abilities = useQuery({
    queryKey: ['reference', 'abilities'],
    queryFn: async () => (await referenceApi.getAbilities()).data ?? [],
  });
  const skills = useQuery({
    queryKey: ['reference', 'skills'],
    queryFn: async () => (await referenceApi.getSkills()).data ?? [],
  });
  const feats = useQuery({
    queryKey: ['reference', 'feats'],
    queryFn: async () => (await referenceApi.getFeatOptions()).data ?? [],
  });
  const spells = useQuery({
    queryKey: ['reference', 'spells', 'builder'],
    queryFn: async () => (await referenceApi.getSpells()).data ?? [],
  });
  const modifierKeys = useQuery({
    queryKey: ['reference', 'modifier-keys'],
    queryFn: async () => (await referenceApi.getModifierKeys()).data ?? [],
  });

  const modKeys = (modifierKeys.data ?? []).map((m) => m.key);
  return {
    abilities: (abilities.data ?? []).map((a) => ({ id: a.id, name: a.name })),
    skills: (skills.data ?? []).map((sk) => ({ id: sk.id, name: sk.name })),
    feats: (feats.data ?? []).map((f) => ({ id: f.id, name: f.name, hint: f.prerequisiteText })),
    spells: (spells.data ?? []).map((sp) => ({ id: sp.id, name: sp.name, hint: `lvl ${sp.level}` })),
    modifierKeys: modKeys.length ? modKeys : [...MODIFIER_KEYS],
    loading: abilities.isLoading || skills.isLoading || feats.isLoading || spells.isLoading,
  };
}
