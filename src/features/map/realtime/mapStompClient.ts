/**
 * Thin STOMP-over-SockJS client for the map-service realtime channel. One instance
 * per live session: it owns the socket, subscribes the three map destinations
 * (committed events, transient presence, per-user errors) and forwards each parsed
 * frame to the injected {@link MapMessageRouter}. Outbound commands are published as
 * {@link MapCommandEnvelope}s to the `/app/...` destinations.
 *
 * Deliberately store-free — connection lifecycle is emitted via a callback — so the
 * testable branching stays in the pure router. SockJS + stompjs cannot run under
 * node/vitest, so this file intentionally has no unit tests.
 */

import { Client, ReconnectionTimeMode, type IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { ensureFreshAccessToken } from '@/lib/authSession';
import { buildMapAuthHeaders } from '../api/mapAuthHeaders';
import type { UUID } from '../types';
import { MAP_WS_URL } from './mapWsConfig';
import type { MapConnectionState } from './mapConnectionStore';
import { mapWsDestinations } from './mapWsDestinations';
import type { MapMessageRouter } from './mapWsMessageRouter';
import {
  MapCommandType,
  type CursorPayload,
  type DragPreviewPayload,
  type JoinSessionPayload,
  type MapCommandEnvelope,
  type MoveTokenPayload,
  type PingPayload,
} from './mapWsTypes';

export interface MapStompClientOptions {
  sessionId: UUID;
  router: MapMessageRouter;
  /** Bridge connection lifecycle to the store (or a test spy). */
  onConnectionStateChange?: (state: MapConnectionState) => void;
  /** Fired after subscriptions are wired on each (re)connect — send JOIN here. */
  onConnected?: () => void;
  /** Override the SockJS endpoint (defaults to {@link MAP_WS_URL}). */
  url?: string;
}

export class MapStompClient {
  private readonly sessionId: UUID;
  private readonly router: MapMessageRouter;
  private readonly onConnectionStateChange?: (state: MapConnectionState) => void;
  private readonly onConnected?: () => void;
  private readonly url: string;
  private client: Client | null = null;

  constructor(options: MapStompClientOptions) {
    this.sessionId = options.sessionId;
    this.router = options.router;
    this.onConnectionStateChange = options.onConnectionStateChange;
    this.onConnected = options.onConnected;
    this.url = options.url ?? MAP_WS_URL;
  }

  get connected(): boolean {
    return this.client?.connected ?? false;
  }

  /** Open the socket and begin (auto-reconnecting) STOMP. Idempotent. */
  activate(): void {
    if (this.client) return;

    this.emit('connecting');

    this.client = new Client({
      webSocketFactory: () => new SockJS(this.url) as unknown as WebSocket,
      connectHeaders: buildMapAuthHeaders(),

      // Bounded auto-reconnect: 2s, doubling up to 30s — mirrors the core socket.
      reconnectDelay: 2000,
      maxReconnectDelay: 30000,
      reconnectTimeMode: ReconnectionTimeMode.EXPONENTIAL,

      // Single-flight fresh token on every (re)connect, shared with the core socket's
      // refresh so two parallel refreshes never race the rotating cookie.
      beforeConnect: async () => {
        await ensureFreshAccessToken();
        if (this.client) {
          this.client.connectHeaders = buildMapAuthHeaders();
        }
      },

      onConnect: () => {
        this.subscribeAll();
        this.emit('connected');
        this.onConnected?.();
      },

      // Header only — never log the body, so no server-supplied detail can leak.
      onStompError: (frame) => {
        console.error('[MapWS] STOMP error', frame.headers['message']);
      },

      // Still active → stompjs keeps retrying ('reconnecting'); a close after a
      // deliberate deactivate() is a real 'offline'.
      onWebSocketClose: () => {
        this.emit(this.client?.active ? 'reconnecting' : 'offline');
      },

      onDisconnect: () => {
        this.emit('offline');
      },
    });

    this.client.activate();
  }

  /** Tear down the socket. Safe to call when never activated. */
  deactivate(): void {
    if (!this.client) return;
    try {
      void this.client.deactivate();
    } catch {
      /* swallow */
    }
    this.client = null;
  }

  /* ── outbound commands ─────────────────────────────────────── */

  sendJoin(payload: JoinSessionPayload): boolean {
    return this.publish(mapWsDestinations.appJoin(this.sessionId), MapCommandType.JOIN, payload);
  }

  sendLeave(): boolean {
    return this.publish(mapWsDestinations.appLeave(this.sessionId), MapCommandType.LEAVE, {});
  }

  sendMoveToken(payload: MoveTokenPayload): boolean {
    return this.publish(
      mapWsDestinations.appMoveToken(this.sessionId),
      MapCommandType.MOVE_TOKEN,
      payload,
    );
  }

  sendDragPreview(payload: DragPreviewPayload): boolean {
    return this.publish(
      mapWsDestinations.appDragPreview(this.sessionId),
      MapCommandType.DRAG_PREVIEW,
      payload,
    );
  }

  sendCursor(payload: CursorPayload): boolean {
    return this.publish(mapWsDestinations.appCursor(this.sessionId), MapCommandType.CURSOR, payload);
  }

  sendPing(payload: PingPayload): boolean {
    return this.publish(mapWsDestinations.appPing(this.sessionId), MapCommandType.PING, payload);
  }

  /* ── internals ─────────────────────────────────────────────── */

  private subscribeAll(): void {
    if (!this.client?.connected) return;
    this.client.subscribe(mapWsDestinations.topicEvents(this.sessionId), (msg) =>
      this.route(msg, this.router.handleEventsMessage),
    );
    this.client.subscribe(mapWsDestinations.topicPresence(this.sessionId), (msg) =>
      this.route(msg, this.router.handlePresenceMessage),
    );
    this.client.subscribe(mapWsDestinations.userErrors, (msg) =>
      this.route(msg, this.router.handleErrorMessage),
    );
  }

  private route(msg: IMessage, handler: (raw: unknown) => void): void {
    let parsed: unknown;
    try {
      parsed = JSON.parse(msg.body);
    } catch {
      return; // malformed frame — drop (a revision gap will resync if it mattered)
    }
    handler(parsed);
  }

  private publish<T>(destination: string, type: string, payload: T): boolean {
    if (!this.client?.connected) return false;
    const envelope: MapCommandEnvelope<T> = {
      type,
      requestId: crypto.randomUUID(),
      sentAt: new Date().toISOString(),
      payload,
    };
    this.client.publish({
      destination,
      headers: buildMapAuthHeaders(),
      body: JSON.stringify(envelope),
    });
    return true;
  }

  private emit(state: MapConnectionState): void {
    this.onConnectionStateChange?.(state);
  }
}
