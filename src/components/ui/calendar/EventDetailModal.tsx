"use client";
import React, { useState, useEffect } from "react";
import type { CalendarEvent, EventReminder } from "@/types/calendar";
import { format } from "date-fns";
import { 
  FiX, FiCalendar, FiMapPin, FiUser, FiUsers, FiShield, FiEdit2, FiTrash2, 
  FiGlobe, FiLock, FiAlertTriangle, FiCheckCircle, FiMinusCircle, FiBell, FiPlus, FiClock
} from "react-icons/fi";
import { updateEvent, deleteEvent } from "@/app/calendar/actions";
import { updateTask, deleteTask } from "@/app/tasks/actions";

interface Props {
  event: CalendarEvent | null;
  open: boolean;
  onClose: () => void;
  onUpdated?: () => Promise<void> | void;
}

function privacyClasses(p?: CalendarEvent["privacy"]) {
  switch (p) {
    case "public":
      return { dot: "bg-emerald-400", text: "text-emerald-200", ring: "ring-emerald-400/40" };
    case "private":
      return { dot: "bg-amber-400", text: "text-amber-200", ring: "ring-amber-400/40" };
    case "confidential":
      return { dot: "bg-rose-400", text: "text-rose-200", ring: "ring-rose-400/40" };
    default:
      return { dot: "bg-slate-400", text: "text-slate-200", ring: "ring-slate-400/30" };
  }
}

function privacyMeta(p?: CalendarEvent["privacy"]) {
  switch (p) {
    case "public":
      return { label: "Public", icon: <FiGlobe className="h-2.5 w-2.5" />, cls: "text-emerald-300 ring-emerald-400/40" };
    case "private":
      return { label: "Private", icon: <FiLock className="h-2.5 w-2.5" />, cls: "text-amber-300 ring-amber-400/40" };
    case "confidential":
      return { label: "Confidential", icon: <FiShield className="h-2.5 w-2.5" />, cls: "text-rose-300 ring-rose-400/40" };
    default:
      return { label: "Unspecified", icon: <FiShield className="h-2.5 w-2.5" />, cls: "text-slate-300 ring-slate-400/30" };
  }
}

function statusMeta(s?: CalendarEvent["status"]) {
  switch (s) {
    case "confirmed":
      return { label: "Confirmed", icon: <FiCheckCircle className="h-2.5 w-2.5" />, cls: "text-emerald-300 ring-emerald-400/40" };
    case "tentative":
      return { label: "Tentative", icon: <FiAlertTriangle className="h-2.5 w-2.5" />, cls: "text-amber-300 ring-amber-400/40" };
    case "cancelled":
      return { label: "Cancelled", icon: <FiMinusCircle className="h-2.5 w-2.5" />, cls: "text-rose-300 ring-rose-400/40" };
    default:
      return { label: "No status", icon: <FiMinusCircle className="h-2.5 w-2.5" />, cls: "text-slate-300 ring-slate-400/30" };
  }
}

function taskStatusMeta(s?: CalendarEvent["taskStatus"]) {
  switch (s) {
    case "completed":
      return { label: "Completed", icon: <FiCheckCircle className="h-2.5 w-2.5" />, cls: "text-emerald-300 ring-emerald-400/40" };
    case "in_progress":
      return { label: "In Progress", icon: <FiClock className="h-2.5 w-2.5" />, cls: "text-amber-300 ring-amber-400/40" };
    case "task":
      return { label: "To Do", icon: <FiAlertTriangle className="h-2.5 w-2.5" />, cls: "text-sky-300 ring-sky-400/40" };
    default:
      return { label: "No status", icon: <FiMinusCircle className="h-2.5 w-2.5" />, cls: "text-slate-300 ring-slate-400/30" };
  }
}

