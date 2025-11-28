import { NextResponse } from 'next/server';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { desc, eq, like, and } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const priority = searchParams.get('priority');
  const status = searchParams.get('status');

  const conditions = [];
  if (query) conditions.push(like(projects.name, `%${query}%`));
  if (priority) conditions.push(eq(projects.priority, priority as "low" | "medium" | "high"));
  if (status) conditions.push(eq(projects.status, status as "planning" | "in_progress" | "completed" | "on_hold"));

  const allProjects = await db.select().from(projects)
    .where(and(...conditions))
    .orderBy(desc(projects.createdAt));
    
  return NextResponse.json(allProjects);
}

export async function POST(request: Request) {
  const body = await request.json();
  const newProject = await db.insert(projects).values({
    name: body.name,
    description: body.description,
    priority: body.priority,
    status: body.status,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }).returning();

  return NextResponse.json(newProject[0]);
}
