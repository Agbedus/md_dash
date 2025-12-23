import { NextResponse } from "next/server";

export async function GET() {
  try {
    const allEvents = [
      {
        id: "event-1",
        title: "Team Sync",
        description: "Weekly team synchronization.",
        start: new Date(Date.now() + 86400000).toISOString(),
        end: new Date(Date.now() + 90000000).toISOString(),
        allDay: 0,
        location: "Conference Room A",
        organizer: "manager@example.com",
        attendees: null,
        status: "confirmed",
        privacy: "public",
        recurrence: null,
        reminders: null,
        color: "#4285F4",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];
    return NextResponse.json(allEvents);
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const result = {
      id: Math.floor(Math.random() * 10000),
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to create event:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
