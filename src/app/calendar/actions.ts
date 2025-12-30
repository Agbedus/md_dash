'use server';

import { auth } from '@/auth';
import { revalidatePath, revalidateTag } from 'next/cache';
import type { CalendarEvent } from '@/types/calendar';

const BASE_URL = process.env.BASE_URL_LOCAL || "http://127.0.0.1:8000";
const API_BASE_URL = `${BASE_URL}/api/v1`;

interface ApiEvent {
    id: number;
    title: string;
    description: string | null;
    start: string;
    end: string;
    all_day: number;
    location: string | null;
    organizer: string | null;
    attendees: string | null;
    status: "tentative" | "confirmed" | "cancelled" | null;
    privacy: "public" | "private" | "confidential" | null;
    recurrence: string | null;
    reminders: string | null;
    color: string | null;
    user_id: string;
    created_at: string;
    updated_at: string;
}

function mapApiEvent(p: ApiEvent): CalendarEvent {
    return {
        id: String(p.id),
        title: p.title,
        description: p.description ?? undefined,
        start: p.start,
        end: p.end,
        allDay: p.all_day === 1,
        location: p.location ?? undefined,
        organizer: p.organizer ?? undefined,
        attendees: p.attendees ? JSON.parse(p.attendees) : [],
        status: p.status ?? undefined,
        privacy: p.privacy ?? undefined,
        recurrence: p.recurrence ?? undefined,
        reminders: p.reminders ?? undefined,
        color: p.color ?? undefined,
        userId: p.user_id,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
    };
}

export async function getEvents(): Promise<CalendarEvent[]> {
  const session = await auth();
  // @ts-expect-error accessToken is not in default session type
  if (!session?.user?.accessToken) return [];

  try {
    const response = await fetch(`${API_BASE_URL}/events`, {
        method: 'GET',
        headers: {
            // @ts-expect-error accessToken is not in default session type
            'Authorization': `Bearer ${session.user.accessToken}`
        },
        next: { tags: ['events'], revalidate: 60 }
    });

    if (!response.ok) return [];

    const events: ApiEvent[] = await response.json();
    return events.map(mapApiEvent);
  } catch (error) {
    console.error("Error fetching events:", error);
    return [];
  }
}

export async function createEvent(formData: FormData) {
  const session = await auth();
  // @ts-expect-error accessToken is not in default session type
  if (!session?.user?.accessToken) return;

  const payload = {
    title: formData.get('title'),
    description: formData.get('description'),
    start: formData.get('start'),
    end: formData.get('end'),
    all_day: formData.get('allDay') === 'true' ? 1 : 0,
    location: formData.get('location'),
    organizer: formData.get('organizer'),
    attendees: formData.get('attendees'), // Assuming JSON string
    status: formData.get('status'),
    privacy: formData.get('privacy'),
    recurrence: formData.get('recurrence'),
    reminders: formData.get('reminders'),
    color: formData.get('color'),
  };

  try {
    const response = await fetch(`${API_BASE_URL}/events`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // @ts-expect-error accessToken is not in default session type
            'Authorization': `Bearer ${session.user.accessToken}`
        },
        body: JSON.stringify(payload)
    });

    if (response.ok) {
        revalidatePath('/calendar');
        revalidateTag('events', 'max');
    }
  } catch (error) {
    console.error("Error creating event:", error);
  }
}

export async function updateEvent(formData: FormData) {
  const session = await auth();
  // @ts-expect-error accessToken is not in default session type
  if (!session?.user?.accessToken) return;

  const id = formData.get('id');
  if (!id) return;

  const payload: Record<string, unknown> = {};
  const fields = ['title', 'description', 'start', 'end', 'location', 'organizer', 'attendees', 'status', 'privacy', 'recurrence', 'reminders', 'color'];
  fields.forEach(field => {
    if (formData.has(field)) payload[field] = formData.get(field);
  });
  if (formData.has('allDay')) payload.all_day = formData.get('allDay') === 'true' ? 1 : 0;

  try {
    const response = await fetch(`${API_BASE_URL}/events/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            // @ts-expect-error accessToken is not in default session type
            'Authorization': `Bearer ${session.user.accessToken}`
        },
        body: JSON.stringify(payload)
    });

    if (response.ok) {
        revalidatePath('/calendar');
        revalidateTag('events', 'max');
    }
  } catch (error) {
    console.error("Error updating event:", error);
  }
}

export async function deleteEvent(id: string | number) {
  const session = await auth();
  // @ts-expect-error accessToken is not in default session type
  if (!session?.user?.accessToken) return;

  try {
    const response = await fetch(`${API_BASE_URL}/events/${id}`, {
        method: 'DELETE',
        headers: {
            // @ts-expect-error accessToken is not in default session type
            'Authorization': `Bearer ${session.user.accessToken}`
        }
    });

    if (response.ok) {
        revalidatePath('/calendar');
        revalidateTag('events', 'max');
    }
  } catch (error) {
    console.error("Error deleting event:", error);
  }
}
