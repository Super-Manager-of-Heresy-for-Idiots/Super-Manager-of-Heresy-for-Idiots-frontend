import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import type { ErrorInfo } from 'react';

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export type BugReportSource =
  | 'console-error'
  | 'window-error'
  | 'unhandled-rejection'
  | 'react-error-boundary'
  | 'api-error';

export interface BugReportSignal {
  source: BugReportSource;
  severity: 'error';
  title: string;
  errorName?: string;
  errorMessage?: string;
  errorStack?: string;
  timestamp: string;
}

export interface CreateBugReportPayload {
  userDescription?: string;
  severity: 'error';
  source: BugReportSource;
  errorName?: string;
  errorMessage?: string;
  errorStack?: string;
  url: string;
  route: string;
  appVersion?: string;
  clientTimestamp: string;
  userAgent: string;
  consoleLogs: JsonValue[];
  networkLogs: JsonValue[];
  serviceLogs: JsonValue[];
  device: JsonValue;
  performance: JsonValue;
  breadcrumbs: JsonValue[];
  extra: JsonValue;
}

type Listener = (signal: BugReportSignal | null) => void;

const MAX_CONSOLE_LOGS = 120;
const MAX_NETWORK_LOGS = 100;
const MAX_BREADCRUMBS = 160;
const MAX_STRING = 4000;
const HEADER_WHITELIST = new Set([
  'accept',
  'content-type',
  'x-requested-with',
  'x-request-id',
  'x-correlation-id',
  'x-xsrf-token',
  'authorization',
]);

const consoleLogs: JsonValue[] = [];
const networkLogs: JsonValue[] = [];
const breadcrumbs: JsonValue[] = [];
let latestSignal: BugReportSignal | null = null;
let installed = false;
const listeners = new Set<Listener>();

const SENSITIVE_KEY = /(authorization|cookie|token|password|secret|x-xsrf-token|jwt)/i;

export function installBugReportCollectors() {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  patchConsole();
  patchHistory();

  window.addEventListener('error', (event) => {
    const error = event.error instanceof Error ? event.error : undefined;
    const signal: BugReportSignal = {
      source: 'window-error',
      severity: 'error',
      title: event.message || 'Frontend error',
      errorName: error?.name,
      errorMessage: error?.message || event.message,
      errorStack: error?.stack,
      timestamp: new Date().toISOString(),
    };
    pushBreadcrumb('window.error', {
      message: event.message,
      filename: event.filename,
      line: event.lineno,
      column: event.colno,
    });
    notify(signal);
  });

  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error ? event.reason : undefined;
    const message = error?.message || stringify(event.reason);
    const signal: BugReportSignal = {
      source: 'unhandled-rejection',
      severity: 'error',
      title: message || 'Unhandled promise rejection',
      errorName: error?.name,
      errorMessage: message,
      errorStack: error?.stack,
      timestamp: new Date().toISOString(),
    };
    pushBreadcrumb('promise.unhandled_rejection', { message });
    notify(signal);
  });

  pushBreadcrumb('app.collectors_installed', { route: window.location.pathname });
}

export function subscribeBugReportSignal(listener: Listener) {
  listeners.add(listener);
  listener(latestSignal);
  return () => {
    listeners.delete(listener);
  };
}

export function clearBugReportSignal() {
  latestSignal = null;
  listeners.forEach((listener) => listener(null));
}

export function reportReactError(error: Error, errorInfo: ErrorInfo) {
  pushBreadcrumb('react.error_boundary', {
    message: error.message,
    componentStack: errorInfo.componentStack,
  });
  notify({
    source: 'react-error-boundary',
    severity: 'error',
    title: error.message || 'React render error',
    errorName: error.name,
    errorMessage: error.message,
    errorStack: [error.stack, errorInfo.componentStack].filter(Boolean).join('\n\nComponent stack:\n'),
    timestamp: new Date().toISOString(),
  });
}

export function recordNetworkSuccess(response: AxiosResponse) {
  const config = response.config as InternalAxiosRequestConfig & { __bugReportStartedAt?: number };
  pushNetworkLog({
    timestamp: new Date().toISOString(),
    kind: 'response',
    method: config.method?.toUpperCase(),
    url: config.url,
    status: response.status,
    durationMs: durationFrom(config.__bugReportStartedAt),
    correlationId: correlationIdFrom(response.headers),
    requestHeaders: headersSnapshot(config.headers),
    responseHeaders: headersSnapshot(response.headers),
    responseBody: responseBodySnapshot(response.data),
  });
}

