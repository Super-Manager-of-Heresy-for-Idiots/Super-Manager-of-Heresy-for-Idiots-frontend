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

    const token = useAuthStore.getState().token;
    const wsStore = useWsStore.getState();

    this.client = new Client({
      webSocketFactory: () => new SockJS('/ws') as unknown as WebSocket,
      connectHeaders: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},

      // No auto-reconnect: a dropped socket goes 'offline' instead of polling the server.
      reconnectDelay: 0,

      onConnect: () => {
        useWsStore.getState().setConnectionState('connected');

        // Campaign broadcast topic
        // Dot separator (not slash): a RabbitMQ STOMP /topic/ destination must be a single
        // word with no inner slash, so the campaign id is appended after a '.'.
        this.subscribeTo(`/topic/campaign.${campaignId}`);

        // Private user notifications
        this.subscribeTo('/user/queue/notifications');
      },

      onStompError: (frame) => {
        console.error('[WS] STOMP error', frame.headers['message'], frame.body);
        useWsStore.getState().setConnectionState('offline');
      },

      onWebSocketClose: () => {
        useWsStore.getState().setConnectionState('offline');
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
    useWsStore.getState().setConnectionState('offline');
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
}

/** Singleton instance — import this throughout the app. */
export const wsService = new WebSocketService();
