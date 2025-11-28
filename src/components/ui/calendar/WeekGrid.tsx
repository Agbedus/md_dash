"use client";
import React from "react";
import { FiCheckCircle } from "react-icons/fi";
import { addDays, eachHourOfInterval, endOfDay, format, isSameDay, startOfDay, startOfWeek } from "date-fns";
import type { CalendarEvent } from "@/types/calendar";
import TimezoneClocks from "./TimezoneClocks";

type UICalendarEvent = CalendarEvent & { isTask?: boolean; taskStatus?: "pending" | "in_progress" | "completed" };

interface WeekGridProps {
  date: Date; // any date inside the target week
  events?: UICalendarEvent[];
  onSelectDateTime?: (d: Date) => void;
  onEventClick?: (e: CalendarEvent) => void;
  onEventDelete?: (e: CalendarEvent) => void;
}

const HOURS = eachHourOfInterval({ start: startOfDay(new Date()), end: endOfDay(new Date()) }).slice(0, 24);

function privacyClasses(p?: CalendarEvent["privacy"]) {
  switch (p) {
    case "public":
      return { dot: "bg-emerald-400", border: "border-emerald-500/50", text: "text-emerald-200" };
    case "private":
      return { dot: "bg-amber-400", border: "border-amber-500/50", text: "text-amber-200" };
    case "confidential":
      return { dot: "bg-rose-400", border: "border-rose-500/50", text: "text-rose-200" };
    default:
      return { dot: "bg-slate-400", border: "border-slate-600", text: "text-slate-200" };
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

export default function WeekGrid({ date, events = [], onSelectDateTime, onEventClick, onEventDelete }: WeekGridProps) {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="overflow-hidden">
        {/* Headers */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-white/5 bg-white/5">
          <div className="px-2 py-2 text-right pr-3 border-r border-white/5">&nbsp;</div>
          {days.map((d) => (
            <div key={d.toISOString()} className="px-3 py-2 text-center border-r border-white/5 last:border-r-0">
              <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">{format(d, "EEE")}</div>
              <div className={`
                inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium
                ${isSameDay(d, new Date()) ? "bg-indigo-500 text-white" : "text-zinc-300"}
              `}>
                {format(d, "d")}
              </div>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] bg-zinc-950/30">
          {/* Time labels */}
          <div className="flex flex-col border-r border-white/5 bg-white/[0.02]">
            {HOURS.map((h, i) => (
              <div key={i} className="h-16 border-b border-white/5 text-[10px] text-right pr-2 pt-2 text-zinc-500 font-medium">
                {format(h, "HH:00")}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((d) => (
            <div key={d.toISOString()} className="flex flex-col border-r border-white/5 last:border-r-0">
              {HOURS.map((h, i) => {
                const slot = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h.getHours(), 0, 0, 0);
                const slotEvents = events.filter((e) => isSameDay(e.start, d) && new Date(e.start).getHours() === slot.getHours());
                return (
                  <div
                    key={i}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectDateTime?.(slot)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelectDateTime?.(slot); } }}
                    className="h-16 border-b border-white/5 hover:bg-white/[0.02] text-left p-1 transition-colors"
                  >
                    {slotEvents.length > 0 && (
                      <div className="h-full w-full flex gap-1">
                        {slotEvents.map((e) => {
                          const isTask = (e as UICalendarEvent).isTask;
                          const c = isTask ? taskClasses((e as UICalendarEvent).taskStatus) : privacyClasses(e.privacy);
                          const widthPct = 100 / slotEvents.length;
                          return (
                            <div
                              key={e.id}
                              role="button"
                              onClick={(ev) => { ev.stopPropagation(); onEventClick?.(e); }}
                              className={`h-full truncate text-[10px] px-1.5 py-1 rounded-lg border ${c.border} bg-white/10 hover:bg-white/20 flex items-center gap-1.5 transition-colors`}
                              style={{ flex: `0 0 ${widthPct}%` }}
                              title={e.title}
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
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <TimezoneClocks />
    </div>
  );
}
