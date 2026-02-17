import React, { useState } from 'react';
import { FiCheckSquare, FiCheckCircle, FiClock, FiAlertCircle, FiCheck } from "react-icons/fi";
import { Task } from "@/types/task";
import { batchUpdateTaskStatus } from '@/app/tasks/actions';
import toast from 'react-hot-toast';

interface TaskSummarySectionProps {
  tasks: Task[];
}

export function TaskSummarySection({ tasks }: TaskSummarySectionProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const totalTasks = tasks.length;
  const activeTasks = tasks.filter(t => t.status !== 'DONE');
  const completedTasks = tasks.filter(t => t.status === 'DONE').length;
  const highPriority = tasks.filter(t => t.priority === 'high').length;
  const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const handleMarkAllDone = async () => {
    if (activeTasks.length === 0) return;
    if (!confirm(`Are you sure you want to mark all ${activeTasks.length} active tasks as completed?`)) return;

    setIsUpdating(true);
    try {
      const taskIds = activeTasks.map(t => t.id);
      const result = await batchUpdateTaskStatus(taskIds, 'DONE');
      if (result.success) {
        toast.success(`Successfully completed ${taskIds.length} tasks`);
      } else {
        toast.error(result.error || "Failed to update some tasks");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  const FiActivity = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
  );

  const stats = [
    { label: 'Total Tasks', value: totalTasks, icon: FiCheckSquare, color: 'text-[var(--pastel-blue)]', bg: 'bg-[var(--pastel-blue)]/10' },
    { label: 'Completed', value: completedTasks, icon: FiCheckCircle, color: 'text-[var(--pastel-emerald)]', bg: 'bg-[var(--pastel-emerald)]/10', sub: `${progressPercent}% progress` },
    { label: 'In Progress', value: inProgress, icon: FiActivity, color: 'text-[var(--pastel-purple)]', bg: 'bg-[var(--pastel-purple)]/10' },
    { label: 'High Priority', value: highPriority, icon: FiAlertCircle, color: 'text-[var(--pastel-rose)]', bg: 'bg-[var(--pastel-rose)]/10' },
  ];

  return (
    <div className="flex flex-col gap-4 mb-4 lg:mb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Quick Stats</h2>
        {activeTasks.length > 0 && (
          <button
            onClick={handleMarkAllDone}
            disabled={isUpdating}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest text-emerald-400 transition-all disabled:opacity-50"
          >
            {isUpdating ? (
              <div className="h-3 w-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <FiCheck className="w-3 h-3" />
            )}
            Mark all as Done ({activeTasks.length})
          </button>
        )}
      </div>

      <div className="flex overflow-x-auto pb-2 scrollbar-hide lg:grid lg:grid-cols-4 gap-3 lg:gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="glass p-3 lg:p-6 rounded-xl lg:rounded-2xl border border-white/5 hover:border-white/20 transition-all duration-300 flex flex-col justify-between group min-w-[120px] lg:min-w-0 flex-shrink-0">
            <div className="flex items-center gap-2 lg:gap-4 mb-2 lg:mb-0">
              <div className={`p-1.5 lg:p-3 rounded-lg lg:rounded-xl ${stat.bg} ${stat.color} transition-colors group-hover:bg-white/10 flex-shrink-0`}>
                <stat.icon className="text-sm lg:text-xl" />
              </div>
              <div>
                  <p className="text-[9px] lg:text-[10px] text-zinc-500 font-bold uppercase tracking-widest truncate">{stat.label}</p>
                  {stat.sub && (
                      <p className="text-[8px] lg:text-[9px] font-bold text-zinc-400 mt-0.5 uppercase tracking-tight truncate">
                          {stat.sub}
                      </p>
                  )}
              </div>
            </div>
            <div className="text-left lg:text-right">
              <p className="text-xl lg:text-4xl font-black text-white leading-none tracking-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
