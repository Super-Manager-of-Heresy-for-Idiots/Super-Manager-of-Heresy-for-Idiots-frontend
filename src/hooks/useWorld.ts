import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import { locationsApi } from '@/api/locations.api';
import { npcsApi } from '@/api/npcs.api';
import { questsApi } from '@/api/quests.api';
import { mapTransitionsApi } from '@/api/mapTransitions.api';
import type {
  ApiError,
  AttachLocationMapRequest,
  BuyItemRequest,
  SellItemRequest,
  AddShopItemRequest,
  CreateMapTransitionRequest,
  UpdateMapTransitionRequest,
  TraverseTransitionRequest,
  PutNpcDialogueRequest,
  UpdateShopSettingsRequest,
} from '@/types';

function errMessage(error: unknown, fallback: string): string {
  const axiosErr = error as AxiosError<ApiError>;
  return axiosErr.response?.data?.message || fallback;
}

// === WORLD_PLAN Этап 1: присутствие ===

export function useLocationOccupants(campaignId: string, locationId?: string) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'locations', locationId, 'occupants'],
    queryFn: async () => {
      const response = await locationsApi.occupants(campaignId, locationId as string);
      return response.data;
    },
    enabled: !!campaignId && !!locationId,
  });
}

export function useEnterLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, locationId, characterId }: { campaignId: string; locationId: string; characterId: string }) =>
      locationsApi.enter(campaignId, locationId, characterId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'locations'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters'] });
      toast.success('Персонаж вошёл в локацию');
    },
    onError: (error) => toast.error(errMessage(error, 'Не удалось войти в локацию')),
  });
}

export function useLeaveLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, locationId, characterId }: { campaignId: string; locationId: string; characterId: string }) =>
      locationsApi.leave(campaignId, locationId, characterId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'locations'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters'] });
      toast.success('Персонаж покинул локацию');
    },
    onError: (error) => toast.error(errMessage(error, 'Не удалось покинуть локацию')),
  });
}

export function useSetNpcLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, npcId, locationId }: { campaignId: string; npcId: string; locationId: string | null }) =>
      npcsApi.setLocation(campaignId, npcId, locationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'npcs'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'locations'] });
      toast.success('Локация NPC обновлена');
    },
    onError: (error) => toast.error(errMessage(error, 'Не удалось обновить локацию NPC')),
  });
}

// === WORLD_PLAN Этап 2-3: взаимодействие с NPC, квесты, торговля ===

export function useNpcInteraction(campaignId: string, npcId?: string, characterId?: string, enabled = true) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'npcs', npcId, 'interact', characterId ?? null],
    queryFn: async () => {
      const response = await npcsApi.interact(campaignId, npcId as string, characterId);
      return response.data;
    },
    enabled: !!campaignId && !!npcId && enabled,
  });
}

export function useAcceptQuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, npcId, questId, characterId }: { campaignId: string; npcId: string; questId: string; characterId: string }) =>
      npcsApi.acceptQuest(campaignId, npcId, questId, characterId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'npcs', variables.npcId, 'interact'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId, 'quests'] });
      toast.success('Квест взят');
    },
    onError: (error) => toast.error(errMessage(error, 'Не удалось взять квест')),
  });
}

export function useCharacterQuestJournal(campaignId: string, characterId?: string) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'characters', characterId, 'quests'],
    queryFn: async () => {
      const response = await questsApi.journal(campaignId, characterId as string);
      return response.data;
    },
    enabled: !!campaignId && !!characterId,
  });
}

export function useAbandonQuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, characterId, questId }: { campaignId: string; characterId: string; questId: string }) =>
      questsApi.abandon(campaignId, characterId, questId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId, 'quests'] });
      toast.success('Квест отклонён');
    },
    onError: (error) => toast.error(errMessage(error, 'Не удалось отклонить квест')),
  });
}

export function useTurnInQuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, npcId, questId, characterId }: { campaignId: string; npcId: string; questId: string; characterId: string }) =>
      npcsApi.turnInQuest(campaignId, npcId, questId, characterId),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'npcs', variables.npcId, 'interact'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId, 'quests'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId, 'inventory'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'quests', 'pending-turn-ins'] });
      toast.success(
        result.data?.status === 'COMPLETED'
          ? 'Квест сдан, награда получена'
          : 'Квест сдан, ожидает подтверждения мастера',
      );
    },
    onError: (error) => toast.error(errMessage(error, 'Не удалось сдать квест')),
  });
}

