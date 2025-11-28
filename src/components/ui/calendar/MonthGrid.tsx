"use client";
import React from "react";
import { FiCheckCircle } from "react-icons/fi";
import { addDays, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek } from "date-fns";
import type { CalendarEvent } from "@/types/calendar";
import TimezoneClocks from "./TimezoneClocks";

type UICalendarEvent = CalendarEvent & { isTask?: boolean; taskStatus?: "pending" | "in_progress" | "completed" };

interface MonthGridProps {
  date: Date;
  events?: UICalendarEvent[];
  onSelectDate?: (d: Date) => void;
  onEventClick?: (e: CalendarEvent) => void;
  onEventDelete?: (e: CalendarEvent) => void;
}

function privacyClasses(p?: CalendarEvent["privacy"]) {
  switch (p) {
    case "public":
      return {
        dot: "bg-emerald-400",
        border: "border-emerald-500/50",
        text: "text-emerald-200",
      };
    case "private":
      return {
        dot: "bg-amber-400",
        border: "border-amber-500/50",
        text: "text-amber-200",
      };
    case "confidential":
      return {
        dot: "bg-rose-400",
        border: "border-rose-500/50",
        text: "text-rose-200",
      };
    default:
      return {
        dot: "bg-slate-400",
        border: "border-slate-600",
        text: "text-slate-200",
      };
  }
}

function taskClasses(status?: "pending" | "in_progress" | "completed") {
  switch (status) {
    case "completed":
      return { dot: "", border: "border-emerald-500/50", text: "text-emerald-200" };
    case "in_progress":
      return { dot: "", border: "border-amber-500/50", text: "text-amber-200" };
    case "pending":
    default:
      return { dot: "", border: "border-sky-500/50", text: "text-sky-200" };
  }
}

export default function MonthGrid({ date, events = [], onSelectDate, onEventClick, onEventDelete }: MonthGridProps) {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(monthStart);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-white/5 bg-white/5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="px-4 py-3 text-center text-xs font-bold text-zinc-500 uppercase tracking-wider">
              {format(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i), "EEE")}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 bg-white/5 gap-px border-b border-white/5">
          {days.map((d) => {
            const dayEvents = events.filter((e) => isSameDay(e.start, d));
            const isCurrentMonth = isSameMonth(d, monthStart);
            const isToday = isSameDay(d, new Date());

            return (
              <div
                key={d.toISOString()}
                role="button"
                tabIndex={0}
                onClick={() => onSelectDate?.(d)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelectDate?.(d); } }}
                className={`min-h-[140px] bg-zinc-950/30 p-2 text-left transition-colors hover:bg-white/[0.02] ${
                  !isCurrentMonth ? "bg-zinc-950/60" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span 
                    className={`
                        flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium
                        ${isToday ? "bg-indigo-500 text-white" : isCurrentMonth ? "text-zinc-300" : "text-zinc-600"}
                    `}
                  >
                    {format(d, "d")}
                  </span>
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((e) => {
                    const isTask = (e as UICalendarEvent).isTask;
                    const c = isTask ? taskClasses((e as UICalendarEvent).taskStatus) : privacyClasses(e.privacy);
                    return (
                      <div
                        key={e.id}
                        role="button"
                        onClick={(ev) => { ev.stopPropagation(); onEventClick?.(e); }}
                        className={`group truncate text-[10px] px-2 py-1 rounded-lg border ${c.border} bg-white/5 hover:bg-white/10 flex items-center gap-2 w-full transition-colors`}
                      >
                        {isTask ? (
                          <FiCheckCircle className={`h-3 w-3 ${c.text}`} />
                        ) : (
                          <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                        )}
                        <span className={`font-medium ${c.text} flex-1 min-w-0`}>{e.title}</span>
                        {onEventDelete && (
                          <button
                            type="button"
                            title="Delete"
                            aria-label="Delete event"
                            onClick={(ev) => { ev.stopPropagation(); onEventDelete(e); }}
                            className="ml-auto opacity-0 group-hover:opacity-100 inline-flex items-center justify-center h-4 w-4 rounded text-zinc-400 hover:text-red-400 transition-all"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <div className="text-[10px] text-zinc-500 pl-2">+{dayEvents.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <TimezoneClocks />
    </div>
  );
}
