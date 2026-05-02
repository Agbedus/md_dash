'use client';

import React, { useState, createContext, useContext } from 'react';
import { NotificationProvider } from './notifications/notification-provider';
import { AnnouncementProvider } from './announcements/announcement-provider';
import { AnnouncementDrawer } from './announcements/announcement-drawer';
import { MobileNav } from './mobile-nav';
import { ConfirmationProvider } from '@/providers/confirmation-provider';
import { useGlobalActions } from '@/providers/global-action-provider';

interface DashboardContextType {
  isMobileExpanded: boolean;
  setIsMobileExpanded: (v: boolean) => void;
  isDesktopCollapsed: boolean;
  setIsDesktopCollapsed: (v: boolean) => void;
  isCommandOpen: boolean;
  setIsCommandOpen: (v: boolean) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}

export default function DashboardLayout({
  sidebar,
  topnav,
  children,
  user
}: {
  sidebar: React.ReactNode;
  topnav: React.ReactNode;
  children: React.ReactNode;
  user?: any;
}) {
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const { isCommandOpen, setIsCommandOpen } = useGlobalActions();

  return (
    <DashboardContext.Provider value={{ 
        isMobileExpanded, 
        setIsMobileExpanded, 
        isDesktopCollapsed, 
        setIsDesktopCollapsed,
        isCommandOpen,
        setIsCommandOpen
    }}>
      <NotificationProvider user={user}>
        <AnnouncementProvider user={user}>
          <ConfirmationProvider>
            <div className="flex h-screen bg-background overflow-hidden relative">
              {/* Sidebar container */}
              <div className="z-30">
                  {sidebar}
              </div>

              {/* Main Content Area */}
              <div 
                className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] relative
                  ${isMobileExpanded ? 'md:translate-x-0 translate-x-24' : 'translate-x-0'}
                `}
              >
                {topnav}
                <div className="flex-1 overflow-y-auto w-full pb-20 md:pb-0">
                  {children}
                </div>
              </div>
              <MobileNav setIsCommandOpen={setIsCommandOpen} />
              <AnnouncementDrawer />
            </div>
          </ConfirmationProvider>
        </AnnouncementProvider>
      </NotificationProvider>
    </DashboardContext.Provider>
  );
}
