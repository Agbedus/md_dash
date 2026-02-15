'use client';

import React, { useState, createContext, useContext } from 'react';
import { NotificationProvider } from './notifications/notification-provider';
import { MobileNav } from './mobile-nav';
import { CommandMenu } from './command-menu';

interface DashboardContextType {
  isMobileExpanded: boolean;
  setIsMobileExpanded: (v: boolean) => void;
  isDesktopCollapsed: boolean;
  setIsDesktopCollapsed: (v: boolean) => void;
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
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  return (
    <DashboardContext.Provider value={{ 
        isMobileExpanded, 
        setIsMobileExpanded, 
        isDesktopCollapsed, 
        setIsDesktopCollapsed 
    }}>
      <NotificationProvider user={user}>
        <div className="flex h-screen bg-zinc-950 overflow-hidden relative">
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
          <CommandMenu open={isCommandOpen} setOpen={setIsCommandOpen} />
        </div>
      </NotificationProvider>
    </DashboardContext.Provider>
  );
}
