import { create } from 'zustand';
import { AppNotification, NotificationType } from '../types';
import { SEED_NOTIFICATIONS } from '../data/seedData';

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: (userId: string) => number;
  getUserNotifications: (userId: string) => AppNotification[];
  markAsRead: (notificationId: string) => void;
  markAllAsRead: (userId: string) => void;
  addNotification: (params: {
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    link?: string;
  }) => void;
}

const STORAGE_KEY_NOTIFICATIONS = 'mandimatch_notifications';

function getInitialNotifications(): AppNotification[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error reading notifications from localStorage:', e);
  }
  try {
    localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(SEED_NOTIFICATIONS));
  } catch {}
  return SEED_NOTIFICATIONS;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: getInitialNotifications(),

  unreadCount: (userId: string) => {
    return get().notifications.filter((n) => n.userId === userId && !n.read).length;
  },

  getUserNotifications: (userId: string) => {
    return get()
      .notifications.filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  markAsRead: (notificationId: string) => {
    const updated = get().notifications.map((n) =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    try {
      localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(updated));
    } catch {}
    set({ notifications: updated });
  },

  markAllAsRead: (userId: string) => {
    const updated = get().notifications.map((n) =>
      n.userId === userId ? { ...n, read: true } : n
    );
    try {
      localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(updated));
    } catch {}
    set({ notifications: updated });
  },

  addNotification: (params) => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type,
      read: false,
      link: params.link,
      createdAt: new Date().toISOString(),
    };

    const updated = [newNotif, ...get().notifications];
    try {
      localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(updated));
    } catch {}
    set({ notifications: updated });
  },
}));
