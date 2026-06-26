/**
 * React-Query bindings for the map-service REST surface (list/get maps, create map,
 * persist grid calibration, upload a background image, open a session). Mutations
 * toast through the map error i18n keys and invalidate the relevant caches; token
 * MOVEMENT is deliberately absent — it rides the WebSocket, never REST.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useT } from '@/i18n/I18nContext';
import { mapApi } from '../api';
import { mapErrorI18nKey } from '../utils';
import type {
  CreateMapRequest,
  CreateMapSessionRequest,
  CreateTokenFromCombatantRequest,
  UpdateGridConfigRequest,
  UUID,
} from '../types';

export const mapQueryKeys = {
  campaignMaps: (campaignId: UUID) => ['map', 'campaign', campaignId, 'maps'] as const,
  mapDefinition: (mapId: UUID) => ['map', 'definition', mapId] as const,
  battleSession: (battleId: UUID) => ['map', 'battle-session', battleId] as const,
};

/** All maps in a campaign (GM map library). */
export function useCampaignMaps(campaignId: UUID | undefined) {
  return useQuery({
    queryKey: mapQueryKeys.campaignMaps(campaignId ?? ''),
    queryFn: () => mapApi.maps.list(campaignId as UUID),
    enabled: !!campaignId,
  });
}

/**
 * The live map session linked to a battle (by `externalBattleId`), or `null` if none.
 * Lets the battle tab reopen the same map after a long absence without a `?session=`
 * id in the URL — the link is owned by the battle and the session state is persisted.
 */
export function useBattleMapSession(battleId: UUID | undefined) {
  return useQuery({
    queryKey: mapQueryKeys.battleSession(battleId ?? ''),
    queryFn: () => mapApi.sessions.findByBattle(battleId as UUID),
    enabled: !!battleId,
    staleTime: 30_000,
  });
}

/** A single map definition (editor edit mode). */
export function useMapDefinition(mapId: UUID | undefined) {
  return useQuery({
    queryKey: mapQueryKeys.mapDefinition(mapId ?? ''),
    queryFn: () => mapApi.maps.get(mapId as UUID),
    enabled: !!mapId,
  });
}

/** Multipart upload of a background image; returns the created asset. */
export function useUploadMapAsset() {
  const t = useT();
  return useMutation({
    mutationFn: ({ campaignId, file }: { campaignId: UUID; file: File }) =>
      mapApi.assets.upload(campaignId, file),
    onError: (error) => toast.error(t(mapErrorI18nKey(error))),
  });
}

/** Create a map definition (name + optional image + grid). */
export function useCreateMap() {
  const t = useT();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateMapRequest) => mapApi.maps.create(request),
    onSuccess: (map) => {
      queryClient.invalidateQueries({ queryKey: mapQueryKeys.campaignMaps(map.campaignId) });
      toast.success(t('map.toast.mapCreated'));
    },
    onError: (error) => toast.error(t(mapErrorI18nKey(error))),
  });
}

/** Persist grid calibration for an existing map (GM). */
export function useUpdateMapGridConfig() {
  const t = useT();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ mapId, request }: { mapId: UUID; request: UpdateGridConfigRequest }) =>
      mapApi.maps.updateGridConfig(mapId, request),
    onSuccess: (map) => {
      queryClient.invalidateQueries({ queryKey: mapQueryKeys.mapDefinition(map.id) });
      queryClient.invalidateQueries({ queryKey: mapQueryKeys.campaignMaps(map.campaignId) });
      toast.success(t('map.toast.gridSaved'));
    },
    onError: (error) => toast.error(t(mapErrorI18nKey(error))),
  });
}

/** Open a live session for a map; the caller navigates to it on success. */
export function useCreateMapSession() {
  const t = useT();
  return useMutation({
    mutationFn: (request: CreateMapSessionRequest) => mapApi.sessions.create(request),
    onError: (error) => toast.error(t(mapErrorI18nKey(error))),
  });
}

/**
 * Place a battle combatant as a linked token (GM). The new token + `tokenCombatLink`
 * arrive through the committed store (TOKEN_CREATED event → snapshot resync); this
 * mutation deliberately does NOT touch the battle query cache.
 */
export function useCreateTokenFromCombatant(sessionId: UUID | null) {
  const t = useT();
  return useMutation({
    mutationFn: (request: CreateTokenFromCombatantRequest) =>
      mapApi.tokens.createFromCombatant(sessionId as UUID, request),
    onError: (error) => toast.error(t(mapErrorI18nKey(error))),
  });
}
