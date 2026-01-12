import React from 'react';
import { 
    getProductivityData, 
    getTasksOverviewData, 
    getWorkloadData, 
    getTimeAllocationData, 
    getKeyTasks, 
    getRecentDecisions, 
    getRecentNotes 
} from '@/app/lib/dashboard-actions';
import { ProductivityChart, TasksChart, WorkloadChart, TimeAllocationChart } from '@/components/ui/client-charts';
import { FaEllipsisH, FaLightbulb, FaStickyNote, FaPlus, FaClock, FaRobot, FaArrowRight } from 'react-icons/fa';

export async function ProductivitySection() {
    const data = await getProductivityData();
    
    return (
        <div className="glass p-6 rounded-2xl col-span-1 lg:col-span-2 hover-glow flex flex-col h-96">
          <div className="flex justify-between items-center mb-6 shrink-0">
            <h2 className="text-xl font-bold text-white tracking-tight">Productivity Trend</h2>
            <select className="bg-white/5 border border-white/10 text-zinc-400 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-white/20 transition-colors cursor-pointer hover:text-white">
              <option>This Week</option>
              <option>Last Week</option>
              <option>This Month</option>
            </select>
          </div>
          <div className="flex-1 w-full min-h-0">
             <ProductivityChart data={data} />
          </div>
        </div>
    );
}

export async function StatsOverviewSection() {
    const data = await getTasksOverviewData();
    return (
        <div className="glass p-6 rounded-2xl col-span-1 hover-glow flex flex-col h-96">
            <h2 className="text-xl font-bold text-white tracking-tight mb-4 shrink-0">Tasks Overview</h2>
            <div className="flex-1 w-full min-h-0">
                <TasksChart data={data} />
            </div>
        </div>
    );
}

export async function WorkloadSection() {
    const data = await getWorkloadData();
    return (
        <div className="glass p-6 rounded-2xl col-span-1 hover-glow flex flex-col h-96">
            <h2 className="text-xl font-bold text-white tracking-tight mb-4 shrink-0">Workload</h2>
            <div className="flex-1 w-full min-h-0">
                <WorkloadChart data={data} />
            </div>
        </div>
    );
}

export async function TimeAllocationSection() {
    const data = await getTimeAllocationData();
    return (
        <div className="glass p-6 rounded-2xl col-span-1 hover-glow flex flex-col h-96">
            <h2 className="text-xl font-bold text-white tracking-tight mb-4 shrink-0">Time Allocation</h2>
            <div className="flex-1 w-full min-h-0">
                <TimeAllocationChart data={data} />
            </div>
        </div>
    );
}

export async function KeyTasksSection() {
    const keyTasks = await getKeyTasks();
    
    return (
        <div className="glass p-6 rounded-2xl col-span-1 lg:col-span-2 hover-glow">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white tracking-tight">Key Tasks</h2>
            <button className="text-zinc-400 hover:text-white transition-colors hover-scale">
              <FaEllipsisH />
            </button>
          </div>
          <div className="space-y-4">
            {keyTasks.length > 0 ? keyTasks.map((task, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${task.color.replace('text-', 'bg-')}`}></div>
                  <span className="text-zinc-300 font-medium group-hover:text-white transition-colors">{task.title}</span>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full ${task.bg} ${task.color} font-medium`}>
                  {task.status}
                </span>
              </div>
            )) : (
              <p className="text-zinc-500 text-center py-4">No key tasks at the moment</p>
            )}
          </div>
          <button className="w-full mt-6 py-2.5 rounded-xl border border-white/10 text-zinc-400 text-sm font-medium hover:bg-white/5 hover:text-white transition-all hover-scale">
            View All Tasks
          </button>
        </div>
    );
}

export async function DecisionsSection() {
    const decisions = await getRecentDecisions();
    
    return (
        <div className="glass p-6 rounded-2xl col-span-1 lg:col-span-1 hover-glow">
          <h2 className="text-xl font-bold text-white tracking-tight mb-6">Decisions Needed</h2>
          <div className="space-y-4">
            {decisions.length > 0 ? decisions.map((decision, i) => (
             <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all cursor-pointer group">
               <div className="flex items-start gap-3">
                 <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 mt-1">
                   <FaLightbulb />
                 </div>
                 <div>
                   <h3 className="font-semibold text-zinc-200 group-hover:text-white transition-colors">{decision.name}</h3>
                   <p className="text-sm text-zinc-500 mt-1">Due: {decision.dueDate || 'No deadline'}</p>
                 </div>
               </div>
               <div className="flex gap-2 mt-4 pl-11">
                 <button className="px-3 py-1.5 rounded-lg bg-white/10 text-xs font-medium text-white hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors">Approve</button>
                 <button className="px-3 py-1.5 rounded-lg bg-white/10 text-xs font-medium text-white hover:bg-red-500/20 hover:text-red-400 transition-colors">Reject</button>
               </div>
             </div>
            )) : (
              <p className="text-zinc-500 text-center py-4">No pending decisions</p>
            )}
          </div>
        </div>
    );
}

export async function RecentNotesSection() {
    const recentNotes = await getRecentNotes();
    
    return (
        <div className="glass p-6 rounded-2xl col-span-1 lg:col-span-2 hover-glow">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white tracking-tight">Recent Notes</h2>
            <button className="p-2 rounded-lg bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all hover-scale">
              <FaPlus />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentNotes.length > 0 ? recentNotes.map((note, i) => {
              const icon = note.type === 'meeting' ? FaStickyNote : note.type === 'idea' ? FaLightbulb : FaStickyNote;
              const color = note.color || 'text-yellow-400';
              const timeAgo = note.updatedAt ? new Date(note.updatedAt).toLocaleDateString() : 'Unknown';
              
              return (
                <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/[0.07] transition-all cursor-pointer group">
                  <div className="flex items-center gap-3 mb-2">
                    {React.createElement(icon, { className: color })}
                    <h3 className="font-semibold text-zinc-300 group-hover:text-white transition-colors">{note.title}</h3>
                  </div>
                  <p className="text-xs text-zinc-500">{timeAgo}</p>
                </div>
              );
            }) : (
              <p className="text-zinc-500 text-center py-4 col-span-2">No recent notes</p>
            )}
          </div>
        </div>
    );
}

// Static sections (no async data needed, but good to have as components)
export function FocusModeSection() {
    return (
        <div className="glass p-6 rounded-2xl col-span-1 lg:col-span-1 hover-glow flex flex-col justify-center items-center text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="p-4 rounded-full bg-white/5 mb-4 border border-white/10 relative z-10">
            <FaClock className="text-3xl text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2 relative z-10">Focus Mode</h2>
          <p className="text-sm text-zinc-400 mb-6 relative z-10">Block distractions and concentrate on your tasks.</p>
          <button className="relative z-10 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:scale-105 transition-all duration-200 active:scale-95">
            Start Session
          </button>
        </div>
    );
}

export function AssistantSection() {
    return (
        <div className="glass p-6 rounded-2xl col-span-1 lg:col-span-1 hover-glow flex flex-col relative overflow-hidden">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <FaRobot />
            </div>
            <h2 className="text-lg font-bold text-white">AI Assistant</h2>
          </div>
          <div className="flex-1 bg-white/5 rounded-xl p-4 mb-4 border border-white/5">
            <p className="text-sm text-zinc-300 italic">&quot;How can I help you be more productive today?&quot;</p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ask anything..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:bg-white/10 focus:border-white/20 transition-colors"
            />
            <button className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors hover-scale">
              <FaArrowRight />
            </button>
          </div>
        </div>
    );
}
