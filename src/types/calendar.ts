export type CalendarView = "month" | "week" | "day";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  // Accept either ISO string (from server) or Date (runtime)
  start: string | Date;
  end: string | Date;
  allDay?: boolean;
  location?: string;
  organizer?: string;
  attendees?: string[]; // emails or names
  status?: "tentative" | "confirmed" | "cancelled";
  privacy?: "public" | "private" | "confidential";
  recurrence?: string; // e.g., RRULE string
  reminders?: string; // e.g., "email:30m,popup:10m"
  color?: string; // tailwind class, e.g. 'bg-emerald-400'
  createdAt?: string;
  updatedAt?: string;
}

