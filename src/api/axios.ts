import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/authStore';

type ApiRequestMetadata = {
  requestId: string;
  startedAt: number;
};

type ApiRequestConfig = InternalAxiosRequestConfig & {
  metadata?: ApiRequestMetadata;
};

let requestCounter = 0;

const nextRequestId = () => {
  requestCounter += 1;
  return `api-${Date.now().toString(36)}-${requestCounter.toString(36)}`;
};

const getHeader = (config: InternalAxiosRequestConfig, name: string) => {
  const headers = config.headers as
    | {
        get?: (headerName: string) => unknown;
        [key: string]: unknown;
      }
    | undefined;

  return headers?.get?.(name) ?? headers?.[name] ?? headers?.[name.toLowerCase()];
};

const formatMethod = (method?: string) => (method || 'GET').toUpperCase();

const formatFullUrl = (config: InternalAxiosRequestConfig) => {
  const url = config.url || '';

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const baseURL = config.baseURL || '';
  return `${baseURL.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
};

const getDurationMs = (config?: ApiRequestConfig) => {
  if (!config?.metadata?.startedAt) {
    return undefined;
  }

  return Math.round(performance.now() - config.metadata.startedAt);
};

const summarizeResponseData = (data: unknown) => {
  if (typeof data !== 'string') {
    return data;
  }

  return data.length > 1000 ? `${data.slice(0, 1000)}...` : data;
};

const logRequest = (config: ApiRequestConfig) => {
  const method = formatMethod(config.method);

  console.info(`[api:${config.metadata?.requestId}] -> ${method} ${formatFullUrl(config)}`, {
    baseURL: config.baseURL,
    url: config.url,
    hasAuthorization: Boolean(getHeader(config, 'Authorization')),
    hasBody: config.data !== undefined,
  });
};

const logResponse = (response: AxiosResponse) => {
  const config = response.config as ApiRequestConfig;
  const method = formatMethod(config.method);
  const durationMs = getDurationMs(config);

  console.info(
    `[api:${config.metadata?.requestId}] <- ${response.status} ${method} ${formatFullUrl(config)}${
      durationMs === undefined ? '' : ` (${durationMs} ms)`
    }`,
    {
      status: response.status,
      statusText: response.statusText,
      responseURL: response.request?.responseURL,
    }
  );
};

const logError = (error: AxiosError) => {
  const config = error.config as ApiRequestConfig | undefined;
  const method = formatMethod(config?.method);
  const durationMs = getDurationMs(config);
  const requestUrl = config ? formatFullUrl(config) : 'unknown-url';
  const requestId = config?.metadata?.requestId || 'unknown';

  console.error(
    `[api:${requestId}] xx ${method} ${requestUrl} failed${
      durationMs === undefined ? '' : ` (${durationMs} ms)`
    }`,
    {
      code: error.code,
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseURL: error.request?.responseURL,
      responseData: summarizeResponseData(error.response?.data),
      noResponse: !error.response,
    }
  );
};

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const requestConfig = config as ApiRequestConfig;
  requestConfig.metadata = {
    requestId: nextRequestId(),
    startedAt: performance.now(),
  };

  const token = useAuthStore.getState().token;
  if (token) {
    requestConfig.headers.Authorization = `Bearer ${token}`;
  }

  logRequest(requestConfig);

  return requestConfig;
});

api.interceptors.response.use(
  (response) => {
    logResponse(response);
    return response;
  },
  (error) => {
    const axiosError = error as AxiosError;
    logError(axiosError);

    if (axiosError.response?.status === 401) {
      const url = axiosError.config?.url || '';
      if (!url.includes('/auth/login') && !url.includes('/auth/register')) {
        console.warn('[api] Received 401 from protected endpoint; logging out and redirecting to /login', {
          url,
        });
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
