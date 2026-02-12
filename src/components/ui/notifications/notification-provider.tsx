'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

export interface Notification {
  id: string;
  recipient_id: string;
  sender_id: string | null;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  resource_type?: 'task' | 'note' | 'project' | 'system' | null;
  resource_id?: string | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  isConnected: boolean;
  user?: any;
  users: any[];
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode, user?: any }> = ({ children, user }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const fetchUsers = useCallback(async () => {
    if (!user?.accessToken) return;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://fast-dash-b1e5.onrender.com" || "http://127.0.0.1:8000";
      const res = await fetch(`${baseUrl}/api/v1/users`, {
        headers: {
          'Authorization': `Bearer ${user.accessToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        // Map to consistent User type (same as src/app/users/actions.ts)
        const mappedUsers = data.map((u: any) => ({
          id: u.id,
          name: u.full_name,
          email: u.email,
          image: u.avatar_url,
          fullName: u.full_name,
          roles: u.roles || [],
          avatarUrl: u.avatar_url,
        }));
        setUsers(mappedUsers);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  }, [user?.accessToken]);

  const fetchNotifications = useCallback(async () => {
    if (!user?.accessToken) return;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://fast-dash-b1e5.onrender.com" || "http://127.0.0.1:8000";
      const res = await fetch(`${baseUrl}/api/v1/notifications`, {
        headers: {
          'Authorization': `Bearer ${user.accessToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, [user?.accessToken]);

  const markAsRead = async (id: string) => {
    if (!user?.accessToken) return;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://fast-dash-b1e5.onrender.com" || "http://127.0.0.1:8000";
      const res = await fetch(`${baseUrl}/api/v1/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.accessToken}`,
        },
      });

      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    // Current API doesn't have mark-all-as-read, so we'll mark them individually for now
    // or we can just update local state if we want to be optimistic
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    await Promise.all(unreadIds.map(markAsRead));
  };

  useEffect(() => {
    if (!user?.id || !user?.accessToken) {
      setIsConnected(false);
      setNotifications([]);
      return;
    }

    fetchUsers();
    fetchNotifications();

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://fast-dash-b1e5.onrender.com" || "http://127.0.0.1:8000";
    const wsBaseUrl = baseUrl.replace(/^http/, 'ws');
    const wsUrl = `${wsBaseUrl}/api/v1/notifications/ws/${user.id}`;
    
    // In a real app, you might want to pass the token in query params if the WS endpoint requires it
    // wsUrl += `?token=${user.accessToken}`;

    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('Notification WebSocket connected');
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const notification: Notification = JSON.parse(event.data);
        setNotifications(prev => [notification, ...prev]);
        
        // Show a toast for the new notification
        toast(notification.title, {
          icon: notification.type === 'success' ? '✅' : '🔔',
          duration: 4000,
        });
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    socket.onclose = () => {
      console.log('Notification WebSocket disconnected');
      setIsConnected(false);
    };

    socket.onerror = (err) => {
      // Only log errors if we're still supposed to be connected
      if (user?.id) {
        console.error('Notification WebSocket error:', err);
      }
      setIsConnected(false);
    };

    return () => {
      socket.close();
    };
  }, [user?.id, user?.accessToken, fetchNotifications]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, isConnected, user, users }}>
      {children}
    </NotificationContext.Provider>
  );
};
