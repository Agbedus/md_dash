"use client";
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { addDays, addMonths, addWeeks, startOfDay } from "date-fns";
import type { CalendarEvent, CalendarView } from "@/types/calendar";
import Toolbar from "./Toolbar";
import MonthGrid from "./MonthGrid";
import WeekGrid from "./WeekGrid";
import DayGrid from "./DayGrid";

import EventModal from "./EventModal";
import EventDetailModal from "./EventDetailModal";

// Shape of rows returned by GET /api/events (derived from `src/db/schema.ts`)
type EventRow = {
  id: number | string;
  title: string;
  description: string | null;
  start: string; // ISO string
  end: string;   // ISO string
  allDay?: number | null;
  all_day?: number | null; // tolerate snake_case just in case
  location: string | null;
  organizer: string | null;
  attendees: string | null; // JSON string array or comma list
  status?: "tentative" | "confirmed" | "cancelled" | null;
  privacy?: "public" | "private" | "confidential" | null;
  recurrence?: string | null;
  reminders?: string | null;
  color?: string | null;
  createdAt?: string | null;
  created_at?: string | null; // tolerate snake_case
  updatedAt?: string | null;
  updated_at?: string | null; // tolerate snake_case
};

type TaskRow = {
  id: number;
  name: string;
  description: string | null;
  dueDate: string | null;
  priority: "low" | "medium" | "high";
  status: "task" | "in_progress" | "completed";
  createdAt?: string | null;
  updatedAt?: string | null;
};

// UI-level event that may include task metadata
type UICalendarEvent = CalendarEvent & { isTask?: boolean; taskStatus?: "pending" | "in_progress" | "completed" };

interface CalendarProps {
  initialDate?: Date;
  initialView?: CalendarView;
  events?: CalendarEvent[];
}

