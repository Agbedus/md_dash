
import { db } from "@/db";
import { events } from "@/db/schema";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const allEvents = await db.select().from(events);
    return NextResponse.json(allEvents);
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Basic validation could go here
    
    const result = await db.insert(events).values({
      title: body.title,
      description: body.description,
      start: body.start,
      end: body.end,
      allDay: body.allDay ? 1 : 0,
      location: body.location,
      organizer: body.organizer,
      attendees: body.attendees ? JSON.stringify(body.attendees) : null,
      status: body.status,
      privacy: body.privacy,
      recurrence: body.recurrence,
      reminders: body.reminders,
      color: body.color,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).returning();

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Failed to create event:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
