/**
 * Pure WebSocket config for the messenger realtime channel — no store/transport imports.
 *
 * The messenger registers its STOMP endpoint as `/ws/messenger` with NO `.withSockJS()`, so it speaks
 * native WebSocket (stompjs `brokerURL`). Resolution: `VITE_MESSENGER_WS_URL` override, else same-origin
 * `ws(s)://<host>/ws/messenger` (Vite proxy in dev, nginx in prod).
 */
export function resolveMessengerWsUrl(): string {
  const override = import.meta.env.VITE_MESSENGER_WS_URL as string | undefined;
  if (override) return override;

  if (typeof window !== 'undefined' && window.location?.host) {
    const scheme = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${scheme}//${window.location.host}/ws/messenger`;
  }
  return 'ws://localhost/ws/messenger';
}

export const MESSENGER_WS_URL = resolveMessengerWsUrl();
