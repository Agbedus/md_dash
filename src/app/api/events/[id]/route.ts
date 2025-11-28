
import { db } from "@/db";
import { events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await request.json();

    const result = await db
      .update(events)
      .set({
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
        updatedAt: new Date().toISOString(),
      })
      .where(eq(events.id, id))
      .returning();

    if (!result.length) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Failed to update event:", error);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const result = await db.delete(events).where(eq(events.id, id)).returning();

    if (!result.length) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete event:", error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
