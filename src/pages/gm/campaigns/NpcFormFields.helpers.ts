import type { CreateNpcRequest, NpcResponse } from '@/types';
import type { NpcFormState } from './NpcFormFields';

export function emptyNpcForm(): NpcFormState {
  return {
    name: '',
    publicDescription: '',
    privateDescription: '',
    isVisibleToPlayers: true,
    sourceType: null,
    raceId: '',
    classId: '',
    level: '',
    abilities: '',
    spellIds: [],
    sourceMonsterId: '',
  };
}

export function npcFormFromResponse(npc: NpcResponse): NpcFormState {
  return {
    name: npc.name ?? '',
    publicDescription: npc.publicDescription ?? '',
    privateDescription: npc.privateDescription ?? '',
    isVisibleToPlayers: npc.isVisibleToPlayers,
    sourceType: npc.sourceType ?? null,
    raceId: npc.race?.id ?? '',
    classId: npc.characterClass?.id ?? '',
    level: npc.level != null ? String(npc.level) : '',
    abilities: npc.abilities ?? '',
    spellIds: npc.spells?.map((sp) => sp.id) ?? [],
    sourceMonsterId: npc.sourceMonster?.id ?? '',
  };
}

export function isNpcFormValid(f: NpcFormState): boolean {
  if (!f.name.trim()) return false;
  if (f.sourceType === 'CLASS_BASED') {
    return !!f.raceId && !!f.classId && f.level.trim() !== '' && Number(f.level) > 0;
  }
  if (f.sourceType === 'MONSTER_BASED') {
    return !!f.sourceMonsterId;
  }
  return true;
}

export function buildNpcPayload(f: NpcFormState): CreateNpcRequest {
  const base: CreateNpcRequest = {
    name: f.name.trim(),
    publicDescription: f.publicDescription.trim() || undefined,
    privateDescription: f.privateDescription.trim() || undefined,
    isVisibleToPlayers: f.isVisibleToPlayers,
    sourceType: f.sourceType,
  };
  if (f.sourceType === 'CLASS_BASED') {
    return {
      ...base,
      raceId: f.raceId || undefined,
      classId: f.classId || undefined,
      level: f.level ? Number(f.level) : undefined,
      abilities: f.abilities.trim() || undefined,
      spellIds: f.spellIds.length ? f.spellIds : undefined,
    };
  }
  if (f.sourceType === 'MONSTER_BASED') {
    return { ...base, sourceMonsterId: f.sourceMonsterId || undefined };
  }
  return base;
}
