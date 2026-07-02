import axios, {
  type AxiosAdapter,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function isUnsafeMethod(method: string | undefined): boolean {
  return UNSAFE_METHODS.has((method ?? 'GET').toUpperCase());
}

export function installUnsafeRequestCoalescing(instance: AxiosInstance): void {
  const baseAdapter = axios.getAdapter(instance.defaults.adapter) as AxiosAdapter;
  const inFlight = new Map<string, Promise<AxiosResponse>>();

  instance.defaults.adapter = async (config) => {
    if (!isUnsafeMethod(config.method)) {
      return baseAdapter(config);
    }

    const key = mutationKey(config);
    const existing = inFlight.get(key);
    if (existing) return existing;

    const request = baseAdapter(config);
    inFlight.set(key, request);
    try {
      return await request;
    } finally {
      if (inFlight.get(key) === request) {
        inFlight.delete(key);
      }
    }
  };
}

function mutationKey(config: InternalAxiosRequestConfig): string {
  return [
    (config.method ?? 'GET').toUpperCase(),
    config.baseURL ?? '',
    config.url ?? '',
    stableSerialize(config.params),
    stableSerialize(config.data),
  ].join(' ');
}

function stableSerialize(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof FormData !== 'undefined' && value instanceof FormData) return '[FormData]';
  if (typeof URLSearchParams !== 'undefined' && value instanceof URLSearchParams) {
    return value.toString();
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableSerialize).join(',')}]`;
  }
  if (typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${key}:${stableSerialize(item)}`)
      .join(',')}}`;
  }
  return String(value);
}
