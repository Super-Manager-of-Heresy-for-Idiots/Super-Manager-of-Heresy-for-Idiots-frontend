import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuthStore } from '@/store/authStore';
import { useWsStore } from '@/store/wsStore';
import type { WsEvent } from '@/types';

/**
 * Event handler function type — registered via onEvent() and called for
 * every parsed WsEvent that arrives on any subscribed STOMP destination.
 */
export type WsEventHandler = (event: WsEvent) => void;

/**
 * Singleton WebSocket service that wraps STOMP over SockJS.
 *
 * Usage:
 *   wsService.connect(campaignId);   // opens socket + subscribes
 *   wsService.onEvent(handler);      // register handler
 *   wsService.offEvent(handler);     // unregister handler
 *   wsService.disconnect();          // clean teardown
 */
class WebSocketService {
  private client: Client | null = null;
  private subscriptions: StompSubscription[] = [];
  private handlers: Set<WsEventHandler> = new Set();
  private currentCampaignId: string | null = null;
  private reconnectAttempt = 0;

  /* ── public API ────────────────────────────────────────── */

  /**
   * Open a STOMP connection and subscribe to campaign + private channels.
   * If already connected to the same campaign this is a no-op.
   */
  connect(campaignId: string): void {
    if (this.client?.connected && this.currentCampaignId === campaignId) {
      return; // already wired up
    }

    // Tear down any previous connection first
    this.disconnect();

    this.currentCampaignId = campaignId;
    this.reconnectAttempt = 0;

    const token = useAuthStore.getState().token;
    const wsStore = useWsStore.getState();

    this.client = new Client({
      // SockJS factory — connects to the backend /ws endpoint with JWT as query param
      webSocketFactory: () => new SockJS(`/ws?token=${token}`) as unknown as WebSocket,

      // Disable built-in reconnect; we handle it ourselves for back-off
      reconnectDelay: 0,

      onConnect: () => {
        this.reconnectAttempt = 0;
        useWsStore.getState().setConnectionState('connected');

        // Campaign broadcast topic
        this.subscribeTo(`/topic/campaign/${campaignId}/updates`);

        // Private user notifications
        this.subscribeTo('/user/queue/notifications');
      },

      onStompError: (frame) => {
        console.error('[WS] STOMP error', frame.headers['message'], frame.body);
        this.scheduleReconnect();
      },

      onWebSocketClose: () => {
        wsStore.setConnectionState('offline');
        this.scheduleReconnect();
      },

      onDisconnect: () => {
        wsStore.setConnectionState('offline');
      },
    });

    wsStore.setConnectionState('reconnecting');
    this.client.activate();
  }

  /**
   * Gracefully close the STOMP connection and remove all subscriptions.
   */
  disconnect(): void {
    this.subscriptions.forEach((sub) => {
      try {
        sub.unsubscribe();
      } catch {
        /* already gone */
      }
    });
    this.subscriptions = [];

    if (this.client) {
      try {
        this.client.deactivate();
      } catch {
        /* swallow */
      }
      this.client = null;
    }

    this.currentCampaignId = null;
    this.reconnectAttempt = 0;
    useWsStore.getState().setConnectionState('offline');
  }

  /**
   * Subscribe to a character-specific topic while connected.
   */
  subscribeCharacter(characterId: string, callback?: (event: WsEvent) => void): void {
    this.subscribe(`/topic/character/${characterId}/updates`, callback);
  }

  /**
   * Manually subscribe to an additional STOMP destination while connected.
   */
  subscribe(destination: string, callback?: (event: WsEvent) => void): void {
    if (!this.client?.connected) {
      console.warn('[WS] Cannot subscribe — not connected');
      return;
    }

    const sub = this.client.subscribe(destination, (msg: IMessage) => {
      const event = this.parseMessage(msg);
      if (!event) return;
      if (callback) callback(event);
      this.dispatchEvent(event);
    });

    this.subscriptions.push(sub);
  }

  /**
   * Unsubscribe from a specific destination by its STOMP subscription id.
   */
  unsubscribe(subscriptionId: string): void {
    const idx = this.subscriptions.findIndex((s) => s.id === subscriptionId);
    if (idx !== -1) {
      try {
        this.subscriptions[idx].unsubscribe();
      } catch {
        /* already gone */
      }
      this.subscriptions.splice(idx, 1);
    }
  }

  /** Register a handler that is called for every incoming WsEvent. */
  onEvent(handler: WsEventHandler): void {
    this.handlers.add(handler);
  }

  /** Remove a previously registered handler. */
  offEvent(handler: WsEventHandler): void {
    this.handlers.delete(handler);
  }

  /* ── internals ─────────────────────────────────────────── */

  private subscribeTo(destination: string): void {
    if (!this.client?.connected) return;

    const sub = this.client.subscribe(destination, (msg: IMessage) => {
      const event = this.parseMessage(msg);
      if (!event) return;
      this.dispatchEvent(event);
    });

    this.subscriptions.push(sub);
  }

  private parseMessage(msg: IMessage): WsEvent | null {
    try {
      return JSON.parse(msg.body) as WsEvent;
    } catch (err) {
      console.error('[WS] Failed to parse message', err, msg.body);
      return null;
    }
  }

  private dispatchEvent(event: WsEvent): void {
    // Persist into notification store
    useWsStore.getState().addNotification(event);

    // Fan out to registered handlers
    this.handlers.forEach((h) => {
      try {
        h(event);
      } catch (err) {
        console.error('[WS] Handler error', err);
      }
    });
  }

  /**
   * Exponential back-off: 1 s, 2 s, 4 s, 8 s ... capped at 30 s.
   */
  private scheduleReconnect(): void {
    if (!this.currentCampaignId) return;

    useWsStore.getState().setConnectionState('reconnecting');
    this.reconnectAttempt += 1;

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempt - 1), 30_000);

    setTimeout(() => {
      if (!this.currentCampaignId) return; // disconnect() was called
      console.info(`[WS] Reconnecting (attempt ${this.reconnectAttempt}, delay ${delay}ms)`);
      this.connect(this.currentCampaignId);
    }, delay);
  }
}

/** Singleton instance — import this throughout the app. */
export const wsService = new WebSocketService();
