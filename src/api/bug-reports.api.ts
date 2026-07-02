import api from './axios';
import type { ApiResponse } from '@/types';
import type { CreateBugReportPayload } from '@/lib/bugReport';

export interface BugReportResponse {
  id: string;
  createdAt: string;
}

export const bugReportsApi = {
  create: async (payload: CreateBugReportPayload): Promise<ApiResponse<BugReportResponse>> => {
    const response = await api.post<ApiResponse<BugReportResponse>>('/bug-reports', payload);
    return response.data;
  },
};
