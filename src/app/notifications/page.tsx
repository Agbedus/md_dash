'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useNotifications, Notification } from '@/components/ui/notifications/notification-provider';
import { 
  FiBell, 
  FiCheck, 
  FiX, 
  FiAlertCircle, 
  FiClock, 
  FiCheckCircle, 
  FiSearch, 
  FiInbox, 
  FiFileText, 
  FiLayers, 
  FiCpu, 
  FiFilter,
  FiUser,
  FiMaximize2,
  FiChevronRight,
  FiShare2,
  FiTag
} from 'react-icons/fi';
import Image from 'next/image';
import { Portal } from '@/components/ui/portal';
import { formatDistanceToNow } from 'date-fns';

type Category = 'all' | 'tasks' | 'notes' | 'projects' | 'system';

interface TabItem {
  id: Category;
  label: string;
  icon: React.ElementType;
}

const tabs: TabItem[] = [
  { id: 'all', label: 'All', icon: FiInbox },
  { id: 'tasks', label: 'Tasks', icon: FiCheckCircle },
  { id: 'notes', label: 'Notes', icon: FiFileText },
  { id: 'projects', label: 'Projects', icon: FiLayers },
  { id: 'system', label: 'System', icon: FiCpu },
];

// SenderAvatar helper component with hover card logic
function SenderAvatar({ user, size = 'sm' }: { user: any, size?: 'xs' | 'sm' | 'md' }) {
  const [isHovered, setIsHovered] = useState(false);
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top,
        left: rect.left + rect.width / 2,
      });
      setIsHovered(true);
    }
  };

  const name = user?.fullName || user?.name || 'System';
  const initials = name.charAt(0).toUpperCase();
  const avatar = user?.avatarUrl || user?.image;

  const sizeClasses = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
  };

  return (
    <>
      <div 
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsHovered(false)}
        className={`relative rounded-full ring-2 ring-zinc-900 bg-zinc-800 flex-shrink-0 flex items-center justify-center overflow-hidden cursor-pointer ${sizeClasses[size]}`}
      >
        {avatar ? (
          <Image src={avatar} alt={name} fill className="object-cover" />
        ) : (
          <span className="font-bold text-emerald-400">{initials}</span>
        )}
      </div>

      {isHovered && user && (
        <Portal>
          <div 
            style={{
              position: 'fixed',
              top: `${coords.top - 8}px`,
              left: `${coords.left}px`,
              transform: 'translate(-50%, -100%)',
            }}
            className="w-48 p-3 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-[9999] animate-in fade-in slide-in-from-bottom-1 duration-200"
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{name}</p>
                  <p className="text-[10px] text-zinc-500 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {user.roles?.map((role: string) => (
                  <span key={role} className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[8px] font-black uppercase tracking-widest text-zinc-400">
                    {role}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, user, users } = useNotifications();
  const [activeTab, setActiveTab] = useState<Category>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const isSuperAdmin = user?.roles?.includes('SUPER_ADMIN');

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      const matchesSearch = 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        n.message.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;
      if (activeTab === 'all') return true;

      if (activeTab === 'tasks') return n.resource_type === 'task' || n.title.toLowerCase().includes('task');
      if (activeTab === 'notes') return n.resource_type === 'note' || n.title.toLowerCase().includes('note');
      if (activeTab === 'projects') return n.resource_type === 'project' || n.title.toLowerCase().includes('project');
      if (activeTab === 'system') return n.resource_type === 'system' || (!n.resource_type && !n.title.toLowerCase().match(/task|note|project/));
      
      return true;
    }).map(n => ({
      ...n,
      sender: users.find(u => u.id === n.sender_id)
    }));
  }, [notifications, activeTab, searchQuery, users]);

  useEffect(() => {
    if (filteredNotifications.length > 0 && !selectedId) {
      setSelectedId(filteredNotifications[0].id);
    }
  }, [filteredNotifications, selectedId]);

  const selectedNotification = useMemo(() => 
    filteredNotifications.find(n => n.id === selectedId) || null
  , [filteredNotifications, selectedId]);

  const handleSelect = (idx: string) => {
    setSelectedId(idx);
    const notification = notifications.find(n => n.id === idx);
    if (notification && !notification.is_read) {
      markAsRead(idx);
    }
  };

  const notificationStats = useMemo(() => {
    const stats = {
      all: notifications.length,
      tasks: notifications.filter(n => n.resource_type === 'task').length,
      notes: notifications.filter(n => n.resource_type === 'note').length,
      projects: notifications.filter(n => n.resource_type === 'project').length,
      system: notifications.filter(n => n.resource_type === 'system' || (!n.resource_type && !n.title.toLowerCase().match(/task|note|project/))).length,
    };
    return stats;
  }, [notifications]);

  return (
    <div className="px-4 py-6 max-w-[1600px] mx-auto min-h-screen">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1 tracking-tight flex items-center gap-2">
             Notifications
          </h1>
          <p className="text-zinc-500 text-sm font-medium">Stay updated with team activity and system alerts.</p>
        </div>
        <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg border border-emerald-500/20 transition-all active:scale-95"
              >
                Mark all as read
              </button>
            )}
        </div>
      </div>

      <div className="glass rounded-3xl overflow-hidden border border-white/5 shadow-2xl flex flex-col md:flex-row h-[800px]">
        {/* Left Pane - List */}
        <div className="w-full md:w-80 lg:w-96 border-r border-white/5 flex flex-col bg-zinc-900/30">
          <div className="p-4 border-b border-white/5">
            <div className="relative group">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-emerald-500 transition-colors w-3.5 h-3.5" />
              <input 
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/5 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:bg-white/5 focus:border-white/10 transition-all placeholder:text-zinc-700"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-white/5 no-scrollbar">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((n) => (
                <div 
                  key={n.id}
                  onClick={() => handleSelect(n.id)}
                  className={`px-4 py-3.5 cursor-pointer transition-all relative group ${
                    selectedId === n.id 
                      ? 'bg-emerald-500/[0.03]' 
                      : 'hover:bg-white/[0.01]'
                  }`}
                >
                  <div className="flex gap-3">
                    <SenderAvatar user={n.sender} size="xs" />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex justify-between items-start">
                        <p className={`text-[11px] font-bold truncate transition-colors ${selectedId === n.id ? 'text-emerald-400' : 'text-zinc-100 group-hover:text-emerald-300'}`}>
                          {n.title}
                        </p>
                        <span className="text-[9px] text-zinc-600 shrink-0 ml-2 font-black uppercase tracking-tighter">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: false })}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 line-clamp-1 leading-normal font-medium">
                        {n.message}
                      </p>
                      <div className="flex items-center gap-2">
                        {!n.is_read && (
                          <div className="h-1 w-1 rounded-full bg-emerald-500" />
                        )}
                        {n.resource_type && (
                          <span className="text-[8px] font-black uppercase tracking-widest text-zinc-700">
                             {n.resource_type}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4 opacity-50">
                <FiBell size={32} className="text-zinc-700" />
                <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-600">Inbox is empty</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Pane - Content */}
        <div className="hidden md:flex flex-1 flex-col bg-zinc-950/40">
          {selectedNotification ? (
            <div className="h-full flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="p-6 lg:p-8 border-b border-white/5 bg-white/[0.01]">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <SenderAvatar user={selectedNotification.sender} size="sm" />
                    <div className="space-y-1">
                       <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border transition-all ${
                          selectedNotification.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          selectedNotification.type === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          selectedNotification.type === 'warning' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>
                          {selectedNotification.type}
                        </span>
                        <span className="text-[9px] text-zinc-600 flex items-center gap-1 font-black uppercase tracking-tight">
                          <FiClock className="w-3 h-3" />
                          {new Date(selectedNotification.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      </div>
                      <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight leading-tight">
                        {selectedNotification.title}
                      </h2>
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button className="p-2 rounded-lg bg-white/5 border border-white/10 text-zinc-500 hover:text-white hover:bg-white/10 transition-all active:scale-95">
                      <FiShare2 size={14} />
                    </button>
                    <button className="p-2 rounded-lg bg-white/5 border border-white/10 text-zinc-500 hover:text-white hover:bg-white/10 transition-all active:scale-95">
                      <FiMaximize2 size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8 no-scrollbar">
                <div className="max-w-2xl">
                  <p className="text-sm lg:text-base text-zinc-400 leading-relaxed font-medium">
                    {selectedNotification.message}
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-white/5 bg-zinc-900/10">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex gap-3 w-full sm:w-auto">
                    <button className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-emerald-500 text-zinc-950 font-black text-[10px] uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg active:scale-95">
                      Process
                    </button>
                    <button className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-300 font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95">
                      Dismiss
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] text-zinc-600 font-black uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                    <FiTag className="text-emerald-500/50" /> {selectedNotification.resource_type || 'General'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-8 animate-in fade-in duration-500">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/10 blur-[80px] rounded-full animate-pulse" />
                <div className="relative w-32 h-32 rounded-[3.5rem] bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-800 shadow-2xl transform hover:rotate-6 transition-transform duration-500">
                  <FiBell size={56} className="text-zinc-800" />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-white uppercase tracking-wider">Select a Transmission</h3>
                <p className="text-zinc-500 max-w-sm mx-auto font-medium leading-relaxed">Review incoming data streams from your workspace and connected operations.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
