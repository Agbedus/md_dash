'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHome, FiCheckSquare, FiSearch, FiCalendar, FiMenu, FiBriefcase, FiFileText, FiClock, FiCpu, FiSettings, FiLogOut } from 'react-icons/fi';
import { motion } from 'framer-motion';

export function MobileNav({ setIsCommandOpen }: { setIsCommandOpen: (open: boolean) => void }) {
    const pathname = usePathname();

    // State for the "More" menu popup
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    const navItems = [
        { href: '/', icon: FiHome, label: 'Home' },
        { href: '/tasks', icon: FiCheckSquare, label: 'Tasks' },
        { 
            icon: FiSearch, 
            label: 'Search', 
            onClick: () => setIsCommandOpen(true),
            isAction: true 
        },
        { href: '/calendar', icon: FiCalendar, label: 'Calendar' },
        { 
            icon: FiMenu, 
            label: 'Menu', 
            onClick: () => setIsMenuOpen(!isMenuOpen),
            isAction: true,
            isActive: isMenuOpen 
        }, 
    ];

    // Secondary menu items (same as sidebar)
    const secondaryItems = [
        { href: "/projects", icon: FiBriefcase, label: "Projects", color: "text-pink-400" },
        { href: "/notes", icon: FiFileText, label: "Notes", color: "text-yellow-400" },
        { href: "/focus", icon: FiClock, label: "Focus Mode", color: "text-orange-400" },
        { href: "/assistant", icon: FiCpu, label: "AI Assistant", color: "text-cyan-400" },
        { href: "/settings", icon: FiSettings, label: "Settings", color: "text-indigo-400" },
    ];

    return (
        <>
            {/* Mobile Menu Popup */}
            <div className={`md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMenuOpen(false)} />
            
            <div className={`md:hidden fixed bottom-20 right-4 z-50 transition-all duration-300 transform ${isMenuOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95 pointer-events-none'}`}>
                <div className="w-56 bg-zinc-900 border border-white/5 rounded-2xl shadow-2xl overflow-hidden max-h-[60vh] overflow-y-auto">
                    <div className="flex flex-col">
                        {secondaryItems.map((item, index) => (
                            <Link 
                                key={index} 
                                href={item.href}
                                onClick={() => setIsMenuOpen(false)}
                                className="flex items-center gap-3 p-4 hover:bg-white/[0.03] transition-colors border-b border-white/5 last:border-0"
                            >
                                <item.icon className={`text-lg ${item.color}`} />
                                <span className="text-sm font-medium text-zinc-300">{item.label}</span>
                            </Link>
                        ))}
                         <button
                            onClick={() => {
                                setIsMenuOpen(false);
                                // Add logout logic here if needed, or link to a logout route
                             }}
                            className="flex items-center gap-3 p-4 hover:bg-red-500/10 transition-colors w-full text-left"
                        >
                            <FiLogOut className="text-lg text-red-400" />
                            <span className="text-sm font-medium text-red-400">Sign Out</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#09090b]/80 backdrop-blur-xl border-t border-white/5 z-50 px-6 pb-safe">
            <div className="flex justify-between items-center h-full">
                {navItems.map((item, index) => {
                    const isActive = pathname === item.href || (item.isActive);
                    const Icon = item.icon;

                    if (item.isAction) {
                        return (
                            <button
                                key={index}
                                onClick={item.onClick}
                                className={`flex flex-col items-center justify-center gap-1 transition-colors ${isActive ? 'text-white' : 'text-zinc-500 active:text-white'}`}
                            >
                                <div className={`relative p-1`}>
                                     <Icon size={20} />
                                     {isActive && (
                                        <motion.div
                                            layoutId="mobile-nav-indicator"
                                            className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-500 rounded-full"
                                        />
                                    )}
                                </div>
                                <span className="text-[11px] font-medium">{item.label}</span>
                            </button>
                        );
                    }

                    return (
                        <Link
                            key={index}
                            href={item.href || '#'}
                            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                                isActive ? 'text-white' : 'text-zinc-500'
                            }`}
                        >
                            <div className="relative">
                                <Icon size={20} />
                                {isActive && (
                                    <motion.div
                                        layoutId="mobile-nav-indicator"
                                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-500 rounded-full"
                                    />
                                )}
                            </div>
                            <span className="text-[11px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
        </>
    );
}
