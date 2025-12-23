"use client";
import React from "react";
import type { CalendarEvent } from "@/types/calendar";
import { format } from "date-fns";
import { FiX, FiCalendar, FiMapPin, FiUser, FiUsers, FiShield, FiEdit2, FiTrash2, FiGlobe, FiLock, FiAlertTriangle, FiCheckCircle, FiMinusCircle } from "react-icons/fi";

type UICalendarEvent = CalendarEvent & { isTask?: boolean; taskStatus?: "pending" | "in_progress" | "completed" };

import { updateEvent, deleteEvent } from "@/app/calendar/actions";

interface Props {
  event: UICalendarEvent | null;
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

export default function EventDetailModal({ event, onClose, onUpdated }: Props) {
  const [editing, setEditing] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [allDay, setAllDay] = React.useState(false);
  const [start, setStart] = React.useState("");
  const [end, setEnd] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [organizer, setOrganizer] = React.useState("");
  const [attendees, setAttendees] = React.useState("");
  const [status, setStatus] = React.useState<CalendarEvent["status"] | "">("");
  const [taskStatus, setTaskStatus] = React.useState<"pending" | "in_progress" | "completed">("pending");
  const [privacy, setPrivacy] = React.useState<CalendarEvent["privacy"] | "">("");

  React.useEffect(() => {
    if (event) {
      setEditing(false);
      setSubmitting(false);
      setTitle(event.title || "");
      setDescription(event.description || "");
      setAllDay(!!event.allDay);
      const s = event.start instanceof Date ? event.start : new Date(event.start);
      const e = event.end instanceof Date ? event.end : new Date(event.end);
      const sIso = s.toISOString().slice(0, 16);
      const eIso = e.toISOString().slice(0, 16);
      setStart(sIso);
      setEnd(eIso);
      setLocation(event.location || "");
      setOrganizer(event.organizer || "");
      setAttendees((event.attendees || []).join(", "));
      setAttendees((event.attendees || []).join(", "));
      setStatus(event.status || "");
      setTaskStatus(event.taskStatus || "pending");
      setPrivacy(event.privacy || "");
    }
  }, [event]);

  if (!event) return null;

  const isTask = !!event.isTask;

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

  const c = privacyClasses(event.privacy);

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!event) return;
    setSubmitting(true);
    try {
      if (isTask) {
        const payload = {
          id: parseInt(event.id.replace('task-', '')),
          name: title || "Untitled Task",
          description: description || null,
          dueDate: new Date(start).toISOString(),
          status: taskStatus === 'pending' ? 'task' : taskStatus
        };
        const res = await fetch(`/api/tasks`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to update task");
      } else {
        const formData = new FormData();
        formData.append('id', event.id);
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

        await updateEvent(formData);
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
    if (!event) return;
    const ok = confirm("Delete this event? This action cannot be undone.");
    if (!ok) return;
    setSubmitting(true);
    try {
      await deleteEvent(event.id);
      await onUpdated?.();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to delete event");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-0 md:p-6"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full md:max-w-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-t-2xl md:rounded-2xl shadow-2xl ring-1 ring-slate-700/40">
        <div className="relative overflow-hidden rounded-t-2xl border-b border-slate-700/60">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800 via-slate-800/70 to-slate-800" />
          <div className="relative px-5 py-4 flex items-center justify-between">
            <div className="flex items-start gap-3 min-w-0">
              <div className={`mt-0.5 h-9 w-1.5 rounded-full ${c.dot}`} />
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 text-slate-100 font-semibold text-base md:text-lg min-w-0">
                  {editing ? (
                    <input
                      value={title}
                      onChange={(e)=>setTitle(e.target.value)}
                      className="bg-transparent border-b border-slate-600 focus:border-purple-500/60 outline-none text-slate-100 px-1 py-0.5 min-w-0"
                    />
                  ) : (
                    <span className="line-clamp-1">{event.title || "Untitled Event"}</span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ring-1 bg-slate-900/30 ${privacyMeta(event.privacy).cls}`}>
                    {privacyMeta(event.privacy).icon}
                    <span className="capitalize">{event.privacy ?? "unspecified"}</span>
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ring-1 bg-slate-900/30 ${statusMeta(event.status).cls}`}>
                    {statusMeta(event.status).icon}
                    <span className="capitalize">{event.status ?? "no status"}</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!editing && !isTask && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="inline-flex h-8 px-3 items-center gap-1.5 justify-center rounded bg-rose-600/20 text-rose-200 border border-rose-600/40 hover:bg-rose-600/30 text-sm"
                >
                  <FiTrash2 className="h-3 w-3" /> <span className="hidden md:inline">Delete</span>
                </button>
              )}
              {!editing && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="inline-flex h-8 px-3 items-center gap-1.5 justify-center rounded bg-slate-800/70 text-slate-200 border border-slate-700 hover:bg-slate-800 text-sm"
                >
                  <FiEdit2 className="h-3 w-3" /> <span className="hidden md:inline">Edit</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-8 w-8 items-center justify-center rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                aria-label="Close"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {!editing ? (
          <div className="p-5 space-y-4">
            <div className="text-slate-200 text-sm flex items-center gap-2">
              <FiCalendar className="h-4 w-4" />
              <span>{dateLine}</span>
            </div>

            {event.location && (
              <div className="text-sm text-slate-300 flex items-center gap-2">
                <FiMapPin className="h-4 w-4 text-slate-400" />
                <span>{event.location}</span>
              </div>
            )}

            {event.organizer && (
              <div className="text-sm text-slate-300 flex items-center gap-2">
                <FiUser className="h-4 w-4 text-slate-400" />
                <span>{event.organizer}</span>
              </div>
            )}

            {event.attendees && event.attendees.length > 0 && (
              <div className="text-sm text-slate-300 flex items-center gap-2">
                <FiUsers className="h-4 w-4 text-slate-400" />
                <span>{event.attendees.join(", ")}</span>
              </div>
            )}

            {event.description && (
              <div className="text-sm text-slate-300 whitespace-pre-wrap border-t border-slate-800/60 pt-3">
                {event.description}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSave} className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">{isTask ? "Due Date" : "Start"}</label>
                <input
                  type={allDay ? "date" : "datetime-local"}
                  value={allDay ? start.slice(0,10) : start}
                  onChange={(e)=>setStart(allDay ? `${e.target.value}T09:00` : e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200"
                />
              </div>
              {!isTask && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">End</label>
                  <input
                    type={allDay ? "date" : "datetime-local"}
                    value={allDay ? end.slice(0,10) : end}
                    onChange={(e)=>setEnd(allDay ? `${e.target.value}T10:00` : e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200"
                  />
                </div>
              )}
            </div>

            {!isTask && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-slate-400">All day</span>
                <button
                  type="button"
                  onClick={() => setAllDay((v)=>!v)}
                  className={`relative inline-flex h-8 items-center rounded-full border px-1 ${allDay ? "bg-purple-600/20 border-purple-600" : "bg-slate-800/60 border-slate-600"}`}
                >
                  <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full ${allDay ? "bg-purple-600 text-white" : "bg-transparent text-slate-300"}`}>All day</span>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full ${!allDay ? "bg-slate-700 text-slate-200" : "bg-transparent text-slate-300"}`}>Timed</span>
                </button>
              </div>
            )}

            {!isTask && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Location</label>
                <input value={location} onChange={(e)=>setLocation(e.target.value)} className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200" />
              </div>
            )}

            {!isTask && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Organizer</label>
                  <input value={organizer} onChange={(e)=>setOrganizer(e.target.value)} className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Attendees (comma separated)</label>
                  <input value={attendees} onChange={(e)=>setAttendees(e.target.value)} className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200" />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-2">Status</label>
                <div className="flex flex-wrap gap-2">
                  {isTask ? (
                    <>
                      {(["pending", "in_progress", "completed"] as const).map((opt) => (
                        <button
                          type="button"
                          key={opt}
                          onClick={() => setTaskStatus(opt)}
                          aria-pressed={taskStatus === opt}
                          className={`px-3 py-1.5 text-xs rounded-full border ${
                            taskStatus === opt
                              ? "border-purple-500 bg-purple-500/10 text-purple-300"
                              : "border-slate-600 bg-slate-800/60 text-slate-300"
                          }`}
                        >
                          {opt.replace("_", " ")}
                        </button>
                      ))}
                    </>
                  ) : (
                    <>
                      {(["tentative","confirmed","cancelled"] as const).map((opt)=> (
                        <button type="button" key={opt} onClick={()=>setStatus(opt)} aria-pressed={status===opt}
                          className={`px-3 py-1.5 text-xs rounded-full border ${status===opt?"border-purple-500 bg-purple-500/10 text-purple-300":"border-slate-600 bg-slate-800/60 text-slate-300"}`}>{opt}</button>
                      ))}
                      <button type="button" onClick={()=>setStatus("")} className={`px-3 py-1.5 text-xs rounded-full border ${status===""?"border-slate-500 bg-slate-800/60 text-slate-300":"border-slate-600 text-slate-400"}`}>None</button>
                    </>
                  )}
                </div>
              </div>
              {!isTask && (
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Privacy</label>
                  <div className="flex flex-wrap gap-2">
                    {([
                      { v: "public", cls: "ring-emerald-400/40 text-emerald-300" },
                      { v: "private", cls: "ring-amber-400/40 text-amber-300" },
                      { v: "confidential", cls: "ring-rose-400/40 text-rose-300" },
                    ] as const).map((opt)=> (
                      <button type="button" key={opt.v} onClick={()=>setPrivacy(opt.v)} aria-pressed={privacy===opt.v}
                        className={`px-3 py-1.5 text-xs rounded-full border ${privacy===opt.v?`border-transparent bg-slate-800/60 ring-2 ${opt.cls}`:"border-slate-600 bg-slate-800/60 text-slate-300"}`}>{opt.v}</button>
                    ))}
                    <button type="button" onClick={()=>setPrivacy("")} className={`px-3 py-1.5 text-xs rounded-full border ${privacy===""?"border-slate-500 bg-slate-800/60 text-slate-300":"border-slate-600 text-slate-400"}`}>None</button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Description</label>
              <textarea value={description} onChange={(e)=>setDescription(e.target.value)} className="w-full min-h-24 bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200" />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/60">
              <button type="button" onClick={()=>setEditing(false)} className="px-4 py-2 text-sm rounded-md bg-slate-800/80 text-slate-200 border border-slate-700 hover:bg-slate-800">Cancel</button>
              <button type="submit" disabled={submitting} className="px-4 py-2 text-sm rounded-md bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-60">{submitting?"Saving...":"Save Changes"}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
