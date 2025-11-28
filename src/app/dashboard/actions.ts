'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { tasks, projects, events, notes, decisions, users } from '@/db/schema';
import { eq, desc, and, gte, sql, inArray } from 'drizzle-orm';

export async function getDashboardData() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  const userId = session.user.id;

  // 1. User Info
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      name: true,
    },
  });

  // 2. Productivity Trend (Last 7 days completed tasks)
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);
  
  // Initialize last 7 days with 0
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sevenDaysAgo);
    d.setDate(sevenDaysAgo.getDate() + i);
    return {
      date: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      count: 0,
    };
  });

  // Fetch completed tasks in range
  // Note: This assumes tasks have an 'updatedAt' or 'createdAt' we can use for completion time.
  // Since schema doesn't have 'completedAt', we'll use 'updatedAt' for 'completed' tasks as a proxy,
  // or just count tasks created in that range if that's more appropriate for "Productivity" in this context.
  // Let's use 'updatedAt' for completed tasks.
  const completedTasks = await db
    .select({
      date: sql<string>`date(${tasks.updatedAt})`,
      count: sql<number>`count(*)`,
    })
    .from(tasks)
    .leftJoin(projects, eq(tasks.projectId, projects.id))
    .where(
      and(
        eq(tasks.status, 'completed'),
        // Filter by user's projects or assigned tasks if we had direct assignment.
        // For now, let's assume we filter by projects owned by user or where they are a manager.
        // Simplified: Filter by projects owned by user for now as per schema relationships.
        eq(projects.ownerId, userId), 
        gte(tasks.updatedAt, sevenDaysAgo.toISOString())
      )
    )
    .groupBy(sql`date(${tasks.updatedAt})`);

  // Merge counts
  completedTasks.forEach((item) => {
    const day = last7Days.find((d) => d.date === item.date);
    if (day) {
      day.count = Number(item.count);
    }
  });

  const productivityData = last7Days.map(d => ({ name: d.dayName, productivity: d.count }));


  // 3. Tasks Overview (Status counts)
  const tasksStatus = await db
    .select({
      status: tasks.status,
      count: sql<number>`count(*)`,
    })
    .from(tasks)
    .leftJoin(projects, eq(tasks.projectId, projects.id))
    .where(eq(projects.ownerId, userId))
    .groupBy(tasks.status);

  const tasksOverviewData = [
    { name: 'Completed', value: 0 },
    { name: 'In Progress', value: 0 },
    { name: 'Pending', value: 0 }, // Mapping 'task' status to 'Pending'
  ];

  tasksStatus.forEach((item) => {
    if (item.status === 'completed') tasksOverviewData[0].value = Number(item.count);
    else if (item.status === 'in_progress') tasksOverviewData[1].value = Number(item.count);
    else if (item.status === 'task') tasksOverviewData[2].value = Number(item.count);
  });


  // 4. Workload (Tasks per project)
  const workload = await db
    .select({
      projectName: projects.name,
      taskCount: sql<number>`count(${tasks.id})`,
    })
    .from(projects)
    .leftJoin(tasks, eq(projects.id, tasks.projectId))
    .where(
        and(
            eq(projects.ownerId, userId),
            eq(tasks.status, 'in_progress') // Count active tasks
        )
    )
    .groupBy(projects.id)
    .orderBy(desc(sql`count(${tasks.id})`))
    .limit(5);

  const workloadData = workload.map(w => ({ name: w.projectName, tasks: Number(w.taskCount) }));


  // 5. Time Allocation (Meetings vs Focus)
  // Get start of current week
  const startOfWeek = new Date(today);
  const day = startOfWeek.getDay() || 7; // Get current day number, converting Sun. to 7
  if (day !== 1) startOfWeek.setHours(-24 * (day - 1)); 
  startOfWeek.setHours(0,0,0,0);

  // Fetch events for this week
  // Note: Events table doesn't have a direct user link in the schema provided (organizer is text).
  // Assuming 'organizer' might match user email or name, or we fetch all if not linked.
  // Wait, schema says `organizer: text`. Let's assume for now we can't easily filter by user unless we match email.
  // Let's try to match organizer by user email.
  const userEmail = session.user.email;
  
  const weeklyEvents = await db
    .select()
    .from(events)
    .where(
      and(
        gte(events.start, startOfWeek.toISOString()),
        // Simple filter: organizer is user or user is in attendees (attendees is JSON string)
        // This is tricky with SQLite JSON. Let's just filter by organizer for MVP if email matches.
        userEmail ? eq(events.organizer, userEmail) : undefined
      )
    );

  let meetingMinutes = 0;
  weeklyEvents.forEach(e => {
    const start = new Date(e.start);
    const end = new Date(e.end);
    meetingMinutes += (end.getTime() - start.getTime()) / 1000 / 60;
  });

  const totalWorkMinutes = 40 * 60; // 40 hours
  const focusMinutes = Math.max(0, totalWorkMinutes - meetingMinutes);

  const timeAllocationData = [
    { name: 'Meetings', value: Math.round(meetingMinutes / 60) }, // Hours
    { name: 'Focus Work', value: Math.round(focusMinutes / 60) },
  ];


  // 6. Key Tasks (High priority or In Progress)
  const keyTasks = await db
    .select({
      title: tasks.name,
      status: tasks.status,
      priority: tasks.priority,
    })
    .from(tasks)
    .leftJoin(projects, eq(tasks.projectId, projects.id))
    .where(
      and(
        eq(projects.ownerId, userId),
        inArray(tasks.priority, ['high', 'medium']),
        inArray(tasks.status, ['in_progress', 'task'])
      )
    )
    .limit(5);

  const formattedKeyTasks = keyTasks.map(t => {
    let color = 'text-zinc-400';
    let bg = 'bg-zinc-400/10';
    if (t.status === 'completed') { color = 'text-emerald-400'; bg = 'bg-emerald-400/10'; }
    else if (t.status === 'in_progress') { color = 'text-blue-400'; bg = 'bg-blue-400/10'; }
    else { color = 'text-yellow-400'; bg = 'bg-yellow-400/10'; }

    return {
      title: t.title,
      status: t.status === 'task' ? 'Pending' : t.status === 'in_progress' ? 'In Progress' : 'Completed',
      color,
      bg
    };
  });


  // 7. Decisions Needed
  const pendingDecisions = await db
    .select()
    .from(decisions)
    .limit(3); // Schema doesn't link decisions to users yet, so just fetching some.


  // 8. Recent Notes
  const recentNotes = await db
    .select({
      title: notes.title,
      updatedAt: notes.updatedAt,
      type: notes.type,
      color: notes.color,
    })
    .from(notes)
    .where(eq(notes.userId, userId))
    .orderBy(desc(notes.updatedAt))
    .limit(4);

  return {
    userName: user?.name || 'User',
    productivityData,
    tasksOverviewData,
    workloadData,
    timeAllocationData,
    keyTasks: formattedKeyTasks,
    decisions: pendingDecisions,
    recentNotes,
  };
}
