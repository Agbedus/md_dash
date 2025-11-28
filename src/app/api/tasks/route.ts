
import { db } from "@/db";
import { tasks } from "@/db/schema";
import { eq, and, or, like, SQL } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  const priority = searchParams.get("priority");
  const status = searchParams.get("status");

  try {
    const conditions: (SQL | undefined)[] = [];
    if (query) {
      const queryLower = query.toLowerCase();
      conditions.push(
        or(
          like(tasks.name, `%${queryLower}%`),
          like(tasks.description, `%${queryLower}%`)
        )
      );
    }
    if (priority) {
      conditions.push(eq(tasks.priority, priority as "low" | "medium" | "high"));
    }
    if (status) {
      conditions.push(eq(tasks.status, status as "task" | "in_progress" | "completed"));
    }

    const finalConditions = and(...conditions.filter((c): c is SQL => !!c));

    const rows = await db.query.tasks.findMany({
      where: finalConditions,
      with: {
        assignees: {
          with: {
            user: true
          }
        }
      }
    });
    return NextResponse.json(rows);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load tasks" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const { id, status } = await request.json();

  await db
    .update(tasks)
    .set({ status, updatedAt: new Date().toISOString() })
    .where(eq(tasks.id, id));

  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request) {
  const task = await request.json();
  await db
    .update(tasks)
    .set({ ...task, updatedAt: new Date().toISOString() })
    .where(eq(tasks.id, task.id));
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  await db.delete(tasks).where(eq(tasks.id, id));
  return NextResponse.json({ success: true });
}
