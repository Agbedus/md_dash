"use client";
import React from "react";
import { format } from "date-fns";
import { FiChevronLeft, FiChevronRight, FiPlus, FiSun } from "react-icons/fi";
import type { CalendarView } from "@/types/calendar";

interface ToolbarProps {
  currentDate: Date;
  view: CalendarView;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onChangeView?: (v: CalendarView) => void;
  onAddEvent?: () => void;
  onRequestTimeOff?: () => void;
  canRequestTimeOff?: boolean;
  activeFilter: 'projects' | 'tasks' | 'events' | 'timeOff';
  setActiveFilter: (filter: 'projects' | 'tasks' | 'events' | 'timeOff') => void;
  hideViewSwitcher?: boolean;
}

export default function Toolbar({ 
  currentDate, view, onPrev, onNext, onToday, onChangeView, onAddEvent,
  onRequestTimeOff, canRequestTimeOff,
  activeFilter, setActiveFilter,
  hideViewSwitcher
}: ToolbarProps) {
  return (
    <div className="flex flex-col gap-6 mb-8">
      <div className="glass p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white/[0.03] rounded-xl border border-white/5 p-1">
              <button onClick={onPrev} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all">
              <FiChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={onNext} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all">
              <FiChevronRight className="h-4 w-4" />
              </button>
          </div>
          <button 
              onClick={onToday} 
              className="px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-zinc-400 hover:text-white hover:bg-white/[0.06] text-sm font-medium transition-all"
          >
              Today
          </button>
          {onAddEvent && (
              <button 
                  onClick={onAddEvent} 
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--pastel-indigo)]/10 border border-[var(--pastel-indigo)]/20 text-[var(--pastel-indigo)] hover:bg-[var(--pastel-indigo)]/20 text-sm font-bold transition-all ml-2"
              >
                  <FiPlus className="h-4 w-4" />
                  <span>Event</span>
              </button>
          )}
          {canRequestTimeOff && onRequestTimeOff && (
              <button 
                  onClick={onRequestTimeOff} 
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 text-sm font-bold transition-all"
              >
                  <FiSun className="h-4 w-4" />
                  <span>Time Off</span>
              </button>
          )}
        </div>
        
        <div className="text-xl font-bold text-white tracking-tight">
          {format(currentDate, "MMMM yyyy")}
        </div>

        {!hideViewSwitcher && (
          <div className="flex items-center space-x-1 bg-white/[0.03] p-1 rounded-xl border border-white/5">
            {(['month', 'week', 'day'] as const).map((v) => (
                <button
                    key={v}
                    onClick={() => onChangeView?.(v)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        view === v 
                        ? "bg-white/[0.06] text-white shadow-sm" 
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                >
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
            ))}
          </div>
        )}
      </div>

      {/* Filter Toggles */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-2">
          {/* Main Calendar Group */}
          <div className="flex flex-col gap-2.5">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">Main Calendar</span>
              <div className="flex items-center gap-2">
                  <FilterToggle 
                    label="Events" 
                    active={activeFilter === 'events'} 
                    onClick={() => setActiveFilter('events')}
                    color="purple"
                  />
                  <FilterToggle 
                    label="Tasks" 
                    active={activeFilter === 'tasks'} 
                    onClick={() => setActiveFilter('tasks')}
                    color="emerald"
                  />
              </div>
          </div>

          <div className="hidden sm:block h-6 w-px bg-white/10 self-end mb-2" />

          {/* Timeline Group */}
          <div className="flex flex-col gap-2.5">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">Timeline (Gantt)</span>
              <div className="flex items-center gap-2">
                  <FilterToggle 
                    label="Projects" 
                    active={activeFilter === 'projects'} 
                    onClick={() => setActiveFilter('projects')}
                    color="indigo"
                  />
                  <FilterToggle 
                    label="Time Off" 
                    active={activeFilter === 'timeOff'} 
                    onClick={() => setActiveFilter('timeOff')}
                    color="amber"
                  />
              </div>
          </div>
      </div>
    </div>
  );
}

function FilterToggle({ label, active, onClick, color }: { label: string, active: boolean, onClick: () => void, color: 'indigo' | 'emerald' | 'purple' | 'amber' }) {
    const activeColors = {
        indigo: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.1)]',
        emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]',
        purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.1)]',
        amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
    };

    return (
        <button
            onClick={onClick}
            className={`
                px-4 py-2 rounded-xl border text-xs font-bold uppercase tracking-widest transition-all duration-300
                ${active 
                    ? activeColors[color] 
                    : 'bg-white/[0.02] border-white/5 text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'
                }
            `}
        >
            {label}
        </button>
    );
}
