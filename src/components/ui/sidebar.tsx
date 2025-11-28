"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
    FiHome, 
    FiFileText, 
    FiCalendar, 
    FiCpu, 
    FiSettings, 
    FiLayers, 
    FiCheckSquare, 
    FiClock, 
    FiLogOut,
    FiBriefcase,
    FiUsers
} from 'react-icons/fi';
import { LuPanelLeftClose, LuPanelLeftOpen } from "react-icons/lu";

import { logout } from '@/app/lib/actions';

interface SidebarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    roles?: string[];
  };
}

const Sidebar = ({ user }: SidebarProps) => {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const baseLinkClasses =
    "flex items-center py-2 px-4 rounded-xl transition-all duration-200 font-light text-sm hover:bg-white/5 hover:text-white hover-scale whitespace-nowrap";
  const activeLinkClasses =
    "bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-white/10 font-medium";
  const inactiveLinkClasses = "text-zinc-400";

  return (
    <div 
        className={`glass border-r border-white/5 absolute inset-y-0 left-0 transform -translate-x-full md:relative md:translate-x-0 transition-all duration-300 ease-in-out flex flex-col z-20 ${
            isCollapsed ? 'w-20' : 'w-64'
        }`}
    >
      <div className={`h-16 flex items-center border-b border-white/5 transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'justify-between px-6'}`}>
        {!isCollapsed && (
            <Link href="/" className="flex items-center gap-3 hover-scale">
            <div className="p-1.5 bg-white/5 rounded-lg border border-white/10">
                <FiLayers className="text-lg text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
                MD<span className="text-emerald-500">*</span>
            </span>
            </Link>
        )}
        {isCollapsed && (
             <div className="p-1.5 bg-white/5 rounded-lg border border-white/10">
                <FiLayers className="text-lg text-white" />
            </div>
        )}
        
        <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-zinc-400 hover:text-white transition-colors p-1"
        >
            {isCollapsed ? <LuPanelLeftOpen className="text-xl" /> : <LuPanelLeftClose className="text-xl" />}
        </button>
      </div>

      <div className="px-3 space-y-6 flex-1 overflow-y-auto py-4 overflow-x-hidden">
        {/* ... existing menu items ... */}
        <div>
          {!isCollapsed && (
              <h3 className="px-4 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 transition-opacity duration-300">
                Menu
              </h3>
          )}
          <nav className="space-y-1">
            <Link
              href="/"
              className={`${baseLinkClasses} ${
                pathname === "/" ? activeLinkClasses : inactiveLinkClasses
              } ${isCollapsed ? 'justify-center px-2' : ''}`}
              title={isCollapsed ? "Dashboard" : ""}
            >
              <FiHome className={`${isCollapsed ? 'text-xl' : 'mr-3 text-base'} text-blue-400`} />
              {!isCollapsed && "Dashboard"}
            </Link>
            <Link
              href="/tasks"
              className={`${baseLinkClasses} ${
                pathname === "/tasks" ? activeLinkClasses : inactiveLinkClasses
              } ${isCollapsed ? 'justify-center px-2' : ''}`}
              title={isCollapsed ? "Tasks" : ""}
            >
              <FiCheckSquare className={`${isCollapsed ? 'text-xl' : 'mr-3 text-base'} text-purple-400`} />
              {!isCollapsed && "Tasks"}
            </Link>
            <Link
              href="/projects"
              className={`${baseLinkClasses} ${
                pathname === "/projects" ? activeLinkClasses : inactiveLinkClasses
              } ${isCollapsed ? 'justify-center px-2' : ''}`}
              title={isCollapsed ? "Projects" : ""}
            >
              <FiBriefcase className={`${isCollapsed ? 'text-xl' : 'mr-3 text-base'} text-pink-400`} />
              {!isCollapsed && "Projects"}
            </Link>
            <Link
              href="/notes"
              className={`${baseLinkClasses} ${
                pathname === "/notes" ? activeLinkClasses : inactiveLinkClasses
              } ${isCollapsed ? 'justify-center px-2' : ''}`}
              title={isCollapsed ? "Notes" : ""}
            >
              <FiFileText className={`${isCollapsed ? 'text-xl' : 'mr-3 text-base'} text-yellow-400`} />
              {!isCollapsed && "Notes"}
            </Link>
            <Link
              href="/calendar"
              className={`${baseLinkClasses} ${
                pathname === "/calendar" ? activeLinkClasses : inactiveLinkClasses
              } ${isCollapsed ? 'justify-center px-2' : ''}`}
              title={isCollapsed ? "Calendar" : ""}
            >
              <FiCalendar className={`${isCollapsed ? 'text-xl' : 'mr-3 text-base'} text-green-400`} />
              {!isCollapsed && "Calendar"}
            </Link>
          </nav>
        </div>

        <div>
          {!isCollapsed && (
              <h3 className="px-4 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 transition-opacity duration-300">
                Tools
              </h3>
          )}
          <nav className="space-y-1">
            <Link
              href="/focus"
              className={`${baseLinkClasses} ${
                pathname === "/focus" ? activeLinkClasses : inactiveLinkClasses
              } ${isCollapsed ? 'justify-center px-2' : ''}`}
              title={isCollapsed ? "Focus Mode" : ""}
            >
              <FiClock className={`${isCollapsed ? 'text-xl' : 'mr-3 text-base'} text-orange-400`} />
              {!isCollapsed && "Focus Mode"}
            </Link>
            <Link
              href="/assistant"
              className={`${baseLinkClasses} ${
                pathname === "/assistant" ? activeLinkClasses : inactiveLinkClasses
              } ${isCollapsed ? 'justify-center px-2' : ''}`}
              title={isCollapsed ? "AI Assistant" : ""}
            >
              <FiCpu className={`${isCollapsed ? 'text-xl' : 'mr-3 text-base'} text-cyan-400`} />
              {!isCollapsed && "AI Assistant"}
            </Link>
            <Link
              href="/settings"
              className={`${baseLinkClasses} ${
                pathname === "/settings" ? activeLinkClasses : inactiveLinkClasses
              } ${isCollapsed ? 'justify-center px-2' : ''}`}
              title={isCollapsed ? "Settings" : ""}
            >
              <FiSettings className={`${isCollapsed ? 'text-xl' : 'mr-3 text-base'} text-indigo-400`} />
              {!isCollapsed && "Settings"}
            </Link>
            {(user?.roles?.some(r => ['super_admin', 'manager'].includes(r))) && (
              <>
                <Link
                  href="/users"
                  className={`${baseLinkClasses} ${
                    pathname === "/users" ? activeLinkClasses : inactiveLinkClasses
                  } ${isCollapsed ? 'justify-center px-2' : ''}`}
                  title={isCollapsed ? "Users" : ""}
                >
                  <FiUsers className={`${isCollapsed ? 'text-xl' : 'mr-3 text-base'} text-teal-400`} />
                  {!isCollapsed && "Users"}
                </Link>
                <Link
                  href="/clients"
                  className={`${baseLinkClasses} ${
                    pathname === "/clients" ? activeLinkClasses : inactiveLinkClasses
                  } ${isCollapsed ? 'justify-center px-2' : ''}`}
                  title={isCollapsed ? "Clients" : ""}
                >
                  <FiUsers className={`${isCollapsed ? 'text-xl' : 'mr-3 text-base'} text-violet-400`} />
                  {!isCollapsed && "Clients"}
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>

      <div className="p-3 border-t border-white/5 space-y-3">
        {user && (
            <div className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-4'} py-2 transition-all duration-300`}>
                {user.image ? (
                    <div className="relative w-8 h-8 flex-shrink-0">
                        <Image 
                            src={user.image} 
                            alt={user.name || 'User'} 
                            fill
                            className="rounded-full object-cover border border-emerald-500/30"
                        />
                    </div>
                ) : (
                    <div className="w-8 h-8 flex-shrink-0 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold border border-emerald-500/30">
                        {(user.name || user.email || '?').charAt(0).toUpperCase()}
                    </div>
                )}
                {!isCollapsed && (
                    <div className="ml-3 overflow-hidden transition-opacity duration-300">
                        <p className="text-sm font-medium text-white truncate">{user.name || 'User'}</p>
                        <p className="text-xs text-zinc-500 truncate capitalize">{user.roles?.[0]?.replace('_', ' ') || 'Member'}</p>
                    </div>
                )}
            </div>
        )}
        {user ? (
            <button 
                onClick={() => logout()} 
                className={`flex items-center w-full py-2 rounded-xl text-zinc-400 text-sm hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 hover-scale ${isCollapsed ? 'justify-center px-2' : 'px-4'}`}
                title={isCollapsed ? "Sign Out" : ""}
            >
            <FiLogOut className={`${isCollapsed ? 'text-xl' : 'mr-3 text-base'}`} />
            {!isCollapsed && "Sign Out"}
            </button>
        ) : (
            <Link 
                href="/login" 
                className={`flex items-center w-full py-2 rounded-xl text-zinc-400 text-sm hover:bg-emerald-500/10 hover:text-emerald-400 transition-all duration-200 hover-scale ${isCollapsed ? 'justify-center px-2' : 'px-4'}`}
                title={isCollapsed ? "Login" : ""}
            >
            <FiLogOut className={`${isCollapsed ? 'text-xl' : 'mr-3 text-base'} rotate-180`} />
            {!isCollapsed && "Login"}
            </Link>
        )}
      </div>
    </div>
  );
};

export default Sidebar;