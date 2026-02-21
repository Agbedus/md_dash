'use client';

import React, { useState } from 'react';
import { Project, statusMapping, priorityMapping } from '@/types/project';
import { Task } from '@/types/task';
import { Note } from '@/types/note';
import { User } from '@/types/user';
import { Client } from '@/types/client';
import { FiX, FiCheckSquare, FiFileText, FiCalendar, FiDollarSign, FiUsers, FiClock, FiPlus, FiMaximize2 } from 'react-icons/fi';
import { format } from 'date-fns';
import Link from 'next/link';
import UserAvatarGroup from '@/components/ui/user-avatar-group';
import TaskCard from '@/components/ui/tasks/task-card';
import NoteCard from '@/components/ui/notes/note-card';
import { updateTask, deleteTask } from '@/app/tasks/actions';
import { updateNote, deleteNote } from '@/app/notes/actions';

interface ProjectDetailsProps {
    project: Project;
    users: User[];
    clients: Client[];
    notes: Note[];
    projects: Project[];
    onClose: () => void;
}

export function ProjectDetails({ project, users, clients, notes, projects, onClose }: ProjectDetailsProps) {
    const [activeTab, setActiveTab] = useState<'tasks' | 'notes'>('tasks');

    const projectTasks = project.tasks || [];
    const projectNotes = notes.filter(n => projectTasks.some(t => t.id === n.task_id));

    const client = clients.find(c => c.id === project.clientId);
    const owner = users.find(u => u.id === project.ownerId);

    const totalBudget = project.budget || 0;
    const spent = project.spent || 0;
    const budgetProgress = totalBudget > 0 ? (spent / totalBudget) * 100 : 0;

    const completedTasks = projectTasks.filter(t => t.status === 'DONE').length;
    const taskProgress = projectTasks.length > 0 ? (completedTasks / projectTasks.length) * 100 : 0;

    return (
        <div className="fixed inset-y-0 right-0 w-full max-w-2xl z-[100] animate-in slide-in-from-right duration-500">
            <div className="h-full bg-zinc-950/80 backdrop-blur-2xl border-l border-white/5 shadow-2xl flex flex-col">
                {/* Header */}
                <div className="p-8 border-b border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 flex items-center gap-2">
                        <Link 
                            href={`/projects/${project.id}`}
                            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 text-[11px] font-medium text-zinc-400 hover:text-white uppercase tracking-wider transition-all"
                        >
                            <FiMaximize2 className="w-3.5 h-3.5" />
                            <span>Open Command Center</span>
                        </Link>
                        <button onClick={onClose} className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] text-zinc-400 hover:text-white transition-all border border-white/5">
                            <FiX className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex items-center gap-3 mb-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[11px] font-medium uppercase tracking-wider border ${
                            project.status === 'completed' ? 'bg-[var(--pastel-emerald)]/10 text-[var(--pastel-emerald)] border-[var(--pastel-emerald)]/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' :
                            project.status === 'in_progress' ? 'bg-[var(--pastel-blue)]/10 text-[var(--pastel-blue)] border-[var(--pastel-blue)]/20' :
                            'bg-white/[0.03] text-zinc-500 border-white/5'
                        }`}>
                            {statusMapping[project.status]}
                        </span>
                        <div className="px-2.5 py-1 rounded-lg text-[11px] font-medium font-mono text-zinc-500 bg-white/[0.03] border border-white/5 uppercase tracking-wider leading-none">
                            {project.key}
                        </div>
                    </div>

                    <h2 className="text-3xl font-medium text-white tracking-tight leading-none mb-6 group">
                        {project.name}
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Client</span>
                            <span className="text-sm font-bold text-white uppercase tracking-tight truncate">
                                {client ? client.companyName : 'Internal'}
                            </span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Owner</span>
                            <div className="flex items-center gap-2">
                                {owner ? (
                                    <>
                                        <UserAvatarGroup users={[owner]} size="sm" limit={1} />
                                        <span className="text-sm font-bold text-white uppercase tracking-tight truncate">{owner.fullName}</span>
                                    </>
                                ) : <span className="text-sm font-bold text-zinc-600">Unassigned</span>}
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Budget</span>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-white uppercase tracking-tight">${spent.toLocaleString()} / ${totalBudget.toLocaleString()}</span>
                                <div className="w-full h-1 bg-white/[0.03] rounded-full mt-1 overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                                        style={{ width: `${Math.min(budgetProgress, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Timeline</span>
                            <div className="flex items-center gap-1.5 text-sm font-bold text-white uppercase tracking-tight">
                                <FiCalendar className="w-3.5 h-3.5 text-zinc-500" />
                                <span>{project.endDate ? format(new Date(project.endDate), 'MMM dd') : 'TBD'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex px-8 border-b border-white/5">
                    <button 
                        onClick={() => setActiveTab('tasks')}
                        className={`py-6 px-4 text-[11px] font-medium uppercase tracking-wider border-b-2 transition-all ${activeTab === 'tasks' ? 'border-[var(--pastel-indigo)] text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                    >
                        Tasks ({projectTasks.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('notes')}
                        className={`py-6 px-4 text-[11px] font-medium uppercase tracking-wider border-b-2 transition-all ${activeTab === 'notes' ? 'border-[var(--pastel-indigo)] text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                    >
                        Notes ({projectNotes.length})
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {activeTab === 'tasks' ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Project Roadmaps</h3>
                                <button className="flex items-center gap-2 h-9 px-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 text-[11px] font-medium uppercase tracking-wider text-zinc-400 hover:text-white transition-all">
                                    <FiPlus className="w-3.5 h-3.5" />
                                    <span>Add Task</span>
                                </button>
                            </div>
                            
                            {projectTasks.length > 0 ? (
                                <div className="glass rounded-2xl overflow-hidden border border-white/5">
                                    <table className="w-full text-left text-sm">
                                        <tbody className="divide-y divide-white/5">
                                            {projectTasks.map(task => (
                                                <TaskCard 
                                                    key={task.id}
                                                    task={task}
                                                    users={users}
                                                    projects={projects}
                                                    updateTask={updateTask}
                                                    deleteTask={deleteTask}
                                                    hideProject={true}
                                                />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="py-20 flex flex-col items-center gap-4 text-zinc-600">
                                    <FiCheckSquare className="w-12 h-12 opacity-20" />
                                    <span className="text-sm font-bold uppercase tracking-wider">No tasks active</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Context & Mentions</h3>
                                <button className="flex items-center gap-2 h-9 px-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 text-[11px] font-medium uppercase tracking-wider text-zinc-400 hover:text-white transition-all">
                                    <FiPlus className="w-3.5 h-3.5" />
                                    <span>New Note</span>
                                </button>
                            </div>

                            {projectNotes.length > 0 ? (
                                <div className="grid grid-cols-1 gap-6">
                                    {projectNotes.map(note => (
                                        <div key={note.id} className="h-[280px]">
                                            <NoteCard 
                                                note={note}
                                                onNoteUpdate={updateNote}
                                                onNoteDelete={deleteNote}
                                                viewMode="grid"
                                                availableUsers={users.map(u => ({ id: u.id, name: u.fullName, email: u.email, image: '' }))}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 flex flex-col items-center gap-4 text-zinc-600">
                                    <FiFileText className="w-12 h-12 opacity-20" />
                                    <span className="text-sm font-bold uppercase tracking-wider">Zero documents found</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                
                {/* Footer / Stats */}
                <div className="p-8 border-t border-white/5 bg-white/[0.02]">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider">Mission Progress</span>
                            <div className="flex items-center gap-3">
                                <div className="w-48 h-2 bg-white/[0.03] rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-[var(--pastel-indigo)]"
                                        style={{ width: `${taskProgress}%` }}
                                    />
                                </div>
                                <span className="text-xs font-medium text-white tracking-wider">{Math.round(taskProgress)}%</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col items-end gap-0.5">
                                <span className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider">Created</span>
                                <span className="text-[11px] font-medium text-zinc-400">{project.createdAt ? format(new Date(project.createdAt), 'MMM dd, yyyy') : '-'}</span>
                            </div>
                            <div className="flex flex-col items-end gap-0.5">
                                <span className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider">Last Update</span>
                                <span className="text-[11px] font-medium text-zinc-400">{project.updatedAt ? format(new Date(project.updatedAt), 'MMM dd, yyyy') : '-'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
