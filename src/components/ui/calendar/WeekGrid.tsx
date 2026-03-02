"use client";
import React from "react";
import { FiCheckCircle } from "react-icons/fi";
import { addDays, eachHourOfInterval, endOfDay, format, isSameDay, startOfDay, startOfWeek, isWithinInterval } from "date-fns";
import type { CalendarEvent } from "@/types/calendar";
import { Tooltip } from "@/components/ui/Tooltip";

type UICalendarEvent = CalendarEvent & { isProject?: boolean; projectStatus?: string };

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

function taskClasses(status?: "task" | "in_progress" | "completed") {
  switch (status) {
    case "completed":
      return { dot: "", border: "border-emerald-500/50", text: "text-emerald-200", bg: "bg-emerald-500/10" };
    case "in_progress":
      return { dot: "", border: "border-amber-500/50", text: "text-amber-200", bg: "bg-amber-500/10" };
    case "task":
    default:
      return { dot: "", border: "border-sky-500/50", text: "text-sky-200", bg: "bg-sky-500/10" };
  }
}

function timeOffClasses(status?: string) {
  switch (status) {
    case "approved":
      return { dot: "bg-emerald-400", border: "border-emerald-500/50", text: "text-emerald-200", bg: "bg-emerald-500/10" };
    case "rejected":
      return { dot: "bg-rose-400", border: "border-rose-500/50", text: "text-rose-200", bg: "bg-rose-500/10" };
    case "pending":
    default:
      return { dot: "bg-amber-400", border: "border-amber-500/50", text: "text-amber-200", bg: "bg-amber-500/10" };
  }
}

export default function WeekGrid({ date, events = [], onSelectDateTime, onEventClick, onEventDelete }: WeekGridProps) {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="overflow-hidden">
        {/* Headers */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-white/5 bg-white/[0.03]">
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
              <div key={i} className="h-16 border-b border-white/5 text-[11px] text-right pr-2 pt-2 text-zinc-500 font-medium">
                {format(h, "HH:00")}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((d) => {
            const dayStart = startOfDay(d);
            const dayEnd = endOfDay(d);

            return (
              <div key={d.toISOString()} className="flex flex-col border-r border-white/5 last:border-r-0 relative">
                {HOURS.map((h, i) => {
                  const slotStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h.getHours(), 0, 0, 0);
                  const slotEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h.getHours(), 59, 59, 999);
                  
                  // Show events that occur during this hour slot on this specific day
                  const slotEvents = events.filter((e) => {
                      const eStart = new Date(e.start);
                      const eEnd = e.end ? new Date(e.end) : eStart;
                      
                      // Check if the event overlaps with this hour slot
                      return isWithinInterval(slotStart, { start: eStart, end: eEnd }) || 
                             isWithinInterval(slotEnd, { start: eStart, end: eEnd }) || 
                             (eStart >= slotStart && eEnd <= slotEnd);
                  });

                  return (
                    <div
                      key={i}
                      role="button"
                      tabIndex={0}
                      onClick={() => onSelectDateTime?.(slotStart)}
                      className="h-16 border-b border-white/5 hover:bg-white/[0.02] text-left p-1 transition-colors group/slot overflow-hidden"
                    >
                      {slotEvents.length > 0 && (
                        <div className="h-full w-full flex gap-1 overflow-x-auto no-scrollbar">
                          {slotEvents.map((e) => {
                            const isTask = e.isTask;
                            const isProject = e.isProject;
                            const isTimeOff = e.isTimeOff;
                            const c = isProject ? { border: 'border-indigo-500/50', text: 'text-indigo-200', dot: 'bg-indigo-400', bg: 'bg-indigo-500/10' } : (isTask ? taskClasses(e.taskStatus) : (isTimeOff ? timeOffClasses(e.timeOffStatus) : privacyClasses(e.privacy)));
                            
                            // Width depends on number of overlapping items to "fit"
                            const widthPct = slotEvents.length > 1 ? (100 / slotEvents.length) : 100;
                            
                            const summary = isProject 
                                ? `PROJECT: ${e.title} - ${e.projectStatus || 'Active'}`
                                : (isTask ? `TASK: ${e.title} - ${e.taskStatus || 'TODO'}` : `EVENT: ${e.title} (${format(new Date(e.start), 'h:mm a')} - ${e.end ? format(new Date(e.end), 'h:mm a') : '...'})`);

                            return (
                              <Tooltip key={e.id} content={summary} className="h-full flex-shrink-0" style={{ width: slotEvents.length > 1 ? `${widthPct}%` : '100%', minWidth: slotEvents.length > 1 ? '40px' : 'none' }}>
                                <div
                                    role="button"
                                    onClick={(ev) => { ev.stopPropagation(); onEventClick?.(e); }}
                                    className={`h-full truncate text-[9px] px-1.5 py-1 rounded-lg border ${c.border} bg-white/[0.06] hover:bg-white/20 flex flex-col justify-center gap-0.5 transition-colors cursor-pointer w-full leading-tight`}
                                >
                                    <div className="flex items-center gap-1">
                                        {isTask ? (
                                        <FiCheckCircle className={`h-2.5 w-2.5 ${c.text}`} />
                                        ) : (
                                        <span className={`h-1 w-1 rounded-full ${c.dot}`} />
                                        )}
                                        <span className={`font-black uppercase tracking-tighter ${c.text} truncate`}>{e.title}</span>
                                    </div>
                                    {slotEvents.length <= 2 && !isTask && !isProject && (
                                        <span className="text-[8px] opacity-60 text-zinc-400 truncate">{format(new Date(e.start), 'HH:mm')}</span>
                                    )}
                                </div>
                              </Tooltip>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
