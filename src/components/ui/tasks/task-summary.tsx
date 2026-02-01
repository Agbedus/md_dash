'use client';

import React from 'react';
import { FiCheckSquare, FiCheckCircle, FiClock, FiAlertCircle } from "react-icons/fi";
import { Task } from "@/types/task";

interface TaskSummarySectionProps {
  tasks: Task[];
}

export function TaskSummarySection({ tasks }: TaskSummarySectionProps) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const highPriority = tasks.filter(t => t.priority === 'high').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, i) => (
        <div key={i} className="glass p-6 rounded-2xl border border-white/5 hover:border-white/20 transition-all duration-300 flex items-center justify-between group">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} transition-colors group-hover:bg-white/10 flex-shrink-0`}>
              <stat.icon className="text-xl" />
            </div>
            <div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{stat.label}</p>
                {stat.sub && (
                    <p className="text-[9px] font-bold text-zinc-400 mt-0.5 uppercase tracking-tight">
                        {stat.sub}
                    </p>
                )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-4xl font-black text-white leading-none tracking-tight">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
