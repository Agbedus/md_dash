"use client";
import React from "react";
import { format } from "date-fns";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import type { CalendarView } from "@/types/calendar";

interface ToolbarProps {
  currentDate: Date;
  view: CalendarView;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onChangeView?: (v: CalendarView) => void;
}

export default function Toolbar({ currentDate, view, onPrev, onNext, onToday, onChangeView }: ToolbarProps) {
  return (
    <div className="glass p-4 rounded-2xl mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
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
      </div>
      
      <div className="text-xl font-bold text-white tracking-tight">
        {format(currentDate, "MMMM yyyy")}
      </div>

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
    </div>
  );
}
