'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import useSWR, { useSWRConfig } from 'swr';
import { fetcher } from '@/lib/api';

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
  const [isConnected, setIsConnected] = useState(false);
  const { mutate } = useSWRConfig();
  
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://fast-dash-b1e5.onrender.com" || "http://127.0.0.1:8000";

  // SWR for Users
  const { data: users = [] } = useSWR(
    user?.accessToken ? [`${baseUrl}/api/v1/users`, user.accessToken] : null,
    ([url, token]: [string, string]) => fetcher(url, token).then(data => data.map((u: any) => ({
          id: u.id,
          name: u.full_name,
          email: u.email,
          image: u.avatar_url,
          fullName: u.full_name,
          roles: u.roles || [],
          avatarUrl: u.avatar_url,
    })))
  );

  // SWR for Notifications
  const { data: notifications = [], mutate: mutateNotifications } = useSWR<Notification[]>(
    user?.accessToken ? [`${baseUrl}/api/v1/notifications`, user.accessToken] : null,
    ([url, token]: [string, string]) => fetcher(url, token)
  );

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = async (id: string) => {
    if (!user?.accessToken) return;

    // Optimistic update
    mutateNotifications(
        (currentNotifications = []) => currentNotifications.map(n => n.id === id ? { ...n, is_read: true } : n),
        false
    );

    try {
      const res = await fetch(`${baseUrl}/api/v1/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.accessToken}`,
        },
      });

      if (!res.ok) throw new Error('Failed to mark read');
      // Revalidate to be sure
      mutateNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // Rollback
      mutateNotifications();
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    
    // Optimistic update
    mutateNotifications(
        (currentNotifications = []) => currentNotifications.map(n => ({ ...n, is_read: true })),
        false
    );

    await Promise.all(unreadIds.map(id => 
        fetch(`${baseUrl}/api/v1/notifications/${id}/read`, {
             method: 'PUT',
             headers: { 'Authorization': `Bearer ${user.accessToken}` }
        })
    ));
    mutateNotifications();
  };

  useEffect(() => {
    if (!user?.id || !user?.accessToken) {
      setIsConnected(false);
      return;
    }

    const wsBaseUrl = baseUrl.replace(/^http/, 'ws');
    const wsUrl = `${wsBaseUrl}/api/v1/notifications/ws/${user.id}`;
    
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('Notification WebSocket connected');
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const notification: Notification = JSON.parse(event.data);
        
        // Update cache with new notification
        mutateNotifications((currentNotifications = []) => [notification, ...currentNotifications], false);
        
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
      if (user?.id) {
        console.error('Notification WebSocket error:', err);
      }
      setIsConnected(false);
    };

    return () => {
      socket.close();
    };
  }, [user?.id, user?.accessToken, baseUrl, mutateNotifications]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, isConnected, user, users }}>
      {children}
    </NotificationContext.Provider>
  );
};
