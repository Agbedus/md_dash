"use client";
import React, { useState, useMemo, useCallback, useEffect, useOptimistic, useTransition } from "react";
import { addDays, addMonths, addWeeks, startOfDay } from "date-fns";
import type { CalendarEvent, CalendarView } from "@/types/calendar";
import Toolbar from "./Toolbar";
import MonthGrid from "./MonthGrid";
import WeekGrid from "./WeekGrid";
import DayGrid from "./DayGrid";

import EventModal from "./EventModal";
import EventDetailModal from "./EventDetailModal";
import { getEvents, deleteEvent } from "@/app/calendar/actions";
import { getTasks, deleteTask } from "@/app/tasks/actions";

// Shape of rows returned by GET /api/tasks (simplified for internal use or imported if needed)
type TaskRow = {
  id: number;
  name: string;
  description: string | null;
  dueDate: string | null;
  priority: "low" | "medium" | "high";
  status: "TODO" | "IN_PROGRESS" | "QA" | "REVIEW" | "DONE";
  createdAt?: string | null;
  updatedAt?: string | null;
};

// UI-level event that may include task metadata
type UICalendarEvent = CalendarEvent;

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
  const [, ] = useTransition();

  // Optimistic UI for Calendar
  const [optimisticEvents, addOptimisticEvent] = useOptimistic(
    serverEvents,
    (state: UICalendarEvent[], action: { type: 'add' | 'update' | 'delete', event: UICalendarEvent }) => {
      switch (action.type) {
        case 'add':
          return [...state, action.event];
        case 'update':
          return state.map(e => e.id === action.event.id ? action.event : e);
        case 'delete':
          return state.filter(e => e.id !== action.event.id);
        default:
          return state;
      }
    }
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
      optimisticEvents.map((e) => ({
        ...e,
        start: new Date(e.start),
        end: new Date(e.end),
      })),
    [optimisticEvents]
  );

  const loadEvents = useCallback(async () => {
    try {
      const [eventsData, tasksData] = await Promise.all([
        getEvents(),
        getTasks(),
      ]);

      const mappedEvents: UICalendarEvent[] = eventsData.map((ev) => ({
          ...ev,
          start: new Date(ev.start),
          end: new Date(ev.end),
      }));

      // map tasks with dueDate into calendar items
      const taskItems: UICalendarEvent[] = tasksData
        .filter((t) => t.dueDate)
        .map((t) => {
          const due = new Date(t.dueDate as string);
          // place at 09:00 local for visibility
          const start = new Date(due.getFullYear(), due.getMonth(), due.getDate(), 9, 0, 0, 0);
          const statusMap: UICalendarEvent["taskStatus"] =
            t.status === "IN_PROGRESS" ? "in_progress" : t.status === "DONE" ? "completed" : "task";
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
        addOptimisticEvent({ type: "delete", event: e });
        if (e.isTask || String(e.id).startsWith("task-")) {
          // extract numeric id for tasks
          const idStr = String(e.id).replace(/^task-/, "");
          const formData = new FormData();
          formData.append("id", idStr);
          await deleteTask(formData);
        } else {
          await deleteEvent(e.id);
        }
        await loadEvents();
        if (selectedEvent && selectedEvent.id === e.id) setSelectedEvent(null);
      } catch (err) {
        console.error(err);
        alert("Failed to delete item");
        await loadEvents(); // revert
      }
    },
    [loadEvents, selectedEvent, addOptimisticEvent]
  );

  return (
    <div className="space-y-4 pb-40">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Calendar</h1>
        <p className="text-zinc-400 text-lg">Manage your schedule and upcoming events.</p>
      </div>

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
          onOptimisticAdd={(evt) => addOptimisticEvent({ type: 'add', event: evt })}
        />

        <EventDetailModal
          event={selectedEvent}
          open={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onUpdated={async () => {
            await loadEvents();
          }}
          onOptimisticUpdate={(evt) => addOptimisticEvent({ type: 'update', event: evt })}
          onOptimisticDelete={(evt) => addOptimisticEvent({ type: 'delete', event: evt })}
        />
      </div>
  );
}
