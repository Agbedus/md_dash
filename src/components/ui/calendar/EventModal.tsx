"use client";
import React, { useEffect, useState } from "react";
import { FiBell, FiX, FiCheck, FiClock, FiCalendar, FiMapPin, FiPlus } from "react-icons/fi";
import { createEvent } from "@/app/calendar/actions";
import type { EventReminder } from "@/types/calendar";

interface EventModalProps {
  open: boolean;
  initialStart?: Date | null;
  onClose: () => void;
  onCreated: () => Promise<void> | void;
}

export default function EventModal({ open, initialStart, onClose, onCreated }: EventModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [location, setLocation] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [attendees, setAttendees] = useState(""); // comma separated
  const [status, setStatus] = useState<"tentative"|"confirmed"|"cancelled">("tentative");
  const [privacy, setPrivacy] = useState<"public"|"private"|"confidential">("public");
  const [recurrence, setRecurrence] = useState<"none"|"daily"|"weekly"|"monthly"|"yearly">("none");
  const [reminders, setReminders] = useState<EventReminder[]>([]);
  const [color, setColor] = useState("#6366f1");
  
  const [rDays, setRDays] = useState(0);
  const [rHours, setRHours] = useState(0);
  const [rMinutes, setRMinutes] = useState(0);
  
  const [submitting, setSubmitting] = useState(false);

  // Helpers
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

  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setAllDay(false);
      const base = initialStart ?? new Date();
      // Use local time for inputs
      const startLocal = toLocalISOString(base);
      // Default end is 1 hour later
      const endBase = new Date(base.getTime() + 60*60*1000);
      const endLocal = toLocalISOString(endBase);
      
      setStart(startLocal);
      setEnd(endLocal);
      setLocation("");
      setOrganizer("");
      setAttendees("");
      setStatus("tentative");
      setPrivacy("public");
      setRecurrence("none");
      setReminders([]);
      setColor("#6366f1");
      setRDays(0);
      setRHours(0);
      setRMinutes(0);
      setSubmitting(false);
    }
  }, [open, initialStart]);

  // When switching between all-day and timed, reshape values so inputs stay valid
  useEffect(() => {
    if (allDay) {
      setStart((prev) => toDateOnly(prev));
      setEnd((prev) => toDateOnly(prev));
    } else {
      // If only dates are present, add reasonable default times
      setStart((prev) => toDateTime(prev, "09:00"));
      setEnd((prev) => toDateTime(prev, "10:00"));
    }
  }, [allDay]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title || "Untitled Event");
      if (description) formData.append('description', description);
      
      // Convert local inputs back to ISO for server
      formData.append('start', new Date(start).toISOString());
      formData.append('end', new Date(end).toISOString());
      
      formData.append('allDay', String(allDay));
      if (location) formData.append('location', location);
      if (organizer) formData.append('organizer', organizer);
      if (attendees) formData.append('attendees', JSON.stringify(attendees.split(",").map((s) => s.trim()).filter(Boolean)));
      if (status) formData.append('status', status);
      if (privacy) formData.append('privacy', privacy);
      if (recurrence) formData.append('recurrence', recurrence);
      formData.append('reminders', JSON.stringify(reminders));
      formData.append('color', color);

      const result = await createEvent(formData);
      if (result && !result.success) {
        alert(result.error || "Failed to save event");
        return;
      }
      
      await onCreated();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to save event");
    } finally {
      setSubmitting(false);
    }
  }

  // Close when clicking the backdrop
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
      aria-labelledby="create-event-title"
      onClick={handleBackdropClick}
    >
      <div className="w-full md:max-w-3xl bg-slate-950/40 backdrop-blur-2xl border border-white/10 rounded-t-2xl md:rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div id="create-event-title" className="text-slate-100 font-bold tracking-tight">Create Event</div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* All-day toggle at top */}
          <div className="flex items-center justify-between gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
            <span className="text-xs font-medium text-slate-300 flex items-center gap-2">
              <FiCalendar className="text-purple-400" /> Event Timing
            </span>
            <button
              type="button"
              id="allday"
              onClick={() => setAllDay((v) => !v)}
              aria-pressed={allDay}
              className={`relative inline-flex h-9 items-center rounded-full border px-1 transition-all duration-300 ${
                allDay ? "bg-purple-600/30 border-purple-500/50" : "bg-slate-800/40 border-slate-700/50"
              }`}
            >
              <span
                className={`inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-full transition-all duration-300 ${
                  allDay ? "bg-purple-600 text-white shadow-lg shadow-purple-900/40" : "bg-transparent text-slate-400"
                }`}
              >
                All day
              </span>
              <span
                className={`inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-full transition-all duration-300 ${
                  !allDay ? "bg-slate-700 text-slate-200" : "bg-transparent text-slate-400"
                }`}
              >
                Timed
              </span>
            </button>
          </div>
          {/* Primary fields */}
          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 ml-1">Title</label>
              <input
                value={title}
                onChange={(e)=>setTitle(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all"
                placeholder="What's happening?"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 ml-1 flex items-center gap-1.5">
                  <FiClock className="text-purple-400" /> Start
                </label>
                <input
                  type={startInputType}
                  value={start}
                  onChange={(e)=>setStart(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 ml-1 flex items-center gap-1.5">
                  <FiClock className="text-purple-400" /> End
                </label>
                <input
                  type={endInputType}
                  value={end}
                  onChange={(e)=>setEnd(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 ml-1 flex items-center gap-1.5">
                <FiMapPin className="text-purple-400" /> Location
              </label>
              <input
                value={location}
                onChange={(e)=>setLocation(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all"
                placeholder="Add physical or virtual location"
              />
            </div>
          </div>

          {/* Advanced options */}
          <details className="group">
            <summary className="list-none cursor-pointer select-none text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-3 hover:text-slate-200 transition-colors">
              <span className="flex-1 h-px bg-white/10"></span>
              <div className="flex items-center gap-2 px-2">
                <FiPlus className="group-open:rotate-45 transition-transform" />
                More options
              </div>
              <span className="flex-1 h-px bg-white/10"></span>
            </summary>

            <div className="mt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 ml-1">Organizer</label>
                  <input
                    value={organizer}
                    onChange={(e)=>setOrganizer(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all"
                    placeholder="Event creator or host"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 ml-1">Attendees</label>
                  <input
                    value={attendees}
                    onChange={(e)=>setAttendees(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all"
                    placeholder="Separate emails with commas"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 ml-1">Status</label>
                  <div className="flex flex-wrap gap-2">
                    {([
                      { v: "tentative", label: "Tentative" },
                      { v: "confirmed", label: "Confirmed" },
                      { v: "cancelled", label: "Cancelled" },
                    ] as const).map((opt) => (
                      <button
                        type="button"
                        key={opt.v}
                        onClick={() => setStatus(opt.v)}
                        className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all duration-200 ${
                          status === opt.v
                            ? "border-purple-500/60 bg-purple-500/20 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                            : "border-white/5 bg-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 ml-1">Privacy</label>
                  <div className="flex flex-wrap gap-2">
                    {([
                      { v: "public", label: "Public", color: "border-emerald-500/50 text-emerald-300 bg-emerald-500/10" },
                      { v: "private", label: "Private", color: "border-amber-500/50 text-amber-300 bg-amber-500/10" },
                      { v: "confidential", label: "Confidential", color: "border-rose-500/50 text-rose-300 bg-rose-500/10" },
                    ] as const).map((opt) => (
                      <button
                        type="button"
                        key={opt.v}
                        onClick={() => setPrivacy(opt.v)}
                        className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all duration-200 ${
                          privacy === opt.v
                            ? `${opt.color} shadow-[0_0_15px_rgba(16,185,129,0.1)]`
                            : "border-white/5 bg-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 ml-1">Recurrence</label>
                  <div className="flex flex-wrap gap-2">
                    {([
                      { v: "none", label: "None" },
                      { v: "daily", label: "Daily" },
                      { v: "weekly", label: "Weekly" },
                      { v: "monthly", label: "Monthly" },
                      { v: "yearly", label: "Yearly" },
                    ] as const).map((opt) => (
                      <button
                        type="button"
                        key={opt.v}
                        onClick={() => setRecurrence(opt.v)}
                        className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all duration-200 ${
                          recurrence === opt.v
                            ? "border-purple-500/60 bg-purple-500/20 text-purple-200"
                            : "border-white/5 bg-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 ml-1">Event Color</label>
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

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 ml-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e)=>setDescription(e.target.value)}
                    className="w-full min-h-32 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all custom-scrollbar"
                    placeholder="Add notes, details, or agenda..."
                  />
                </div>

                <div className="md:col-span-2">
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
              </div>
            </div>
          </details>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-white/5 text-slate-300 border border-white/5 hover:bg-white/10 hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 text-xs font-bold rounded-lg bg-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              {submitting ? "Saving..." : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
