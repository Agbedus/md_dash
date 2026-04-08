"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { logout } from '@/app/lib/actions';
import { useDashboard } from './dashboard-layout';
import { FiBell, FiSearch, FiUser, FiSettings, FiLogOut, FiPlus, FiHelpCircle, FiMessageSquare, FiMenu, FiX, FiCheck, FiInfo, FiAlertCircle } from 'react-icons/fi';
import { useNotifications } from './notifications/notification-provider';
import { useAnnouncements } from './announcements/announcement-provider';
import { AnnouncementDropdown } from './announcements/announcement-dropdown';
import { formatDistanceToNow } from 'date-fns';
import { useLocation } from '@/providers/location-provider';

interface TopNavProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    roles?: string[];
  };
}

import { CommandMenu } from "@/components/ui/command-menu";

const TopNav = ({ user }: TopNavProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const announcementRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { unreadCount: announcementUnreadCount, isDropdownOpen: isAnnouncementsOpen, setIsDropdownOpen: setIsAnnouncementsOpen } = useAnnouncements();
  const { isMobileExpanded, setIsMobileExpanded } = useDashboard();
  const { attendanceState } = useLocation();

  const statusColor = attendanceState === 'CLOCKED_IN' ? 'bg-emerald-500' : 
                      attendanceState === 'CLOCKED_OUT' ? 'bg-blue-500' : 'bg-zinc-500';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (announcementRef.current && !announcementRef.current.contains(event.target as Node)) {
        setIsAnnouncementsOpen(false);
      }
    };
 
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setIsAnnouncementsOpen, setIsOpen, setIsNotificationsOpen]);

  return (
    <>
      <CommandMenu open={isCommandOpen} setOpen={setIsCommandOpen} />
      <nav className="h-20 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-card-border">
        <div className="flex items-center gap-6 flex-1">
          {/* Mobile Logo */}
          <Link href={user ? "/dashboard" : "/"} className="md:hidden flex items-center gap-2">
             <div className="p-1.5 bg-background/50 rounded-lg border border-card-border">
               <Image 
                 src="/logo.svg" 
                 alt="MD Logo" 
                 width={24} 
                 height={24} 
                 className="w-6 h-6 object-contain"
               />
             </div>
             <span className="text-lg font-bold text-foreground tracking-tight">MD<span className="text-emerald-500">*</span></span>
          </Link>

          <div className="relative group hidden md:block w-full max-w-md">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-[var(--pastel-indigo)] transition-colors" />
            <input
              type="text"
              placeholder="Search anything..."
              onClick={() => setIsCommandOpen(true)}
              readOnly
              className="bg-background/50 border border-card-border rounded-xl pl-10 pr-16 py-2.5 text-sm focus:outline-none focus:bg-foreground/[0.06] focus:border-foreground/10 w-full transition-all duration-300 placeholder:text-text-muted font-bold cursor-pointer hidden md:block"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded border border-card-border bg-background/50 text-[11px] font-bold text-text-muted pointer-events-none font-numbers">
              <span className="text-[12px]">⌘</span>
              <span>K</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-5">

          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2.5 text-text-muted hover:text-foreground transition-colors bg-background/50 border border-card-border rounded-xl hover:bg-foreground/[0.05] group hover-scale"
            >
              <FiBell className="text-xl group-hover:text-[var(--pastel-yellow)] transition-colors" />
              {unreadCount > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-background animate-pulse"></span>
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-background/95 border border-card-border rounded-xl py-2 animate-in fade-in zoom-in-95 duration-200 z-50 backdrop-blur-xl">
                <div className="px-4 py-3 border-b border-card-border flex justify-between items-center">
                  <p className="text-sm font-bold text-foreground">Notifications</p>
                  {unreadCount > 0 && (
                    <span className="text-xs text-text-muted bg-foreground/[0.05] px-2 py-0.5 rounded-full">{unreadCount} New</span>
                  )}
                </div>
                
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.length > 0 ? (
                    (() => {
                      const unread = notifications.filter(n => !n.is_read);
                      const displayNotifications = unread.length > 0 
                        ? unread 
                        : notifications.filter(n => n.is_read).slice(0, 7);
                        
                      return displayNotifications.map((notification) => (
                        <div 
                          key={notification.id} 
                          onClick={() => !notification.is_read && markAsRead(notification.id)}
                          className={`px-4 py-3 hover:bg-foreground/[0.04] transition-colors cursor-pointer border-b border-card-border last:border-0 ${!notification.is_read ? 'bg-foreground/[0.02]' : ''}`}
                        >
                          <div className="flex gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                              notification.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                              notification.type === 'error' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                              notification.type === 'warning' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                              'bg-blue-500/10 text-blue-500 border-blue-500/20'
                            }`}>
                              {notification.type === 'success' ? <FiCheck size={14} /> :
                               notification.type === 'error' ? <FiX size={14} /> :
                               notification.type === 'warning' ? <FiAlertCircle size={14} /> :
                               <FiBell size={14} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm line-clamp-2 ${!notification.is_read ? 'text-foreground font-bold' : 'text-text-muted'}`}>
                                {notification.message}
                              </p>
                              <p className="text-[11px] text-text-muted mt-1 font-bold font-numbers">
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                              </p>
                            </div>
                            {!notification.is_read && (
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5"></div>
                            )}
                          </div>
                        </div>
                      ));
                    })()
                  ) : (
                    <div className="px-4 py-8 text-center">
                      <FiBell className="mx-auto text-text-muted mb-2 opacity-20" size={24} />
                      <p className="text-xs text-text-muted">No notifications yet</p>
                    </div>
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="p-2 border-t border-card-border flex gap-2">
                    {unreadCount > 0 && (
                      <button 
                        onClick={() => markAllAsRead()}
                        className="flex-1 py-2 text-xs text-text-muted hover:text-foreground hover:bg-foreground/[0.05] rounded-lg transition-colors border border-transparent hover:border-card-border"
                      >
                        Mark all as read
                      </button>
                    )}
                    <Link 
                      href="/notifications"
                      onClick={() => setIsNotificationsOpen(false)}
                      className="flex-1 py-2 text-xs text-center bg-foreground/[0.04] text-text-muted hover:text-foreground hover:bg-foreground/[0.07] rounded-lg transition-colors border border-card-border"
                    >
                      View all
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="relative" ref={announcementRef}>
            <button 
              onClick={() => setIsAnnouncementsOpen(!isAnnouncementsOpen)}
              className="relative p-2.5 text-text-muted hover:text-foreground transition-colors bg-background/50 border border-card-border rounded-xl hover:bg-foreground/[0.05] group hover-scale"
              title="Announcements"
            >
              <FiMessageSquare className={`text-xl group-hover:text-[var(--pastel-yellow)] transition-colors ${isAnnouncementsOpen ? 'text-[var(--pastel-yellow)]' : 'text-text-muted'}`} />
              {announcementUnreadCount > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[var(--pastel-yellow)] rounded-full ring-2 ring-background animate-pulse"></span>
              )}
            </button>

            {isAnnouncementsOpen && <AnnouncementDropdown />}
          </div>

          <div className="flex gap-2 hidden md:flex">
            <button className="p-2.5 text-text-muted hover:text-foreground transition-colors bg-background/50 border border-card-border rounded-xl hover:bg-foreground/[0.05] hover-scale" title="Help & Support">
              <FiHelpCircle className="text-xl" />
            </button>
          </div>

          <div className="h-8 w-[1px] bg-foreground/[0.08] hidden md:block"></div>

          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button 
                  onClick={() => setIsOpen(!isOpen)}
                  className="flex items-center gap-3 p-1 rounded-xl hover:bg-foreground/[0.04] transition-all cursor-pointer group focus:outline-none"
              >
                  <div className="relative">
                  {user.image ? (
                      <Image
                          src={user.image}
                          alt="Avatar"
                          width={36}
                          height={36}
                          className="rounded-lg object-cover border-2 border-background group-hover:border-[var(--pastel-purple)]/50 transition-colors"
                      />
                  ) : (
                      <div className="w-9 h-9 rounded-lg bg-background/50 flex items-center justify-center text-foreground font-bold border border-card-border group-hover:border-foreground/10 transition-colors">
                          {user.name?.charAt(0) || user.email?.charAt(0)}
                      </div>
                  )}
                  <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 ${statusColor} rounded-full border-2 border-background`}></span>
                  </div>
                  <div className="hidden lg:block text-left">
                  <p className="text-xs font-bold text-foreground group-hover:text-[var(--pastel-purple)] transition-colors uppercase tracking-tight">
                      {user.name || 'User'}
                  </p>
                  </div>
              </button>

              {/* Dropdown Menu */}
              {isOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-background/95 border border-card-border rounded-xl py-2 animate-in fade-in zoom-in-95 duration-200 z-50 backdrop-blur-xl">
                      <div className="px-4 py-3 border-b border-card-border mb-2">
                          <p className="text-sm font-bold text-foreground truncate">{user.name || 'User'}</p>
                          <p className="text-xs text-text-muted font-medium truncate">{user.email}</p>
                      </div>
                      
                      <Link 
                          href="/profile" 
                      className="flex items-center px-4 py-2.5 text-sm text-text-muted hover:text-foreground hover:bg-foreground/[0.04] transition-colors group"
                          onClick={() => setIsOpen(false)}
                      >
                          <FiUser className="mr-3 text-text-muted group-hover:text-[var(--pastel-blue)]" />
                          My Profile
                      </Link>
                      <Link 
                          href="/settings" 
                      className="flex items-center px-4 py-2.5 text-sm text-text-muted hover:text-foreground hover:bg-foreground/[0.04] transition-colors group"
                          onClick={() => setIsOpen(false)}
                      >
                          <FiSettings className="mr-3 text-text-muted group-hover:text-[var(--pastel-teal)]" />
                          Settings
                      </Link>
                      
                      <div className="border-t border-card-border my-2"></div>
                      
                      <form action={logout}>
                          <button 
                              type="submit"
                              className="flex w-full items-center px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors group"
                          >
                              <FiLogOut className="mr-3 group-hover:translate-x-0.5 transition-transform" />
                              Sign Out
                          </button>
                      </form>
                  </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="px-4 py-2 rounded-full bg-foreground/[0.07] hover:bg-foreground/[0.12] text-foreground text-sm font-medium transition-colors border border-card-border">
              Login
            </Link>
          )}
        </div>
      </nav>
    </>
  );
};

export default TopNav;
