'use client';

import { useState, useTransition, useRef, useEffect, useCallback, useOptimistic, useMemo } from 'react';
import { FiCheck, FiX, FiPlus, FiGrid, FiList, FiSearch, FiFilter, FiUser } from 'react-icons/fi';
import { createTask, updateTask, deleteTask, getTasks } from '@/app/tasks/actions';
import { statusMapping, priorityMapping } from "@/types/task";
import type { Task } from "@/types/task";
import TaskCard from './task-card';
import KanbanBoard from './kanban-board';
import { TaskSummarySection } from './task-summary';
import { UserLeaderboard } from './user-leaderboard';
import toast from 'react-hot-toast';
import { CustomDatePicker } from '@/components/ui/inputs/custom-date-picker';
import { format } from 'date-fns';

type ViewMode = 'table' | 'kanban';

import { User } from "@/types/user";
import { Project } from "@/types/project";

import { Combobox } from "@/components/ui/combobox";

export default function TasksPageClient({ allTasks: initialTasks, users, projects, projectId, currentUserId }: { allTasks: Task[], users: User[], projects: Project[], projectId?: number, currentUserId?: string }) {
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
    const [viewMode, setViewMode] = useState<ViewMode>('table');
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [filterMyTasks, setFilterMyTasks] = useState(false);

    const [isPending, startTransition] = useTransition();
    const [savingCreate, setSavingCreate] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isDirty, setIsDirty] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [filterPriority, setFilterPriority] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
    
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

    // Filtered tasks for visual grouping and search
    const filteredTasks = useMemo(() => {
        return optimisticTasks.filter(task => {
            const matchesSearch = !searchQuery || 
                task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
            
            const matchesPriority = !filterPriority || task.priority === filterPriority;
            const matchesStatus = !filterStatus || task.status === filterStatus;
            
            const matchesMyTasks = !filterMyTasks || (
                currentUserId && (
                    task.userId == currentUserId || 
                    task.owner?.id == currentUserId ||
                    task.assigneeIds?.some(id => String(id) === String(currentUserId)) ||
                    task.assignees?.some(a => String(a.user.id) === String(currentUserId))
                )
            );

            return matchesSearch && matchesPriority && matchesStatus && matchesMyTasks;
        });
    }, [optimisticTasks, searchQuery, filterPriority, filterStatus, filterMyTasks, currentUserId]);

    // New task state
    const [newAssignees, setNewAssignees] = useState<(string | number)[]>([]);
    const [newProject, setNewProject] = useState<string | number | null>(projectId || null);
    const [newDueDate, setNewDueDate] = useState<Date | null>(null);

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
        // Only trigger server fetch on initial load or projectId change.
        // Client-side filtering handles search/priority/status for a more instant feel.
        loadTasks();
    }, [projectId]); // Removed loadTasks from deps to prevent re-fetching on every state change (search/filter)

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
        startTransition(() => {
        addOptimisticTask({ type: 'add', task: newTask });
        });

        setErrorMsg(null);
        setSavingCreate(true);
        // Don't close form yet - wait for success
        try {
            const result = await createTask(formData);
            if (result && result.error) {
                setErrorMsg(result.error);
                 // We don't have an easy way to revert optimistic update here without reloading, 
                 // but loadTasks() below will eventually fix it or user sees error.
            } else {
                 toast.success('Task created successfully');
                 setIsAddingTask(false);
                 setIsDirty(false);
                 // Reset form state
                 setNewAssignees([]);
                 setNewProject(null);
                 if (newNameRef.current) newNameRef.current.value = '';
            }
            loadTasks();
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
             startTransition(() => {
                 addOptimisticTask({ type: 'update', task: updatedTask });
             });
        }

        setErrorMsg(null);
        try {
            const result = await updateTask(formData);
            if (result && result.error) {
                setErrorMsg(result.error);
                return { success: false, error: result.error };
            } else {
                setEditingTaskId(null);
            }
            loadTasks();
            return { success: true };
        } catch (err) {
            console.error(err);
            const msg = 'Could not update the task. Please try again.';
            setErrorMsg(msg);
            return { success: false, error: msg };
        }
    };

    const handleDelete = async (formData: FormData) => {
        const id = Number(formData.get('id'));
        const task = allTasks.find(t => t.id === id);
        if (task) {
            startTransition(() => {
                addOptimisticTask({ type: 'delete', task });
            });
        }
        
        setErrorMsg(null);
        try {
            const result = await deleteTask(formData);
            if (result && result.error) {
                setErrorMsg(result.error);
                return { success: false, error: result.error };
            }
            loadTasks();
            return { success: true };
        } catch (err) {
            console.error(err);
            const msg = 'Could not delete the task. Please try again.';
            setErrorMsg(msg);
            return { success: false, error: msg };
        }
    };

    return (
        <div className="px-4 py-8 max-w-[1600px] mx-auto">
            <div className="mb-10">
                <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Tasks</h1>
                <p className="text-zinc-400 text-lg">Manage team work and track progress.</p>
            </div>

            <TaskSummarySection tasks={filteredTasks} />
            
            <UserLeaderboard tasks={filteredTasks} users={users} />

            <div className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-10 overflow-x-auto pb-2 scrollbar-hide">
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                    <div className="relative flex-1 min-w-[280px] lg:w-96 hidden md:block group">
                        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[var(--pastel-indigo)] transition-colors"/>
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 h-11 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:bg-white/10 focus:border-white/20 text-white placeholder:text-zinc-600 transition-all text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative group">
                            <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-hover:text-[var(--pastel-indigo)] transition-colors pointer-events-none w-3.5 h-3.5" />
                            <select
                                value={filterPriority}
                                onChange={(e) => setFilterPriority(e.target.value)}
                                className="flex-shrink-0 w-36 h-11 bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 focus:outline-none focus:bg-white/10 focus:border-white/20 text-zinc-400 cursor-pointer hover:bg-white/10 transition-all text-[11px] appearance-none font-bold uppercase tracking-wider"
                            >
                                <option value="" className="bg-zinc-900">Priority</option>
                                {Object.entries(priorityMapping).map(([key, value]) => <option key={key} value={key} className="bg-zinc-900">{value}</option>)}
                            </select>
                        </div>
                        <div className="relative group">
                            <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-hover:text-[var(--pastel-indigo)] transition-colors pointer-events-none w-3.5 h-3.5" />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="flex-shrink-0 w-36 h-11 bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 focus:outline-none focus:bg-white/10 focus:border-white/20 text-zinc-400 cursor-pointer hover:bg-white/10 transition-all text-[11px] appearance-none font-bold uppercase tracking-wider"
                            >
                                <option value="" className="bg-zinc-900">Status</option>
                                {Object.entries(statusMapping).map(([key, value]) => <option key={key} value={key} className="bg-zinc-900">{value}</option>)}
                            </select>
                        </div>
                    </div>
                    {currentUserId && (
                        <button
                            onClick={() => setFilterMyTasks(!filterMyTasks)}
                            className={`flex items-center gap-2 px-4 h-11 rounded-xl border transition-all text-xs font-bold uppercase tracking-wider ${
                                filterMyTasks 
                                    ? 'bg-[var(--pastel-indigo)]/10 text-[var(--pastel-indigo)] border-[var(--pastel-indigo)]/20 shadow-sm' 
                                    : 'bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            <FiUser className="w-4 h-4" />
                            <span>My Tasks</span>
                        </button>
                    )}
                </div>
                
                <div className="flex items-center space-x-1 bg-white/5 p-1 h-11 rounded-xl border border-white/10">
                    <button
                        onClick={() => setViewMode('table')}
                        className={`p-2 rounded-lg transition-all hover-scale ${viewMode === 'table' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                        title="Table view"
                    >
                        <FiList className="w-5 h-5"/>
                    </button>
                    <button
                        onClick={() => setViewMode('kanban')}
                        className={`p-2 rounded-lg transition-all hover-scale ${viewMode === 'kanban' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                        title="Kanban view"
                    >
                        <FiGrid className="w-5 h-5"/>
                    </button>
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
                    tasks={filteredTasks}
                    users={users}
                    projects={projects}
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
                                    <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-widest whitespace-nowrap">Name</th>
                                    <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-widest whitespace-nowrap">Description</th>
                                    <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-widest whitespace-nowrap">Due Date</th>
                                    <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-widest whitespace-nowrap">Owner</th>
                                    <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-widest whitespace-nowrap">Priority</th>
                                    <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-widest whitespace-nowrap">Assignee</th>
                                    <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-widest whitespace-nowrap">Project</th>
                                    <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-widest whitespace-nowrap">Status</th>
                                    <th scope="col" className="px-6 py-4 text-right text-[10px] font-bold text-zinc-500 uppercase tracking-widest whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredTasks.map((task) => (
                                    <TaskCard
                                        key={task.id}
                                        task={task}
                                        users={users}
                                        projects={projects}
                                        updateTask={handleUpdate}
                                        deleteTask={handleDelete}
                                        isEditing={editingTaskId === task.id}
                                        onEdit={() => setEditingTaskId(task.id)}
                                        onCancel={() => setEditingTaskId(null)}
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
                                                if (newDueDate) {
                                                    formData.append('dueDate', format(newDueDate, 'yyyy-MM-dd'));
                                                }

                                                await handleCreate(formData);
                                                setNewDueDate(null);
                                                setNewAssignees([]);
                                                // Reset other states if needed or rely on form reset
                                                if (newNameRef.current) newNameRef.current.value = "";
                                            }}>
                                                <input
                                                    ref={newNameRef}
                                                    type="text"
                                                    name="name"
                                                    placeholder="Task name"
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 px-3 py-2 text-white placeholder:text-zinc-600 text-xs transition-all"
                                                    onChange={() => setIsDirty(true)}
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
                                                className="w-full bg-white/5 border border-white/10 rounded-xl focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 px-3 py-2 text-white placeholder:text-zinc-600 text-xs transition-all"
                                                onChange={() => setIsDirty(true)}
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <CustomDatePicker
                                                value={newDueDate}
                                                onChange={(date) => {
                                                    setNewDueDate(date);
                                                    setIsDirty(true);
                                                }}
                                                placeholder="Due date"
                                                className="w-full"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            {/* Owner column empty in creation row */}
                                        </td>
                                        <td className="px-4 py-2">
                                            <select
                                                name="priority"
                                                form="create-task-form"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 px-3 py-2 text-white text-xs appearance-none cursor-pointer transition-all"
                                                required
                                                onChange={() => setIsDirty(true)}
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
                                                onChange={(val) => { setNewAssignees(val as (string | number)[]); setIsDirty(true); }}
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
                                                onChange={(val) => { setNewProject(val as string | number | null); setIsDirty(true); }}
                                                placeholder="Project..."
                                                searchPlaceholder="Search projects..."
                                                className="w-full"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <select
                                                name="status"
                                                form="create-task-form"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 px-3 py-2 text-white text-xs appearance-none cursor-pointer transition-all"
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
                                                    {savingCreate ? (
                                                        <div className="h-3.5 w-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                                                    ) : (
                                                        <FiCheck className="h-3.5 w-3.5" />
                                                    )}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (isDirty) {
                                                            if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
                                                                setIsAddingTask(false);
                                                                setIsDirty(false);
                                                                setNewAssignees([]);
                                                                setNewProject(null);
                                                            }
                                                        } else {
                                                            setIsAddingTask(false);
                                                        }
                                                    }}
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
                                onClick={() => {
                                    if (isAddingTask && isDirty) {
                                         if (confirm('You have unsaved changes. Are you sure you want to close the form?')) {
                                             setIsAddingTask(!isAddingTask);
                                             setIsDirty(false);
                                         }
                                    } else {
                                        setIsAddingTask(!isAddingTask);
                                    }
                                }}
                                className="flex items-center gap-2 p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-sm text-zinc-400 hover:text-white transition-all duration-200 group"
                            >
                                <div className="p-1 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                                    <FiPlus className="w-4 h-4" />
                                </div>
                                <span>{isAddingTask ? 'Cancel' : 'New Task'}</span>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
