'use server';

import { auth } from '@/auth';
import { getTasks } from '@/app/tasks/actions';
import { getNotes } from '@/app/notes/actions';
import { getProjects } from '@/app/projects/actions';
import { getEvents } from '@/app/calendar/actions';
import { cache } from 'react';

export async function getUserName() {
  const session = await auth();
  return session?.user?.name || 'User';
}

export const getProductivityData = cache(async function() {
  // Fetch completed tasks. Limit to 100 to avoid huge payloads, hoping the recent ones are first.
  // Ideally API should support filtering by date.
  const tasks = await getTasks(undefined, undefined, 'completed', undefined, 100);
  
  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000;
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getTime() - (6 - i) * oneDay);
    return {
      day: days[d.getDay()],
      dateStr: d.toISOString().split('T')[0]
    };
  });

  return last7Days.map(d => {
    const count = tasks.filter(t => 
      t.updatedAt && 
      t.updatedAt.startsWith(d.dateStr)
    ).length;
    return { name: d.day, productivity: count };
  });
});

export async function getTasksOverviewData() {
    // We need counts for all.
    // Optimization: fetch all tasks (up to a reasonable limit) or purely rely on different calls?
    // Without a 'stats' endpoint, we unfortunately have to fetch tasks. 
    // Let's cap at 500 for performance.
    const tasks = await getTasks(undefined, undefined, undefined, undefined, 500);
    
    const todoCount = tasks.filter(t => t.status === 'task').length;
    const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
    const completedCount = tasks.filter(t => t.status === 'completed').length;
    
    return [
      { name: 'Completed', value: completedCount },
      { name: 'In Progress', value: inProgressCount },
      { name: 'Pending', value: todoCount }, 
    ];
}

export async function getWorkloadData() {
    // Top 5 projects by task count.
    // Complex because we need to join/group.
    // Fetching projects and tasks... parallel.
    const [tasks, projects] = await Promise.all([
        getTasks(undefined, undefined, undefined, undefined, 500),
        getProjects()
    ]);

    const projectTaskCounts = new Map<string, number>();
  
    tasks.forEach(t => {
        if (t.projectId) {
            const proj = projects.find(p => p.id === t.projectId);
            const projName = proj ? proj.name : 'Unknown Project';
            projectTaskCounts.set(projName, (projectTaskCounts.get(projName) || 0) + 1);
        } else {
            projectTaskCounts.set('No Project', (projectTaskCounts.get('No Project') || 0) + 1);
        }
    });

    const workloadData = Array.from(projectTaskCounts.entries())
        .map(([name, tasks]) => ({ name, tasks }))
        .sort((a, b) => b.tasks - a.tasks)
        .slice(0, 5);
  
    if (workloadData.length === 0) {
        workloadData.push({ name: 'No Projects', tasks: 0 });
    }
    return workloadData;
}

export async function getTimeAllocationData() {
    // Based on priorities of all tasks
    const tasks = await getTasks(undefined, undefined, undefined, undefined, 500);

    const highPriority = tasks.filter(t => t.priority === 'high').length;
    const mediumPriority = tasks.filter(t => t.priority === 'medium').length;
    const lowPriority = tasks.filter(t => t.priority === 'low').length;

    const nav = [
        { name: 'High Priority', value: highPriority },
        { name: 'Medium Priority', value: mediumPriority },
        { name: 'Low Priority', value: lowPriority },
    ];
    const cleanTimeAllocationData = nav.filter(d => d.value > 0);
    return cleanTimeAllocationData.length > 0 ? cleanTimeAllocationData : [{name: 'No Tasks', value: 1}];
}

