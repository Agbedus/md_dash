'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import KeyboardShortcutsModal from '@/components/ui/keyboard-shortcuts-modal';
import { useGlobalShortcuts } from '@/hooks/use-global-shortcuts';
import { CommandMenu } from '@/components/ui/command-menu';

interface GlobalActionContextType {
    openShortcutsModal: () => void;
    setIsCommandOpen: (open: boolean) => void;
    isCommandOpen: boolean;
}

const GlobalActionContext = createContext<GlobalActionContextType | undefined>(undefined);

export function useGlobalActions() {
    const context = useContext(GlobalActionContext);
    if (!context) {
        throw new Error('useGlobalActions must be used within a GlobalActionProvider');
    }
    return context;
}

import { useTheme } from '@/providers/theme-provider';
import { useRouter } from 'next/navigation';

export function GlobalActionProvider({ children }: { children: ReactNode }) {
    const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
    const [isCommandOpen, setIsCommandOpen] = useState(false);
    const { toggleTheme } = useTheme();
    const router = useRouter();

    const openShortcuts = useCallback(() => setIsShortcutsOpen(true), []);
    const closeAll = useCallback(() => {
        setIsShortcutsOpen(false);
        setIsCommandOpen(false);
    }, []);

    useGlobalShortcuts({
        '?': openShortcuts,
        'Escape': closeAll,
        '⌘+K': () => setIsCommandOpen(true),
        'c': () => setIsCommandOpen(true),
        't': toggleTheme,
        'g h': () => router.push('/dashboard'),
        'g p': () => router.push('/projects'),
        'g t': () => router.push('/tasks'),
        'g n': () => router.push('/notes'),
        'g l': () => router.push('/clients'),
        'n': () => router.push('/notes?new=true'),
        'a': () => router.push('/attendance'),
    });

    return (
        <GlobalActionContext.Provider value={{ 
            openShortcutsModal: openShortcuts,
            isCommandOpen,
            setIsCommandOpen
        }}>
            {children}
            <KeyboardShortcutsModal 
                isOpen={isShortcutsOpen} 
                onClose={() => setIsShortcutsOpen(false)} 
            />
            <CommandMenu open={isCommandOpen} setOpen={setIsCommandOpen} />
        </GlobalActionContext.Provider>
    );
}