export function usePendingTurnIns(campaignId: string, enabled = true) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'quests', 'pending-turn-ins'],
    queryFn: async () => {
      const response = await questsApi.pendingTurnIns(campaignId);
      return response.data;
    },
    enabled: !!campaignId && enabled,
  });
}

export function useConfirmTurnIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, characterId, questId }: { campaignId: string; characterId: string; questId: string }) =>
      questsApi.confirmTurnIn(campaignId, characterId, questId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'quests', 'pending-turn-ins'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId, 'quests'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId, 'inventory'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId] });
      toast.success('Сдача подтверждена, награда выдана');
    },
    onError: (error) => toast.error(errMessage(error, 'Не удалось подтвердить сдачу')),
  });
}

export function useNpcShop(campaignId: string, npcId?: string, enabled = true) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'npcs', npcId, 'shop'],
    queryFn: async () => {
      const response = await npcsApi.listShop(campaignId, npcId as string);
      return response.data;
    },
    enabled: !!campaignId && !!npcId && enabled,
  });
}

export function useStockShop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, npcId, data }: { campaignId: string; npcId: string; data: AddShopItemRequest }) =>
      npcsApi.stockShop(campaignId, npcId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'npcs', variables.npcId, 'shop'] });
      toast.success('Товар добавлен');
    },
    onError: (error) => toast.error(errMessage(error, 'Не удалось добавить товар')),
  });
}

export function useRemoveShopItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, npcId, shopItemId }: { campaignId: string; npcId: string; shopItemId: string }) =>
      npcsApi.removeShopItem(campaignId, npcId, shopItemId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'npcs', variables.npcId, 'shop'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'npcs', variables.npcId, 'interact'] });
      toast.success('Товар удалён из лавки');
    },
    onError: (error) => toast.error(errMessage(error, 'Не удалось удалить товар')),
  });
}

export function useBuyItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, npcId, data }: { campaignId: string; npcId: string; data: BuyItemRequest }) =>
      npcsApi.buy(campaignId, npcId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'npcs', variables.npcId, 'shop'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'npcs', variables.npcId, 'interact'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', variables.data.characterId] });
      toast.success('Покупка совершена');
    },
    onError: (error) => toast.error(errMessage(error, 'Не удалось купить предмет')),
  });
}

export function useSellItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, npcId, data }: { campaignId: string; npcId: string; data: SellItemRequest }) =>
      npcsApi.sell(campaignId, npcId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'npcs', variables.npcId, 'shop'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'npcs', variables.npcId, 'interact'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', variables.data.characterId, 'inventory'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', variables.data.characterId] });
      toast.success('Предмет продан');
    },
    onError: (error) => toast.error(errMessage(error, 'Не удалось продать предмет')),
  });
}

// === WORLD_PLAN Этап 5: опциональная экономика торговца ===

export function useShopSettings(campaignId: string, npcId?: string, enabled = true) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'npcs', npcId, 'shop', 'settings'],
    queryFn: async () => {
      const response = await npcsApi.getShopSettings(campaignId, npcId as string);
      return response.data ?? {};
    },
    enabled: !!campaignId && !!npcId && enabled,
  });
}

export function useUpdateShopSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, npcId, data }: { campaignId: string; npcId: string; data: UpdateShopSettingsRequest }) =>
      npcsApi.updateShopSettings(campaignId, npcId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'npcs', variables.npcId, 'shop'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'npcs', variables.npcId, 'interact'] });
      toast.success('Настройки торговца сохранены');
    },
    onError: (error) => toast.error(errMessage(error, 'Не удалось сохранить настройки')),
  });
}

export function useRestockShop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, npcId }: { campaignId: string; npcId: string }) =>
      npcsApi.restockShop(campaignId, npcId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'npcs', variables.npcId, 'shop'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'npcs', variables.npcId, 'interact'] });
      toast.success('Запас лавки восстановлен');
    },
    onError: (error) => toast.error(errMessage(error, 'Не удалось восстановить запас')),
  });
}