export async function getKeyTasks() {
    // High priority, in progress. 
    // We can filter by params!
    let tasks = await getTasks(undefined, 'high', 'in_progress', undefined, 10);
    
    if (tasks.length < 5) {
        // Fallback: try just 'high' priority if not enough in progress
         const moreTasks = await getTasks(undefined, 'high', undefined, undefined, 10);
         // dedup using Set or Map
         const currentIds = new Set(tasks.map(t => t.id));
         const nonCompleted = moreTasks.filter(t => t.status !== 'completed' && !currentIds.has(t.id));
         tasks = [...tasks, ...nonCompleted];
    }
    
    const sorted = tasks.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }).slice(0, 5);

    return sorted.map(t => {
        let statusColor = 'text-zinc-400';
        let statusBg = 'bg-zinc-400/10';
        
        if (t.status === 'in_progress') {
            statusColor = 'text-blue-400';
            statusBg = 'bg-blue-400/10';
        } else if (t.status === 'completed') {
            statusColor = 'text-emerald-400';
            statusBg = 'bg-emerald-400/10';
        } else {
            statusColor = 'text-yellow-400';
            statusBg = 'bg-yellow-400/10';
        }

        return {
            title: t.name,
            status: t.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            color: statusColor,
            bg: statusBg
        };
    });
}

export async function getRecentDecisions() {
    // Fetch notes with limit 20 to check tags?
    // Optimization: Just fetch recent notes.
    const notes = await getNotes(50);
    const decisionNotes = notes.filter(n => n.tags.includes('decision') || n.type === 'idea'); 
    return decisionNotes.slice(0, 2).map(n => ({
        name: n.title,
        dueDate: null
    }));
}

export async function getRecentNotes() {
    const notes = await getNotes(4);
    
    return notes.map(n => {
        let color = 'text-zinc-400';
        if (n.type === 'meeting') color = 'text-blue-400';
        if (n.type === 'idea') color = 'text-yellow-400';
        if (n.type === 'journal') color = 'text-pink-400';
        if (n.type === 'code') color = 'text-purple-400';

        return {
            title: n.title,
            type: n.type,
            color: color,
            updatedAt: n.updated_at
        };
    });
}

export async function getAggregatedDashboardData() {
    // Collect all data in parallel
    const [
        productivity,
        overview,
        workload,
        timeAllocation,
        keyTasks,
        decisions,
        notes,
        events,
        allProjects
    ] = await Promise.all([
        getProductivityData(),
        getTasksOverviewData(),
        getWorkloadData(),
        getTimeAllocationData(),
        getTasks(undefined, 'high', 'in_progress', undefined, 20), // Fetch more key tasks for context
        getRecentDecisions(),
        getNotes(10), // Fetch more notes
        getEvents(),
        getProjects(),
    ]);

    // Process events (upcoming 7 days)
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingEvents = events
        .filter(e => new Date(e.start) >= now && new Date(e.start) <= nextWeek)
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
        .slice(0, 10);

    // Format as a readable string for the AI
    return `
    FULL DASHBOARD CONTEXT:
    
    1. Productivity Trend (Last 7 Days):
    ${productivity.map(p => `   - ${p.name}: ${p.productivity} completed tasks`).join('\n')}
    
    2. Task Status Overview:
    ${overview.map(o => `   - ${o.name}: ${o.value}`).join('\n')}
    
    3. Workload Distribution:
    ${workload.map(w => `   - ${w.name}: ${w.tasks} tasks`).join('\n')}
    
    4. Time Allocation (Priority):
    ${timeAllocation.map(t => `   - ${t.name}: ${t.value}`).join('\n')}
    
    5. Key/High-Priority Tasks (Top 20):
    ${keyTasks.map(t => `   - [${t.status}] ${t.name} (Due: ${t.dueDate || 'N/A'})`).join('\n')}
    
    6. Upcoming Events (Next 7 Days):
    ${upcomingEvents.length > 0 ? upcomingEvents.map(e => `   - ${e.title} at ${e.start} (${e.location || 'No location'})`).join('\n') : '   - No upcoming events found.'}
    
    7. Active Projects:
    ${allProjects.slice(0, 10).map(p => `   - ${p.name} [${p.status}]`).join('\n')}
    
    8. Recent Notes (Top 10):
    ${notes.map(n => `   - ${n.title} [${n.type}] (Tags: ${n.tags || 'none'})`).join('\n')}
    
    9. Recent Decisions/Ideas:
    ${decisions.map(d => `   - ${d.name}`).join('\n')}
    `;
}