export function recordNetworkFailure(error: AxiosError) {
  const config = error.config as (InternalAxiosRequestConfig & { __bugReportStartedAt?: number }) | undefined;
  const status = error.response?.status;
  const url = config?.url || error.request?.responseURL;
  const entry = {
    timestamp: new Date().toISOString(),
    kind: 'error',
    method: config?.method?.toUpperCase(),
    url,
    status,
    durationMs: durationFrom(config?.__bugReportStartedAt),
    message: error.message,
    responseMessage: responseMessage(error.response?.data),
    correlationId: correlationIdFrom(error.response?.headers),
    requestHeaders: headersSnapshot(config?.headers),
    responseHeaders: headersSnapshot(error.response?.headers),
    responseBody: responseBodySnapshot(error.response?.data),
  };
  pushNetworkLog(entry);

  if (!url?.includes('/bug-reports')) {
    notify({
      source: 'api-error',
      severity: 'error',
      title: entry.responseMessage || error.message || 'API request failed',
      errorName: error.name,
      errorMessage: entry.responseMessage || error.message,
      errorStack: error.stack,
      timestamp: entry.timestamp,
    });
  }
}

export function markNetworkRequestStarted(config: InternalAxiosRequestConfig) {
  (config as InternalAxiosRequestConfig & { __bugReportStartedAt?: number }).__bugReportStartedAt =
    performance.now();
}

export function buildBugReportPayload(
  userDescription: string,
  fallbackSignal?: BugReportSignal | null,
  user?: { id?: string; username?: string; role?: string } | null
): CreateBugReportPayload {
  const signal = fallbackSignal || latestSignal || {
    source: 'console-error',
    severity: 'error',
    title: 'Manual bug report',
    timestamp: new Date().toISOString(),
  } satisfies BugReportSignal;

  return {
    userDescription: userDescription.trim() || undefined,
    severity: signal.severity,
    source: signal.source,
    errorName: signal.errorName,
    errorMessage: signal.errorMessage || signal.title,
    errorStack: signal.errorStack,
    url: window.location.href,
    route: `${window.location.pathname}${window.location.search}${window.location.hash}`,
    appVersion: import.meta.env.VITE_APP_VERSION || import.meta.env.MODE,
    clientTimestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    consoleLogs: consoleLogs.slice(-MAX_CONSOLE_LOGS),
    networkLogs: networkLogs.slice(-MAX_NETWORK_LOGS),
    serviceLogs: serviceLogs(),
    device: deviceSnapshot(),
    performance: performanceSnapshot(),
    breadcrumbs: breadcrumbs.slice(-MAX_BREADCRUMBS),
    extra: {
      activeUser: user ? sanitize(user) : null,
      language: navigator.language,
      languages: Array.from(navigator.languages || []),
      online: navigator.onLine,
    },
  };
}

function patchConsole() {
  (['debug', 'info', 'log', 'warn', 'error'] as const).forEach((level) => {
    const original = console[level].bind(console);
    console[level] = (...args: unknown[]) => {
      pushConsoleLog(level, args);
      if (level === 'error') {
        const firstError = args.find((arg): arg is Error => arg instanceof Error);
        const message = firstError?.message || args.map(stringify).join(' ');
        notify({
          source: 'console-error',
          severity: 'error',
          title: message || 'Console error',
          errorName: firstError?.name,
          errorMessage: message,
          errorStack: firstError?.stack,
          timestamp: new Date().toISOString(),
        });
      }
      original(...args);
    };
  });
}

function patchHistory() {
  const wrap = (method: 'pushState' | 'replaceState') => {
    const original = history[method];
    history[method] = function patchedHistoryMethod(...args) {
      const result = original.apply(this, args);
      pushBreadcrumb(`history.${method}`, { route: window.location.href });
      return result;
    };
  };
  wrap('pushState');
  wrap('replaceState');
  window.addEventListener('popstate', () => pushBreadcrumb('history.popstate', { route: window.location.href }));
}

function notify(signal: BugReportSignal) {
  latestSignal = signal;
  listeners.forEach((listener) => listener(signal));
}

function pushConsoleLog(level: string, args: unknown[]) {
  ringPush(consoleLogs, {
    timestamp: new Date().toISOString(),
    level,
    message: args.map(stringify).join(' '),
    args: args.map((arg) => sanitize(arg)),
  }, MAX_CONSOLE_LOGS);
}

function pushNetworkLog(entry: unknown) {
  ringPush(networkLogs, sanitize(entry), MAX_NETWORK_LOGS);
  pushBreadcrumb('network', entry);
}

function pushBreadcrumb(type: string, data: unknown) {
  ringPush(breadcrumbs, {
    timestamp: new Date().toISOString(),
    type,
    data: sanitize(data),
  }, MAX_BREADCRUMBS);
}

function ringPush(target: JsonValue[], value: JsonValue, limit: number) {
  target.push(value);
  if (target.length > limit) {
    target.splice(0, target.length - limit);
  }
}

function serviceLogs(): JsonValue[] {
  return consoleLogs.filter((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return false;
    const message = String(entry.message || '');
    return /\[(WS|MapWS|auth|service|worker)\]/i.test(message);
  });
}

