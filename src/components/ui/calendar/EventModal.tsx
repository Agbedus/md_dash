"use client";
import React, { useEffect, useState } from "react";
import { FiBell, FiX, FiCheck, FiClock, FiCalendar, FiMapPin, FiPlus } from "react-icons/fi";
import { createEvent } from "@/app/calendar/actions";

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
  const [status, setStatus] = useState<"tentative"|"confirmed"|"cancelled"|"">("");
  const [privacy, setPrivacy] = useState<"public"|"private"|"confidential"|"">("");
  const [reminders, setReminders] = useState<string[]>([]);
  const [customReminder, setCustomReminder] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Helpers
  function toDateOnly(value: string) {
    // value like yyyy-MM-ddTHH:mm -> yyyy-MM-dd; if already date-only, return as-is
    return value.length > 10 ? value.slice(0, 10) : value;
  }

  function toDateTime(value: string, fallbackTime: string) {
    // value like yyyy-MM-dd -> yyyy-MM-ddTHH:mm using provided fallback time
    return value.length === 10 ? `${value}T${fallbackTime}` : value;
  }

  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setAllDay(false);
      const base = initialStart ?? new Date();
      const startIso = new Date(base).toISOString().slice(0,16); // yyyy-MM-ddTHH:mm
      const endIso = new Date(base.getTime() + 60*60*1000).toISOString().slice(0,16);
      setStart(startIso);
      setEnd(endIso);
      setLocation("");
      setOrganizer("");
      setAttendees("");
      setStatus("");
      setPrivacy("");
      setReminders([]);
      setCustomReminder("");
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
      formData.append('start', new Date(start).toISOString());
      formData.append('end', new Date(end).toISOString());
      formData.append('allDay', String(allDay));
      if (location) formData.append('location', location);
      if (organizer) formData.append('organizer', organizer);
      if (attendees) formData.append('attendees', JSON.stringify(attendees.split(",").map((s) => s.trim()).filter(Boolean)));
      if (status) formData.append('status', status);
      if (privacy) formData.append('privacy', privacy);
      if (reminders.length) formData.append('reminders', reminders.join(","));

      await createEvent(formData);
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
      className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-0 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-event-title"
      onClick={handleBackdropClick}
    >
      <div className="w-full md:max-w-2xl bg-slate-900/90 border border-slate-700/60 rounded-t-2xl md:rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-700/60 flex items-center justify-between sticky top-0">
          <div id="create-event-title" className="text-slate-200 font-semibold">Create Event</div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        {/* Removed inner overflow to eliminate the visible scrollbar */}
        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          {/* All-day toggle at top */}
          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="text-xs text-slate-400 flex items-center gap-2">
              <FiCalendar /> All day
            </span>
            <button
              type="button"
              id="allday"
              onClick={() => setAllDay((v) => !v)}
              aria-pressed={allDay}
              className={`relative inline-flex h-8 items-center rounded-full border px-1 transition ${
                allDay ? "bg-purple-600/20 border-purple-600" : "bg-slate-800/60 border-slate-600"
              }`}
            >
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full ${
                  allDay ? "bg-purple-600 text-white" : "bg-transparent text-slate-300"
                }`}
              >
                <FiCalendar /> All day
              </span>
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full ${
                  !allDay ? "bg-slate-700 text-slate-200" : "bg-transparent text-slate-300"
                }`}
              >
                <FiClock /> Timed
              </span>
            </button>
          </div>
          {/* Primary fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs text-slate-400 mb-1">Title</label>
              <input
                value={title}
                onChange={(e)=>setTitle(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-slate-600"
                placeholder="Add a title"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1 flex items-center gap-1"><FiClock /> Start</label>
              <input
                type={startInputType}
                value={start}
                onChange={(e)=>setStart(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-slate-600"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1 flex items-center gap-1"><FiClock /> End</label>
              <input
                type={endInputType}
                value={end}
                onChange={(e)=>setEnd(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-slate-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1 flex items-center gap-1"><FiMapPin /> Location</label>
              <input
                value={location}
                onChange={(e)=>setLocation(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-slate-600"
                placeholder="Where is it?"
              />
            </div>
          </div>

          {/* Advanced options collapsed by default to keep the modal short (no scrollbar) */}
          <details className="group">
            <summary className="list-none cursor-pointer select-none text-sm text-slate-300 inline-flex items-center gap-2">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-600">
                <FiPlus className="text-slate-500 h-2.5 w-2.5" />
              </span>
              More options
            </summary>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Organizer</label>
                <input
                  value={organizer}
                  onChange={(e)=>setOrganizer(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-slate-600"
                  placeholder="Who is hosting?"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs text-slate-400 mb-1">Attendees (comma separated)</label>
                <input
                  value={attendees}
                  onChange={(e)=>setAttendees(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-slate-600"
                  placeholder="alice@example.com, bob@example.com"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-2">Status</label>
                <div className="flex flex-wrap gap-2">
                  {([
                    { v: "tentative", label: "Tentative" },
                    { v: "confirmed", label: "Yes" },
                    { v: "cancelled", label: "No" },
                  ] as const).map((opt) => (
                    <button
                      type="button"
                      key={opt.v}
                      onClick={() => setStatus(opt.v)}
                      aria-pressed={status === opt.v}
                      className={`px-3 py-1.5 text-xs rounded-full border transition ${
                        status === opt.v
                          ? "border-purple-500 bg-purple-500/10 text-purple-300"
                          : "border-slate-600 bg-slate-800/60 text-slate-300 hover:border-slate-500"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setStatus("")}
                    className={`px-3 py-1.5 text-xs rounded-full border transition ${
                      status === "" ? "border-slate-500 bg-slate-800/60 text-slate-300" : "border-slate-600 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    None
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-2">Privacy</label>
                <div className="flex flex-wrap gap-2">
                  {([
                    { v: "public", label: "Public", color: "ring-emerald-400/40 text-emerald-300" },
                    { v: "private", label: "Private", color: "ring-amber-400/40 text-amber-300" },
                    { v: "confidential", label: "Confidential", color: "ring-rose-400/40 text-rose-300" },
                  ] as const).map((opt) => (
                    <button
                      type="button"
                      key={opt.v}
                      onClick={() => setPrivacy(opt.v)}
                      aria-pressed={privacy === opt.v}
                      className={`px-3 py-1.5 text-xs rounded-full border transition ${
                        privacy === opt.v
                          ? `border-transparent bg-slate-800/60 ring-2 ${opt.color}`
                          : "border-slate-600 bg-slate-800/60 text-slate-300 hover:border-slate-500"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPrivacy("")}
                    className={`px-3 py-1.5 text-xs rounded-full border transition ${
                      privacy === "" ? "border-slate-500 bg-slate-800/60 text-slate-300" : "border-slate-600 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    None
                  </button>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs text-slate-400 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e)=>setDescription(e.target.value)}
                  className="w-full min-h-28 bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-slate-600"
                  placeholder="Add details"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs text-slate-400 mb-2 flex items-center gap-2"><FiBell /> Reminders</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(["email:30m","popup:10m","email:1h","popup:1d"] as const).map((opt) => {
                    const active = reminders.includes(opt);
                    return (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => setReminders((prev) => active ? prev.filter((r) => r !== opt) : [...prev, opt])}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-full border transition ${
                          active ? "border-purple-500 bg-purple-500/10 text-purple-300" : "border-slate-600 bg-slate-800/60 text-slate-300 hover:border-slate-500"
                        }`}
                      >
                        {active ? <FiCheck /> : <FiBell />}
                        {opt}
                      </button>
                    );
                  })}
                  {reminders.map((r) => !["email:30m","popup:10m","email:1h","popup:1d"].includes(r) ? (
                    <span key={r} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-full border border-slate-600 bg-slate-800/60 text-slate-300">
                      <FiBell /> {r}
                      <button type="button" onClick={() => setReminders((prev) => prev.filter((x) => x !== r))} className="ml-1 hover:text-slate-100">
                        <FiX />
                      </button>
                    </span>
                  ) : null)}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={customReminder}
                    onChange={(e)=>setCustomReminder(e.target.value)}
                    className="w-full md:w-64 bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-slate-600"
                    placeholder="type:duration e.g. email:15m"
                  />
                  <button
                    type="button"
                    onClick={() => { const v = customReminder.trim(); if (v && !reminders.includes(v)) { setReminders((prev) => [...prev, v]); setCustomReminder(""); } }}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-slate-800/80 text-slate-200 border border-slate-700 hover:bg-slate-800"
                  >
                    <FiPlus /> Add
                  </button>
                </div>
              </div>
            </div>
          </details>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-md bg-slate-800/80 text-slate-200 border border-slate-700 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm rounded-md bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Save Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
