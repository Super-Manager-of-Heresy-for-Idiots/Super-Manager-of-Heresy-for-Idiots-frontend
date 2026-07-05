import api from './axios';
import type { ApiResponse } from '@/types';

/** Admin editor for class resource templates (custom_resource_types) — the single player-facing resource system. */
export interface ResourceTypeAdmin {
  id: string;
  name: string;
  description?: string | null;
  maxValue?: number | null;
  maxFormula?: string | null;
  maxFormulaStatus?: string | null;
  maxFormulaMessage?: string | null;
  classBoundId?: string | null;
  className?: string | null;
  featBoundId?: string | null;
  featName?: string | null;
  resetOn?: string | null;
  shortRestRecovery?: string | null;
  shortRestFormula?: string | null;
  longRestRecovery?: string | null;
  longRestFormula?: string | null;
  homebrew: boolean;
}

export interface ResourceTypeRequest {
  name: string;
  description?: string | null;
  maxValue?: number | null;
  maxFormula?: string | null;
  classBoundId?: string | null;
  featBoundId?: string | null;
  resetOn?: string | null;
  shortRestRecovery?: string | null;
  shortRestFormula?: string | null;
  longRestRecovery?: string | null;
  longRestFormula?: string | null;
}

export const resourceTypesApi = {
  list: async (): Promise<ApiResponse<ResourceTypeAdmin[]>> =>
    (await api.get<ApiResponse<ResourceTypeAdmin[]>>('/admin/resource-types')).data,

  create: async (data: ResourceTypeRequest): Promise<ApiResponse<ResourceTypeAdmin>> =>
    (await api.post<ApiResponse<ResourceTypeAdmin>>('/admin/resource-types', data)).data,

  update: async (id: string, data: ResourceTypeRequest): Promise<ApiResponse<ResourceTypeAdmin>> =>
    (await api.put<ApiResponse<ResourceTypeAdmin>>(`/admin/resource-types/${id}`, data)).data,

  remove: async (id: string): Promise<ApiResponse<void>> =>
    (await api.delete<ApiResponse<void>>(`/admin/resource-types/${id}`)).data,
};
