'use client';

import React, { useState } from 'react';
import { Project, statusMapping, priorityMapping } from '@/types/project';
import { Task } from '@/types/task';
import { Note } from '@/types/note';
import { User } from '@/types/user';
import { Client } from '@/types/client';
import { 
    FiCheckSquare, FiFileText, FiCalendar, FiDollarSign, 
    FiUsers, FiClock, FiPlus, FiSettings, FiActivity,
    FiLayout, FiPieChart, FiArrowLeft, FiMoreHorizontal,
    FiTrendingUp, FiAlertCircle, FiChevronRight, FiEdit2, FiTrash2
} from 'react-icons/fi';
import { format } from 'date-fns';
import Link from 'next/link';
import UserAvatarGroup from '@/components/ui/user-avatar-group';
import TaskCard from '@/components/ui/tasks/task-card';
import NoteCard from '@/components/ui/notes/note-card';
import { updateTask, deleteTask } from '@/app/tasks/actions';
import { updateNote, deleteNote } from '@/app/notes/actions';

interface ProjectDashboardClientProps {
    project: Project;
    tasks: Task[];
    notes: Note[];
    users: User[];
    clients: Client[];
    allProjects: Project[];
}

export default function ProjectDashboardClient({ 
    project, 
    tasks, 
    notes, 
    users, 
    clients,
    allProjects 
}: ProjectDashboardClientProps) {
    const [activeView, setActiveView] = useState<'overview' | 'tasks' | 'notes' | 'settings'>('overview');

    const client = clients.find(c => c.id === project.clientId);
    const owner = users.find(u => u.id === project.ownerId);

    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const taskProgress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;
    
    const budgetProgress = project.budget && project.budget > 0 
        ? ((project.spent || 0) / project.budget) * 100 
        : 0;

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col">
            {/* Top Command Bar */}
            <div className="h-16 px-6 border-b border-white/5 bg-zinc-900/40 backdrop-blur-md flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-6">
                    <Link href="/projects" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all border border-white/5">
                        <FiArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
                            <span>Project</span>
                            <FiChevronRight className="w-3 h-3" />
                            <span className="text-zinc-400">{project.key}</span>
                        </div>
                        <h1 className="text-lg font-black text-white tracking-tight uppercase leading-none">{project.name}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Active System</span>
                    </div>
                    <button className="flex items-center gap-2 h-10 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-black text-zinc-400 uppercase tracking-widest transition-all">
                        <FiSettings className="w-4 h-4" />
                        <span>Matrix Config</span>
                    </button>
                    <div className="w-px h-6 bg-white/10 mx-2" />
                    {owner && <UserAvatarGroup users={[owner]} size="sm" limit={1} />}
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Secondary Sidebar Nav */}
                <div className="w-64 border-r border-white/5 bg-zinc-900/20 p-5 flex flex-col gap-6 hidden lg:flex">
                    <div className="space-y-1">
                        <p className="px-4 text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-3">Navigation</p>
                        <NavButton active={activeView === 'overview'} onClick={() => setActiveView('overview')} icon={FiPieChart} label="Overview" />
                        <NavButton active={activeView === 'tasks'} onClick={() => setActiveView('tasks')} icon={FiLayout} label="Task Force" />
                        <NavButton active={activeView === 'notes'} onClick={() => setActiveView('notes')} icon={FiFileText} label="Intelligence" />
                        <NavButton active={activeView === 'settings'} onClick={() => setActiveView('settings')} icon={FiActivity} label="Logs & History" />
                    </div>

                    <div className="space-y-1">
                        <p className="px-4 text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-3">Health Status</p>
                        <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">Tactical Health</span>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${
                                    taskProgress > 75 ? 'text-emerald-400' : taskProgress > 40 ? 'text-indigo-400' : 'text-amber-400'
                                }`}>
                                    {taskProgress > 75 ? 'Optimal' : taskProgress > 40 ? 'Stable' : 'In Review'}
                                </span>
                            </div>
                            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full transition-all duration-1000 ${
                                        taskProgress > 75 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 
                                        taskProgress > 40 ? 'bg-indigo-500' : 'bg-amber-500'
                                    }`} 
                                    style={{ width: `${taskProgress}%` }} 
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">Resources</span>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${
                                    budgetProgress < 80 ? 'text-emerald-400' : 'text-rose-400'
                                }`}>
                                    {budgetProgress < 80 ? 'Efficient' : 'Critical'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.03),transparent_40%)]">
                    <div className="px-6 py-8 max-w-[1600px] mx-auto space-y-8">
                        {activeView === 'overview' && (
                            <>
                                {/* Impact Stats Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <StatCard icon={FiCheckSquare} color="indigo" label="Tactical Alignment" value={`${completedTasks}/${tasks.length}`} subValue={`${Math.round(taskProgress)}% Completed`} />
                                    <StatCard icon={FiDollarSign} color="emerald" label="Resource Purity" value={`$${(project.spent || 0).toLocaleString()}`} subValue={`of $${(project.budget || 0).toLocaleString()} Cap`} />
                                    <StatCard icon={FiClock} color="amber" label="Mission Window" value={project.endDate ? format(new Date(project.endDate), 'MMM dd') : 'N/A'} subValue="End Sequence" />
                                    <StatCard icon={FiTrendingUp} color="rose" label="Velocity Alpha" value={`${(taskProgress / 10).toFixed(1)}x`} subValue="Output Index" />
                                </div>

                                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                                    {/* Main Operational Column */}
                                    <div className="xl:col-span-2 space-y-6">
                                        {/* Row 1: Milestones & Risk */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="glass rounded-2xl p-6 border border-white/5 bg-zinc-900/10 flex flex-col gap-6">
                                                <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                                                    <FiActivity className="text-indigo-400" />
                                                    Strategic Milestones
                                                </h3>
                                                <div className="flex items-center gap-6">
                                                    <div className="relative w-20 h-20 flex-shrink-0">
                                                        <svg className="w-full h-full transform -rotate-90">
                                                            <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/5" />
                                                            <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray={226} strokeDashoffset={226 - (taskProgress / 100) * 226} className="text-indigo-500 transition-all duration-1000" strokeLinecap="round" />
                                                        </svg>
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                            <span className="text-sm font-black text-white leading-none">{Math.round(taskProgress)}%</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 space-y-4">
                                                        <div>
                                                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">Project Brief</p>
                                                            <p className="text-xs text-zinc-400 line-clamp-2 italic leading-relaxed">
                                                                {project.description || "Operational intelligence for this theater of operations remains classified. Update mission briefing in settings."}
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-4">
                                                            <MilestoneItem label="Architecture" status="completed" date="Oct 12" />
                                                            <MilestoneItem label="Integration" status="active" date="Nov 05" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="glass rounded-2xl p-6 border border-white/5 bg-zinc-900/10 flex flex-col gap-6">
                                                <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                                                    <FiActivity className="text-amber-400" />
                                                    System Telemetry
                                                </h3>
                                                <div className="space-y-4">
                                                    <TelemetryItem label="Risk Protocol" value="Low" color="emerald" percentage={15} />
                                                    <TelemetryItem label="Data Density" value="High" color="amber" percentage={78} />
                                                    <TelemetryItem label="Network Health" value="Optimal" color="indigo" percentage={92} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Row 2: Active Operations (Full Width of Column) */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                                                    <FiLayout className="text-emerald-400" />
                                                    Active Operations
                                                </h3>
                                                <button onClick={() => setActiveView('tasks')} className="text-[9px] font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-2">
                                                    View All <FiChevronRight />
                                                </button>
                                            </div>
                                            
                                            <div className="glass rounded-2xl overflow-hidden border border-white/5 bg-zinc-900/10">
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left">
                                                        <thead>
                                                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                                                <th className="px-6 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Name</th>
                                                                <th className="px-6 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Assignee</th>
                                                                <th className="px-6 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Status</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-white/5">
                                                            {tasks.slice(0, 5).map(task => (
                                                                <tr key={task.id} className="hover:bg-white/5 transition-colors">
                                                                    <td className="px-6 py-3">
                                                                        <p className="text-xs font-bold text-white uppercase tracking-tight truncate max-w-[250px]">{task.name}</p>
                                                                    </td>
                                                                    <td className="px-6 py-3">
                                                                        {task.assignees && task.assignees.length > 0 ? (
                                                                            <UserAvatarGroup users={task.assignees.map(a => a.user)} size="sm" limit={2} />
                                                                        ) : (
                                                                            <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest">Unassigned</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-6 py-3">
                                                                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${
                                                                            task.status === 'completed' 
                                                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                                                                : task.status === 'in_progress'
                                                                                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                                                                : 'bg-zinc-800 text-zinc-500 border-white/5'
                                                                        }`}>
                                                                            {task.status.replace('_', ' ')}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Row 3: Project Intelligence */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="glass rounded-2xl p-6 border border-white/5 bg-zinc-900/10 flex flex-col gap-4">
                                                <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                                                    <FiActivity className="text-rose-400" />
                                                    Activity Intel
                                                </h3>
                                                <div className="space-y-4">
                                                    {tasks.filter(t => t.status === 'completed').slice(0, 3).map(t => (
                                                        <ActivityItem key={t.id} user={users[0]} action="completed task" target={t.name} time="2h ago" />
                                                    ))}
                                                    <ActivityItem user={users[1] || users[0]} action="posted briefing" target="Alpha Protocol Update" time="4h ago" />
                                                </div>
                                            </div>
                                            <div className="glass rounded-2xl p-6 border border-white/5 bg-zinc-900/10 flex flex-col gap-4">
                                                <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                                                    <FiDollarSign className="text-emerald-400" />
                                                    Financial Telemetry
                                                </h3>
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Allocation</span>
                                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">${(project.budget || 0).toLocaleString()}</span>
                                                    </div>
                                                    <div className="w-full h-8 bg-white/5 rounded-xl border border-white/5 relative overflow-hidden flex">
                                                        <div className="h-full bg-emerald-500/40" style={{ width: `${Math.min(budgetProgress, 100)}%` }} />
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <span className="text-[10px] font-black text-white uppercase tracking-widest">{Math.round(budgetProgress)}% Exhausted</span>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                                            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Spent</p>
                                                            <p className="text-xs font-black text-white">${(project.spent || 0).toLocaleString()}</p>
                                                        </div>
                                                        <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                                            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Available</p>
                                                            <p className="text-xs font-black text-emerald-400">${((project.budget || 0) - (project.spent || 0)).toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sidebar Intel Column */}
                                    <div className="space-y-6">
                                        {/* Client Briefing */}
                                        <div className="glass rounded-2xl p-6 border border-white/5 bg-zinc-900/10 space-y-4">
                                            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                                                <FiUsers className="text-indigo-400" />
                                                Client Briefing
                                            </h3>
                                            <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
                                                <div>
                                                    <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Entity</p>
                                                    <p className="text-sm font-black text-white uppercase tracking-tight">{client ? client.companyName : 'Internal Asset'}</p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Entity</p>
                                                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{client?.companyName || 'Classified'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Contact</p>
                                                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{client?.contactPersonName || 'Unassigned'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Tactical Unit */}
                                        <div className="glass rounded-2xl p-6 border border-white/5 bg-zinc-900/10 space-y-6">
                                            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                                                <FiUsers className="text-rose-400" />
                                                Tactical Unit
                                            </h3>
                                            <div className="flex flex-wrap gap-2.5">
                                                {users.slice(0, 12).map((u, i) => (
                                                    <div key={i} className="group/avatar relative hover:scale-110 transition-all duration-300">
                                                        <UserAvatarGroup users={[u]} size="md" limit={1} />
                                                        <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-zinc-950" />
                                                    </div>
                                                ))}
                                                <button className="w-10 h-10 rounded-full border border-white/10 border-dashed flex items-center justify-center text-zinc-600 hover:text-white hover:border-white hover:bg-white/5 transition-all">
                                                    <FiPlus className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="pt-2 border-t border-white/5">
                                                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.2em] text-center">Authorized Personnel: {users.length}</p>
                                            </div>
                                        </div>

                                        {/* System Logs */}
                                        <div className="glass rounded-2xl p-6 border border-white/5 bg-zinc-900/10 space-y-4">
                                            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                                                <FiActivity className="text-zinc-400" />
                                                System Logs
                                            </h3>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                                                    <span className="text-zinc-600">Established</span>
                                                    <span className="text-zinc-400">{project.createdAt ? format(new Date(project.createdAt), 'MMM dd, yyyy') : '-'}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                                                    <span className="text-zinc-600">Window</span>
                                                    <span className="text-zinc-400">{project.startDate ? format(new Date(project.startDate), 'MMM dd') : 'TBD'} - {project.endDate ? format(new Date(project.endDate), 'MMM dd') : 'TBD'}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                                                    <span className="text-zinc-600">Sync Status</span>
                                                    <span className="text-emerald-400">Encrypted</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {activeView === 'tasks' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div>
                                        <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-none">Operation Center</h2>
                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-2">{tasks.length} Active Maneuvers Identified</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                                            <button className="h-10 px-6 rounded-xl bg-white/10 text-white text-[10px] font-black uppercase tracking-widest transition-all">Table</button>
                                            <button className="h-10 px-6 rounded-xl text-zinc-500 hover:text-zinc-300 text-[10px] font-black uppercase tracking-widest transition-all">Kanban</button>
                                        </div>
                                        <button className="flex items-center gap-2 h-12 px-8 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[11px] font-black uppercase tracking-[0.2em] transition-all">
                                            <FiPlus className="w-4 h-4" />
                                            <span>Initialize</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="glass rounded-2xl overflow-hidden border border-white/5 bg-zinc-900/10">
                                    <table className="w-full text-left">
                                        <tbody className="divide-y divide-white/5">
                                            {tasks.map(task => (
                                                <TaskCard 
                                                    key={task.id}
                                                    task={task}
                                                    users={users}
                                                    projects={allProjects}
                                                    updateTask={updateTask}
                                                    deleteTask={deleteTask}
                                                    hideProject={true}
                                                />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeView === 'notes' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div>
                                        <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-none">Intelligence Hub</h2>
                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-2">Classified briefings and metadata</p>
                                    </div>
                                    <button className="flex items-center gap-2 h-12 px-8 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[11px] font-black uppercase tracking-[0.2em] transition-all">
                                        <FiPlus className="w-4 h-4" />
                                        <span>Log Note</span>
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {notes.map(note => (
                                        <div key={note.id} className="h-[300px]">
                                            <NoteCard 
                                                note={note}
                                                onNoteUpdate={updateNote}
                                                onNoteDelete={deleteNote}
                                                viewMode="grid"
                                                availableUsers={users.map(u => ({ id: u.id, name: u.fullName, email: u.email, image: '' }))}
                                            />
                                        </div>
                                    ))}
                                    {notes.length === 0 && (
                                        <div className="col-span-full py-32 flex flex-col items-center gap-6 text-zinc-700 border border-white/5 border-dashed rounded-2xl">
                                            <FiFileText className="w-16 h-16 opacity-10" />
                                            <p className="text-xs font-black uppercase tracking-[0.3em]">Vault is empty</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function MilestoneItem({ label, status, date }: { label: string, status: 'completed' | 'active' | 'pending', date: string }) {
    const statusColors = {
        completed: 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]',
        active: 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.4)] animate-pulse',
        pending: 'bg-zinc-800'
    };

    return (
        <div className="flex flex-col gap-2 group">
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
                <span className={`text-[10px] font-black uppercase tracking-widest ${status === 'pending' ? 'text-zinc-600' : 'text-zinc-400'}`}>{date}</span>
            </div>
            <p className={`text-sm font-black uppercase tracking-tight transition-colors ${status === 'pending' ? 'text-zinc-700' : 'text-white group-hover:text-indigo-400'}`}>{label}</p>
        </div>
    );
}

function TelemetryItem({ label, value, color, percentage }: { label: string, value: string, color: 'indigo' | 'emerald' | 'amber' | 'rose', percentage: number }) {
    const colors = {
        indigo: 'bg-indigo-500',
        emerald: 'bg-emerald-500',
        amber: 'bg-amber-500',
        rose: 'bg-rose-500',
    };

    return (
        <div className="space-y-2.5">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{label}</span>
                <span className={`text-[10px] font-black uppercase tracking-widest ${percentage < 30 ? 'text-emerald-400' : percentage > 70 ? 'text-amber-400' : 'text-indigo-400'}`}>{value}</span>
            </div>
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div 
                    className={`h-full ${colors[color]} transition-all duration-1000 ease-out`} 
                    style={{ width: `${percentage}%` }} 
                />
            </div>
        </div>
    );
}

function NavButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
    return (
        <button 
            onClick={onClick}
            className={`w-full flex items-center gap-4 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                active 
                    ? 'bg-white/10 text-white border border-white/10' 
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-transparent blur-[0.3px] hover:blur-none'
            }`}
        >
            <Icon className={`w-4 h-4 ${active ? 'text-[var(--pastel-indigo)]' : 'text-zinc-500'}`} />
            <span>{label}</span>
            {active && <div className="ml-auto w-1 h-1 rounded-full bg-[var(--pastel-indigo)]" />}
        </button>
    );
}

function ActivityItem({ user, action, target, time }: { user: User, action: string, target: string, time: string }) {
    return (
        <div className="flex items-center gap-3 group">
            <UserAvatarGroup users={[user]} size="sm" limit={1} />
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-white uppercase tracking-tight truncate">
                    <span className="text-zinc-500 font-bold">{(user.fullName || 'User').split(' ')[0]}</span> {action} <span className="text-indigo-400">{target}</span>
                </p>
                <p className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest mt-0.5">{time}</p>
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, color, label, value, subValue }: { icon: any, color: 'indigo' | 'emerald' | 'amber' | 'rose', label: string, value: string, subValue: string }) {
    const colors = {
        indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20 shadow-indigo-500/10',
        emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/10',
        amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-amber-500/10',
        rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20 shadow-rose-500/10',
    };

    return (
        <div className="glass rounded-2xl p-5 border border-white/5 bg-zinc-900/10 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500">
            <div className={`absolute -top-10 -right-10 w-32 h-32 blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity ${colors[color].split(' ')[1]}`} />
            
            <div className="flex flex-col gap-4 relative z-10">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-500 ${colors[color]}`}>
                    <Icon className="w-4 h-4" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">{label}</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl font-black text-white uppercase tracking-tight">{value}</span>
                        <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{subValue}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
