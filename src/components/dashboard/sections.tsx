import React from "react";
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
  getAIPriorities,
  getSummaryStats,
} from "@/app/lib/dashboard-actions";
import { RangeFilter } from "./range-filter";
import {
  ProductivityChart,
  TasksChart,
  WorkloadChart,
  TimeAllocationChart,
  ProjectProgressChart,
} from "@/components/ui/client-charts";
import { Sparkline } from "@/components/ui/sparkline";
import {
  FiMoreHorizontal,
  FiZap,
  FiFileText,
  FiPlus,
  FiClock,
  FiCpu,
  FiArrowRight,
  FiArrowUp,
  FiArrowDown,
  FiCheckCircle,
  FiAlertCircle,
  FiCheckSquare,
  FiCalendar,
  FiActivity,
  FiUsers,
} from "react-icons/fi";

const AvatarGroup = ({ users, total }: { users: any[], total: number }) => {
    return (
        <div className="flex -space-x-2 overflow-hidden">
            {users.map((user, i) => (
                <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-[var(--background)] bg-zinc-800 overflow-hidden relative">
                    {user.image ? (
                        <img src={user.image} alt={user.name} className="h-full w-full object-cover" />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-[10px] font-bold text-white bg-emerald-500/20">
                            {user.name?.[0]?.toUpperCase()}
                        </div>
                    )}
                </div>
            ))}
            {total > users.length && (
                <div className="flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-[var(--background)] bg-zinc-800 text-[10px] font-bold text-white">
                    +{total - users.length}
                </div>
            )}
        </div>
    );
};

