import { useQuery } from '@tanstack/react-query';
import { loginPageApi } from '@/api/login-page.api';

export function useLoginPageStats() {
  return useQuery({
    queryKey: ['public', 'login-stats'],
    queryFn: async () => {
      const response = await loginPageApi.getStats();
      return response.data;
    },
    staleTime: 60_000,
  });
}

export function useAppReleaseConfig() {
  return useQuery({
    queryKey: ['app-release-config'],
    queryFn: loginPageApi.getReleaseConfig,
    staleTime: 5 * 60_000,
  });
}
