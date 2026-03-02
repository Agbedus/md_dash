"use client";
import React from "react";
import { FiCheckCircle, FiBriefcase } from "react-icons/fi";
import { 
  addDays, 
  eachHourOfInterval, 
  endOfDay, 
  format, 
  isSameDay, 
  startOfDay, 
  startOfWeek, 
  isWithinInterval,
  differenceInDays
} from "date-fns";
import type { CalendarEvent } from "@/types/calendar";
import { Tooltip } from "@/components/ui/Tooltip";

type UICalendarEvent = CalendarEvent;

interface WeekGridProps {
  date: Date;
  events?: UICalendarEvent[];
  onSelectDateTime?: (d: Date) => void;
  onEventClick?: (e: CalendarEvent) => void;
  onEventDelete?: (e: CalendarEvent) => void;
}

const HOURS = eachHourOfInterval({ start: startOfDay(new Date()), end: endOfDay(new Date()) }).slice(0, 24);

const COLOR_PALETTE = [
    { bg: 'bg-indigo-500', border: 'border-indigo-400', text: 'text-indigo-50', shadow: 'shadow-indigo-500/20' },
    { bg: 'bg-emerald-500', border: 'border-emerald-400', text: 'text-emerald-50', shadow: 'shadow-emerald-500/20' },
    { bg: 'bg-rose-500', border: 'border-rose-400', text: 'text-rose-50', shadow: 'shadow-rose-500/20' },
    { bg: 'bg-amber-500', border: 'border-amber-400', text: 'text-amber-50', shadow: 'shadow-amber-500/20' },
    { bg: 'bg-sky-500', border: 'border-sky-400', text: 'text-sky-50', shadow: 'shadow-sky-500/20' },
    { bg: 'bg-purple-500', border: 'border-purple-400', text: 'text-purple-50', shadow: 'shadow-purple-500/20' },
    { bg: 'bg-fuchsia-500', border: 'border-fuchsia-400', text: 'text-fuchsia-50', shadow: 'shadow-fuchsia-500/20' },
    { bg: 'bg-teal-500', border: 'border-teal-400', text: 'text-teal-50', shadow: 'shadow-teal-500/20' },
    { bg: 'bg-orange-500', border: 'border-orange-400', text: 'text-orange-50', shadow: 'shadow-orange-500/20' },
    { bg: 'bg-blue-500', border: 'border-blue-400', text: 'text-blue-50', shadow: 'shadow-blue-500/20' },
    { bg: 'bg-lime-500', border: 'border-lime-400', text: 'text-lime-50', shadow: 'shadow-lime-500/20' },
    { bg: 'bg-pink-500', border: 'border-pink-400', text: 'text-pink-50', shadow: 'shadow-pink-500/20' },
];

function getColorForId(id: string) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % COLOR_PALETTE.length;
    return COLOR_PALETTE[index];
}

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