export default function EventDetailModal({ event, open, onClose, onUpdated }: Props) {
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [location, setLocation] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [attendees, setAttendees] = useState("");
  const [status, setStatus] = useState<CalendarEvent["status"]>("tentative");
  const [taskStatus, setTaskStatus] = useState<CalendarEvent["taskStatus"]>("task");
  const [privacy, setPrivacy] = useState<CalendarEvent["privacy"]>("public");
  const [recurrence, setRecurrence] = useState<CalendarEvent["recurrence"]>("none");
  const [reminders, setReminders] = useState<EventReminder[]>([]);
  const [color, setColor] = useState("#6366f1");

  const [rDays, setRDays] = useState(0);
  const [rHours, setRHours] = useState(0);
  const [rMinutes, setRMinutes] = useState(0);

  function toLocalISOString(date: Date) {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  useEffect(() => {
    if (event && open) {
      setEditing(false);
      setSubmitting(false);
      setTitle(event.title || "");
      setDescription(event.description || "");
      setAllDay(!!event.allDay);
      
      const s = event.start instanceof Date ? event.start : new Date(event.start);
      const e = event.end instanceof Date ? event.end : new Date(event.end);
      // Use local time for inputs
      setStart(toLocalISOString(s));
      setEnd(toLocalISOString(e));
      
      setLocation(event.location || "");
      setOrganizer(event.organizer || "");
      setAttendees((event.attendees || []).join(", "));
      setStatus(event.status || "tentative");
      setTaskStatus(event.taskStatus || "task");
      setPrivacy(event.privacy || "public");
      setRecurrence(event.recurrence || "none");
      setReminders(event.reminders || []);
      setColor(event.color || "#6366f1");
      setRDays(0); setRHours(0); setRMinutes(0);
    }
  }, [event, open]);

  if (!event || !open) return null;

  const startD = event.start instanceof Date ? event.start : new Date(event.start);
  const endD = event.end instanceof Date ? event.end : new Date(event.end);
  const sameDay = startD.toDateString() === endD.toDateString();
  const dateLine = event.allDay
    ? sameDay
      ? format(startD, "EEEE, MMM d, yyyy")
      : `${format(startD, "EEE, MMM d, yyyy")} – ${format(endD, "EEE, MMM d, yyyy")}`
    : sameDay
      ? `${format(startD, "EEE, MMM d, yyyy • HH:mm")} – ${format(endD, "HH:mm")}`
      : `${format(startD, "EEE, MMM d, yyyy • HH:mm")} – ${format(endD, "EEE, MMM d, yyyy • HH:mm")}`;

  const c = event.isTask ? { dot: "bg-sky-400", ring: "ring-sky-400/40" } : privacyClasses(event.privacy);

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      if (event?.isTask) {
        // Handle task update
        const numericId = event.id.replace("task-", "");
        fd.append("id", numericId);
        fd.append("name", title);
        fd.append("description", description);
        fd.append("dueDate", new Date(start).toISOString());
        fd.append("status", taskStatus || "task");
        await updateTask(fd);
      } else {
        // Handle event update
        fd.append("id", event!.id);
        fd.append("title", title);
        if (description) fd.append("description", description);
        fd.append("start", new Date(start).toISOString());
        fd.append("end", new Date(end).toISOString());
        fd.append("allDay", String(allDay));
        if (location) fd.append("location", location);
        if (organizer) fd.append("organizer", organizer);
        if (attendees) fd.append("attendees", JSON.stringify(attendees.split(",").map(s => s.trim()).filter(Boolean)));
        if (status) fd.append("status", status);
        if (privacy) fd.append("privacy", privacy);
        if (recurrence) fd.append("recurrence", recurrence);
        fd.append("reminders", JSON.stringify(reminders));
        fd.append("color", color);
        
        const result = await updateEvent(fd);
        if (result && !result.success) {
            alert(result.error || "Failed to update event");
            return;
        }
      }
      
      await onUpdated?.();
      setEditing(false);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to save changes");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    const ok = confirm(`Delete this ${event?.isTask ? 'task' : 'event'}? This action cannot be undone.`);
    if (!ok) return;
    setSubmitting(true);
    try {
      if (event?.isTask) {
        const numericId = event.id.replace("task-", "");
        await deleteTask(numericId);
      } else {
        await deleteEvent(event!.id);
      }
      await onUpdated?.();
      onClose();
    } catch (err) {
      console.error(err);
      alert(`Failed to delete ${event?.isTask ? 'task' : 'event'}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-6"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full md:max-w-3xl bg-slate-950/40 backdrop-blur-2xl border border-white/10 rounded-t-2xl md:rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] overflow-hidden">
        <div className="relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-white/5" />
          <div className="relative px-5 py-3 flex items-center justify-between">
            <div className="flex items-start gap-3 min-w-0">
              <div className={`mt-0.5 h-8 w-1 rounded-full ${c.dot}`} />
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 text-slate-100 font-bold tracking-tight text-lg md:text-xl min-w-0">
                  {editing ? (
                    <input
                      value={title}
                      onChange={(e)=>setTitle(e.target.value)}
                      className="bg-white/5 border-b border-white/20 focus:border-purple-500 focus:bg-white/10 transition-all outline-none text-slate-100 px-3 py-1 rounded-t-lg min-w-0 w-full"
                    />
                  ) : (
                    <span className="line-clamp-1">{event.title || "Untitled Item"}</span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                  {event.isTask ? (
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ring-1 bg-slate-900/30 ${taskStatusMeta(event.taskStatus).cls}`}>
                      {taskStatusMeta(event.taskStatus).icon}
                      <span className="capitalize">{taskStatusMeta(event.taskStatus).label}</span>
                    </span>
                  ) : (
                    <>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ring-1 bg-slate-900/30 ${privacyMeta(event.privacy).cls}`}>
                        {privacyMeta(event.privacy).icon}
                        <span className="capitalize">{event.privacy ?? "unspecified"}</span>
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ring-1 bg-slate-900/30 ${statusMeta(event.status).cls}`}>
                        {statusMeta(event.status).icon}
                        <span className="capitalize">{event.status ?? "no status"}</span>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!editing && (
                <>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="inline-flex h-8 px-3 items-center gap-2 justify-center rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/20 hover:border-rose-500/40 transition-all text-[10px] font-bold uppercase tracking-wider"
                  >
                    <FiTrash2 className="h-3 w-3" /> <span className="hidden md:inline">Delete</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="inline-flex h-8 px-3 items-center gap-2 justify-center rounded-lg bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10 transition-all text-[10px] font-bold uppercase tracking-wider"
                  >
                    <FiEdit2 className="h-3 w-3" /> <span className="hidden md:inline">Edit</span>
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {!editing ? (
          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-4">
              <div className="text-slate-200 text-sm font-medium flex items-center gap-3">
                <FiCalendar className="h-4 w-4 text-purple-400" />
                <span>{event.isTask ? format(startD, "EEEE, MMM d, yyyy • HH:mm") : dateLine}</span>
              </div>

              {!event.isTask && (
                <>
                  {event.location && (
                    <div className="text-sm text-slate-300 flex items-center gap-3">
                      <FiMapPin className="h-5 w-5 text-purple-400" />
                      <span>{event.location}</span>
                    </div>
                  )}

                  {event.organizer && (
                    <div className="text-sm text-slate-300 flex items-center gap-3">
                      <FiUser className="h-5 w-5 text-purple-400" />
                      <span>{event.organizer}</span>
                    </div>
                  )}

                  {event.attendees && event.attendees.length > 0 && (
                    <div className="flex items-start gap-3">
                      <FiUsers className="h-5 w-5 text-purple-400 mt-0.5" />
                      <div className="flex flex-wrap gap-2">
                        {event.attendees.map((a, i) => (
                          <span key={i} className="px-3 py-1 bg-white/5 text-slate-300 text-xs font-semibold rounded-full border border-white/10">{a}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {event.reminders && event.reminders.length > 0 && (
                    <div className="flex items-start gap-3">
                      <FiBell className="h-5 w-5 text-purple-400 mt-0.5" />
                      <div className="flex flex-wrap gap-2">
                        {event.reminders.map((r, i) => (
                          <span key={i} className="px-3 py-1 bg-purple-500/10 text-purple-200 text-xs font-semibold rounded-full border border-purple-500/20">
                            {r.days > 0 && `${r.days}d `}
                            {r.hours > 0 && `${r.hours}h `}
                            {r.minutes > 0 && `${r.minutes}m `}
                            before
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {event.recurrence && event.recurrence !== "none" && (
                    <div className="flex items-center gap-3 text-sm text-slate-300">
                      <FiCalendar className="h-5 w-5 text-purple-400" />
                      <span>Repeats <span className="capitalize font-bold text-slate-100">{event.recurrence}</span></span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 pt-2">
                    <div 
                      className="h-4 w-4 rounded-full ring-2 ring-white/10" 
                      style={{ backgroundColor: event.color || '#6366f1' }}
                    />
                    <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-slate-400">{event.color || '#6366f1'}</span>
                  </div>
                </>
              )}
            </div>

            {event.description && (
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3 ml-1">Description</div>
                <div className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {event.description}
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 ml-1 flex items-center gap-2">
                  <FiClock className="text-purple-400" /> {event.isTask ? 'Due Date' : 'Start'}
                </label>
                <input
                  type={!event.isTask && allDay ? "date" : "datetime-local"}
                  value={(!event.isTask && allDay) ? start.slice(0,10) : start}
                  onChange={(e)=>setStart((!event.isTask && allDay) ? `${e.target.value}T09:00` : e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
                />
              </div>
              {!event.isTask && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 ml-1 flex items-center gap-2">
                    <FiClock className="text-purple-400" /> End
                  </label>
                  <input
                    type={allDay ? "date" : "datetime-local"}
                    value={allDay ? end.slice(0,10) : end}
                    onChange={(e)=>setEnd(allDay ? `${e.target.value}T10:00` : e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
                  />
                </div>
              )}
            </div>

            {!event.isTask && (
              <div className="flex items-center justify-between gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">All day event</span>
                <button
                  type="button"
                  onClick={() => setAllDay((v)=>!v)}
                  className={`relative inline-flex h-8 items-center rounded-full border px-1 transition-all duration-300 ${allDay ? "bg-purple-600/30 border-purple-500/50" : "bg-slate-800/40 border-slate-700/50"}`}
                >
                  <span className={`inline-flex items-center gap-2 px-4 py-1.5 text-[10px] font-bold rounded-full transition-all duration-300 ${allDay ? "bg-purple-600 text-white shadow-lg" : "bg-transparent text-slate-400"}`}>All day</span>
                  <span className={`inline-flex items-center gap-2 px-4 py-1.5 text-[10px] font-bold rounded-full transition-all duration-300 ${!allDay ? "bg-slate-700 text-slate-200" : "bg-transparent text-slate-400"}`}>Timed</span>
                </button>
              </div>
            )}

            {!event.isTask && (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 ml-1 flex items-center gap-2">
                  <FiMapPin className="text-purple-400" /> Location
                </label>
                <input 
                  value={location} 
                  onChange={(e)=>setLocation(e.target.value)} 
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all" 
                  placeholder="Where is it?"
                />
              </div>
            )}

            {!event.isTask && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 ml-1">Organizer</label>
                  <input 
                    value={organizer} 
                    onChange={(e)=>setOrganizer(e.target.value)} 
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all" 
                    placeholder="Who is hosting?"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 ml-1">Attendees</label>
                  <input 
                    value={attendees} 
                    onChange={(e)=>setAttendees(e.target.value)} 
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all" 
                    placeholder="Emails"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 ml-1">Status</label>
                <div className="flex flex-wrap gap-2">
                  {event.isTask ? (
                    (["task","in_progress","completed"] as const).map((opt)=> (
                      <button type="button" key={opt} onClick={()=>setTaskStatus(opt)} aria-pressed={taskStatus===opt}
                        className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg border transition-all duration-200 ${taskStatus===opt?"border-purple-500/60 bg-purple-500/20 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.1)]":"border-white/5 bg-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200"}`}>{opt === "task" ? "To Do" : opt.replace("_", " ")}</button>
                    ))
                  ) : (
                    (["tentative","confirmed","cancelled"] as const).map((opt)=> (
                      <button type="button" key={opt} onClick={()=>setStatus(opt)} aria-pressed={status===opt}
                        className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg border transition-all duration-200 ${status===opt?"border-purple-500/60 bg-purple-500/20 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.1)]":"border-white/5 bg-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200"}`}>{opt}</button>
                    ))
                  )}
                </div>
              </div>
              {!event.isTask && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 ml-1">Privacy</label>
                  <div className="flex flex-wrap gap-2">
                    {([
                      { v: "public", cls: "border-emerald-500/50 text-emerald-300 bg-emerald-500/10" },
                      { v: "private", cls: "border-amber-500/50 text-amber-300 bg-amber-500/10" },
                      { v: "confidential", cls: "border-rose-500/50 text-rose-300 bg-rose-500/10" },
                    ] as const).map((opt)=> (
                      <button type="button" key={opt.v} onClick={()=>setPrivacy(opt.v)} aria-pressed={privacy===opt.v}
                        className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg border transition-all duration-200 ${privacy===opt.v?`${opt.cls} shadow-[0_0_15px_rgba(16,185,129,0.1)]`:"border-white/5 bg-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200"}`}>{opt.v}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {!event.isTask && (
              <>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3 ml-1">Event Color</label>
                  <div className="flex flex-wrap gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                    {(["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"] as const).map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setColor(c)}
                        className={`h-8 w-8 rounded-full border-2 transition-all duration-300 ${
                          color === c ? "border-white scale-125 shadow-lg shadow-white/20" : "border-transparent opacity-60 hover:opacity-100 hover:scale-110"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 ml-1 text-slate-400">Recurrence</label>
                  <div className="flex flex-wrap gap-2">
                    {(["none", "daily", "weekly", "monthly", "yearly"] as const).map((opt) => (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => setRecurrence(opt)}
                        className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all duration-200 ${
                          recurrence === opt
                            ? "border-purple-500/60 bg-purple-500/20 text-purple-200"
                            : "border-white/5 bg-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3 ml-1 flex items-center gap-2">
                    <FiBell className="text-purple-400" /> Reminders
                  </label>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {reminders.map((r, idx) => (
                      <span key={idx} className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-200">
                        <FiBell className="h-3 w-3" />
                        {r.days > 0 && `${r.days}d `}
                        {r.hours > 0 && `${r.hours}h `}
                        {r.minutes > 0 && `${r.minutes}m `}
                        before
                        <button type="button" onClick={() => setReminders((prev) => prev.filter((_, i) => i !== idx))} className="ml-1 hover:text-white transition-colors">
                          <FiX className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex flex-wrap items-end gap-3 p-4 bg-white/5 border border-white/5 rounded-2xl">
                    <div className="flex-1 min-w-[70px]">
                      <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-1.5 ml-1">Days</label>
                      <input
                        type="number"
                        min="0"
                        value={rDays}
                        onChange={(e) => setRDays(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-950/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                      />
                    </div>
                    <div className="flex-1 min-w-[70px]">
                      <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-1.5 ml-1">Hours</label>
                      <input
                        type="number"
                        min="0"
                        max="23"
                        value={rHours}
                        onChange={(e) => setRHours(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-950/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                      />
                    </div>
                    <div className="flex-1 min-w-[70px]">
                      <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-1.5 ml-1">Mins</label>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={rMinutes}
                        onChange={(e) => setRMinutes(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-950/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (rDays === 0 && rHours === 0 && rMinutes === 0) return;
                        setReminders((prev) => [...prev, { days: rDays, hours: rHours, minutes: rMinutes }]);
                        setRDays(0); setRHours(0); setRMinutes(0);
                      }}
                      className="h-10 px-5 inline-flex items-center gap-2 text-xs font-bold rounded-lg bg-white/10 text-white border border-white/10 hover:bg-white/20 transition-all active:scale-95"
                    >
                      <FiPlus className="h-4 w-4" /> Add
                    </button>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1">Description</label>
              <textarea 
                value={description} 
                onChange={(e)=>setDescription(e.target.value)} 
                className="w-full min-h-32 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all custom-scrollbar" 
                placeholder="Add notes or details..."
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button 
                type="button" 
                onClick={()=>setEditing(false)} 
                className="px-5 py-2 text-xs font-semibold rounded-lg bg-white/5 text-slate-300 border border-white/5 hover:bg-white/10 hover:text-white transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={submitting} 
                className="px-6 py-2 text-xs font-bold rounded-lg bg-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-600/20 disabled:opacity-50 transition-all active:scale-95"
              >
                {submitting?"Saving...":"Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
