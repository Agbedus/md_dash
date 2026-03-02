"use client";
import React from "react";
import { FiCheckCircle, FiBriefcase, FiX, FiCalendar, FiClock, FiMapPin, FiUser } from "react-icons/fi";
import { addDays, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import type { CalendarEvent } from "@/types/calendar";
import { Tooltip } from "@/components/ui/Tooltip";
import { AnimatePresence, motion } from "framer-motion";

type UICalendarEvent = CalendarEvent & { isProject?: boolean; projectStatus?: string; description?: string; location?: string; organizer?: string };

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
      return { dot: "bg-emerald-400", border: "border-emerald-500/50", text: "text-emerald-200", bg: "bg-emerald-500/10" };
    case "private":
      return { dot: "bg-amber-400", border: "border-amber-500/50", text: "text-amber-200", bg: "bg-amber-500/10" };
    case "confidential":
      return { dot: "bg-rose-400", border: "border-rose-500/50", text: "text-rose-200", bg: "bg-rose-500/10" };
    default:
      return { dot: "bg-slate-400", border: "border-slate-600", text: "text-slate-200", bg: "bg-slate-500/10" };
  }
}

function taskClasses(status?: "task" | "in_progress" | "completed") {
  switch (status) {
    case "completed":
      return { dot: "bg-emerald-400", border: "border-emerald-500/50", text: "text-emerald-200", bg: "bg-emerald-500/10" };
    case "in_progress":
      return { dot: "bg-amber-400", border: "border-amber-500/50", text: "text-amber-200", bg: "bg-amber-500/10" };
    case "task":
      return { dot: "bg-sky-400", border: "border-sky-500/50", text: "text-sky-200", bg: "bg-sky-500/10" };
    default:
      return { dot: "bg-sky-400", border: "border-sky-500/50", text: "text-sky-200", bg: "bg-sky-500/10" };
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

export default function MonthGrid({ date, events = [], onSelectDate, onEventClick, onEventDelete }: MonthGridProps) {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(monthStart);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const [popupData, setPopupData] = React.useState<{ date: Date, events: UICalendarEvent[] } | null>(null);
  const popupRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setPopupData(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="glass rounded-2xl overflow-hidden relative">
      <div className="overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-white/5 bg-white/[0.03]">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="px-4 py-3 text-center text-[10px] font-black text-zinc-500 uppercase tracking-widest">
              {format(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i), "EEE")}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 bg-white/[0.01] gap-px">
          {days.map((d) => {
            const dayStart = startOfDay(d);
            const dayEnd = endOfDay(d);

            // Filter projects that occur on this day
            const dayProjects = events.filter((e) => {
                if (!e.isProject) return false;
                const s = startOfDay(new Date(e.start));
                const endVal = e.end ? new Date(e.end) : new Date(e.start);
                const end = endOfDay(endVal);
                return isWithinInterval(d, { start: s, end: end });
            });

            // Filter non-project events
            const dayEvents = events.filter((e) => {
                if (e.isProject) return false;
                const s = startOfDay(new Date(e.start));
                const endVal = e.end ? new Date(e.end) : new Date(e.start);
                const end = endOfDay(endVal);
                return isWithinInterval(d, { start: s, end: end });
            });

            const isCurrentMonth = isSameMonth(d, monthStart);
            const isToday = isSameDay(d, new Date());

            // Determine if the cell should be shaded (if any project is active)
            const isProjectShaded = dayProjects.length > 0;
            
            // Primary project for summary/label (most recent or first)
            const primaryProject = dayProjects[0];

            return (
              <div
                key={d.toISOString()}
                role="button"
                tabIndex={0}
                onClick={() => onSelectDate?.(d)}
                className={`min-h-[140px] relative p-2 text-left transition-colors border-b border-r border-white/5 group/cell ${
                  !isCurrentMonth ? "opacity-30" : ""
                } ${isProjectShaded ? 'bg-indigo-500/[0.08]' : 'bg-zinc-950/20'} hover:bg-white/[0.02]`}
              >
                {/* Project Full-Cell Indicator (if only one project, or primary) */}
                {isProjectShaded && primaryProject && (
                    <div 
                        className="absolute inset-0 pointer-events-none border-l-2 border-indigo-500/30"
                        title={dayProjects.map(p => p.title).join(', ')}
                    />
                )}

                <div className="flex items-center justify-between mb-2 relative z-10">
                  <span 
                    className={`
                        flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold
                        ${isToday ? "bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.5)]" : "text-zinc-500"}
                    `}
                  >
                    {format(d, "d")}
                  </span>
                  
                  {isProjectShaded && (
                      <Tooltip content={`Active Projects: ${dayProjects.length}`}>
                          <FiBriefcase className="w-3 h-3 text-indigo-400 opacity-60" />
                      </Tooltip>
                  )}
                </div>

                <div className="space-y-1 relative z-10">
                  {/* Render project indicators if needed, but the cell is already shaded */}
                  {dayProjects.map((p) => {
                      const isStart = isSameDay(d, new Date(p.start));
                      if (!isStart) return null; // Only show title on start day
                      return (
                        <Tooltip key={p.id} content={`${p.title} (${p.projectStatus || 'Active'})`}>
                            <div
                                onClick={(ev) => { ev.stopPropagation(); onEventClick?.(p); }}
                                className="truncate text-[9px] py-0.5 px-1.5 font-black uppercase tracking-widest bg-indigo-500/40 text-white rounded border border-indigo-400/50 flex items-center gap-1 cursor-pointer hover:bg-indigo-500/60 transition-colors"
                            >
                                <FiBriefcase className="w-2.5 h-2.5" />
                                <span className="truncate">{p.title.replace('[PROJ] ', '')}</span>
                            </div>
                        </Tooltip>
                      );
                  })}

                  {dayEvents.slice(0, 3).map((e) => {
                    const isTask = e.isTask;
                    const isStart = isSameDay(d, new Date(e.start));
                    
                    // Tasks and normal events only show on start day
                    if (!isStart) return null;

                    const isTimeOff = e.isTimeOff;
                    const c = isTask ? taskClasses(e.taskStatus) : (isTimeOff ? timeOffClasses(e.timeOffStatus) : privacyClasses(e.privacy));
                    const summary = isTask 
                        ? `TASK: ${e.title} - ${e.taskStatus || 'TODO'}`
                        : `EVENT: ${e.title} - ${format(new Date(e.start), 'h:mm a')}`;

                    return (
                      <Tooltip key={e.id} content={summary}>
                        <div
                            role="button"
                            onClick={(ev) => { ev.stopPropagation(); onEventClick?.(e); }}
                            className={`group truncate text-[10px] px-2 py-1 rounded-lg border ${c.border} bg-white/[0.03] hover:bg-white/[0.06] flex items-center gap-2 w-full transition-colors cursor-pointer`}
                        >
                            {isTask ? (
                            <FiCheckCircle className={`h-3 w-3 ${c.text}`} />
                            ) : (
                            <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                            )}
                            <span className={`font-bold uppercase tracking-tight ${c.text} flex-1 min-w-0`}>{e.title}</span>
                        </div>
                      </Tooltip>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <div 
                      onClick={(ev) => { ev.stopPropagation(); setPopupData({ date: d, events: dayEvents }); }}
                      className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-2 pt-1 hover:text-indigo-400 transition-colors cursor-pointer"
                    >
                      + {dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hidden Items Popup */}
      <AnimatePresence>
        {popupData && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
            <motion.div
              ref={popupRef}
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="w-full max-w-md bg-zinc-950/95 border border-white/10 rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] backdrop-blur-2xl p-6 pointer-events-auto flex flex-col gap-4 overflow-hidden max-h-[80vh]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white text-xl font-black tracking-tight">{format(popupData.date, "MMMM d, yyyy")}</h3>
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">{popupData.events.length} Items Today</p>
                </div>
                <button onClick={() => setPopupData(null)} className="p-2 hover:bg-white/5 rounded-2xl text-zinc-500 hover:text-white transition-colors">
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                {popupData.events.map((e) => {
                  const isTask = e.isTask;
                  const isTimeOff = e.isTimeOff;
                  const c = isTask ? taskClasses(e.taskStatus) : (isTimeOff ? timeOffClasses(e.timeOffStatus) : privacyClasses(e.privacy));
                  
                  return (
                    <Tooltip key={e.id} content={`Click to view details`}>
                      <div
                        onClick={() => { onEventClick?.(e); setPopupData(null); }}
                        className={`bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2 hover:bg-white/[0.08] transition-all cursor-pointer group/card active:scale-[0.98] w-full`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-lg ${c.bg} border ${c.border.replace('/50', '/20')} ${c.text}`}>
                            {isTask ? <FiCheckCircle className="w-3.5 h-3.5" /> : <FiCalendar className="w-3.5 h-3.5" />}
                          </div>
                          
                          <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <h4 className="text-white font-bold text-xs group-hover/card:text-indigo-400 transition-colors uppercase tracking-tight truncate">{e.title}</h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                                        <FiClock className="w-2.5 h-2.5" /> {format(new Date(e.start), 'h:mm a')}
                                    </span>
                                    {e.location && (
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 truncate flex items-center gap-1">
                                            <FiMapPin className="w-2.5 h-2.5" /> {e.location}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                                <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${c.bg} ${c.text} border ${c.border.replace('/50', '/20')}`}>
                                    {isTask ? (e.taskStatus || 'TASK') : (e.privacy || 'EVENT')}
                                </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Tooltip>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
