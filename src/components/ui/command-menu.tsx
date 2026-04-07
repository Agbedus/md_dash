"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { FiSearch, FiHome, FiCheckSquare, FiCalendar, FiCpu, FiSettings, FiSun, FiMoon } from "react-icons/fi";

interface CommandMenuProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function CommandMenu({ open, setOpen }: CommandMenuProps) {
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") {
         setOpen(false) 
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setOpen]);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, [setOpen]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] px-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-md transition-opacity animate-in fade-in" 
        onClick={() => setOpen(false)}
      />
      
      {/* Dialog */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-card-border bg-card animate-in fade-in zoom-in-95 duration-200">
        <Command className="w-full bg-transparent">
          <div className="flex items-center border-b border-card-border px-3">
            <FiSearch className="mr-2 h-4 w-4 text-text-muted shrink-0" />
            <Command.Input 
              placeholder="Type a command or search..."
              className="flex h-12 w-full rouneded-md bg-transparent py-3 text-sm outline-none placeholder:text-text-muted text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              autoFocus
            />
          </div>
          
          <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2 scrollbar-hide">
            <Command.Empty className="py-6 text-center text-sm text-text-muted">
              No results found.
            </Command.Empty>

            <Command.Group heading="Navigation" className="text-xs font-medium text-text-muted px-2 py-1.5">
              <Command.Item
                onSelect={() => runCommand(() => router.push("/"))}
                className="relative flex cursor-pointer select-none items-center rounded-lg px-2 py-2 text-sm text-text-secondary hover:bg-foreground/[0.05] hover:text-foreground aria-selected:bg-foreground/[0.05] aria-selected:text-foreground transition-colors"
              >
                <FiHome className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/tasks"))}
                className="relative flex cursor-pointer select-none items-center rounded-lg px-2 py-2 text-sm text-text-secondary hover:bg-foreground/[0.05] hover:text-foreground aria-selected:bg-foreground/[0.05] aria-selected:text-foreground transition-colors"
              >
                <FiCheckSquare className="mr-2 h-4 w-4" />
                <span>Tasks</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/calendar"))}
                className="relative flex cursor-pointer select-none items-center rounded-lg px-2 py-2 text-sm text-text-secondary hover:bg-foreground/[0.05] hover:text-foreground aria-selected:bg-foreground/[0.05] aria-selected:text-foreground transition-colors"
              >
                <FiCalendar className="mr-2 h-4 w-4" />
                <span>Calendar</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/assistant"))}
                className="relative flex cursor-pointer select-none items-center rounded-lg px-2 py-2 text-sm text-text-secondary hover:bg-foreground/[0.05] hover:text-foreground aria-selected:bg-foreground/[0.05] aria-selected:text-foreground transition-colors"
              >
                <FiCpu className="mr-2 h-4 w-4" />
                <span>AI Assistant</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/settings"))}
                className="relative flex cursor-pointer select-none items-center rounded-lg px-2 py-2 text-sm text-text-secondary hover:bg-foreground/[0.05] hover:text-foreground aria-selected:bg-foreground/[0.05] aria-selected:text-foreground transition-colors"
              >
                <FiSettings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Command.Item>
            </Command.Group>

            <Command.Separator className="my-1 h-px bg-card-border" />

            <Command.Group heading="Appearance" className="text-xs font-medium text-text-muted px-2 py-1.5">
              <Command.Item
                onSelect={() => runCommand(() => console.log("Theme Light"))} 
                className="relative flex cursor-pointer select-none items-center rounded-lg px-2 py-2 text-sm text-text-secondary hover:bg-foreground/[0.05] hover:text-foreground aria-selected:bg-foreground/[0.05] aria-selected:text-foreground transition-colors"
              >
                <FiSun className="mr-2 h-4 w-4" />
                <span>Light Mode</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => console.log("Theme Dark"))}
                className="relative flex cursor-pointer select-none items-center rounded-lg px-2 py-2 text-sm text-text-secondary hover:bg-foreground/[0.05] hover:text-foreground aria-selected:bg-foreground/[0.05] aria-selected:text-foreground transition-colors"
              >
                <FiMoon className="mr-2 h-4 w-4" />
                <span>Dark Mode</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
          
          <div className="border-t border-card-border px-2 py-2 flex items-center justify-between text-[11px] text-text-muted">
             <div className="flex items-center gap-1">
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-card-border bg-foreground/[0.05] px-1.5 font-mono font-medium opacity-100">
                  <span className="text-xs">↑</span>
                </kbd>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-card-border bg-foreground/[0.05] px-1.5 font-mono font-medium opacity-100">
                  <span className="text-xs">↓</span>
                </kbd>
                <span>to navigate</span>
             </div>
             <div className="flex items-center gap-1">
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-card-border bg-foreground/[0.05] px-1.5 font-mono font-medium opacity-100">
                  <span className="text-xs">esc</span>
                </kbd>
                <span>to close</span>
             </div>
          </div>
        </Command>
      </div>
    </div>
  );
}
