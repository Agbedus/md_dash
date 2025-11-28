"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { FaBell, FaSearch, FaUser, FaCog, FaSignOutAlt } from 'react-icons/fa';
import Link from 'next/link';
import { logout } from '@/app/lib/actions';

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
    <nav className="h-24 px-8 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center flex-1">
        <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative group">
          <input
            type="text"
            placeholder="Search..."
            className="bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:bg-white/10 focus:border-white/20 w-64 transition-all duration-300 focus:w-72"
          />
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors" />
        </div>

        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative p-2 text-zinc-400 hover:text-white transition-colors hover-scale"
          >
            <FaBell className="text-xl" />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#09090b]"></span>
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl py-2 animate-in fade-in zoom-in-95 duration-200 z-50">
              <div className="px-4 py-3 border-b border-white/5 flex justify-between items-center">
                <p className="text-sm font-medium text-white">Notifications</p>
                <span className="text-xs text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full">3 New</span>
              </div>
              
              <div className="max-h-[300px] overflow-y-auto">
                {[1, 2, 3].map((_, i) => (
                  <div key={i} className="px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer border-b border-white/5 last:border-0">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
                        <FaBell size={12} />
                      </div>
                      <div>
                        <p className="text-sm text-zinc-300 line-clamp-2">
                          New project &quot;Dashboard Redesign&quot; has been assigned to you.
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">2 hours ago</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-2 border-t border-white/5">
                <button className="w-full py-2 text-xs text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                  Mark all as read
                </button>
              </div>
            </div>
          )}
        </div>

        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-4 pl-2 rounded-full hover:bg-white/5 p-1.5 pr-4 transition-all cursor-pointer group hover-scale focus:outline-none"
            >
                <div className="relative">
                {user.image ? (
                    <Image
                        src={user.image}
                        alt="Avatar"
                        width={40}
                        height={40}
                        className="rounded-full object-cover border-2 border-white/10 group-hover:border-white/30 transition-colors"
                    />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold border-2 border-white/10 group-hover:border-white/30 transition-colors">
                        {user.name?.charAt(0) || user.email?.charAt(0)}
                    </div>
                )}
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#09090b]"></span>
                </div>
                <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-white group-hover:text-purple-400 transition-colors">
                    {user.name || 'User'}
                </p>
                <p className="text-xs text-zinc-500 capitalize">
                    {user.roles?.[0]?.replace('_', ' ') || 'Member'}
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
                        className="flex items-center px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                        onClick={() => setIsOpen(false)}
                    >
                        <FaUser className="mr-3 text-zinc-500" />
                        My Profile
                    </Link>
                    <Link 
                        href="/settings" 
                        className="flex items-center px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                        onClick={() => setIsOpen(false)}
                    >
                        <FaCog className="mr-3 text-zinc-500" />
                        Settings
                    </Link>
                    
                    <div className="border-t border-white/5 my-2"></div>
                    
                    <button 
                        onClick={() => logout()}
                        className="flex w-full items-center px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                        <FaSignOutAlt className="mr-3" />
                        Sign Out
                    </button>
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
