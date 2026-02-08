'use server';

import { auth } from '@/auth';
import { getTasks } from '@/app/tasks/actions';
import { getNotes } from '@/app/notes/actions';
import { getProjects } from '@/app/projects/actions';
import { getEvents } from '@/app/calendar/actions';
import { getUsers } from '@/app/users/actions';
import { cache } from 'react';
import { format, startOfWeek, endOfWeek, subWeeks, subDays, isSameDay } from 'date-fns';

export async function getUserName() {
  const session = await auth();
  return session?.user?.name || 'User';
}

export async function getSummaryStats() {
    const [tasks, events, notes, users, projects] = await Promise.all([
        getTasks(undefined, undefined, undefined, undefined, 1000),
        getEvents(),
        getNotes(1000),
        getUsers(),
        getProjects()
    ]);

    const now = new Date();
    const startOfCurrentWeek = startOfWeek(now);

    const upcomingEvents = events.filter(e => new Date(e.start) >= now);
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const recentNotes = notes.filter(n => n.updated_at && new Date(n.updated_at) >= startOfCurrentWeek);

    return {
        totalTasks: tasks.length,
        completedTasks: completedTasks.length,
        upcomingEvents: upcomingEvents.length,
        totalNotes: notes.length,
        recentNotesCount: recentNotes.length,
        pendingTasks: tasks.length - completedTasks.length,
        totalUsers: users.length,
        totalProjects: projects.length,
        users: users.slice(0, 3).map((u: any) => ({ name: u.name, image: u.image }))
    };
}

export const getProductivityData = cache(async function(range: string = '7d') {
  // Fetch completed tasks.
  const tasks = await getTasks(undefined, undefined, 'completed', undefined, 1000);
  
  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000;
  
  let days: { name: string, current: string, previous: string }[] = [];
  
  if (range === '7d' || range === 'last_week') {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const anchor = range === '7d' ? now : subWeeks(now, 1);
    const startOfCurrent = range === '7d' ? subDays(now, 6) : startOfWeek(anchor);
    
    days = Array.from({ length: 7 }, (_, i) => {
      const current = new Date(startOfCurrent.getTime() + i * oneDay);
      const previous = subWeeks(current, 1);
      return {
        name: dayNames[current.getDay()],
        current: format(current, 'yyyy-MM-dd'),
        previous: format(previous, 'yyyy-MM-dd')
      };
    });
  } else if (range === '30d') {
    days = Array.from({ length: 30 }, (_, i) => {
      const current = subDays(now, 29 - i);
      const previous = subDays(current, 30);
      return {
        name: format(current, 'MMM d'),
        current: format(current, 'yyyy-MM-dd'),
        previous: format(previous, 'yyyy-MM-dd')
      };
    });
  } else if (range === '90d' || range === '1y') {
    // For longer ranges, we'll return simple current series for now 
    // but optimized to use similar logic if needed.
    // For now, let's keep it simple to avoid overwhelming the chart.
    if (range === '90d') {
      const weeks = 12;
      return Array.from({ length: weeks }, (_, i) => {
        const start = subDays(now, (weeks - i) * 7);
        const end = new Date(start.getTime() + 6 * oneDay);
        const startStr = format(start, 'yyyy-MM-dd');
        const endStr = format(end, 'yyyy-MM-dd');
        
        const currentCount = tasks.filter(t => t.updatedAt && t.updatedAt >= startStr && t.updatedAt <= endStr).length;
        return { name: `W${i + 1}`, productivity: currentCount, previousProductivity: 0 };
      });
    } else {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return Array.from({ length: 12 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
        const monthLabel = months[d.getMonth()];
        const count = tasks.filter(t => {
          if (!t.updatedAt) return false;
          const taskDate = new Date(t.updatedAt);
          return taskDate.getMonth() === d.getMonth() && taskDate.getFullYear() === d.getFullYear();
        }).length;
        return { name: monthLabel, productivity: count, previousProductivity: 0 };
      });
    }
  }

  return days.map(d => {
    const currentCount = tasks.filter(t => t.updatedAt && t.updatedAt.startsWith(d.current)).length;
    const previousCount = tasks.filter(t => t.updatedAt && t.updatedAt.startsWith(d.previous)).length;
    return { 
      name: d.name, 
      productivity: currentCount,
      previousProductivity: previousCount 
    };
  });
});

