import { create } from 'zustand';
import type { WsEvent } from '@/types';

export type ConnectionState = 'connected' | 'reconnecting' | 'offline';

export interface Notification {
  id: string;
  event: WsEvent;
  read: boolean;
  receivedAt: string;
}

interface WsState {
  connectionState: ConnectionState;
  notifications: Notification[];
  unreadCount: number;
  setConnectionState: (state: ConnectionState) => void;
  addNotification: (event: WsEvent) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clearNotifications: () => void;
}

export const useWsStore = create<WsState>((set) => ({
  connectionState: 'offline',
  notifications: [],
  unreadCount: 0,
  setConnectionState: (state) => set({ connectionState: state }),
  addNotification: (event) => {
    const notif: Notification = {
      id: crypto.randomUUID(),
      event,
      read: false,
      receivedAt: new Date().toISOString(),
    };
    set((s) => ({
      notifications: [notif, ...s.notifications].slice(0, 100),
      unreadCount: s.unreadCount + 1,
    }));
  },
  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
  markRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
      unreadCount: Math.max(
        0,
        s.unreadCount -
          (s.notifications.find((n) => n.id === id && !n.read) ? 1 : 0),
      ),
    })),
  clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
}));
