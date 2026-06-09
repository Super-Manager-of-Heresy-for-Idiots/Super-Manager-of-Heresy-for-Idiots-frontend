import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { getStoredLang } from '@/i18n/lang';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token && token !== 'undefined' && token !== 'null') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Reference data (PHB spells/races/classes/backgrounds/skills/currencies) is
  // localized server-side by a `lang` query param. Attach the active UI language
  // to every reference request so all roles get RU/EN text. `stat-types` has no
  // translations, so it is left untouched.
  if (config.url?.includes('/reference/') && !config.url.includes('/reference/stat-types')) {
    config.params = { ...config.params, lang: getStoredLang() };
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (response.data && response.data.success === false) {
      const error = new Error(response.data.message || 'Request failed');
      (error as any).response = response;
      return Promise.reject(error);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
