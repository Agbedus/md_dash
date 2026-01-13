'use client';

import { useState, useTransition, useRef, useEffect, useCallback, useOptimistic } from 'react';
import { FiCheck, FiX, FiPlus, FiGrid, FiList, FiSearch } from 'react-icons/fi';
import { createTask, updateTask, deleteTask, getTasks } from '@/app/tasks/actions';
import { statusMapping, priorityMapping } from "@/types/task";
import type { Task } from "@/types/task";
import TaskCard from './task-card';
import KanbanBoard from './kanban-board';

type ViewMode = 'table' | 'kanban';

import { User } from "@/types/user";
import { Project } from "@/types/project";

import { Combobox } from "@/components/ui/combobox";

export default function TasksPageClient({ allTasks: initialTasks, users, projects, projectId }: { allTasks: Task[], users: User[], projects: Project[], projectId?: number }) {
    const hydrateTasks = useCallback((tasks: Task[]) => {
        return tasks.map(task => {
            if (task.assignees && task.assignees.length > 0) return task;
            if (!task.assigneeIds || task.assigneeIds.length === 0) return task;
            
            return {
                ...task,
                assignees: users
                    .filter(u => task.assigneeIds?.includes(u.id))
                    .map(user => ({ user }))
            };
        });
    }, [users]);

    const [allTasks, setAllTasks] = useState<Task[]>(hydrateTasks(initialTasks));
    // ... rest of state
    const [viewMode, setViewMode] = useState<ViewMode>('table');
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [savingCreate, setSavingCreate] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [filterPriority, setFilterPriority] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    
    // Optimistic UI
    const [optimisticTasks, addOptimisticTask] = useOptimistic(
        allTasks,
        (state: Task[], action: { type: 'add' | 'update' | 'delete', task: Task }) => {
            switch (action.type) {
                case 'add':
                    return [...state, action.task];
                case 'update':
                    return state.map(t => t.id === action.task.id ? action.task : t);
                case 'delete':
                    return state.filter(t => t.id !== action.task.id);
                default:
                    return state;
            }
        }
    );

    // New task state
    const [newAssignees, setNewAssignees] = useState<(string | number)[]>([]);
    const [newProject, setNewProject] = useState<string | number | null>(projectId || null);

    const newNameRef = useRef<HTMLInputElement | null>(null);

    const loadTasks = useCallback(() => {
        startTransition(async () => {
            try {
                const tasks = await getTasks(searchQuery, filterPriority, filterStatus, projectId);
                setAllTasks(hydrateTasks(tasks));
            } catch (err) {
                console.error(err);
                setErrorMsg('Could not load tasks. Please try again.');
            }
        });
    }, [searchQuery, filterPriority, filterStatus, hydrateTasks, projectId]);

    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    useEffect(() => {
        if (isAddingTask && newNameRef.current) {
            setTimeout(() => newNameRef.current?.focus(), 0);
        }
    }, [isAddingTask]);

    const handleCreate = async (formData: FormData) => {
        // Optimistic Update
        const newTask: Task = {
            id: -1,
            name: formData.get('name') as string,
            description: formData.get('description') as string,
            status: formData.get('status') as Task['status'],
            priority: formData.get('priority') as Task['priority'],
            dueDate: formData.get('dueDate') as string,
            projectId: formData.get('projectId') ? Number(formData.get('projectId')) : null,
            assignees: (() => {
                const idsJson = formData.get('assigneeIds') as string;
                if (!idsJson) return [];
                try {
                    const ids = JSON.parse(idsJson);
                    return users
                        .filter(u => ids.includes(u.id))
                        .map(user => ({ user }));
                } catch { return []; }
            })(),
            assigneeIds: (() => {
                const idsJson = formData.get('assigneeIds') as string;
                try { return idsJson ? JSON.parse(idsJson) : []; } catch { return []; }
            })(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        addOptimisticTask({ type: 'add', task: newTask });

        setErrorMsg(null);
        setSavingCreate(true);
        try {
            await createTask(formData);
            loadTasks();
            setIsAddingTask(false);
            // Reset form state
            setNewAssignees([]);
            setNewProject(null);
        } catch (err) {
            console.error(err);
            setErrorMsg('Could not save the new task. Please try again.');
        } finally {
            setSavingCreate(false);
        }
    };

    const handleUpdate = async (formData: FormData) => {
        // Optimistic Update
        const id = Number(formData.get('id'));
        const existingTask = allTasks.find(t => t.id === id);
        if (existingTask) {
             const updatedTask: Task = {
                ...existingTask,
                name: (formData.get('name') as string) || existingTask.name,
                description: (formData.get('description') as string) || existingTask.description,
                status: (formData.get('status') as Task['status']) || existingTask.status,
                priority: (formData.get('priority') as Task['priority']) || existingTask.priority,
                dueDate: (formData.get('dueDate') as string) || existingTask.dueDate,
                projectId: formData.get('projectId') ? Number(formData.get('projectId')) : existingTask.projectId,
                assignees: (() => {
                    const idsJson = formData.get('assigneeIds') as string;
                    if (!idsJson) return existingTask.assignees;
                    try {
                        const ids = JSON.parse(idsJson);
                        return users
                            .filter(u => ids.includes(u.id))
                            .map(user => ({ user }));
                    } catch { return existingTask.assignees; }
                })(),
                assigneeIds: (() => {
                    const idsJson = formData.get('assigneeIds') as string;
                    try { return idsJson ? JSON.parse(idsJson) : existingTask.assigneeIds; } catch { return existingTask.assigneeIds; }
                })(),
             };
             addOptimisticTask({ type: 'update', task: updatedTask });
        }

        setErrorMsg(null);
        try {
            await updateTask(formData);
            loadTasks();
        } catch (err) {
            console.error(err);
            setErrorMsg('Could not update the task. Please try again.');
        }
    };

    const handleDelete = async (formData: FormData) => {
        const id = Number(formData.get('id'));
        const task = allTasks.find(t => t.id === id);
        if (task) {
            addOptimisticTask({ type: 'delete', task });
        }
        
        setErrorMsg(null);
        try {
            await deleteTask(formData);
            loadTasks();
        } catch (err) {
            console.error(err);
            setErrorMsg('Could not delete the task. Please try again.');
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <div className="mb-6 md:mb-8">
                <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 tracking-tight">Tasks</h1>
                <p className="text-zinc-400 text-sm md:text-lg">Manage your tasks and track progress.</p>
            </div>

            <div className="sticky top-20 md:top-24 z-10 glass p-3 md:p-6 rounded-2xl mb-6 md:mb-8">
                <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                        <div className="relative flex-1 min-w-[200px] lg:w-64 hidden md:block">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:bg-white/10 focus:border-white/20 text-white placeholder:text-zinc-600 transition-all text-sm"
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                            <select
                                value={filterPriority}
                                onChange={(e) => setFilterPriority(e.target.value)}
                                className="flex-shrink-0 w-36 sm:w-40 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus:outline-none focus:bg-white/10 focus:border-white/20 text-zinc-300 cursor-pointer hover:bg-white/10 transition-colors text-xs md:text-sm"
                            >
                                <option value="">All Priorities</option>
                                {Object.entries(priorityMapping).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
                            </select>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="flex-shrink-0 w-36 sm:w-40 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus:outline-none focus:bg-white/10 focus:border-white/20 text-zinc-300 cursor-pointer hover:bg-white/10 transition-colors text-xs md:text-sm"
                            >
                                <option value="">All Statuses</option>
                                {Object.entries(statusMapping).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center space-x-1 bg-white/5 p-1 rounded-xl border border-white/10 self-end lg:self-auto">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-1.5 md:p-2 rounded-lg transition-all hover-scale ${viewMode === 'table' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                            title="Table view"
                        >
                            <FiList className="w-4 h-4 md:w-5 md:h-5"/>
                        </button>
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={`p-1.5 md:p-2 rounded-lg transition-all hover-scale ${viewMode === 'kanban' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                            title="Kanban view"
                        >
                            <FiGrid className="w-4 h-4 md:w-5 md:h-5"/>
                        </button>
                    </div>
                </div>
            </div>

            {errorMsg && (
                <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400 text-sm flex items-center gap-2">
                    <FiX className="h-4 w-4" />
                    {errorMsg}
                </div>
            )}

            {viewMode === 'kanban' ? (
                <KanbanBoard
                    tasks={optimisticTasks}
                    updateTask={handleUpdate}
                    deleteTask={handleDelete}
                />
            ) : (
                <div className="glass rounded-2xl overflow-hidden flex flex-col">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <caption className="sr-only">Tasks table</caption>
                            <thead>
                                <tr className="border-b border-white/5 bg-white/5">
                                    <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap">Name</th>
                                    <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap">Description</th>
                                    <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap">Due Date</th>
                                    <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap">Priority</th>
                                    <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap">Assignee</th>
                                    <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap">Project</th>
                                    <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                                    <th scope="col" className="px-4 py-3 text-right text-[10px] font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {optimisticTasks.map((task) => (
                                    <TaskCard
                                        key={task.id}
                                        task={task}
                                        users={users}
                                        projects={projects}
                                        updateTask={handleUpdate}
                                        deleteTask={handleDelete}
                                    />
                                ))}
                                {isAddingTask && (
                                    <tr className="bg-white/5 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <td className="px-4 py-2">
                                            <form id="create-task-form" onSubmit={async (e) => {
                                                e.preventDefault();
                                                const formData = new FormData(e.currentTarget);
                                                
                                                // Manually append state values to FormData since inputs are outside form or detached
                                                if (newAssignees.length > 0) {
                                                    formData.append('assigneeIds', JSON.stringify(newAssignees));
                                                }
                                                if (newProject) {
                                                    formData.append('projectId', newProject.toString());
                                                }

                                                await handleCreate(formData);
                                            }}>
                                                <input
                                                    ref={newNameRef}
                                                    type="text"
                                                    name="name"
                                                    placeholder="Task name"
                                                    className="w-full bg-transparent border-b border-white/10 focus:border-emerald-500/50 focus:ring-0 p-1 text-white placeholder:text-zinc-600 text-xs transition-colors"
                                                    required
                                                />
                                            </form>
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="text"
                                                name="description"
                                                placeholder="Description"
                                                form="create-task-form"
                                                className="w-full bg-transparent border-b border-white/10 focus:border-emerald-500/50 focus:ring-0 p-1 text-white placeholder:text-zinc-600 text-xs transition-colors"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="date"
                                                name="dueDate"
                                                form="create-task-form"
                                                className="w-full bg-transparent border-b border-white/10 focus:border-emerald-500/50 focus:ring-0 p-1 text-white placeholder:text-zinc-600 text-xs [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:invert transition-colors"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <select
                                                name="priority"
                                                form="create-task-form"
                                                className="w-full bg-transparent border-b border-white/10 focus:border-emerald-500/50 focus:ring-0 p-1 text-white text-xs appearance-none cursor-pointer transition-colors"
                                                required
                                            >
                                                <option value="low" className="bg-zinc-900">Low</option>
                                                <option value="medium" className="bg-zinc-900">Medium</option>
                                                <option value="high" className="bg-zinc-900">High</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-2 min-w-[200px]">
                                            <Combobox
                                                options={users.map(u => ({ value: u.id, label: u.fullName || u.email, subLabel: u.email }))}
                                                value={newAssignees}
                                                onChange={(val) => setNewAssignees(val as (string | number)[])}
                                                multiple
                                                placeholder="Assign..."
                                                searchPlaceholder="Search users..."
                                                className="w-full"
                                            />
                                        </td>
                                        <td className="px-4 py-2 min-w-[150px]">
                                            <Combobox
                                                options={projects.map(p => ({ value: p.id, label: p.name, subLabel: p.key || undefined }))}
                                                value={newProject || ''}
                                                onChange={(val) => setNewProject(val as string | number | null)}
                                                placeholder="Project..."
                                                searchPlaceholder="Search projects..."
                                                className="w-full"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <select
                                                name="status"
                                                form="create-task-form"
                                                className="w-full bg-transparent border-b border-white/10 focus:border-emerald-500/50 focus:ring-0 p-1 text-white text-xs appearance-none cursor-pointer transition-colors"
                                                required
                                            >
                                                {Object.entries(statusMapping).map(([key, value]) => (
                                                    <option key={key} value={key} className="bg-zinc-900">{value}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-4 py-2 text-right text-xs font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    type="submit"
                                                    form="create-task-form"
                                                    disabled={isPending || savingCreate}
                                                    className="inline-flex items-center p-1.5 border border-transparent rounded-lg text-white bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-all"
                                                >
                                                    <FiCheck className="h-3 w-3" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsAddingTask(false)}
                                                    disabled={savingCreate}
                                                    className="inline-flex items-center p-1.5 border border-white/10 rounded-lg text-zinc-400 bg-white/5 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500 disabled:opacity-50 transition-all"
                                                >
                                                    <FiX className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {!isAddingTask && (
                        <div className="p-4 border-t border-white/5">
                            <button
                                onClick={() => setIsAddingTask(true)}
                                className="flex items-center gap-2 p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-sm text-zinc-400 hover:text-white transition-all duration-200 group"
                            >
                                <div className="p-1 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                                    <FiPlus className="w-4 h-4" />
                                </div>
                                <span>New Task</span>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