export default function WeekGrid({ date, events = [], onSelectDateTime, onEventClick }: WeekGridProps) {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday
  const weekEnd = addDays(weekStart, 6);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Projects and Time Off for the spanning header
  const spanningEvents = events.filter(e => {
    if (!e.isProject && !e.isTimeOff) return false;
    const s = startOfDay(new Date(e.start));
    const ed = endOfDay(e.end ? new Date(e.end) : s);
    return (s <= weekEnd && ed >= weekStart);
  });

  return (
    <div className="glass rounded-2xl overflow-hidden flex flex-col h-full">
      {/* Headers */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-white/5 bg-white/[0.03] flex-shrink-0">
        <div className="px-2 py-2 text-right pr-3 border-r border-white/5 flex items-center justify-end">
            <span className="text-[10px] font-black text-zinc-600 uppercase">GMT</span>
        </div>
        {days.map((d) => (
          <div key={d.toISOString()} className="px-3 py-2 text-center border-r border-white/5 last:border-r-0">
            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{format(d, "EEE")}</div>
            <div className={`
              inline-flex h-8 w-8 items-center justify-center rounded-xl text-sm font-black
              ${isSameDay(d, new Date()) ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "text-zinc-300"}
            `}>
              {format(d, "d")}
            </div>
          </div>
        ))}
      </div>

      {/* Spanning Events (All Day / Projects Area) */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-white/5 bg-white/[0.01] relative flex-shrink-0">
          <div className="border-r border-white/5 bg-zinc-950/20 flex items-center justify-center">
            <FiBriefcase className="text-zinc-600 w-3 h-3" />
          </div>
          <div className="col-span-7 py-2 relative min-h-[40px] flex flex-col gap-1 px-1">
              {spanningEvents.map(e => {
                const eStart = startOfDay(new Date(e.start));
                const eEnd = endOfDay(e.end ? new Date(e.end) : eStart);
                
                const startOffset = Math.max(0, differenceInDays(eStart, weekStart));
                const endOffset = Math.min(6, differenceInDays(eEnd, weekStart));
                const duration = endOffset - startOffset + 1;

                const barColor = getColorForId(e.id);
                const isStarting = isWithinInterval(eStart, { start: weekStart, end: weekEnd });
                const isEnding = isWithinInterval(eEnd, { start: weekStart, end: weekEnd });

                const displayTitle = e.isProject 
                    ? e.title.replace('[PROJ] ', '') 
                    : e.title.includes('—') ? e.title.split('—')[1]?.trim() : e.title;

                return (
                    <div 
                        key={e.id}
                        style={{ 
                            marginLeft: `${(startOffset / 7) * 100}%`,
                            width: `${(duration / 7) * 100}%`,
                            paddingLeft: isStarting ? '2px' : '0px',
                            paddingRight: isEnding ? '2px' : '0px'
                        }}
                        className="h-7 relative z-10"
                    >
                        <Tooltip content={`${displayTitle} (${format(eStart, 'MMM d')} - ${format(eEnd, 'MMM d')})`}>
                            <div 
                                onClick={(ev) => { ev.stopPropagation(); onEventClick?.(e); }}
                                className={`
                                    h-full px-2 flex items-center gap-2 rounded-lg border shadow-sm cursor-pointer transition-all hover:brightness-110 active:scale-[0.98]
                                    ${barColor.bg} ${barColor.border} ${barColor.shadow}
                                    ${!isStarting ? 'rounded-l-none border-l-0' : ''}
                                    ${!isEnding ? 'rounded-r-none border-r-0' : ''}
                                `}
                            >
                                {e.isProject && isStarting && <FiBriefcase className="w-2.5 h-2.5 flex-shrink-0 text-white" />}
                                {e.isTimeOff && isStarting && <span className="text-[10px] flex-shrink-0">🌴</span>}
                                <span className={`text-[9px] font-black uppercase tracking-wider truncate ${barColor.text}`}>
                                    {displayTitle}
                                </span>
                            </div>
                        </Tooltip>
                    </div>
                );
              })}
              {spanningEvents.length === 0 && (
                  <div className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest text-center py-1">No multi-day projects this week</div>
              )}
          </div>
      </div>

      {/* Hourly Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] bg-zinc-950/30 min-h-full">
          {/* Time labels */}
          <div className="flex flex-col border-r border-white/5 bg-white/[0.02]">
            {HOURS.map((h, i) => (
              <div key={i} className="h-16 border-b border-white/5 text-[10px] text-right pr-2 pt-2 text-zinc-500 font-black uppercase tracking-tighter">
                {format(h, "HH:00")}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((d) => {
            return (
              <div key={d.toISOString()} className="flex flex-col border-r border-white/5 last:border-r-0 relative">
                {HOURS.map((h, i) => {
                  const slotStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h.getHours(), 0, 0, 0);
                  const slotEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h.getHours(), 59, 59, 999);
                  
                  const slotEvents = events.filter((e) => {
                      if (e.isProject || e.isTimeOff) return false;
                      const eStart = new Date(e.start);
                      const eEnd = e.end ? new Date(e.end) : eStart;
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
                        <div className="h-full w-full flex flex-col gap-1">
                          {slotEvents.map((e) => {
                            const isTask = e.isTask;
                            const c = isTask ? taskClasses(e.taskStatus) : privacyClasses(e.privacy);
                            const widthPct = slotEvents.length > 1 ? (100 / slotEvents.length) : 100;

                            return (
                              <Tooltip key={e.id} content={e.title}>
                                <div
                                    role="button"
                                    onClick={(ev) => { ev.stopPropagation(); onEventClick?.(e); }}
                                    className={`truncate text-[9px] px-1.5 py-1 rounded-lg border ${c.border} bg-white/[0.06] hover:bg-white/20 flex items-center gap-1.5 transition-colors cursor-pointer w-full leading-tight`}
                                >
                                    {isTask ? (
                                        <FiCheckCircle className={`h-2.5 w-2.5 ${c.text}`} />
                                    ) : (
                                        <span className={`h-1 w-1 rounded-full ${c.dot}`} />
                                    )}
                                    <span className={`font-black uppercase tracking-tighter ${c.text} truncate`}>{e.title}</span>
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
