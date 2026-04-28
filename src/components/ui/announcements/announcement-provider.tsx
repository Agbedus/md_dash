'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { toast } from '@/lib/toast';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import { Announcement, AnnouncementCreate, AnnouncementUpdate } from '@/types/announcement';
import { HiSpeakerphone } from 'react-icons/hi';
import { createAnnouncement as apiCreateAnnouncement, updateAnnouncement as apiUpdateAnnouncement, deleteAnnouncement as apiDeleteAnnouncement } from '@/app/(dashboard)/announcements/actions';

interface AnnouncementContextType {
  announcements: Announcement[];
  unreadCount: number;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (open: boolean) => void;
  isAdminFormOpen: boolean;
  setIsAdminFormOpen: (open: boolean) => void;
  createAnnouncement: (data: AnnouncementCreate) => Promise<{ success: boolean; error?: string }>;
  updateAnnouncement: (id: string, data: AnnouncementUpdate) => Promise<{ success: boolean; error?: string }>;
  deleteAnnouncement: (id: string) => Promise<{ success: boolean; error?: string }>;
  markAsRead: (id: string) => void;
  isConnected: boolean;
  user?: any;
}

const AnnouncementContext = createContext<AnnouncementContextType | undefined>(undefined);

export const useAnnouncements = () => {
  const context = useContext(AnnouncementContext);
  if (!context) {
    throw new Error('useAnnouncements must be used within an AnnouncementProvider');
  }
  return context;
};

export const AnnouncementProvider: React.FC<{ children: React.ReactNode, user?: any }> = ({ children, user }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAdminFormOpen, setIsAdminFormOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);
  
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const socketRef = useRef<WebSocket | null>(null);
  
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  // Load read status from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('read_announcements');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Use setTimeout to avoid synchronous setState inside effect warning
          setTimeout(() => setReadIds(parsed), 0);
        }
      } catch (e) {
        console.error('Failed to parse read announcements', e);
      }
    }
  }, []);

  // Save read status to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('read_announcements', JSON.stringify(readIds));
  }, [readIds]);

  // SWR for Announcements
  const { data: announcements = [], mutate: mutateAnnouncements } = useSWR<Announcement[]>(
    user?.accessToken ? [`${baseUrl}/api/v1/announcements`, user.accessToken] : null,
    ([url, token]: [string, string]) => fetcher(url, token)
  );

  const unreadCount = announcements.filter(a => a.id && !readIds.includes(a.id)).length;

  const markAsRead = useCallback((id: string) => {
    if (!id) return;
    setReadIds(prev => prev.includes(id) ? prev : [...prev, id]);
  }, []);

  const createAnnouncement = async (data: AnnouncementCreate) => {
    const res = await apiCreateAnnouncement(data);
    if (res.success) {
      mutateAnnouncements();
      return { success: true };
    }
    return { success: false, error: res.error || "Failed to create announcement" };
  };

  const updateAnnouncement = async (id: string, data: AnnouncementUpdate) => {
    const res = await apiUpdateAnnouncement(id, data);
    if (res.success) {
      mutateAnnouncements();
      return { success: true };
    }
    return { success: false, error: res.error || "Failed to update announcement" };
  };

  const deleteAnnouncement = async (id: string) => {
    const res = await apiDeleteAnnouncement(id);
    if (res.success) {
      mutateAnnouncements();
      return { success: true };
    }
    return { success: false, error: res.error || "Failed to delete announcement" };
  };

  useEffect(() => {
    if (!user?.id || !user?.accessToken) {
      if (isConnected) {
        // Use setTimeout to avoid synchronous setState inside effect warning
        setTimeout(() => setIsConnected(false), 0);
      }
      return;
    }

    const connect = () => {
      if (socketRef.current?.readyState === WebSocket.OPEN) return;

      const wsBaseUrl = baseUrl.replace(/^http/, 'ws');
      const wsUrl = `${wsBaseUrl}/ws/announcements`;
      
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log('Announcement WebSocket connected');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      socket.onmessage = (event: MessageEvent) => {
        try {
          const announcement: Announcement = JSON.parse(event.data);
          mutateAnnouncements((current = []) => [announcement, ...current], false);
          
          toast(announcement.title, {
            icon: <HiSpeakerphone size={22} className="text-[var(--pastel-yellow)]" />,
            duration: 6000,
          });
        } catch (err) {
          console.error('Failed to parse Announcement WebSocket message:', err);
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
        const timeout = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current += 1;
          connect();
        }, timeout);
      };

      socket.onerror = (err) => {
        console.warn('Announcement WebSocket error');
        socket.close();
      };
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.onclose = null;
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [user?.id, user?.accessToken, baseUrl, mutateAnnouncements, isConnected]);

  return (
    <AnnouncementContext.Provider value={{ 
      announcements, 
      unreadCount,
      isDrawerOpen,
      setIsDrawerOpen,
      isDropdownOpen,
      setIsDropdownOpen,
      isAdminFormOpen,
      setIsAdminFormOpen,
      createAnnouncement,
      updateAnnouncement,
      deleteAnnouncement,
      markAsRead,
      isConnected,
      user
    }}>
      {children}
    </AnnouncementContext.Provider>
  );
};
