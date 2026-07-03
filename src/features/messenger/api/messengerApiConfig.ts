/**
 * Pure messenger REST config — no axios/store imports, safe to use anywhere (incl. node tests).
 *
 * Same-origin `/api` in both dev and prod: dev relies on the Vite proxy forwarding
 * `/api/chat-sessions` to the messenger service, prod relies on nginx. Override with
 * `VITE_MESSENGER_API_BASE_URL` if the gateway mounts the service under a distinct prefix.
 */
export const MESSENGER_API_BASE_URL =
  (import.meta.env.VITE_MESSENGER_API_BASE_URL as string | undefined) ?? '/api';
