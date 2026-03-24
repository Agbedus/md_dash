import { auth } from '@/auth';
import { FiUser, FiMail, FiShield, FiCalendar, FiClock, FiCheckSquare, FiFileText, FiActivity, FiZap } from 'react-icons/fi';
import Image from 'next/image';
import { 
  getSummaryStats, 
  getProductivityData, 
  getTasksOverviewData, 
  getWorkloadData, 
  getKeyTasks, 
  getRecentNotes,
  getActivityData
} from '@/app/lib/dashboard-actions';
import ProfileStats from '@/components/profile/profile-stats';
import ProfileCharts from '@/components/profile/profile-charts';
import { ActivityHeatmap } from '@/components/ui/client-charts';
import React from 'react';

export default async function ProfilePage() {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    return <div className="p-8 text-white">Please log in to view your profile.</div>;
  }

  // Fetch all user-specific data in parallel
  const [
    stats,
    productivityData,
    tasksOverviewData,
    workloadData,
    keyTasks,
    recentNotes,
    activityData
  ] = await Promise.all([
    getSummaryStats(),
    getProductivityData('7d'),
    getTasksOverviewData(),
    getWorkloadData(),
    getKeyTasks(),
    getRecentNotes(),
    getActivityData()
  ]);

  return (
    <div className="px-4 py-6 md:py-8 max-w-[1600px] mx-auto min-h-screen space-y-6 md:space-y-8 pb-20">
      <div className="hidden lg:flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">My Profile</h1>
          <p className="text-zinc-400 mt-1">Manage your account and view your performance metrics.</p>
        </div>
        <div className="text-sm text-zinc-500 bg-white/[0.03] px-4 py-2 rounded-full border border-white/5">
          Personal Workspace • {new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: User Info Card */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">
            <div className="glass p-5 lg:p-8 rounded-3xl border border-white/5 bg-zinc-900/50 backdrop-blur-xl flex flex-col items-center text-center">
                {/* Avatar Section */}
                <div className="relative mb-4 lg:mb-6">
                    {user.image ? (
                    <div className="relative w-32 h-32 lg:w-40 lg:h-40">
                        <Image 
                            src={user.image} 
                            alt={user.name || 'User'} 
                            fill
                            className="rounded-full object-cover border-4 border-white/5 shadow-2xl"
                        />
                    </div>
                    ) : (
                    <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-4xl lg:text-5xl font-bold shadow-2xl border-4 border-white/5">
                        {(user.name || user.email || '?').charAt(0).toUpperCase()}
                    </div>
                    )}
                    <div className="absolute bottom-2 right-2 p-2 rounded-full bg-emerald-500 border-4 border-zinc-900 shadow-xl" />
                </div>

                <h2 className="text-2xl lg:text-3xl font-bold text-white mb-1">{user.name || 'User'}</h2>
                <p className="text-zinc-400 text-sm font-medium mb-4 lg:mb-6 flex items-center gap-2">
                    <FiMail className="w-4 h-4" /> {user.email}
                </p>

                <div className="w-full space-y-3 lg:space-y-4 pt-4 lg:pt-6 border-t border-white/5">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-500 flex items-center gap-2"><FiShield className="w-4 h-4" /> Roles</span>
                        <div className="flex gap-1">
                            {user.roles?.map(role => (
                                <span key={role} className="text-emerald-400 font-bold uppercase tracking-wider text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded">
                                    {role.replace('_', ' ')}
                                </span>
                            )) || <span className="text-zinc-600">None</span>}
                        </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-500 flex items-center gap-2"><FiCalendar className="w-4 h-4" /> Joined</span>
                        <span className="text-white font-medium">January 2024</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-500 flex items-center gap-2"><FiCheckSquare className="w-4 h-4" /> Workspace</span>
                        <span className="text-white font-medium">Personal</span>
                    </div>
                </div>

                <button className="w-full mt-6 lg:mt-8 py-2.5 lg:py-3 rounded-2xl bg-white/[0.03] border border-white/5 text-white font-semibold hover:bg-white/[0.06] transition-all hover:scale-[1.02] active:scale-95 text-sm lg:text-base">
                    Edit Profile Details
                </button>
            </div>

            {/* Quick Actions / Integration Card */}
            <div className="glass p-6 rounded-3xl border border-white/5 bg-white/[0.03] space-y-4">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Integrations</h4>
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 border border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400"><FiActivity /></div>
                        <span className="text-sm text-zinc-300">Google Calendar</span>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 border border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400"><FiZap /></div>
                        <span className="text-sm text-zinc-300">GitHub Activity</span>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-zinc-700" />
                </div>
            </div>

            {/* Activity Heatmap Card */}
            <div className="glass p-6 rounded-3xl border border-white/5 bg-zinc-900/50 space-y-4 overflow-hidden">
                <div className="flex justify-between items-center mb-1">
                    <h4 className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded">Activity Engine</h4>
                    <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">History</span>
                </div>
                <ActivityHeatmap data={activityData} variant="compact" />
            </div>
        </div>

        {/* Right Column: Metrics & Content */}
        <div className="lg:col-span-8 space-y-6 lg:space-y-8">
            {/* Personalized Statistics */}
            <section className="hidden lg:block space-y-4">
                <h3 className="text-lg lg:text-xl font-bold text-white px-2 flex items-center gap-2">
                    <FiActivity className="text-emerald-400" /> Performance Overview
                </h3>
                <ProfileStats stats={{
                    totalTasks: stats.totalTasks,
                    completedTasks: stats.completedTasks,
                    pendingTasks: stats.pendingTasks,
                    totalProjects: stats.totalProjects,
                    totalNotes: stats.totalNotes
                }} />
            </section>

            {/* Analytics & Charts */}
            <section className="hidden lg:block space-y-4">
                <h3 className="text-xl font-bold text-white px-2 flex items-center gap-2">
                    <FiZap className="text-amber-400" /> Productivity Metrics
                </h3>
                <ProfileCharts 
                    productivityData={productivityData}
                    tasksOverviewData={tasksOverviewData}
                    workloadData={workloadData}
                />
            </section>

            {/* Activity Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* High Priority Tasks */}
                <section className="space-y-3 lg:space-y-4">
                <div className="flex justify-between items-center px-2">
                    <h3 className="text-base lg:text-lg font-bold text-white">Critical Focus</h3>
                    <span className="text-[11px] lg:text-[11px] font-medium text-rose-400 uppercase tracking-wider bg-rose-500/10 px-2 py-0.5 rounded">High Priority</span>
                </div>
                <div className="glass p-4 lg:p-5 rounded-3xl border border-white/5 bg-zinc-900/50 space-y-3">
                    {keyTasks.length > 0 ? (
                    keyTasks.map((task: any, i: number) => (
                        <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] transition-all group cursor-pointer border-l-4 border-l-rose-500/50">
                        <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 transition-colors group-hover:bg-rose-500/20">
                            <FiZap className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate group-hover:text-rose-300 transition-colors">{task.title}</p>
                            <div className="flex items-center gap-3 mt-1 text-[11px] text-zinc-500">
                                <span className="flex items-center gap-1">
                                    <FiClock className="w-3 h-3" /> {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                                </span>
                                <span className="flex items-center gap-1">
                                    <FiActivity className="w-3 h-3" /> {task.status}
                                </span>
                            </div>
                        </div>
                        </div>
                    ))
                    ) : (
                        <div className="py-10 text-center text-zinc-500 text-sm">No critical focus tasks detected.</div>
                    )}
                    <button className="w-full py-3 rounded-2xl border border-white/5 text-zinc-400 text-xs font-bold uppercase tracking-wider hover:bg-white/[0.03] transition-all">View Task Board</button>
                </div>
                </section>

                {/* Recent Notes */}
                <section className="space-y-3 lg:space-y-4">
                <div className="flex justify-between items-center px-2">
                    <h3 className="text-base lg:text-lg font-bold text-white">Knowledge</h3>
                    <span className="text-[11px] lg:text-[11px] font-medium text-blue-400 uppercase tracking-wider bg-blue-500/10 px-2 py-0.5 rounded">Captures</span>
                </div>
                <div className="glass p-4 lg:p-5 rounded-3xl border border-white/5 bg-zinc-900/50 space-y-3">
                    {recentNotes.length > 0 ? (
                    recentNotes.map((note: any, i: number) => (
                        <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] transition-all group cursor-pointer border-l-4 border-l-blue-500/50">
                        <div className={`p-2 rounded-xl bg-white/[0.03] ${note.color || 'text-zinc-400'}`}>
                            <FiFileText className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate group-hover:text-blue-300 transition-colors">{note.title}</p>
                            <p className="text-[11px] text-zinc-500 mt-1 uppercase tracking-wider font-medium">{note.type} • {new Date(note.updatedAt).toLocaleDateString()}</p>
                        </div>
                        </div>
                    ))
                    ) : (
                        <div className="py-10 text-center text-zinc-500 text-sm">No recent notes found.</div>
                    )}
                    <button className="w-full py-3 rounded-2xl border border-white/5 text-zinc-400 text-xs font-bold uppercase tracking-wider hover:bg-white/[0.03] transition-all">Open Notebook</button>
                </div>
                </section>
            </div>
        </div>
      </div>
    </div>
  );
}