function deviceSnapshot(): JsonValue {
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { effectiveType?: string; downlink?: number; rtt?: number; saveData?: boolean };
  };
  return {
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
    },
    screen: {
      width: window.screen.width,
      height: window.screen.height,
      colorDepth: window.screen.colorDepth,
    },
    platform: navigator.platform,
    hardwareConcurrency: navigator.hardwareConcurrency ?? null,
    deviceMemory: nav.deviceMemory ?? null,
    connection: nav.connection
      ? {
          effectiveType: nav.connection.effectiveType ?? null,
          downlink: nav.connection.downlink ?? null,
          rtt: nav.connection.rtt ?? null,
          saveData: nav.connection.saveData ?? null,
        }
      : null,
  };
}

function performanceSnapshot(): JsonValue {
  const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  const resources = performance
    .getEntriesByType('resource')
    .slice(-40)
    .map((entry) => ({
      name: redactUrl(entry.name),
      initiatorType: (entry as PerformanceResourceTiming).initiatorType,
      duration: Math.round(entry.duration),
      startTime: Math.round(entry.startTime),
    }));
  return {
    timeOrigin: performance.timeOrigin,
    navigation: navEntry
      ? {
          type: navEntry.type,
          duration: Math.round(navEntry.duration),
          domContentLoaded: Math.round(navEntry.domContentLoadedEventEnd),
          loadEventEnd: Math.round(navEntry.loadEventEnd),
        }
      : null,
    memory: (performance as Performance & { memory?: unknown }).memory ? sanitize((performance as Performance & { memory?: unknown }).memory) : null,
    resources,
  };
}

function durationFrom(startedAt?: number) {
  if (startedAt == null) return undefined;
  return Math.round(performance.now() - startedAt);
}

function responseMessage(data: unknown) {
  if (!data || typeof data !== 'object') return undefined;
  const record = data as Record<string, unknown>;
  return typeof record.message === 'string' ? record.message : undefined;
}

function responseBodySnapshot(data: unknown): JsonValue {
  if (data == null) return null;
  return sanitize(data);
}

function correlationIdFrom(headers: unknown): string | undefined {
  const headersRecord = plainHeaders(headers);
  const value = headersRecord['x-correlation-id'] ?? headersRecord['x-request-id'];
  return typeof value === 'string' ? value : undefined;
}

function headersSnapshot(headers: unknown): JsonValue {
  const headersRecord = plainHeaders(headers);
  const result: Record<string, JsonValue> = {};
  Object.entries(headersRecord).forEach(([key, value]) => {
    const normalized = key.toLowerCase();
    if (!HEADER_WHITELIST.has(normalized)) return;
    result[normalized] = SENSITIVE_KEY.test(normalized) ? '[redacted]' : sanitizeHeaderValue(value);
  });
  return result;
}

function plainHeaders(headers: unknown): Record<string, unknown> {
  if (!headers || typeof headers !== 'object') return {};
  const maybeAxiosHeaders = headers as { toJSON?: () => unknown };
  const raw = typeof maybeAxiosHeaders.toJSON === 'function' ? maybeAxiosHeaders.toJSON() : headers;
  if (!raw || typeof raw !== 'object') return {};

  const normalized: Record<string, unknown> = {};
  Object.entries(raw as Record<string, unknown>).forEach(([key, value]) => {
    normalized[key.toLowerCase()] = value;
  });
  return normalized;
}

function sanitizeHeaderValue(value: unknown): JsonValue {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeHeaderValue(item));
  }
  if (value == null) return null;
  return redactString(String(value)).slice(0, MAX_STRING);
}

function stringify(value: unknown): string {
  if (value instanceof Error) {
    return `${value.name}: ${value.message}`;
  }
  if (typeof value === 'string') {
    return redactString(value).slice(0, MAX_STRING);
  }
  try {
    return JSON.stringify(sanitize(value)).slice(0, MAX_STRING);
  } catch {
    return String(value).slice(0, MAX_STRING);
  }
}

function sanitize(value: unknown, depth = 0): JsonValue {
  if (value == null) return null;
  if (typeof value === 'string') return redactString(value).slice(0, MAX_STRING);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'function' || typeof value === 'symbol') return String(value);
  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactString(value.message),
      stack: redactString(value.stack || '').slice(0, MAX_STRING),
    };
  }
  if (depth > 4) return '[truncated]';
  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) => sanitize(item, depth + 1));
  }
  const result: Record<string, JsonValue> = {};
  Object.entries(value as Record<string, unknown>).slice(0, 80).forEach(([key, item]) => {
    result[key] = SENSITIVE_KEY.test(key) ? '[redacted]' : sanitize(item, depth + 1);
  });
  return result;
}

function redactString(value: string) {
  return value
    .replace(/Bearer\s+[-._~+/=A-Za-z0-9]+/g, 'Bearer [redacted]')
    .replace(/(access_token|refresh_token|token|password|secret)=([^&\s]+)/gi, '$1=[redacted]');
}

function redactUrl(value: string) {
  try {
    const url = new URL(value, window.location.origin);
    ['access_token', 'refresh_token', 'token', 'password', 'secret'].forEach((key) => {
      if (url.searchParams.has(key)) url.searchParams.set(key, '[redacted]');
    });
    return url.toString();
  } catch {
    return redactString(value);
  }
}
