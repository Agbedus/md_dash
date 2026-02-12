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

      // Prioritize resource_type, fallback to title parsing
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

  // Set initial selected notification
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

  return (
    <div className="h-[calc(100vh-6rem)] md:h-[calc(100vh-6rem)] overflow-hidden flex flex-col">
      <div className="px-6 py-4 border-b border-white/5 bg-zinc-950/50 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FiInbox className="text-emerald-400" /> Inbox
          </h1>
          <div className="h-4 w-[1px] bg-white/10" />
          <p className="text-xs text-zinc-500 font-medium">{unreadCount} unread sessions active</p>
        </div>
        
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg border border-emerald-500/20 transition-all font-bold"
            >
              Flush Unread
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane - List (Master) */}
        <div className="w-full md:w-80 lg:w-96 border-r border-white/5 flex flex-col bg-zinc-900/30">
          {/* List Search & Filter */}
          <div className="h-[136px] p-6 border-b border-white/5 flex flex-col justify-between">
            <div className="relative group">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500 transition-colors w-3.5 h-3.5" />
              <input 
                type="text"
                placeholder="Search archive..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:bg-white/10 focus:border-white/20 transition-all placeholder:text-zinc-600"
              />
            </div>
            
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setSelectedId(null); }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${
                      isActive 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                        : 'border-transparent text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/5 no-scrollbar">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((n) => (
                <div 
                  key={n.id}
                  onClick={() => handleSelect(n.id)}
                  className={`p-4 cursor-pointer transition-all relative ${
                    selectedId === n.id 
                      ? 'bg-emerald-500/5' 
                      : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex gap-4">
                    <SenderAvatar user={n.sender} size="sm" />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col min-w-0">
                          <p className={`text-xs font-bold truncate ${selectedId === n.id ? 'text-emerald-400' : 'text-white'}`}>
                            {n.title}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {n.resource_type && (
                              <span className="px-1 py-0 rounded bg-white/5 border border-white/10 text-[8px] font-black uppercase tracking-widest text-zinc-500">
                                {n.resource_type}
                              </span>
                            )}
                            <span className="text-[9px] text-zinc-600 font-medium truncate">
                              {n.message}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] text-zinc-600 shrink-0 ml-2 font-medium tracking-tight">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: false })}
                        </span>
                      </div>
                    </div>
                    {!n.is_read && (
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1" />
                    )}
                    {selectedId === n.id && (
                      <div className="absolute left-0 top-0 bottom-0 w-[2.5px] bg-emerald-500" />
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center space-y-2">
                <FiBell className="mx-auto text-zinc-800" size={24} />
                <p className="text-xs text-zinc-600 font-medium uppercase tracking-widest">Archive Empty</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Pane - Content (Detail) */}
        <div className="hidden md:flex flex-1 flex-col bg-zinc-950">
          {selectedNotification ? (
            <div className="h-full flex flex-col overflow-hidden">
              {/* Detail Header */}
              <div className="h-[136px] p-6 border-b border-white/5 flex flex-col justify-center">
                <div className="flex justify-between items-center gap-6">
                  <div className="flex items-center gap-5 min-w-0">
                    <SenderAvatar user={selectedNotification.sender} size="md" />
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${
                          selectedNotification.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          selectedNotification.type === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          selectedNotification.type === 'warning' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>
                          {selectedNotification.type}
                        </span>
                        {selectedNotification.resource_type && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${
                            selectedNotification.resource_type === 'task' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            selectedNotification.resource_type === 'note' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            selectedNotification.resource_type === 'project' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            'bg-violet-500/10 text-violet-400 border-violet-500/20'
                          }`}>
                            {selectedNotification.resource_type}
                          </span>
                        )}
                        <span className="text-[10px] text-zinc-500 flex items-center gap-1.5 font-bold uppercase tracking-widest">
                          <FiClock className="w-3.5 h-3.5" />
                          {new Date(selectedNotification.created_at).toLocaleString()}
                        </span>
                      </div>
                      <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-tight leading-tight truncate">
                        {selectedNotification.title}
                      </h2>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all">
                      <FiShare2 size={16} />
                    </button>
                    <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all">
                      <FiMaximize2 size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Detail Content */}
              <div className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-12 no-scrollbar">
                <div className="max-w-3xl">
                  <p className="text-lg lg:text-xl text-zinc-300 leading-relaxed font-medium">
                    {selectedNotification.message}
                  </p>
                </div>

                {/* Technical / Meta Section */}
                {isSuperAdmin && (
                  <div className="p-8 rounded-3xl bg-white/5 border border-white/5 space-y-8 max-w-4xl">
                    <div className="flex items-center gap-3 text-violet-400">
                      <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
                        <FiCpu className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-widest">System Metadata</h4>
                        <p className="text-[10px] text-violet-400/50 font-medium">Platform Engineering Insight</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">Notification UID</p>
                        <p className="text-xs text-zinc-300 font-mono bg-white/5 p-2 rounded-lg border border-white/5 break-all">{selectedNotification.id}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">Recipient UUID</p>
                        <p className="text-xs text-zinc-300 font-mono bg-white/5 p-2 rounded-lg border border-white/5 break-all">{selectedNotification.recipient_id}</p>
                      </div>
                      {selectedNotification.sender_id && (
                        <div className="space-y-2">
                          <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">Origin Sender UUID</p>
                          <p className="text-xs text-zinc-300 font-mono bg-white/5 p-2 rounded-lg border border-white/5 break-all">{selectedNotification.sender_id}</p>
                        </div>
                      )}
                      <div className="space-y-2">
                        <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">Protocol Version</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-zinc-300 font-mono bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-md border border-emerald-500/20">v1.2.4-stable</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Detail Footer - Actions at the bottom */}
              <div className="p-8 border-t border-white/5 bg-zinc-900/10 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex gap-4">
                    <button className="px-6 py-2.5 rounded-xl bg-emerald-500 text-zinc-950 font-black text-[11px] uppercase tracking-[0.15em] hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
                      Process Notification
                    </button>
                    <button className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-black text-[11px] uppercase tracking-[0.15em] hover:bg-white/10 transition-all active:scale-95">
                      Context View
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-600 font-black uppercase tracking-widest">
                    <FiTag className="text-zinc-500" /> System, Critical, Dash
                  </div>
                </div>
                
                <div className="flex items-center justify-between opacity-50 hover:opacity-100 transition-opacity pt-2">
                  <div className="flex items-center gap-2 text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                    Entry verified by automated system log
                  </div>
                  <button className="text-[10px] text-rose-500/70 font-black uppercase tracking-widest hover:text-rose-400 transition-colors flex items-center gap-1.5">
                    <FiX /> Purge Alert Archive
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-6">
              <div className="w-24 h-24 rounded-[2rem] bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-800 shadow-2xl skew-y-3">
                <FiBell size={48} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white uppercase tracking-tight">Select an alert</h3>
                <p className="text-sm text-zinc-500 max-w-xs mx-auto">Click on a notification in the sidebar to review full details and take action.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
