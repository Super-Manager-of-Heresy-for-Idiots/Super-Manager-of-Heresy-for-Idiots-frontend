import { useQuery } from '@tanstack/react-query';
import { capabilityProfileApi, type CapabilityProfile } from '@/api/capabilityProfile.api';

/**
 * Fetches a character's class-aware capability profile. Drives which folio/level-up/battle panels
 * render (spells tab, spellbook, resources, actions, forms, companions, ...). Safe to call for any
 * character: the spellcasting block is always populated, feature-rules flags default to false when
 * the runtime is off.
 */
export function useCapabilityProfile(characterId: string | undefined) {
  return useQuery<CapabilityProfile>({
    queryKey: ['capability-profile', characterId],
    queryFn: async () => (await capabilityProfileApi.get(characterId as string)).data as CapabilityProfile,
    enabled: !!characterId,
    staleTime: 5 * 60 * 1000,
  });
}
