'use client';

import React from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { FiMessageSquare, FiBell, FiChevronRight } from 'react-icons/fi';
import { useAnnouncements } from './announcement-provider';

export const AnnouncementDropdown = () => {
  const { announcements, unreadCount, setIsDropdownOpen, setIsDrawerOpen } = useAnnouncements();
  
  const latestAnnouncements = announcements.slice(0, 5);

  return (
    <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-zinc-900 border border-white/5 rounded-xl shadow-2xl py-2 animate-in fade-in zoom-in-95 duration-200 z-50">
      <div className="px-4 py-3 border-b border-white/5 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <FiMessageSquare className="text-[var(--pastel-yellow)]" size={16} />
          <p className="text-sm font-medium text-white">Announcements</p>
        </div>
        {unreadCount > 0 && (
          <span className="text-xs text-zinc-500 bg-white/[0.03] px-2 py-0.5 rounded-full">{unreadCount} New</span>
        )}
      </div>
      
      <div className="max-h-[350px] overflow-y-auto">
        {latestAnnouncements.length > 0 ? (
          latestAnnouncements.map((announcement) => (
            <div 
              key={announcement.id}
              onClick={() => {
                setIsDropdownOpen(false);
                setIsDrawerOpen(true);
              }}
              className="px-4 py-3 hover:bg-white/[0.03] transition-colors cursor-pointer border-b border-white/5 last:border-0 group"
            >
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center flex-shrink-0 group-hover:border-[var(--pastel-yellow)]/30 transition-colors">
                  <FiBell className="text-zinc-400 group-hover:text-[var(--pastel-yellow)]" size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium line-clamp-1 group-hover:text-[var(--pastel-yellow)] transition-colors">
                    {announcement.title}
                  </p>
                  <p className="text-xs text-zinc-500 line-clamp-2 mt-0.5">
                    {announcement.content}
                  </p>
                  <p className="text-[10px] text-zinc-600 mt-1 uppercase tracking-wider font-semibold">
                    {formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="px-4 py-10 text-center">
            <FiMessageSquare className="mx-auto text-zinc-600 mb-2 opacity-20" size={28} />
            <p className="text-xs text-zinc-500 font-medium">No announcements yet</p>
          </div>
        )}
      </div>

      <div className="p-2 border-t border-white/5">
        <button 
          onClick={() => {
            setIsDropdownOpen(false);
            setIsDrawerOpen(true);
          }}
          className="w-full py-2.5 text-xs text-center bg-white/[0.03] text-zinc-300 hover:text-white hover:bg-white/[0.06] rounded-xl transition-all border border-white/5 flex items-center justify-center gap-2 group"
        >
          View all announcements
          <FiChevronRight className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
