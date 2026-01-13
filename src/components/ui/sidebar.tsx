"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useDashboard } from './dashboard-layout';
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
    FiUsers,
    FiMenu
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
  const { isMobileExpanded, setIsMobileExpanded, isDesktopCollapsed, setIsDesktopCollapsed } = useDashboard();
  
  const baseLinkClasses =
    "flex items-center py-2 rounded-xl transition-all duration-200 font-light text-sm hover:bg-white/5 hover:text-white hover-scale whitespace-nowrap";
  const activeLinkClasses =
    "bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-white/10 font-medium";
  const inactiveLinkClasses = "text-zinc-400";

  // Unified expansion state for easier logic Check
  // Note: We still use responsive classes for CSS, but these help with layout decisions
  const isExpandedMobile = isMobileExpanded;
  const isExpandedDesktop = !isDesktopCollapsed;

  // Responsive State Classes
  const widthClass = `${isExpandedMobile ? 'w-64' : 'w-20'} md:${isExpandedDesktop ? 'w-64' : 'w-20'}`;
  
  const itemAlignmentClass = `${isExpandedMobile ? 'justify-start px-6' : 'justify-center px-0'} md:${isExpandedDesktop ? 'justify-start px-6' : 'justify-center px-0'}`;
  
  const contentVisibilityClass = `${isExpandedMobile ? 'block' : 'hidden'} md:${isExpandedDesktop ? 'block' : 'hidden'}`;
  
  const inverseContentVisibilityClass = `${isExpandedMobile ? 'hidden' : 'block'} md:${isExpandedDesktop ? 'hidden' : 'block'}`;
  
  const iconSpacingClass = `${isExpandedMobile ? 'gap-4' : ''} md:${isExpandedDesktop ? 'gap-4' : ''}`;
  
  const iconSizeClass = `${isExpandedMobile ? 'text-base' : 'text-xl'} md:${isExpandedDesktop ? 'text-base' : 'text-xl'}`;
  
  const headerPaddingClass = `${isExpandedMobile ? 'px-6' : 'px-0'} md:${isExpandedDesktop ? 'px-6' : 'px-0'}`;

  // Menu Items Config
  const mainMenuItems = [
    { href: '/', icon: FiHome, label: 'Dashboard', color: 'text-blue-400' },
    { href: '/tasks', icon: FiCheckSquare, label: 'Tasks', color: 'text-purple-400' },
    { href: '/projects', icon: FiBriefcase, label: 'Projects', color: 'text-pink-400' },
    { href: '/notes', icon: FiFileText, label: 'Notes', color: 'text-yellow-400' },
    { href: '/calendar', icon: FiCalendar, label: 'Calendar', color: 'text-green-400' },
  ];

  const toolMenuItems = [
    { href: '/focus', icon: FiClock, label: 'Focus Mode', color: 'text-orange-400' },
    { href: '/assistant', icon: FiCpu, label: 'AI Assistant', color: 'text-cyan-400' },
    { href: '/settings', icon: FiSettings, label: 'Settings', color: 'text-indigo-400' },
  ];

  const renderMenuItem = (item: any) => (
    <Link
      key={item.href}
      href={item.href}
      className={`${baseLinkClasses} ${pathname === item.href ? activeLinkClasses : inactiveLinkClasses} ${itemAlignmentClass} ${iconSpacingClass}`}
    >
      <item.icon className={`flex-shrink-0 ${iconSizeClass} ${item.color}`} />
      <span className={contentVisibilityClass}>{item.label}</span>
    </Link>
  );

  return (
    <div 
        className={`glass border-r border-white/5 relative inset-y-0 left-0 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col z-40 h-full ${widthClass}`}
    >
      {/* Header Branding & Toggle */}
      <div className={`h-20 flex items-center border-b border-white/5 transition-all duration-300 ${headerPaddingClass} ${
          isExpandedMobile ? 'justify-between' : (isExpandedDesktop ? 'md:justify-between' : 'justify-center')
      }`}>
        <div className={`flex items-center gap-2 ${
            (isExpandedMobile || isExpandedDesktop) ? 'w-full justify-between' : 'justify-center'
        }`}>
            {/* Logo Group */}
            <Link href="/" className="flex items-center gap-3 hover-scale flex-shrink-0">
                <div className="p-1.5 bg-white/5 rounded-lg border border-white/10 flex-shrink-0">
                    <FiLayers className="text-lg text-white" />
                </div>
                <span className={`text-xl font-bold tracking-tight text-white ${contentVisibilityClass}`}>
                    MD<span className="text-emerald-500">*</span>
                </span>
            </Link>

            {/* Toggle Button */}
            <button 
                onClick={() => {
                    if (typeof window !== 'undefined' && window.innerWidth < 768) {
                        setIsMobileExpanded(!isMobileExpanded);
                    } else {
                        setIsDesktopCollapsed(!isDesktopCollapsed);
                    }
                }}
                className="text-zinc-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5 flex-shrink-0"
            >
                <span className={contentVisibilityClass}>
                    <LuPanelLeftClose className="text-xl" />
                </span>
                <span className={inverseContentVisibilityClass}>
                    <LuPanelLeftOpen className="text-xl" />
                </span>
            </button>
        </div>
      </div>

      <div className="space-y-6 flex-1 overflow-y-auto py-4 overflow-x-hidden">
        <div>
           <h3 className={`px-6 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 transition-opacity duration-300 ${contentVisibilityClass}`}>
                Menu
            </h3>
          <nav className="space-y-1">
            {mainMenuItems.map(renderMenuItem)}
          </nav>
        </div>

        <div>
           <h3 className={`px-6 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 transition-opacity duration-300 ${contentVisibilityClass}`}>
                Tools
            </h3>
          <nav className="space-y-1">
            {toolMenuItems.map(renderMenuItem)}
            {user?.roles?.some(r => ['super_admin', 'admin'].includes(r)) && (
                <>
                <Link
                  href="/users"
                  className={`${baseLinkClasses} ${pathname === "/users" ? activeLinkClasses : inactiveLinkClasses} ${itemAlignmentClass} ${iconSpacingClass}`}
                >
                  <FiUsers className={`${iconSizeClass} text-teal-400 flex-shrink-0`} />
                  <span className={contentVisibilityClass}>Users</span>
                </Link>
                <Link
                  href="/clients"
                  className={`${baseLinkClasses} ${pathname === "/clients" ? activeLinkClasses : inactiveLinkClasses} ${itemAlignmentClass} ${iconSpacingClass}`}
                >
                  <FiUsers className={`${iconSizeClass} text-violet-400 flex-shrink-0`} />
                  <span className={contentVisibilityClass}>Clients</span>
                </Link>
                </>
            )}
          </nav>
        </div>
      </div>

      <div className="py-3 border-t border-white/5 space-y-3">
        {user && (
            <div className={`flex items-center ${itemAlignmentClass} py-2 transition-all duration-300`}> 
                {/* User Avatar */}
                <div className={`relative w-8 h-8 flex-shrink-0`}>
                    {user.image ? (
                         <Image 
                            src={user.image} 
                            alt={user.name || 'User'} 
                            fill
                            className="rounded-full object-cover border border-emerald-500/30"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold border border-emerald-500/30">
                            {(user.name || user.email || '?').charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>

                {/* User Info Text */}
                <div className={`flex-1 ml-3 overflow-hidden transition-opacity duration-300 ${contentVisibilityClass}`}>
                    <p className="text-sm font-medium text-white truncate">{user.name || 'User'}</p>
                    <p className="text-xs text-zinc-500 truncate capitalize">{user.roles?.[0]?.replace('_', ' ') || 'Member'}</p>
                </div>
            </div>
        )}
        
        {user ? (
            <button 
                onClick={() => logout()} 
                className={`flex items-center w-full py-2 rounded-xl text-zinc-400 text-sm hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 hover-scale ${itemAlignmentClass} ${iconSpacingClass}`}
            >
            <FiLogOut className={`${iconSizeClass} flex-shrink-0`} />
            <span className={contentVisibilityClass}>Sign Out</span>
            </button>
        ) : (
            <Link 
                href="/login" 
                className={`flex items-center w-full py-2 rounded-xl text-zinc-400 text-sm hover:bg-emerald-500/10 hover:text-emerald-400 transition-all duration-200 hover-scale ${itemAlignmentClass} ${iconSpacingClass}`}
            >
            <FiLogOut className={`${iconSizeClass} rotate-180 flex-shrink-0`} />
            <span className={contentVisibilityClass}>Login</span>
            </Link>
        )}
      </div>
    </div>
  );
};

export default Sidebar;