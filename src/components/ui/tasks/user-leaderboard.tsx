'use client';

import React from 'react';
import { User } from "@/types/user";
import { Task } from "@/types/task";
import { FiAward, FiStar, FiTrendingUp } from "react-icons/fi";
import Image from 'next/image';

interface UserLeaderboardProps {
  tasks: Task[];
  users: User[];
}

export function UserLeaderboard({ tasks, users }: UserLeaderboardProps) {
  // Calculate completed tasks per user
  const userPerformance = users.map(user => {
    const completedCount = tasks.filter(task => 
      (task.status === 'completed') && 
      (task.assigneeIds?.includes(user.id) || task.assignees?.some(a => a.user.id === user.id))
    ).length;
    
    return { ...user, completedCount };
  }).filter(u => u.completedCount > 0)
    .sort((a, b) => b.completedCount - a.completedCount)
    .slice(0, 5); // Top 5

  if (userPerformance.length === 0) return null;

  const getAwardIcon = (index: number) => {
    switch(index) {
      case 0: return <FiAward className="text-yellow-400 text-sm sm:text-base pulse-soft" />;
      case 1: return <FiAward className="text-zinc-300 text-sm sm:text-base" />;
      case 2: return <FiAward className="text-orange-400 text-sm sm:text-base" />;
      default: return <FiStar className="text-zinc-500 text-[10px]" />;
    }
  };

  const getAwardBg = (index: number) => {
    switch(index) {
      case 0: return 'bg-yellow-400/10 border-yellow-400/20';
      case 1: return 'bg-zinc-300/10 border-zinc-300/20';
      case 2: return 'bg-orange-400/10 border-orange-400/20';
      default: return 'bg-white/5 border-white/10';
    }
  };

  return (
    <div className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <FiTrendingUp className="text-[var(--pastel-indigo)]" />
        <h3 className="text-sm font-bold text-white uppercase tracking-widest">Top Performers</h3>
      </div>
      <div className="flex flex-wrap gap-4">
        {userPerformance.map((user, i) => (
          <div 
            key={user.id} 
            className={`flex items-center gap-5 px-6 py-4 rounded-2xl border transition-all duration-300 hover:bg-white/5 group ${getAwardBg(i)}`}
          >
            <div className="relative">
              {user.avatarUrl ? (
                <Image 
                  src={user.avatarUrl} 
                  alt={user.fullName || user.email} 
                  width={48} 
                  height={48} 
                  className="rounded-xl border-2 border-white/10 group-hover:border-white/20 transition-colors"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold border border-emerald-500/20">
                  {(user.fullName || user.email).charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 p-0.5 bg-zinc-950 rounded-full border border-white/10 shadow-lg">
                {getAwardIcon(i)}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-tight">{user.fullName || user.email.split('@')[0]}</p>
              <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest mt-0.5">
                <span className="text-white font-bold">{user.completedCount}</span> Tasks Done
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