// === WORLD_PLAN Этап 4: опциональный диалог NPC ===

export function useNpcDialogue(campaignId: string, npcId?: string, enabled = true) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'npcs', npcId, 'dialogue'],
    queryFn: async () => {
      const response = await npcsApi.getDialogue(campaignId, npcId as string);
      return response.data ?? null;
    },
    enabled: !!campaignId && !!npcId && enabled,
  });
}

export function usePutNpcDialogue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, npcId, data }: { campaignId: string; npcId: string; data: PutNpcDialogueRequest }) =>
      npcsApi.putDialogue(campaignId, npcId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'npcs', variables.npcId, 'dialogue'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'npcs', variables.npcId, 'interact'] });
      toast.success('Диалог сохранён');
    },
    onError: (error) => toast.error(errMessage(error, 'Не удалось сохранить диалог')),
  });
}

export function useDeleteNpcDialogue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, npcId }: { campaignId: string; npcId: string }) =>
      npcsApi.deleteDialogue(campaignId, npcId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'npcs', variables.npcId, 'dialogue'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'npcs', variables.npcId, 'interact'] });
      toast.success('Диалог удалён');
    },
    onError: (error) => toast.error(errMessage(error, 'Не удалось удалить диалог')),
  });
}

// === WORLD_PLAN Этап 4-5: карты локаций и переходы ===

export function useLocationMaps(campaignId: string, locationId?: string) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'locations', locationId, 'maps'],
    queryFn: async () => {
      const response = await locationsApi.listMaps(campaignId, locationId as string);
      return response.data;
    },
    enabled: !!campaignId && !!locationId,
  });
}

export function useAttachLocationMap() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, locationId, data }: { campaignId: string; locationId: string; data: AttachLocationMapRequest }) =>
      locationsApi.attachMap(campaignId, locationId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'locations', variables.locationId, 'maps'] });
      toast.success('Карта привязана к локации');
    },
    onError: (error) => toast.error(errMessage(error, 'Не удалось привязать карту')),
  });
}

export function useDetachLocationMap() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, locationId, linkId }: { campaignId: string; locationId: string; linkId: string }) =>
      locationsApi.detachMap(campaignId, locationId, linkId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'locations', variables.locationId, 'maps'] });
      toast.success('Карта отвязана');
    },
    onError: (error) => toast.error(errMessage(error, 'Не удалось отвязать карту')),
  });
}

export function useMapTransitions(campaignId: string, mapId?: string) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'map-transitions', mapId ?? null],
    queryFn: async () => {
      const response = await mapTransitionsApi.list(campaignId, mapId);
      return response.data;
    },
    enabled: !!campaignId,
  });
}

export function useCreateMapTransition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, data }: { campaignId: string; data: CreateMapTransitionRequest }) =>
      mapTransitionsApi.create(campaignId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'map-transitions'] });
      toast.success('Переход создан');
    },
    onError: (error) => toast.error(errMessage(error, 'Не удалось создать переход')),
  });
}

export function useUpdateMapTransition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, transitionId, data }: { campaignId: string; transitionId: string; data: UpdateMapTransitionRequest }) =>
      mapTransitionsApi.update(campaignId, transitionId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'map-transitions'] });
      toast.success('Переход обновлён');
    },
    onError: (error) => toast.error(errMessage(error, 'Не удалось обновить переход')),
  });
}

export function useDeleteMapTransition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, transitionId }: { campaignId: string; transitionId: string }) =>
      mapTransitionsApi.remove(campaignId, transitionId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'map-transitions'] });
      toast.success('Переход удалён');
    },
    onError: (error) => toast.error(errMessage(error, 'Не удалось удалить переход')),
  });
}

export function useTraverseTransition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, transitionId, data }: { campaignId: string; transitionId: string; data: TraverseTransitionRequest }) =>
      mapTransitionsApi.traverse(campaignId, transitionId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'locations'] });
    },
    onError: (error) => toast.error(errMessage(error, 'Не удалось выполнить переход')),
  });
}
