import api from './axios';
import type {
  ApiResponse,
  NpcResponse,
  CreateNpcRequest,
  UpdateNpcRequest,
  NoteResponse,
  CreateNoteRequest,
  UpdateNoteRequest,
  NpcInteractionResponse,
  QuestResponse,
  CharacterQuestResponse,
  LocationRef,
  ShopItemResponse,
  AddShopItemRequest,
  BuyItemRequest,
  SellItemRequest,
  TradeResultResponse,
  NpcDialogueResponse,
  PutNpcDialogueRequest,
  ShopSettingsResponse,
  UpdateShopSettingsRequest,
} from '@/types';

type NpcNoteResponse = NoteResponse;
type CreateNpcNoteRequest = CreateNoteRequest;

export const npcsApi = {
  list: async (campaignId: string): Promise<ApiResponse<NpcResponse[]>> => {
    const response = await api.get<ApiResponse<NpcResponse[]>>(`/campaigns/${campaignId}/npcs`);
    return response.data;
  },

  getById: async (campaignId: string, npcId: string): Promise<ApiResponse<NpcResponse>> => {
    const response = await api.get<ApiResponse<NpcResponse>>(`/campaigns/${campaignId}/npcs/${npcId}`);
    return response.data;
  },

  create: async (campaignId: string, data: CreateNpcRequest): Promise<ApiResponse<NpcResponse>> => {
    const response = await api.post<ApiResponse<NpcResponse>>(`/campaigns/${campaignId}/npcs`, data);
    return response.data;
  },

  update: async (campaignId: string, npcId: string, data: UpdateNpcRequest): Promise<ApiResponse<NpcResponse>> => {
    const response = await api.put<ApiResponse<NpcResponse>>(`/campaigns/${campaignId}/npcs/${npcId}`, data);
    return response.data;
  },

  delete: async (campaignId: string, npcId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/campaigns/${campaignId}/npcs/${npcId}`);
    return response.data;
  },

  // Notes
  addNote: async (campaignId: string, npcId: string, data: CreateNpcNoteRequest): Promise<ApiResponse<NpcNoteResponse>> => {
    const response = await api.post<ApiResponse<NpcNoteResponse>>(`/campaigns/${campaignId}/npcs/${npcId}/notes`, data);
    return response.data;
  },

  updateNote: async (campaignId: string, npcId: string, noteId: string, data: UpdateNoteRequest): Promise<ApiResponse<NpcNoteResponse>> => {
    const response = await api.put<ApiResponse<NpcNoteResponse>>(`/campaigns/${campaignId}/npcs/${npcId}/notes/${noteId}`, data);
    return response.data;
  },

  deleteNote: async (campaignId: string, npcId: string, noteId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/campaigns/${campaignId}/npcs/${npcId}/notes/${noteId}`);
    return response.data;
  },

  toggleVisibility: async (campaignId: string, npcId: string): Promise<ApiResponse<NpcResponse>> => {
    const response = await api.post<ApiResponse<NpcResponse>>(`/campaigns/${campaignId}/npcs/${npcId}/toggle-visibility`);
    return response.data;
  },

  // WORLD_PLAN Этап 1: размещение NPC в локации (ГМ).
  setLocation: async (campaignId: string, npcId: string, locationId: string | null): Promise<ApiResponse<LocationRef | null>> => {
    const response = await api.put<ApiResponse<LocationRef | null>>(`/campaigns/${campaignId}/npcs/${npcId}/location`, { locationId });
    return response.data;
  },

  // WORLD_PLAN Этап 3: агрегированное взаимодействие (осмотр + квесты + витрина).
  interact: async (campaignId: string, npcId: string, characterId?: string): Promise<ApiResponse<NpcInteractionResponse>> => {
    const response = await api.get<ApiResponse<NpcInteractionResponse>>(
      `/campaigns/${campaignId}/npcs/${npcId}/interact`,
      { params: characterId ? { characterId } : undefined },
    );
    return response.data;
  },

  // WORLD_PLAN Этап 2: квесты у NPC.
  listQuests: async (campaignId: string, npcId: string, characterId?: string): Promise<ApiResponse<QuestResponse[]>> => {
    const response = await api.get<ApiResponse<QuestResponse[]>>(
      `/campaigns/${campaignId}/npcs/${npcId}/quests`,
      { params: characterId ? { characterId } : undefined },
    );
    return response.data;
  },

  acceptQuest: async (campaignId: string, npcId: string, questId: string, characterId: string): Promise<ApiResponse<CharacterQuestResponse>> => {
    const response = await api.post<ApiResponse<CharacterQuestResponse>>(
      `/campaigns/${campaignId}/npcs/${npcId}/quests/${questId}/accept`,
      { characterId },
    );
    return response.data;
  },

  // WORLD_PLAN Этап 2: сдача квеста квестодателю.
  turnInQuest: async (campaignId: string, npcId: string, questId: string, characterId: string): Promise<ApiResponse<CharacterQuestResponse>> => {
    const response = await api.post<ApiResponse<CharacterQuestResponse>>(
      `/campaigns/${campaignId}/npcs/${npcId}/quests/${questId}/turn-in`,
      { characterId },
    );
    return response.data;
  },

  // WORLD_PLAN Этап 3: торговля.
  listShop: async (campaignId: string, npcId: string): Promise<ApiResponse<ShopItemResponse[]>> => {
    const response = await api.get<ApiResponse<ShopItemResponse[]>>(`/campaigns/${campaignId}/npcs/${npcId}/shop`);
    return response.data;
  },

  stockShop: async (campaignId: string, npcId: string, data: AddShopItemRequest): Promise<ApiResponse<ShopItemResponse>> => {
    const response = await api.post<ApiResponse<ShopItemResponse>>(`/campaigns/${campaignId}/npcs/${npcId}/shop/stock`, data);
    return response.data;
  },

  removeShopItem: async (campaignId: string, npcId: string, shopItemId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/campaigns/${campaignId}/npcs/${npcId}/shop/stock/${shopItemId}`);
    return response.data;
  },

  // WORLD_PLAN Этап 5: рестокинг и настройки экономики торговца.
  restockShop: async (campaignId: string, npcId: string): Promise<ApiResponse<ShopItemResponse[]>> => {
    const response = await api.post<ApiResponse<ShopItemResponse[]>>(`/campaigns/${campaignId}/npcs/${npcId}/shop/restock`);
    return response.data;
  },

  getShopSettings: async (campaignId: string, npcId: string): Promise<ApiResponse<ShopSettingsResponse>> => {
    const response = await api.get<ApiResponse<ShopSettingsResponse>>(`/campaigns/${campaignId}/npcs/${npcId}/shop/settings`);
    return response.data;
  },

  updateShopSettings: async (campaignId: string, npcId: string, data: UpdateShopSettingsRequest): Promise<ApiResponse<ShopSettingsResponse>> => {
    const response = await api.put<ApiResponse<ShopSettingsResponse>>(`/campaigns/${campaignId}/npcs/${npcId}/shop/settings`, data);
    return response.data;
  },

  buy: async (campaignId: string, npcId: string, data: BuyItemRequest): Promise<ApiResponse<TradeResultResponse>> => {
    const response = await api.post<ApiResponse<TradeResultResponse>>(`/campaigns/${campaignId}/npcs/${npcId}/shop/buy`, data);
    return response.data;
  },

  sell: async (campaignId: string, npcId: string, data: SellItemRequest): Promise<ApiResponse<TradeResultResponse>> => {
    const response = await api.post<ApiResponse<TradeResultResponse>>(`/campaigns/${campaignId}/npcs/${npcId}/shop/sell`, data);
    return response.data;
  },

  // WORLD_PLAN Этап 4: опциональный диалог NPC.
  getDialogue: async (campaignId: string, npcId: string): Promise<ApiResponse<NpcDialogueResponse | null>> => {
    const response = await api.get<ApiResponse<NpcDialogueResponse | null>>(`/campaigns/${campaignId}/npcs/${npcId}/dialogue`);
    return response.data;
  },

  putDialogue: async (campaignId: string, npcId: string, data: PutNpcDialogueRequest): Promise<ApiResponse<NpcDialogueResponse | null>> => {
    const response = await api.put<ApiResponse<NpcDialogueResponse | null>>(`/campaigns/${campaignId}/npcs/${npcId}/dialogue`, data);
    return response.data;
  },

  deleteDialogue: async (campaignId: string, npcId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/campaigns/${campaignId}/npcs/${npcId}/dialogue`);
    return response.data;
  },
};
