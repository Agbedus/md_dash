'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { toast } from '@/lib/toast';
import useSWR, { useSWRConfig } from 'swr';
import { FiCheckCircle, FiInfo, FiAlertCircle } from 'react-icons/fi';
import { 
  getNotifications, 
  markNotificationAsRead as apiMarkAsRead, 
  markAllNotificationsAsRead as apiMarkAllAsRead 
} from '@/app/lib/notification-actions';
import { getUsers } from '@/app/(dashboard)/users/actions';

export interface Notification {
  id: string;
  recipient_id: string;
  sender_id: string | null;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  resource_type?: 'task' | 'note' | 'project' | 'system' | 'attendance' | null;
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
  const { mutate } = useSWRConfig();
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>(null);
  const reconnectAttemptsRef = useRef(0);
  const socketRef = useRef<WebSocket>(null);
  
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  // SWR for Users
  const { data: users = [] } = useSWR(
    user?.accessToken ? 'users' : null,
    () => getUsers()
  );

  // SWR for Notifications
  const { data: notifications = [], mutate: mutateNotifications } = useSWR<Notification[]>(
    user?.accessToken ? 'notifications' : null,
    () => getNotifications()
  );

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = useCallback(async (id: string) => {
    if (!user?.accessToken) return;

    mutateNotifications(
        (currentNotifications = []) => currentNotifications.map(n => n.id === id ? { ...n, is_read: true } : n),
        false
    );

    try {
      const res = await apiMarkAsRead(id);
      if (!res.success) throw new Error('Failed to mark read');
      mutateNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      mutateNotifications();
    }
  }, [user?.accessToken, mutateNotifications]);

  const markAllAsRead = useCallback(async () => {
    if (!user?.accessToken) return;

    mutateNotifications(
        (currentNotifications = []) => currentNotifications.map(n => ({ ...n, is_read: true })),
        false
    );

    try {
      const res = await apiMarkAllAsRead();
      if (!res.success) throw new Error('Failed to mark all read');
      mutateNotifications();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      mutateNotifications();
    }
  }, [user?.accessToken, mutateNotifications]);

  useEffect(() => {
    if (!user?.id || !user?.accessToken) {
      setIsConnected(false);
      return;
    }

    const connect = () => {
      if (socketRef.current?.readyState === WebSocket.OPEN) return;

      const wsBaseUrl = baseUrl.replace(/^http/, 'ws');
      const wsUrl = `${wsBaseUrl}/api/v1/notifications/ws/${user.id}`;
      
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log('Notification WebSocket connected');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      socket.onmessage = (event: MessageEvent) => {
        try {
          const message = JSON.parse(event.data);
          
          // 1. Handle Data Updates (Real-time sync)
          if (message.realtime_type === 'DATA_UPDATE') {
            const { resource, action, data } = message;
            
            // Trigger SWR revalidation for all keys starting with the resource name
            mutate((key: any) => Array.isArray(key) && key[0] === (resource === 'task' ? 'tasks' : resource + 's'));
            
            // Special cases or specific mutations
            if (resource === 'task') {
               // We could also show a small "mission updated" toast if action is 'created'
               if (action === 'created') {
                  toast(`New Task: ${data.name || 'Untitled'}`, {
                    icon: <FiCheckCircle className="text-emerald-400" />,
                    duration: 3000
                  });
               }
            } else if (resource === 'note') {
                if (action === 'created') {
                    toast(`New Note: ${data.title || 'Untitled'}`, {
                        icon: <FiInfo className="text-blue-400" />,
                        duration: 3000
                    });
                }
            }
            return;
          }

          // 2. Handle Notifications (Existing logic)
          const notification: Notification = message;
          mutateNotifications((currentNotifications = []) => [notification, ...currentNotifications], false);
          
          let icon = <FiInfo size={22} className="text-blue-400" />;
          if (notification.type === 'success') icon = <FiCheckCircle size={22} className="text-emerald-400" />;
          if (notification.type === 'error') icon = <FiAlertCircle size={22} className="text-rose-400" />;
          if (notification.type === 'warning') icon = <FiAlertCircle size={22} className="text-amber-400" />;

          toast(notification.title, {
            icon,
            duration: 4000,
          });
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
        // Reconnect logic
        const timeout = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current += 1;
          connect();
        }, timeout);
      };

      socket.onerror = (err) => {
        console.warn('Notification WebSocket error - check server connection');
        socket.close();
      };
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.onclose = null; // Prevent reconnect on explicit cleanup
        socketRef.current.close();
      }
    };
  }, [user?.id, user?.accessToken, baseUrl, mutateNotifications]);

  const contextValue = React.useMemo(() => ({ 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    isConnected, 
    user, 
    users 
  }), [
    notifications, 
    unreadCount, 
    markAsRead,
    markAllAsRead,
    isConnected, 
    user, 
    users
  ]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};
