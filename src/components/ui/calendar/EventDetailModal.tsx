"use client";
import React, { useState, useEffect } from "react";
import type { CalendarEvent, EventReminder } from "@/types/calendar";
import { format } from "date-fns";
import { 
  FiX, FiCalendar, FiMapPin, FiUsers, FiEdit2, FiTrash2, 
  FiGlobe, FiLock, FiBell, FiPlus, FiCheck
} from "react-icons/fi";
import { updateEvent, deleteEvent } from "@/app/calendar/actions";
import { Tooltip } from "@/components/ui/Tooltip";
import { CustomDatePicker } from "@/components/ui/inputs/custom-date-picker";
import { CustomNumberInput } from "@/components/ui/inputs/custom-number-input";

interface Props {
  event: CalendarEvent | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => Promise<void> | void;
  onOptimisticUpdate?: (event: CalendarEvent) => void;
  onOptimisticDelete?: (event: CalendarEvent) => void;
}

export default function EventDetailModal({ 
  event, 
  open, 
  onClose, 
  onUpdated,
  onOptimisticUpdate,
  onOptimisticDelete 
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [location, setLocation] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [attendees, setAttendees] = useState("");
  const [status, setStatus] = useState<"tentative"|"confirmed"|"cancelled">("confirmed");
  const [privacy, setPrivacy] = useState<"public"|"private"|"confidential">("public");
  const [recurrence, setRecurrence] = useState<"none"|"daily"|"weekly"|"monthly"|"yearly">("none");
  const [reminders, setReminders] = useState<EventReminder[]>([]);
  const [color, setColor] = useState("#6366f1");

  // Reminder inputs
  const [rDays, setRDays] = useState(0);
  const [rHours, setRHours] = useState(0);
  const [rMinutes, setRMinutes] = useState(0);

  // Helper functions
  function toLocalISOString(date: Date) {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  function toDateOnly(value: string) {
    return value.length > 10 ? value.slice(0, 10) : value;
  }

  function toDateTime(value: string, fallbackTime: string) {
    return value.length === 10 ? `${value}T${fallbackTime}` : value;
  }

  // Initialize state when event opens
  useEffect(() => {
    if (event && open) {
      setIsEditing(false); // Start in view mode
      setTitle(event.title);
      setDescription(event.description || "");
      setAllDay(Boolean(event.allDay));
      
      try {
          const s = new Date(event.start);
          const e = new Date(event.end);
          if(!isNaN(s.getTime())) setStart(toLocalISOString(s));
          if(!isNaN(e.getTime())) setEnd(toLocalISOString(e));
      } catch (e) {
          console.error("Invalid dates", e);
      }

      setLocation(event.location || "");
      setOrganizer(event.organizer || "");
      setAttendees(event.attendees ? event.attendees.join(", ") : "");
      
      setStatus((event.status as any) || "confirmed");
      setPrivacy((event.privacy as any) || "public");
      setRecurrence((event.recurrence as any) || "none");
      
      setReminders(event.reminders || []);
      setColor(event.color || "#6366f1");
    }
  }, [event, open]);

  // Handle all-day toggle
  useEffect(() => {
    if (allDay) {
      setStart((prev) => toDateOnly(prev));
      setEnd((prev) => toDateOnly(prev));
    } else {
      setStart((prev) => toDateTime(prev, "09:00"));
      setEnd((prev) => toDateTime(prev, "10:00"));
    }
  }, [allDay]);


  if (!open || !event) return null;

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!event) return;
    setSubmitting(true);

    // Optimistic Update
    const updatedEvent: CalendarEvent = {
        ...event,
        title,
        description: description || undefined,
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
        allDay,
        location: location || undefined,
        organizer: organizer || undefined,
        attendees: attendees.split(",").map(s => s.trim()).filter(Boolean),
        status,
        privacy,
        recurrence,
        reminders,
        color,
        updatedAt: new Date().toISOString()
    };
    onOptimisticUpdate?.(updatedEvent);
    onClose();

    try {
      const formData = new FormData();
      formData.append('id', String(event.id));
      formData.append('title', title);
      formData.append('description', description);
      formData.append('start', new Date(start).toISOString());
      formData.append('end', new Date(end).toISOString());
      formData.append('allDay', String(allDay));
      formData.append('location', location);
      formData.append('organizer', organizer);
      formData.append('attendees', JSON.stringify(attendees.split(",").map(s => s.trim()).filter(Boolean)));
      formData.append('status', status);
      formData.append('privacy', privacy);
      formData.append('recurrence', recurrence);
      formData.append('reminders', JSON.stringify(reminders));
      formData.append('color', color);

      const res = await updateEvent(formData);
      if (res && !res.success) {
        console.error(res.error || "Failed to update event");
      }
      await onUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this event?")) return;
    if (!event) return;
    setSubmitting(true);

    onOptimisticDelete?.(event);
    onClose();

    try {
      const res = await deleteEvent(event.id);
      if (res && !res.success) {
         console.error(res.error || "Failed to delete");
      }
      await onUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  const startInputType = allDay ? "date" : "datetime-local";
  const endInputType = allDay ? "date" : "datetime-local";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-6"
      role="dialog"
      aria-modal="true"
      onClick={handleBackdropClick}
    >
      <div className="w-full md:max-w-3xl bg-slate-950/40 backdrop-blur-2xl border border-white/10 rounded-t-2xl md:rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex-none px-5 py-3 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="text-slate-100 font-bold tracking-tight truncate pr-4 text-sm">{isEditing ? "Edit Event" : event.title}</div>
          <Tooltip content="Close">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <FiX className="h-4 w-4" />
            </button>
          </Tooltip>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          
          {/* View Mode */}
          {!isEditing && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4">
                 {/* Timing */}
                 <div className="flex items-start gap-3">
                    <div className="mt-0.5 h-7 w-7 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-purple-400 shrink-0">
                      <FiCalendar className="h-3.5 w-3.5" />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-slate-200">
                            {event.allDay ? (
                                <span>{format(new Date(event.start), "EEEE, MMMM d, yyyy")}</span>
                            ) : (
                                <span>
                                    {format(new Date(event.start), "EEEE, MMMM d")} • {format(new Date(event.start), "h:mm a")} - {format(new Date(event.end), "h:mm a")}
                                </span>
                            )}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                            {event.allDay ? "All Day" : "Formatted Time"}
                            {event.recurrence && event.recurrence !== 'none' && (
                                <span className="text-purple-400 font-semibold uppercase tracking-wider text-[10px] bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                                    Repeats: {event.recurrence}
                                </span>
                            )}
                        </div>
                    </div>
                 </div>

                 {/* Location */}
                 {event.location && (
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 h-7 w-7 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-purple-400 shrink-0">
                          <FiMapPin className="h-3.5 w-3.5" />
                        </div>
                        <div>
                            <div className="text-sm text-slate-300">{event.location}</div>
                            <div className="text-xs text-slate-500 mt-0.5">Location</div>
                        </div>
                    </div>
                 )}

                 {/* Attendees */}
                 {event.attendees && event.attendees.length > 0 && (
                     <div className="flex items-start gap-3">
                        <div className="mt-0.5 h-7 w-7 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-purple-400 shrink-0">
                           <FiUsers className="h-3.5 w-3.5" />
                        </div>
                        <div>
                            <div className="flex flex-wrap gap-2">
                                {event.attendees.map((email, idx) => (
                                    <span key={idx} className="px-2 py-1 text-xs bg-white/5 text-slate-300 rounded-md border border-white/5">
                                        {email.trim()}
                                    </span>
                                ))}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">Attendees</div>
                        </div>
                     </div>
                 )}

                 {/* Description */}
                 {event.description && (
                    <div className="bg-white/5 rounded-xl border border-white/5 p-4 mt-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
                            <FiEdit2 className="h-3 w-3" /> Description
                        </div>
                        <div className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                            {event.description}
                        </div>
                    </div>
                 )}
                 
                 {/* Metadata Badge Row */}
                 <div className="flex flex-wrap gap-3 mt-4 border-t border-white/5 pt-4">
                    <Tooltip content="Event Status" position="bottom">
                        <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border inline-flex items-center gap-1.5 cursor-help ${
                            event.status === 'confirmed' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                            event.status === 'cancelled' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
                            'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        }`}>
                            <div className={`h-1.5 w-1.5 rounded-full ${
                                event.status === 'confirmed' ? 'bg-emerald-400' :
                                event.status === 'cancelled' ? 'bg-rose-400' :
                                'bg-amber-400'
                            }`} />
                            {event.status || 'Tentative'}
                        </div>
                    </Tooltip>
                    
                    <Tooltip content="Visibility" position="bottom">
                        <div className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-slate-800 border border-slate-700 text-slate-400 inline-flex items-center gap-1.5 cursor-help">
                            {event.privacy === 'private' ? <FiLock className="h-2.5 w-2.5" /> : <FiGlobe className="h-2.5 w-2.5" />}
                            {event.privacy || 'Public'}
                        </div>
                    </Tooltip>

                    <Tooltip content="Color Code" position="bottom">
                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-slate-800 border border-slate-700 text-slate-400 cursor-help">
                            <div className="h-2 w-2 rounded-full ring-1 ring-white/20" style={{backgroundColor: event.color || '#6366f1'}} />
                            <span className="opacity-70">Color</span>
                        </div>
                    </Tooltip>
                 </div>
              </div>
            </div>
          )}

          {/* Edit Mode Form */}
          {isEditing && (
            <form id="edit-event-form" onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 ml-1">Title</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all font-medium"
                    placeholder="Event title"
                    required
                  />
                </div>
                
                <div className="flex items-center gap-4 py-1">
                   <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                      <input 
                        type="checkbox" 
                        id="edit-allday" 
                        checked={allDay} 
                        onChange={(e) => setAllDay(e.target.checked)}
                        className="rounded border-slate-600 bg-slate-700 text-purple-500 focus:ring-purple-500/50 focus:ring-offset-0 h-3.5 w-3.5"
                      />
                      <label htmlFor="edit-allday" className="text-xs font-medium text-slate-300 cursor-pointer select-none">All day event</label>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 ml-1">Start</label>
                        <CustomDatePicker
                            value={start}
                            onChange={(date) => {
                                if (date) {
                                    setStart(allDay ? format(date, "yyyy-MM-dd") : format(date, "yyyy-MM-dd'T'HH:mm"));
                                }
                            }}
                            enableTime={!allDay}
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 ml-1">End</label>
                        <CustomDatePicker
                            value={end}
                            onChange={(date) => {
                                if (date) {
                                    setEnd(allDay ? format(date, "yyyy-MM-dd") : format(date, "yyyy-MM-dd'T'HH:mm"));
                                }
                            }}
                            enableTime={!allDay}
                            className="w-full"
                            minDate={start ? new Date(start) : undefined}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 ml-1">Location</label>
                    <input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 ml-1">Organizer</label>
                        <input
                            value={organizer}
                            onChange={(e) => setOrganizer(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all"
                            placeholder="Host name"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 ml-1">Attendees</label>
                        <input
                            value={attendees}
                            onChange={(e) => setAttendees(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all"
                            placeholder="Emails, comma separated"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                     <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 ml-1">Status</label>
                        <select 
                            value={status} 
                            onChange={(e) => setStatus(e.target.value as any)}
                            className="w-full bg-slate-950/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                        >
                            <option value="tentative">Tentative</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                     </div>
                     <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 ml-1">Recurrence</label>
                        <select 
                            value={recurrence} 
                            onChange={(e) => setRecurrence(e.target.value as any)}
                            className="w-full bg-slate-950/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                        >
                            <option value="none">None</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                        </select>
                     </div>
                </div>
                
                 <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 ml-1">Privacy</label>
                    <select 
                        value={privacy} 
                        onChange={(e) => setPrivacy(e.target.value as any)}
                        className="w-full bg-slate-950/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                    >
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                        <option value="confidential">Confidential</option>
                    </select>
                 </div>

                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 ml-1">Color</label>
                    <div className="flex flex-wrap gap-2 p-2 bg-white/5 rounded-lg border border-white/5">
                        {(["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"] as const).map((c) => (
                        <button
                            type="button"
                            key={c}
                            onClick={() => setColor(c)}
                            className={`h-5 w-5 rounded-full border-2 transition-all duration-300 ${
                            color === c ? "border-white scale-125 shadow-sm shadow-white/20" : "border-transparent opacity-60 hover:opacity-100 hover:scale-110"
                            }`}
                            style={{ backgroundColor: c }}
                        />
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 ml-1">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all custom-scrollbar min-h-[80px] resize-none"
                    />
                </div>

                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1 flex items-center gap-1.5">
                        <FiBell className="text-purple-400" /> Reminders
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                        {reminders.map((r, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-200">
                            {r.days > 0 && `${r.days}d `}
                            {r.hours > 0 && `${r.hours}h `}
                            {r.minutes > 0 && `${r.minutes}m `}
                            pre
                            <button type="button" onClick={() => setReminders((prev) => prev.filter((_, i) => i !== idx))} className="hover:text-white transition-colors">
                             <FiX className="h-2.5 w-2.5" />
                            </button>
                        </span>
                        ))}
                    </div>
                    
                    <div className="flex flex-wrap items-end gap-2 p-2 bg-white/5 border border-white/5 rounded-lg">
                        <div className="flex-1 min-w-[50px]">
                        <label className="block text-[8px] uppercase font-bold tracking-widest text-slate-500 mb-1 ml-0.5">Days</label>
                        <CustomNumberInput
                            value={rDays}
                            onChange={(val) => setRDays(Number(val) || 0)}
                            min={0}
                            className="bg-zinc-950/40"
                        />
                        </div>
                        <div className="flex-1 min-w-[50px]">
                        <label className="block text-[8px] uppercase font-bold tracking-widest text-slate-500 mb-1 ml-0.5">Hrs</label>
                        <CustomNumberInput
                            value={rHours}
                            onChange={(val) => setRHours(Number(val) || 0)}
                            min={0}
                            max={23}
                            className="bg-zinc-950/40"
                        />
                        </div>
                        <div className="flex-1 min-w-[50px]">
                        <label className="block text-[8px] uppercase font-bold tracking-widest text-slate-500 mb-1 ml-0.5">Mins</label>
                        <CustomNumberInput
                            value={rMinutes}
                            onChange={(val) => setRMinutes(Number(val) || 0)}
                            min={0}
                            max={59}
                            className="bg-zinc-950/40"
                        />
                        </div>
                        <button
                        type="button"
                        onClick={() => {
                            if (rDays === 0 && rHours === 0 && rMinutes === 0) return;
                            setReminders((prev) => [...prev, { days: rDays, hours: rHours, minutes: rMinutes }]);
                            setRDays(0); setRHours(0); setRMinutes(0);
                        }}
                        className="h-6 px-3 inline-flex items-center gap-1 text-[10px] font-bold rounded bg-white/10 text-white border border-white/10 hover:bg-white/20 transition-all active:scale-95"
                        >
                        <FiPlus className="h-3 w-3" /> Add
                        </button>
                    </div>
                </div>
            </form>
          )}

        </div>

        {/* Footer Actions */}
        <div className="flex-none p-3 border-t border-white/10 bg-white/5 flex items-center justify-between">
            {isEditing ? (
                <>
                    <Tooltip content="Delete Event">
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="group h-8 w-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/5 hover:bg-rose-500/10 hover:border-rose-500/20 text-slate-400 hover:text-rose-400 transition-all"
                        >
                            <FiTrash2 className="h-3.5 w-3.5" />
                        </button>
                    </Tooltip>
                    
                    <div className="flex items-center gap-2">
                        <Tooltip content="Cancel Editing">
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="group h-8 w-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-slate-400 hover:text-white transition-all"
                            >
                                <FiX className="h-3.5 w-3.5" />
                            </button>
                        </Tooltip>
                        
                        <Tooltip content="Save Changes">
                            <button
                                type="submit"
                                form="edit-event-form"
                                disabled={submitting}
                                className="group h-8 w-8 flex items-center justify-center rounded-lg bg-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                            >
                                <FiCheck className="h-3.5 w-3.5" />
                            </button>
                        </Tooltip>
                    </div>
                </>
            ) : (
                <>
                    <Tooltip content="Delete Event">
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="group h-8 w-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/5 hover:bg-rose-500/10 hover:border-rose-500/20 text-slate-400 hover:text-rose-400 transition-all"
                        >
                            <FiTrash2 className="h-3.5 w-3.5" />
                        </button>
                    </Tooltip>
                    
                    <Tooltip content="Edit Event">
                        <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            className="group h-8 w-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/5 transition-all shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                        >
                            <FiEdit2 className="h-3.5 w-3.5" />
                        </button>
                    </Tooltip>
                </>
            )}
        </div>

      </div>
    </div>
  );
}
