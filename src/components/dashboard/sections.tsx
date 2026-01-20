import React from 'react';
import { 
  getProductivityData, 
  getTasksOverviewData,
  getWorkloadData,
  getTimeAllocationData,
  getKeyTasks,
  getRecentNotes,
  getRecentDecisions,
  getProjectsOverviewData,
  getProjectProgressData,
  getAIPriorities
} from '@/app/lib/dashboard-actions';
import { RangeFilter } from './range-filter';
import { ProductivityChart, TasksChart, WorkloadChart, TimeAllocationChart, ProjectProgressChart } from '@/components/ui/client-charts';
import { FaEllipsisH, FaLightbulb, FaStickyNote, FaPlus, FaClock, FaRobot, FaArrowRight, FaArrowUp, FaArrowDown, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

export async function ProductivitySection({ range }: { range?: string }) {
  const data = await getProductivityData(range);
  return (
    <div className="col-span-1 lg:col-span-2 h-96 glass p-6 rounded-2xl flex flex-col group overflow-hidden relative border border-white/5 hover:border-white/10 transition-all duration-300">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h2 className="text-xl font-bold text-white tracking-tight">Productivity Trend</h2>
        <RangeFilter />
      </div>
          <div className="flex-1 w-full min-h-0">
             <ProductivityChart data={data} />
          </div>
        </div>
    );
}

export async function StatsOverviewSection() {
    const [taskData, projectData] = await Promise.all([
        getTasksOverviewData(),
        getProjectsOverviewData()
    ]);

    return (
        <div className="col-span-1 h-96 glass p-6 rounded-2xl flex flex-col overflow-hidden relative border border-white/5 hover:border-white/10 transition-all duration-300">
            <h2 className="text-xl font-bold text-white mb-6 tracking-tight">Overview</h2>
            <div className="flex-1 min-h-0 space-y-6 overflow-y-auto pr-1 custom-scrollbar">
                <div>
                    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Tasks</h3>
                    <div className="grid grid-cols-1 gap-2">
                        {taskData.map((stat: { name: string; value: number; trend?: number }, i: number) => (
                            <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                                <div className="flex flex-col">
                                    <span className="text-sm text-zinc-400">{stat.name}</span>
                                    {stat.trend !== undefined && stat.trend !== 0 && (
                                        <div className={`flex items-center gap-1 text-[10px] font-bold ${stat.trend > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {stat.trend > 0 ? <FaArrowUp /> : <FaArrowDown />}
                                            {Math.abs(stat.trend)}%
                                        </div>
                                    )}
                                </div>
                                <span className="text-sm font-bold text-white">{stat.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Projects</h3>
                    <div className="grid grid-cols-1 gap-2">
                        {projectData.map((stat: { name: string; value: number }, i: number) => (
                            <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                                <span className="text-sm text-zinc-400">{stat.name}</span>
                                <span className="text-sm font-bold text-white">{stat.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
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

export async function PrioritiesSection() {
    const priorities = await getAIPriorities();
    
    return (
        <div className="glass p-6 rounded-2xl col-span-1 lg:col-span-1 hover-glow flex flex-col h-96">
          <div className="flex justify-between items-center mb-6 shrink-0">
            <h2 className="text-xl font-bold text-white tracking-tight">Today's Priorities</h2>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                <FaRobot className="text-[10px] text-indigo-400" />
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">AI</span>
            </div>
          </div>
          <div className="flex-1 min-h-0 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
            {priorities.length > 0 ? priorities.map((priority: any, i: number) => {
              const isHigh = priority.priority === 'high';
              return (
                <div key={i} className="group flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all hover:bg-white/[0.07]">
                  <div className={`mt-0.5 shrink-0 ${isHigh ? 'text-indigo-400' : 'text-zinc-500'}`}>
                    {isHigh ? <FaExclamationCircle className="text-sm" /> : <div className="w-3.5 h-3.5 rounded-md border-2 border-zinc-600 group-hover:border-zinc-500 transition-colors" />}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h3 className={`text-sm font-semibold truncate transition-colors ${isHigh ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`}>
                      {priority.action}
                    </h3>
                    <p className="text-[10px] text-zinc-500 leading-tight mt-0.5 flex items-center gap-1">
                        <span className="font-medium">Why:</span> {priority.reason}
                    </p>
                  </div>
                </div>
              );
            }) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                <FaCheckCircle className="text-2xl mb-2 text-emerald-500" />
                <p className="text-sm text-zinc-400">All caught up!</p>
              </div>
            )}
          </div>
          <button className="w-full mt-4 py-2 rounded-xl border border-white/10 text-zinc-400 text-xs font-semibold hover:bg-white/5 hover:text-white transition-all hover-scale shrink-0">
            Refresh AI Analysis
          </button>
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
                  <p className="text-xs text-zinc-500" suppressHydrationWarning>{timeAgo}</p>
                </div>
              );
            }) : (
              <p className="text-zinc-500 text-center py-4 col-span-2">No recent notes</p>
            )}
          </div>
        </div>
    );
}

export async function ProjectProgressSection() {
    const data = await getProjectProgressData();
    return (
        <div className="glass p-6 rounded-2xl col-span-1 hover-glow flex flex-col h-96">
            <h2 className="text-xl font-bold text-white tracking-tight mb-4 shrink-0">Project Progress</h2>
            <div className="flex-1 w-full min-h-0">
                <ProjectProgressChart data={data} />
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