export async function getTasksOverviewData() {
    // Optimization: fetch tasks once
    const tasks = await getTasks(undefined, undefined, undefined, undefined, 1000);
    
    const now = new Date();
    const startOfCurrentWeek = startOfWeek(now);
    const startOfLastWeek = startOfWeek(subWeeks(now, 1));
    const endOfLastWeek = endOfWeek(subWeeks(now, 1));

    const counts = {
      todo: tasks.filter(t => t.status === 'task').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length
    };

    const previousCounts = {
      todo: tasks.filter(t => t.status === 'task' && t.createdAt && new Date(t.createdAt) < startOfCurrentWeek).length,
      inProgress: tasks.filter(t => t.status === 'in_progress' && t.updatedAt && new Date(t.updatedAt) < startOfCurrentWeek).length,
      completed: tasks.filter(t => {
          if (!t.updatedAt) return false;
          const updatedDate = new Date(t.updatedAt);
          return updatedDate >= startOfLastWeek && updatedDate <= endOfLastWeek;
      }).length
    };

    const calculateTrend = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100);
    };

    return [
      { name: 'Completed', value: counts.completed, trend: calculateTrend(counts.completed, previousCounts.completed) },
      { name: 'In Progress', value: counts.inProgress, trend: calculateTrend(counts.inProgress, previousCounts.inProgress) },
      { name: 'Pending', value: counts.todo, trend: calculateTrend(counts.todo, previousCounts.todo) }, 
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
    // Only show high priority tasks that are in progress (never completed)
    const allTasks = await getTasks(undefined, 'high', 'in_progress', undefined, 20);
    
    // Explicitly filter for in_progress only (in case API doesn't filter correctly)
    const tasks = allTasks.filter(t => t.status === 'in_progress');
    
    const sorted = tasks.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }).slice(0, 5);

    return sorted.map(t => ({
        title: t.name,
        status: 'In Progress',
        priority: t.priority,
        dueDate: t.dueDate,
        color: 'text-blue-400',
        bg: 'bg-blue-400/10'
    }));
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

export async function getProjectsOverviewData() {
    const projects = await getProjects();
    
    // For projects we can't easily calculate historical status changes without a log
    // So we'll just return the current counts for now.
    const planningCount = projects.filter(p => p.status === 'planning').length;
    const inProgressCount = projects.filter(p => p.status === 'in_progress').length;
    const completedCount = projects.filter(p => p.status === 'completed').length;
    const onHoldCount = projects.filter(p => p.status === 'on_hold').length;
    
    return [
        { name: 'Active', value: inProgressCount },
        { name: 'Planning', value: planningCount },
        { name: 'Completed', value: completedCount },
        { name: 'On Hold', value: onHoldCount },
    ];
}

export async function getProjectProgressData() {
    const [tasks, projects] = await Promise.all([
        getTasks(undefined, undefined, undefined, undefined, 1000),
        getProjects()
    ]);

    const activeProjects = projects.filter(p => p.status === 'in_progress' || p.status === 'planning').slice(0, 5);
    
    return activeProjects.map(p => {
        const projectTasks = tasks.filter(t => t.projectId === p.id);
        const total = projectTasks.length;
        const completed = projectTasks.filter(t => t.status === 'completed').length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        return {
            name: p.name,
            progress: progress,
            total: total,
            completed: completed
        };
    }).sort((a, b) => b.progress - a.progress);
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

export async function getAIPriorities() {
    const dashboardData = await getAggregatedDashboardData();
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
        console.error("GROQ_API_KEY not set for priorities");
        return [];
    }

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    {
                        role: "system",
                        content: `You are a strategic productivity assistant. 
                        Analyze the user's dashboard data (tasks, projects, events) and determine the top 5 most critical "Priorities" for today.
                        
                        RULES:
                        1. Be specific. Mention project names or task titles.
                        2. Provide a short "reason" (max 10 words) for each priority.
                        3. Assign a priority level: 'high', 'medium', or 'low'.
                        4. Return ONLY valid JSON in this format: {"priorities": [{"action": "string", "reason": "string", "priority": "high" | "medium" | "low"}]}
                        `
                    },
                    {
                        role: "user",
                        content: `Here is the dashboard context: ${dashboardData}`
                    }
                ],
                temperature: 0.1,
                response_format: { type: "json_object" }
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Failed to fetch priorities from Groq:", errorText);
            return [];
        }

        const result = await response.json();
        const prioritiesStr = result.choices[0]?.message?.content;
        
        if (!prioritiesStr) return [];

        const parsed = JSON.parse(prioritiesStr);
        const priorities = parsed.priorities || parsed.items || (Array.isArray(parsed) ? parsed : []);
        
        return priorities.slice(0, 5);
    } catch (error) {
        console.error("Error generating AI priorities:", error);
        return [];
    }
}

