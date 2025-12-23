'use server';

import { auth } from '@/auth';

export async function getDashboardData() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  
  // Mock Data
  const productivityData = [
    { name: 'Mon', productivity: 4 },
    { name: 'Tue', productivity: 3 },
    { name: 'Wed', productivity: 7 },
    { name: 'Thu', productivity: 2 },
    { name: 'Fri', productivity: 5 },
    { name: 'Sat', productivity: 1 },
    { name: 'Sun', productivity: 0 }
  ];

  const tasksOverviewData = [
    { name: 'Completed', value: 12 },
    { name: 'In Progress', value: 5 },
    { name: 'Pending', value: 8 }, 
  ];

  const workloadData = [
    { name: 'Website Redesign', tasks: 5 },
    { name: 'Mobile App', tasks: 8 },
    { name: 'Marketing Campaign', tasks: 3 }
  ];

  const timeAllocationData = [
    { name: 'Meetings', value: 10 }, 
    { name: 'Focus Work', value: 30 },
  ];

  const formattedKeyTasks = [
    { title: 'Launch Homepage', status: 'In Progress', color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { title: 'Client Meeting', status: 'Pending', color: 'text-zinc-400', bg: 'bg-zinc-400/10' },
    { title: 'Fix Auth Bug', status: 'Completed', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { title: 'Q4 Planning', status: 'Pending', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { title: 'Update Docs', status: 'In Progress', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  ];

  const pendingDecisions = [
    { id: 1, name: 'Approve new design', status: 'pending', createdAt: new Date().toISOString() },
    { id: 2, name: 'Budget review', status: 'pending', createdAt: new Date().toISOString() }
  ];

  const recentNotes = [
    { title: 'Meeting Notes', updatedAt: new Date().toISOString(), type: 'meeting', color: 'blue' },
    { title: 'Ideas', updatedAt: new Date().toISOString(), type: 'idea', color: 'yellow' },
    { title: 'Tech Specs', updatedAt: new Date().toISOString(), type: 'technical', color: 'red' },
    { title: 'Reflections', updatedAt: new Date().toISOString(), type: 'journal', color: 'green' }
  ];

  return {
    userName: session.user.name || 'Mock User',
    productivityData,
    tasksOverviewData,
    workloadData,
    timeAllocationData,
    keyTasks: formattedKeyTasks,
    decisions: pendingDecisions,
    recentNotes,
  };
}
