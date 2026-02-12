"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { logout } from '@/app/lib/actions';
import { useDashboard } from './dashboard-layout';
import { FiBell, FiSearch, FiUser, FiSettings, FiLogOut, FiPlus, FiHelpCircle, FiMessageSquare, FiMenu, FiX, FiCheck, FiInfo, FiAlertCircle } from 'react-icons/fi';
import { useNotifications } from './notifications/notification-provider';
import { formatDistanceToNow } from 'date-fns';

interface TopNavProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    roles?: string[];
  };
}

const TopNav = ({ user }: TopNavProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { isMobileExpanded, setIsMobileExpanded } = useDashboard();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="h-20 md:h-24 px-4 md:px-8 flex items-center justify-between md:sticky md:top-0 z-40 md:bg-zinc-950/50 md:backdrop-blur-xl">
      <div className="flex items-center gap-6 flex-1">
        <div className="relative group hidden md:block w-full max-w-md">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[var(--pastel-indigo)] transition-colors" />
          <input
            type="text"
            placeholder="Search anything..."
            className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-16 py-2.5 text-sm focus:outline-none focus:bg-white/10 focus:border-white/20 w-full transition-all duration-300 placeholder:text-zinc-600"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-[10px] font-medium text-zinc-500">
            <span className="text-[12px]">⌘</span>
            <span>K</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-5">

        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative p-2.5 text-zinc-400 hover:text-white transition-colors bg-white/5 border border-white/10 rounded-xl hover:border-white/20 group hover-scale"
          >
            <FiBell className="text-xl group-hover:text-[var(--pastel-yellow)] transition-colors" />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-[#09090b] animate-pulse"></span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl py-2 animate-in fade-in zoom-in-95 duration-200 z-50">
              <div className="px-4 py-3 border-b border-white/5 flex justify-between items-center">
                <p className="text-sm font-medium text-white">Notifications</p>
                {unreadCount > 0 && (
                  <span className="text-xs text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full">{unreadCount} New</span>
                )}
              </div>
              
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      onClick={() => !notification.is_read && markAsRead(notification.id)}
                      className={`px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer border-b border-white/5 last:border-0 ${!notification.is_read ? 'bg-white/[0.02]' : ''}`}
                    >
                      <div className="flex gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                          notification.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          notification.type === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          notification.type === 'warning' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>
                          {notification.type === 'success' ? <FiCheck size={14} /> :
                           notification.type === 'error' ? <FiX size={14} /> :
                           notification.type === 'warning' ? <FiAlertCircle size={14} /> :
                           <FiBell size={14} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm line-clamp-2 ${!notification.is_read ? 'text-white font-medium' : 'text-zinc-400'}`}>
                            {notification.message}
                          </p>
                          <p className="text-[10px] text-zinc-500 mt-1">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5"></div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center">
                    <FiBell className="mx-auto text-zinc-600 mb-2 opacity-20" size={24} />
                    <p className="text-xs text-zinc-500">No notifications yet</p>
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-2 border-t border-white/5 flex gap-2">
                  {unreadCount > 0 && (
                    <button 
                      onClick={() => markAllAsRead()}
                      className="flex-1 py-2 text-xs text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/10"
                    >
                      Mark all as read
                    </button>
                  )}
                  <Link 
                    href="/notifications"
                    onClick={() => setIsNotificationsOpen(false)}
                    className="flex-1 py-2 text-xs text-center bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors border border-white/10"
                  >
                    View all
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 hidden md:flex">
          <button className="p-2.5 text-zinc-400 hover:text-white transition-colors bg-white/5 border border-white/10 rounded-xl hover:border-white/20 hover-scale" title="Help & Support">
            <FiHelpCircle className="text-xl" />
          </button>
          <button className="p-2.5 text-zinc-400 hover:text-white transition-colors bg-white/5 border border-white/10 rounded-xl hover:border-white/20 hover-scale" title="Send Feedback">
            <FiMessageSquare className="text-xl" />
          </button>
        </div>

        <div className="h-8 w-[1px] bg-white/10 hidden md:block"></div>

        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 p-1 rounded-xl hover:bg-white/5 transition-all cursor-pointer group focus:outline-none"
            >
                <div className="relative">
                {user.image ? (
                    <Image
                        src={user.image}
                        alt="Avatar"
                        width={36}
                        height={36}
                        className="rounded-lg object-cover border-2 border-white/10 group-hover:border-[var(--pastel-purple)]/50 transition-colors"
                    />
                ) : (
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold border border-emerald-500/20 group-hover:border-emerald-500/50 transition-colors">
                        {user.name?.charAt(0) || user.email?.charAt(0)}
                    </div>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#09090b]"></span>
                </div>
                <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-white group-hover:text-[var(--pastel-purple)] transition-colors uppercase tracking-tight">
                    {user.name || 'User'}
                </p>
                </div>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl py-2 animate-in fade-in zoom-in-95 duration-200 z-50">
                    <div className="px-4 py-3 border-b border-white/5 mb-2">
                        <p className="text-sm font-medium text-white truncate">{user.name || 'User'}</p>
                        <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                    </div>
                    
                    <Link 
                        href="/profile" 
                        className="flex items-center px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors group"
                        onClick={() => setIsOpen(false)}
                    >
                        <FiUser className="mr-3 text-zinc-500 group-hover:text-[var(--pastel-blue)]" />
                        My Profile
                    </Link>
                    <Link 
                        href="/settings" 
                        className="flex items-center px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors group"
                        onClick={() => setIsOpen(false)}
                    >
                        <FiSettings className="mr-3 text-zinc-500 group-hover:text-[var(--pastel-teal)]" />
                        Settings
                    </Link>
                    
                    <div className="border-t border-white/5 my-2"></div>
                    
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
          <Link href="/login" className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
};

export default TopNav;
