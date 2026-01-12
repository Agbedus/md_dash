import type { CalendarEvent } from "@/types/calendar";
import Link from "next/link";

interface EventWidgetProps {
  event: CalendarEvent;
}

export default function EventWidget({ event }: EventWidgetProps) {
  // Format date and time - handle both string and Date types
  const formatDateTime = (dateInput: string | Date) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    
    if (date.toDateString() === today.toDateString()) {
      return `Today at ${timeStr}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow at ${timeStr}`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
  };

  // Status color
  let statusColor = "text-blue-400";
  if (event.status === "confirmed") statusColor = "text-emerald-400";
  if (event.status === "cancelled") statusColor = "text-red-400";

  return (
    <div className="glass p-4 rounded-xl border border-white/5 hover:border-white/10 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white mb-2 truncate">{event.title}</h4>
          
          <div className="space-y-1.5 text-sm text-zinc-400 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">📅</span>
              <span>{formatDateTime(event.start)}</span>
            </div>
            
            {event.location && (
              <div className="flex items-center gap-2">
                <span className="text-zinc-500">📍</span>
                <span className="truncate">{event.location}</span>
              </div>
            )}
            
            {event.attendees && event.attendees.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-zinc-500">👥</span>
                <span className="truncate">{event.attendees.length} attendee{event.attendees.length > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
          
          {event.status && (
            <span className={`text-xs px-2 py-1 rounded-lg bg-white/5 ${statusColor} font-medium`}>
              {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
            </span>
          )}
        </div>
        
        <Link 
          href={`/calendar?id=${String(event.id)}`}
          className="text-blue-400 hover:text-blue-300 text-sm font-medium whitespace-nowrap"
        >
          View →
        </Link>
      </div>
    </div>
  );
}