export default function Calendar({ initialDate, initialView = "month", events = [] }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState<Date>(initialDate ? startOfDay(initialDate) : startOfDay(new Date()));
  const [view, setView] = useState<CalendarView>(initialView);
  // augment events with optional task metadata
  const [serverEvents, setServerEvents] = useState<UICalendarEvent[]>(
    // allow initial prop events (may contain string dates)
    events.map((ev) => ({ ...ev }))
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStart, setModalStart] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<UICalendarEvent | null>(null);

  const onPrev = useCallback(() => {
    setCurrentDate((d) => (view === "month" ? addMonths(d, -1) : view === "week" ? addWeeks(d, -1) : addDays(d, -1)));
  }, [view]);

  const onNext = useCallback(() => {
    setCurrentDate((d) => (view === "month" ? addMonths(d, 1) : view === "week" ? addWeeks(d, 1) : addDays(d, 1)));
  }, [view]);

  const onToday = useCallback(() => setCurrentDate(startOfDay(new Date())), []);

  const normalizedEvents = useMemo(
    () =>
      serverEvents.map((e) => ({
        ...e,
        start: new Date(e.start),
        end: new Date(e.end),
      })),
    [serverEvents]
  );

  const loadEvents = useCallback(async () => {
    try {
      const [evRes, taskRes] = await Promise.all([
        fetch("/api/events", { cache: "no-store" }),
        fetch("/api/tasks", { cache: "no-store" }),
      ]);
      if (!evRes.ok) throw new Error("Failed to load events");
      if (!taskRes.ok) throw new Error("Failed to load tasks");
      const data: EventRow[] = await evRes.json();
      const tasksData: TaskRow[] = await taskRes.json();

      const mappedEvents: UICalendarEvent[] = data.map((row) => {
        // safe attendees parsing: try JSON.parse, fallback to comma-split, else []
        let attendees: string[] = [];
        if (row.attendees) {
          try {
            const parsed = JSON.parse(row.attendees);
            if (Array.isArray(parsed)) attendees = parsed.filter(Boolean).map(String);
            else if (typeof parsed === "string") attendees = parsed.split(",").map((s) => s.trim()).filter(Boolean);
          } catch {
            attendees = row.attendees.split(",").map((s) => s.trim()).filter(Boolean);
          }
        }

        // tolerant all-day detection (numeric 1/0, boolean true/false, or snake_case)
        const allDay =
          row.allDay === 1 ||
          String(row.allDay) === "1" ||
          row.all_day === 1 ||
          String(row.all_day) === "1";

        return {
          id: String(row.id),
          title: row.title,
          description: row.description ?? undefined,
          start: new Date(row.start),
          end: new Date(row.end),
          allDay,
          location: row.location ?? undefined,
          organizer: row.organizer ?? undefined,
          attendees,
          status: row.status ?? undefined,
          privacy: row.privacy ?? undefined,
          recurrence: row.recurrence ?? undefined,
          reminders: row.reminders ?? undefined,
          color: row.color ?? undefined,
          createdAt: row.createdAt ?? row.created_at ?? undefined,
          updatedAt: row.updatedAt ?? row.updated_at ?? undefined,
        };
      });

      // map tasks with dueDate into calendar items
      const taskItems: UICalendarEvent[] = tasksData
        .filter((t) => t.dueDate)
        .map((t) => {
          const due = new Date(t.dueDate as string);
          // place at 09:00 local for visibility
          const start = new Date(due.getFullYear(), due.getMonth(), due.getDate(), 9, 0, 0, 0);
          const statusMap: UICalendarEvent["taskStatus"] =
            t.status === "in_progress" ? "in_progress" : t.status === "completed" ? "completed" : "pending";
          const color =
            statusMap === "completed" ? "bg-emerald-400" : statusMap === "in_progress" ? "bg-amber-400" : "bg-sky-400";
          return {
            id: `task-${t.id}`,
            title: t.name,
            description: t.description ?? undefined,
            start,
            end: new Date(start.getTime() + 60 * 60 * 1000),
            allDay: false,
            color,
            isTask: true,
            taskStatus: statusMap,
            createdAt: t.createdAt ?? undefined,
            updatedAt: t.updatedAt ?? undefined,
          };
        });

      setServerEvents([...mappedEvents, ...taskItems]);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const openCreateAt = useCallback((d: Date) => {
    setModalStart(d);
    setModalOpen(true);
  }, []);

  // handle deletes for both events and tasks (task ids prefixed with "task-")
  const handleDeleteEvent = useCallback(
    async (e: UICalendarEvent) => {
      const ok = confirm(`Delete "${e.title}"?`);
      if (!ok) return;
      try {
        if (e.isTask || String(e.id).startsWith("task-")) {
          // extract numeric id for tasks
          const idStr = String(e.id).replace(/^task-/, "");
          const res = await fetch(`/api/tasks/${idStr}`, { method: "DELETE" });
          if (!res.ok) throw new Error("Failed to delete task");
        } else {
          const res = await fetch(`/api/events/${e.id}`, { method: "DELETE" });
          if (!res.ok) throw new Error("Failed to delete event");
        }
        await loadEvents();
        if (selectedEvent && selectedEvent.id === e.id) setSelectedEvent(null);
      } catch (err) {
        console.error(err);
        alert("Failed to delete item");
      }
    },
    [loadEvents, selectedEvent]
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Calendar</h1>
        <p className="text-zinc-400 text-lg">Manage your schedule and upcoming events.</p>
      </div>

      <div className="space-y-4 pb-40">
        <Toolbar
          currentDate={currentDate}
          view={view}
          onPrev={onPrev}
          onNext={onNext}
          onToday={onToday}
          onChangeView={setView}
        />

        {/* Views */}
        {view === "month" && (
          <MonthGrid
            date={currentDate}
            events={normalizedEvents}
            onSelectDate={(d)=>openCreateAt(d)}
            onEventClick={(e)=>setSelectedEvent(e as UICalendarEvent)}
            onEventDelete={handleDeleteEvent}
          />
        )}
        {view === "week" && (
          <WeekGrid
            date={currentDate}
            events={normalizedEvents}
            onSelectDateTime={(d)=>openCreateAt(d)}
            onEventClick={(e)=>setSelectedEvent(e as UICalendarEvent)}
            onEventDelete={handleDeleteEvent}
          />
        )}
        {view === "day" && (
          <DayGrid
            date={currentDate}
            events={normalizedEvents}
            onSelectDateTime={(d)=>openCreateAt(d)}
            onEventClick={(e)=>setSelectedEvent(e as UICalendarEvent)}
            onEventDelete={handleDeleteEvent}
          />
        )}

        <EventModal
          open={modalOpen}
          initialStart={modalStart}
          onClose={() => setModalOpen(false)}
          onCreated={async () => {
            await loadEvents();
          }}
        />

        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onUpdated={async () => {
            await loadEvents();
          }}
        />
      </div>
    </div>
  );
}
