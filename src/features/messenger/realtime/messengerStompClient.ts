import { Client, ReconnectionTimeMode, type IMessage } from '@stomp/stompjs';
import { ensureFreshAccessToken } from '@/lib/authSession';
import { useAuthStore } from '@/store/authStore';
import type { UUID } from '../types';
import { MESSENGER_WS_URL } from './messengerWsConfig';
import { messengerWsDestinations } from './messengerWsDestinations';
import type { MessengerMessageRouter } from './messengerMessageRouter';

export type MessengerConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'offline';

/** Local-only opt-in identity shim for a gateway-less dev messenger (mirrors the map dev shim). */
function buildDevIdentityHeaders(): Record<string, string> {
  if (import.meta.env.VITE_MESSENGER_DEV_IDENTITY !== 'true') return {};
  const user = useAuthStore.getState().user;
  const headers: Record<string, string> = {};
  if (user?.id) headers['X-User-Id'] = user.id;
  if (user?.username) headers['X-Username'] = user.username;
  return headers;
}

export function buildMessengerConnectHeaders(token: string | null | undefined): Record<string, string> {
  const headers: Record<string, string> = buildDevIdentityHeaders();
  if (token && token !== 'undefined' && token !== 'null') {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export interface MessengerStompClientOptions {
  sessionId: UUID;
  router: MessengerMessageRouter;
  onConnectionStateChange?: (state: MessengerConnectionState) => void;
  onConnected?: () => void;
  url?: string;
}

/**
 * Native-STOMP client for one live chat session. Subscribes the session's events + typing topics and
 * the personal notification/error queues, and publishes the transient typing signal. Mirrors the
 * map-service client (native WebSocket, bearer auth on CONNECT, bounded auto-reconnect).
 */
export class MessengerStompClient {
  private readonly sessionId: UUID;
  private readonly router: MessengerMessageRouter;
  private readonly onConnectionStateChange?: (state: MessengerConnectionState) => void;
  private readonly onConnected?: () => void;
  private readonly url: string;
  private client: Client | null = null;

  constructor(options: MessengerStompClientOptions) {
    this.sessionId = options.sessionId;
    this.router = options.router;
    this.onConnectionStateChange = options.onConnectionStateChange;
    this.onConnected = options.onConnected;
    this.url = options.url ?? MESSENGER_WS_URL;
  }

  get connected(): boolean {
    return this.client?.connected ?? false;
  }

  activate(): void {
    if (this.client) return;
    this.emit('connecting');

    this.client = new Client({
      brokerURL: this.url,
      connectHeaders: buildMessengerConnectHeaders(null),
      reconnectDelay: 2000,
      maxReconnectDelay: 30000,
      reconnectTimeMode: ReconnectionTimeMode.EXPONENTIAL,
      beforeConnect: async () => {
        const token = await ensureFreshAccessToken();
        if (this.client) {
          this.client.connectHeaders = buildMessengerConnectHeaders(token);
        }
      },
      onConnect: () => {
        this.subscribeAll();
        this.emit('connected');
        this.onConnected?.();
      },
      onStompError: (frame) => {
        console.error('[MessengerWS] STOMP error', frame.headers['message']);
      },
      onWebSocketClose: () => {
        this.emit(this.client?.active ? 'reconnecting' : 'offline');
      },
      onDisconnect: () => {
        this.emit('offline');
      },
    });

    this.client.activate();
  }

  deactivate(): void {
    if (!this.client) return;
    try {
      void this.client.deactivate();
    } catch {
      /* swallow */
    }
    this.client = null;
  }

  sendTyping(typing: boolean): boolean {
    if (!this.client?.connected) return false;
    this.client.publish({
      destination: messengerWsDestinations.appTyping(this.sessionId),
      headers: buildDevIdentityHeaders(),
      body: JSON.stringify({ typing }),
    });
    return true;
  }

  private subscribeAll(): void {
    if (!this.client?.connected) return;
    this.client.subscribe(messengerWsDestinations.topicEvents(this.sessionId), (msg) =>
      this.route(msg, (raw) => this.router.handleEventsMessage(raw)),
    );
    this.client.subscribe(messengerWsDestinations.topicTyping(this.sessionId), (msg) =>
      this.route(msg, (raw) => this.router.handleTypingMessage(raw)),
    );
    this.client.subscribe(messengerWsDestinations.userNotifications, (msg) =>
      this.route(msg, (raw) => this.router.handleNotification(raw)),
    );
    this.client.subscribe(messengerWsDestinations.userErrors, (msg) =>
      this.route(msg, (raw) => this.router.handleError(raw)),
    );
  }

  private route(msg: IMessage, handler: (raw: unknown) => void): void {
    let parsed: unknown;
    try {
      parsed = JSON.parse(msg.body);
    } catch {
      return;
    }
    handler(parsed);
  }

  private emit(state: MessengerConnectionState): void {
    this.onConnectionStateChange?.(state);
  }
}
