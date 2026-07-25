import api from './axios';
import type {
  ApiResponse,
  ApplyPartialRestRequest,
  AssignCampActivityRequest,
  CampActivityResponse,
  CampEventResponse,
  CampRestSummaryResponse,
  CampSessionResponse,
  CompleteCampRestRequest,
  CreateCampActivityRequest,
  CreateCampEventRequest,
  CreateCampRequest,
  InterruptCampRequest,
  StartCampRestRequest,
  UpdateCampRequest,
  UpdateCampWatchOrderRequest,
} from '@/types';

/**
 * CAMP: лагерь и привал. Чтение доступно любому участнику кампании, изменяющие
 * действия — только мастеру; сервер проверяет права сам.
 */
export const campApi = {
  /** Текущий незавершённый привал; `data` = null, если лагерь не разбит. */
  current: async (campaignId: string): Promise<ApiResponse<CampSessionResponse | null>> => {
    const response = await api.get<ApiResponse<CampSessionResponse | null>>(`/campaigns/${campaignId}/camp`);
    return response.data;
  },

  history: async (campaignId: string): Promise<ApiResponse<CampSessionResponse[]>> => {
    const response = await api.get<ApiResponse<CampSessionResponse[]>>(`/campaigns/${campaignId}/camp/history`);
    return response.data;
  },

  getById: async (campaignId: string, campId: string): Promise<ApiResponse<CampSessionResponse>> => {
    const response = await api.get<ApiResponse<CampSessionResponse>>(`/campaigns/${campaignId}/camp/${campId}`);
    return response.data;
  },

  create: async (campaignId: string, data: CreateCampRequest): Promise<ApiResponse<CampSessionResponse>> => {
    const response = await api.post<ApiResponse<CampSessionResponse>>(`/campaigns/${campaignId}/camp`, data);
    return response.data;
  },

  update: async (
    campaignId: string,
    campId: string,
    data: UpdateCampRequest,
  ): Promise<ApiResponse<CampSessionResponse>> => {
    const response = await api.put<ApiResponse<CampSessionResponse>>(
      `/campaigns/${campaignId}/camp/${campId}`,
      data,
    );
    return response.data;
  },

  updateWatchOrder: async (
    campaignId: string,
    campId: string,
    data: UpdateCampWatchOrderRequest,
  ): Promise<ApiResponse<CampSessionResponse>> => {
    const response = await api.put<ApiResponse<CampSessionResponse>>(
      `/campaigns/${campaignId}/camp/${campId}/watch-order`,
      data,
    );
    return response.data;
  },

  /** SETTING_UP | INTERRUPTED → ACTIVE. */
  start: async (campaignId: string, campId: string): Promise<ApiResponse<CampSessionResponse>> => {
    const response = await api.post<ApiResponse<CampSessionResponse>>(
      `/campaigns/${campaignId}/camp/${campId}/start`,
    );
    return response.data;
  },

  /** ACTIVE → RESTING. Листы персонажей ещё не меняются. */
  startRest: async (
    campaignId: string,
    campId: string,
    data: StartCampRestRequest,
  ): Promise<ApiResponse<CampRestSummaryResponse>> => {
    const response = await api.post<ApiResponse<CampRestSummaryResponse>>(
      `/campaigns/${campaignId}/camp/${campId}/rest`,
      data,
    );
    return response.data;
  },

  /** Применяет отдых per-character; ошибка одного не откатывает остальных. */
  completeRest: async (
    campaignId: string,
    campId: string,
    data?: CompleteCampRestRequest,
  ): Promise<ApiResponse<CampRestSummaryResponse>> => {
    const response = await api.post<ApiResponse<CampRestSummaryResponse>>(
      `/campaigns/${campaignId}/camp/${campId}/rest/complete`,
      data ?? {},
    );
    return response.data;
  },

  interrupt: async (
    campaignId: string,
    campId: string,
    data?: InterruptCampRequest,
  ): Promise<ApiResponse<CampSessionResponse>> => {
    const response = await api.post<ApiResponse<CampSessionResponse>>(
      `/campaigns/${campaignId}/camp/${campId}/interrupt`,
      data ?? {},
    );
    return response.data;
  },

  /** Частичный отдых прерванному привалу — явное решение мастера. */
  applyPartialRest: async (
    campaignId: string,
    campId: string,
    data?: ApplyPartialRestRequest,
  ): Promise<ApiResponse<CampRestSummaryResponse>> => {
    const response = await api.post<ApiResponse<CampRestSummaryResponse>>(
      `/campaigns/${campaignId}/camp/${campId}/partial-rest`,
      data ?? {},
    );
    return response.data;
  },

  end: async (campaignId: string, campId: string): Promise<ApiResponse<CampSessionResponse>> => {
    const response = await api.post<ApiResponse<CampSessionResponse>>(
      `/campaigns/${campaignId}/camp/${campId}/end`,
    );
    return response.data;
  },

  /** Журнал привала: мастер видит все записи, игрок — только видимые. */
  listEvents: async (campaignId: string, campId: string): Promise<ApiResponse<CampEventResponse[]>> => {
    const response = await api.get<ApiResponse<CampEventResponse[]>>(
      `/campaigns/${campaignId}/camp/${campId}/events`,
    );
    return response.data;
  },

  /** Запись события; засада может создать бой и прервать привал. */
  createEvent: async (
    campaignId: string,
    campId: string,
    data: CreateCampEventRequest,
  ): Promise<ApiResponse<CampSessionResponse>> => {
    const response = await api.post<ApiResponse<CampSessionResponse>>(
      `/campaigns/${campaignId}/camp/${campId}/events`,
      data,
    );
    return response.data;
  },

  triggerEvent: async (
    campaignId: string,
    campId: string,
    eventId: string,
  ): Promise<ApiResponse<CampSessionResponse>> => {
    const response = await api.post<ApiResponse<CampSessionResponse>>(
      `/campaigns/${campaignId}/camp/${campId}/events/${eventId}/trigger`,
    );
    return response.data;
  },

  deleteEvent: async (campaignId: string, campId: string, eventId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(
      `/campaigns/${campaignId}/camp/${campId}/events/${eventId}`,
    );
    return response.data;
  },

  /** Справочник даунтайм-активностей: системные плюс активности кампании. */
  listActivities: async (campaignId: string): Promise<ApiResponse<CampActivityResponse[]>> => {
    const response = await api.get<ApiResponse<CampActivityResponse[]>>(
      `/campaigns/${campaignId}/camp/activities`,
    );
    return response.data;
  },

  createActivity: async (
    campaignId: string,
    data: CreateCampActivityRequest,
  ): Promise<ApiResponse<CampActivityResponse>> => {
    const response = await api.post<ApiResponse<CampActivityResponse>>(
      `/campaigns/${campaignId}/camp/activities`,
      data,
    );
    return response.data;
  },

  deleteActivity: async (campaignId: string, activityId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(
      `/campaigns/${campaignId}/camp/activities/${activityId}`,
    );
    return response.data;
  },

  /** Назначает участнику активность; пустой activityId её снимает. */
  assignActivity: async (
    campaignId: string,
    campId: string,
    characterId: string,
    data: AssignCampActivityRequest,
  ): Promise<ApiResponse<CampSessionResponse>> => {
    const response = await api.put<ApiResponse<CampSessionResponse>>(
      `/campaigns/${campaignId}/camp/${campId}/participants/${characterId}/activity`,
      data,
    );
    return response.data;
  },
};