export async function SummaryStatsSection() {
    const stats = await getSummaryStats();
    
    const statCards = [
        { label: 'Total Users', value: stats.totalUsers, icon: FiUsers, color: 'text-[var(--pastel-blue)]', bg: 'bg-[var(--pastel-blue)]/10', users: stats.users, trend: stats.trends.users },
        { label: 'Total Tasks', value: stats.totalTasks, icon: FiCheckSquare, color: 'text-[var(--pastel-purple)]', bg: 'bg-[var(--pastel-purple)]/10', trend: stats.trends.tasks },
        { label: 'Completed', value: stats.completedTasks, icon: FiCheckCircle, color: 'text-[var(--pastel-emerald)]', bg: 'bg-[var(--pastel-emerald)]/10', trend: stats.trends.completions },
        { label: 'Upcoming Events', value: stats.upcomingEvents, icon: FiCalendar, color: 'text-[var(--pastel-rose)]', bg: 'bg-[var(--pastel-rose)]/10', trend: stats.trends.events },
        { label: 'Recent Notes', value: stats.recentNotesCount, icon: FiFileText, color: 'text-[var(--pastel-amber)]', bg: 'bg-[var(--pastel-amber)]/10', trend: stats.trends.notes },
    ];

    return (
        <div className="col-span-1 lg:col-span-12 grid grid-cols-2 lg:grid-cols-5 gap-2 lg:gap-6 mb-6 lg:mb-10">
            {statCards.map((stat, i) => (
                <div 
                    key={i} 
                    className={`glass p-3 lg:p-6 rounded-2xl border border-white/5 hover:border-white/20 transition-all duration-300 flex flex-col justify-between h-24 lg:h-40 group ${i === 0 ? 'col-span-2 lg:col-span-1' : 'col-span-1'}`}
                >
                    <div className="flex justify-between items-start">
                        <div className={`p-1.5 lg:p-3 rounded-xl ${stat.bg} ${stat.color} transition-colors group-hover:bg-white/10`}>
                            <stat.icon className="text-sm lg:text-xl" />
                        </div>
                        {stat.users ? (
                            <AvatarGroup users={stat.users} total={stat.value} />
                        ) : (
                            <div className="h-8 w-20 opacity-60 group-hover:opacity-100 transition-opacity">
                                <Sparkline 
                                    data={stat.trend || [0, 0, 0, 0, 0, 0, 0]} 
                                    color={stat.color.match(/\[(.*?)\]/)?.[1] || "#6366f1"}
                                    width={80}
                                    height={32}
                                />
                            </div>
                        )}
                    </div>
                    <div className="mt-2 lg:mt-4">
                        <p className="text-[9px] lg:text-xs text-zinc-500 font-medium uppercase tracking-wider mb-0.5 lg:mb-1">{stat.label}</p>
                        <div className="flex items-baseline justify-between">
                            <p className="text-xl lg:text-3xl font-bold text-white leading-none">{stat.value}</p>
                            {i !== 0 && (
                                <div className={`text-[8px] lg:text-[10px] font-bold ${stat.color} bg-white/5 px-1.5 py-0.5 rounded-full`}>
                                   +{Math.floor(Math.random() * 15)}%
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export async function ProductivitySection({ range }: { range?: string }) {
  const data = await getProductivityData(range);
  return (
    <div className="col-span-1 lg:col-span-6 h-80 lg:h-96 glass p-4 lg:p-6 rounded-2xl flex flex-col group overflow-hidden relative border border-white/5 hover:border-white/20 transition-all duration-300">
      <div className="flex justify-between items-center mb-4 lg:mb-6 shrink-0">
        <h2 className="text-lg lg:text-xl font-bold text-white tracking-tight">
          Productivity Trend
        </h2>
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
    getProjectsOverviewData(),
  ]);

  return (
    <div className="col-span-1 lg:col-span-3 h-80 lg:h-96 glass p-4 lg:p-6 rounded-2xl flex flex-col overflow-hidden relative border border-white/5 hover:border-white/20 transition-all duration-300">
      <h2 className="text-lg lg:text-xl font-bold text-white mb-4 lg:mb-6 tracking-tight">
        Overview
      </h2>
      <div className="flex-1 min-h-0 space-y-6 overflow-y-auto pr-1 custom-scrollbar">
        <div>
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
            Tasks
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {taskData.map(
              (
                stat: { name: string; value: number; trend?: number },
                i: number,
              ) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5"
                >
                  <div className="flex flex-col">
                    <span className="text-sm text-zinc-400">{stat.name}</span>
                    {stat.trend !== undefined && stat.trend !== 0 && (
                      <div
                        className={`flex items-center gap-1 text-[10px] font-bold ${stat.trend > 0 ? "text-emerald-400" : "text-rose-400"}`}
                      >
                        {stat.trend > 0 ? <FiArrowUp /> : <FiArrowDown />}
                        {Math.abs(stat.trend)}%
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-bold text-white">
                    {stat.value}
                  </span>
                </div>
              ),
            )}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
            Projects
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {projectData.map(
              (stat: { name: string; value: number }, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5"
                >
                  <span className="text-sm text-zinc-400">{stat.name}</span>
                  <span className="text-sm font-bold text-white">
                    {stat.value}
                  </span>
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export async function WorkloadSection() {
  const data = await getWorkloadData();
  return (
    <div className="glass p-4 lg:p-6 rounded-2xl col-span-1 lg:col-span-3 hover-glow flex flex-col h-80 lg:h-96">
      <h2 className="text-lg lg:text-xl font-bold text-white tracking-tight mb-3 lg:mb-4 shrink-0">
        Workload
      </h2>
      <div className="flex-1 w-full min-h-0">
        <WorkloadChart data={data} />
      </div>
    </div>
  );
}

export async function TimeAllocationSection() {
  const data = await getTimeAllocationData();
  return (
    <div className="glass p-4 lg:p-6 rounded-2xl col-span-1 lg:col-span-4 hover-glow flex flex-col h-80 lg:h-96">
      <h2 className="text-lg lg:text-xl font-bold text-white tracking-tight mb-3 lg:mb-4 shrink-0">
        Time Allocation
      </h2>
      <div className="flex-1 w-full min-h-0">
        <TimeAllocationChart data={data} />
      </div>
    </div>
  );
}

export async function KeyTasksSection() {
  const keyTasks = await getKeyTasks();

  return (
    <div className="glass p-4 lg:p-6 rounded-2xl col-span-1 lg:col-span-3 hover-glow h-80 lg:h-96 flex flex-col">
      <div className="flex justify-between items-center mb-4 lg:mb-6">
        <h2 className="text-lg lg:text-xl font-bold text-white tracking-tight">
          Key Tasks
        </h2>
        <button className="text-zinc-400 hover:text-white transition-colors hover-scale">
          <FiMoreHorizontal />
        </button>
      </div>
      <div className="flex-1 min-h-0 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
        {keyTasks.length > 0 ? (
          keyTasks.map((task, i) => (
            <div
              key={i}
              className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/[0.08] hover:border-white/10 transition-all cursor-pointer group"
            >
              <div className="shrink-0 w-2 h-2 mt-1.5 rounded-full bg-blue-400"></div>
              <div className="flex-1 min-w-0">
                <span className="text-sm text-zinc-300 font-medium group-hover:text-white transition-colors block truncate">
                  {task.title}
                </span>
                <div className="flex items-center justify-between gap-2 mt-1.5">
                  <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 font-semibold uppercase tracking-wider">
                    <FiActivity className="text-[8px]" />
                    {task.status}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {task.priority && (
                      <span className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${task.priority === 'high' ? 'bg-rose-500/10 text-rose-400' : task.priority === 'medium' ? 'bg-amber-500/10 text-amber-400' : 'bg-zinc-500/10 text-zinc-400'}`}>
                        <FiZap className="text-[8px]" />
                        {task.priority}
                      </span>
                    )}
                    {task.dueDate && (
                      <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-md bg-zinc-500/10 text-zinc-400 font-medium">
                        <FiClock className="text-[8px]" />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-zinc-500 text-center py-4">
            No key tasks at the moment
          </p>
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
    <div className="glass p-4 lg:p-6 rounded-2xl col-span-1 lg:col-span-3 hover-glow flex flex-col h-80 lg:h-96">
      <div className="flex justify-between items-center mb-4 lg:mb-6 shrink-0">
        <h2 className="text-lg lg:text-xl font-bold text-white tracking-tight">
          Today's Priorities
        </h2>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
          <FiCpu className="text-[10px] text-[var(--pastel-indigo)]" />
          <span className="text-[10px] font-bold text-[var(--pastel-indigo)] uppercase tracking-wider">
            AI
          </span>
        </div>
      </div>
      <div className="flex-1 min-h-0 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
        {priorities.length > 0 ? (
          priorities.map((priority: any, i: number) => {
            const isHigh = priority.priority === "high";
            return (
              <div key={i} className="group flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 transition-all hover:bg-white/[0.08]">
                <div className={`mt-0.5 shrink-0 ${isHigh ? 'text-[var(--pastel-rose)]' : 'text-zinc-500'}`}>
                  {isHigh ? (
                    <FiAlertCircle className="text-sm" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-md border-2 border-zinc-600 group-hover:border-zinc-500 transition-colors" />
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <h3
                    className={`text-sm font-semibold truncate transition-colors ${isHigh ? "text-white" : "text-zinc-300 group-hover:text-white"}`}
                  >
                    {priority.action}
                  </h3>
                  <p className="text-[10px] text-zinc-500 leading-tight mt-0.5 flex items-center gap-1">
                    <span className="font-medium">Why:</span> {priority.reason}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
          <FiCheckCircle className="text-2xl mb-2 text-emerald-500" />
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
    <div className="glass p-4 lg:p-6 rounded-2xl col-span-1 lg:col-span-6 hover-glow h-80 lg:h-96 flex flex-col">
      <div className="flex justify-between items-center mb-4 lg:mb-6 shrink-0">
        <h2 className="text-lg lg:text-xl font-bold text-white tracking-tight">
          Recent Notes
        </h2>
        <button className="p-2 rounded-lg bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all hover-scale">
          <FiPlus />
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto pr-1 custom-scrollbar">
        {recentNotes.length > 0 ? (
          recentNotes.map((note, i) => {
            const icon =
              note.type === "meeting"
                ? FiFileText
                : note.type === "idea"
                  ? FiZap
                  : FiFileText;
            const color = note.color || "text-yellow-400";
            const timeAgo = note.updatedAt
              ? new Date(note.updatedAt).toLocaleDateString()
              : "Unknown";

            return (
              <div
                key={i}
                className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/[0.07] transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 mb-2">
                  {React.createElement(icon, { className: color })}
                  <h3 className="font-semibold text-zinc-300 group-hover:text-white transition-colors">
                    {note.title}
                  </h3>
                </div>
                <p className="text-xs text-zinc-500" suppressHydrationWarning>
                  {timeAgo}
                </p>
              </div>
            );
          })
        ) : (
          <p className="text-zinc-500 text-center py-4 col-span-2">
            No recent notes
          </p>
        )}
      </div>
    </div>
  );
}

export async function ProjectProgressSection() {
  const data = await getProjectProgressData();
  return (
    <div className="glass p-4 lg:p-6 rounded-2xl col-span-1 lg:col-span-5 hover-glow flex flex-col h-80 lg:h-96">
      <h2 className="text-lg lg:text-xl font-bold text-white tracking-tight mb-3 lg:mb-4 shrink-0">
        Project Progress
      </h2>
      <div className="flex-1 w-full min-h-0">
        <ProjectProgressChart data={data} />
      </div>
    </div>
  );
}

// Static sections (no async data needed, but good to have as components)
export function FocusModeSection() {
  return (
    <div className="glass p-4 lg:p-6 rounded-2xl col-span-1 lg:col-span-3 hover-glow flex flex-col justify-center items-center text-center relative overflow-hidden group h-80 lg:h-96">
      <div className="p-4 rounded-full bg-white/5 mb-4 border border-white/10 relative z-10">
        <FiClock className="text-3xl text-[var(--pastel-indigo)]" />
      </div>
      <h2 className="text-lg lg:text-xl font-bold text-white mb-2 relative z-10">
        Focus Mode
      </h2>
      <p className="text-sm text-zinc-400 mb-6 relative z-10">
        Block distractions and concentrate on your tasks.
      </p>
      <button className="relative z-10 px-6 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white font-medium hover:bg-white/20 transition-all duration-200 active:scale-95">
        Start Session
      </button>
    </div>
  );
}
