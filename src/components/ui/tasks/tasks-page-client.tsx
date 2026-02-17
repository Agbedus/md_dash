'use client';

import { useState, useTransition, useRef, useEffect, useCallback, useOptimistic, useMemo } from 'react';
import { AnimatePresence, motion } from "framer-motion";
import { FiCheck, FiX, FiPlus, FiGrid, FiList, FiSearch, FiFilter, FiUser } from 'react-icons/fi';
import { createTask, updateTask, deleteTask } from '@/app/tasks/actions';
import { useTasks } from '@/hooks/use-tasks';
import { statusMapping, priorityMapping } from "@/types/task";
import type { Task } from "@/types/task";
import TaskCard from './task-card';
import KanbanBoard from './kanban-board';
import { TaskSummarySection } from './task-summary';
import { UserLeaderboard } from './user-leaderboard';
import toast from 'react-hot-toast';
import { CustomDatePicker } from '@/components/ui/inputs/custom-date-picker';
import { format } from 'date-fns';
import { createOptimisticTask, updateOptimisticTask } from '@/lib/task-optimistic';

type ViewMode = 'table' | 'kanban';

import { User } from "@/types/user";
import { Project } from "@/types/project";

import { Combobox } from "@/components/ui/combobox";

export default function TasksPageClient({ allTasks: initialTasks, users, projects, projectId, currentUserId }: { allTasks: Task[], users: User[], projects: Project[], projectId?: number, currentUserId?: string }) {
    const [tableTab, setTableTab] = useState<'active' | 'done'>('active');
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
    
    // SWR Hook
    const { 
        tasks: serverTasks, 
        isLoading, 
        isLoadingMore, 
        size, 
        setSize, 
        mutate,
        isReachingEnd 
    } = useTasks({
        searchQuery,
        filterPriority,
        filterStatus,
        projectId,
        limit: 50,
        users,
        initialTasks
    });

    // Optimistic UI
    const [optimisticTasks, addOptimisticTask] = useOptimistic(
        serverTasks,
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
        const tasks = optimisticTasks.filter(task => {
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

        if (viewMode === 'kanban') return tasks;

        // In table view, filter by active/done status based on tab
        return tasks.filter(task => {
            if (tableTab === 'done') return task.status === 'DONE';
            return task.status !== 'DONE';
        });
    }, [optimisticTasks, searchQuery, filterPriority, filterStatus, filterMyTasks, currentUserId, viewMode, tableTab]);

    // New task state
    const [newAssignees, setNewAssignees] = useState<(string | number)[]>([]);
    const [newProject, setNewProject] = useState<string | number | null>(projectId || null);
    const [newDueDate, setNewDueDate] = useState<Date | null>(null);
    const [newQARequired, setNewQARequired] = useState(false);
    const [newReviewRequired, setNewReviewRequired] = useState(false);
    const [newDependsOn, setNewDependsOn] = useState<number | null>(null);
    const newNameRef = useRef<HTMLInputElement | null>(null);

    // Infinite Scroll Handler
    const observer = useRef<IntersectionObserver | null>(null);
    const lastTaskElementRef = useCallback((node: any) => {
        if (isLoadingMore || viewMode === 'kanban' || isReachingEnd) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                setSize(size + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [isLoadingMore, viewMode, isReachingEnd, setSize, size]);

    useEffect(() => {
        if (isAddingTask && newNameRef.current) {
            setTimeout(() => newNameRef.current?.focus(), 0);
        }
    }, [isAddingTask]);

    const handleCreate = async (formData: FormData) => {
        // Optimistic Update
        // Optimistic Update
        const newTask = createOptimisticTask(formData, users);
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
                 setNewProject(projectId || null);
                 setNewQARequired(false);
                 setNewReviewRequired(false);
                 setNewDependsOn(null);
                 if (newNameRef.current) newNameRef.current.value = '';
            }
            mutate();
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
        const existingTask = optimisticTasks.find(t => t.id === id);
        if (existingTask) {
             const updatedTask = updateOptimisticTask(existingTask, formData, users);
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
            mutate();
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
        const task = optimisticTasks.find(t => t.id === id);
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
            mutate();
            return { success: true };
        } catch (err) {
            console.error(err);
            const msg = 'Could not delete the task. Please try again.';
            setErrorMsg(msg);
            return { success: false, error: msg };
        }
    };

    return (
        <div className="px-4 py-8 max-w-[1600px] mx-auto min-h-screen">
            <div className="hidden lg:block mb-10">
                <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Tasks</h1>
                <p className="text-zinc-400 text-lg">Manage team work and track progress.</p>
            </div>

            <TaskSummarySection tasks={optimisticTasks} />
            
            <UserLeaderboard tasks={optimisticTasks} users={users} />

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 lg:mb-10">
                <div className="flex items-center gap-2 w-full overflow-x-auto pb-2 scrollbar-hide">
                    <div className="relative flex-1 min-w-[140px] max-w-sm group">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[var(--pastel-indigo)] transition-colors w-3.5 h-3.5"/>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-4 h-9 lg:h-11 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:bg-white/10 focus:border-white/20 text-white placeholder:text-zinc-600 transition-all text-xs lg:text-sm"
                        />
                    </div>
                    
                    <div className="relative group flex-shrink-0">
                         <div className="h-9 lg:h-11 w-9 lg:w-36 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center lg:justify-start lg:pl-3 relative overflow-hidden focus-within:outline-none focus-within:bg-white/10 focus-within:border-white/20 transition-all">
                            <FiFilter className="text-zinc-500 group-hover:text-[var(--pastel-indigo)] transition-colors w-3.5 h-3.5 lg:absolute lg:left-3 lg:top-1/2 lg:-translate-y-1/2 lg:z-10" />
                            <select
                                value={filterPriority}
                                onChange={(e) => setFilterPriority(e.target.value)}
                                className="absolute inset-0 opacity-0 lg:opacity-100 lg:static lg:bg-transparent lg:border-none lg:pl-8 lg:pr-4 lg:w-full lg:h-full text-zinc-400 cursor-pointer lg:text-[11px] lg:font-bold lg:uppercase lg:tracking-wider appearance-none focus:outline-none"
                            >
                                <option value="" className="bg-zinc-900">Priority</option>
                                {Object.entries(priorityMapping).map(([key, value]) => <option key={key} value={key} className="bg-zinc-900">{value}</option>)}
                            </select>
                         </div>
                    </div>

                     <div className="relative group flex-shrink-0">
                         <div className="h-9 lg:h-11 w-9 lg:w-36 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center lg:justify-start lg:pl-3 relative overflow-hidden focus-within:outline-none focus-within:bg-white/10 focus-within:border-white/20 transition-all">
                            <FiFilter className="text-zinc-500 group-hover:text-[var(--pastel-indigo)] transition-colors w-3.5 h-3.5 lg:absolute lg:left-3 lg:top-1/2 lg:-translate-y-1/2 lg:z-10" />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="absolute inset-0 opacity-0 lg:opacity-100 lg:static lg:bg-transparent lg:border-none lg:pl-8 lg:pr-4 lg:w-full lg:h-full text-zinc-400 cursor-pointer lg:text-[11px] lg:font-bold lg:uppercase lg:tracking-wider appearance-none focus:outline-none"
                            >
                                <option value="" className="bg-zinc-900">Status</option>
                                {Object.entries(statusMapping).map(([key, value]) => <option key={key} value={key} className="bg-zinc-900">{value}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center space-x-1 bg-white/5 p-1 h-9 lg:h-11 rounded-xl border border-white/10 flex-shrink-0 ml-auto">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-1.5 lg:p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            <FiList className="w-4 h-4 lg:w-5 lg:h-5"/>
                        </button>
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={`p-1.5 lg:p-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            <FiGrid className="w-4 h-4 lg:w-5 lg:h-5"/>
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
                    tasks={filteredTasks}
                    users={users}
                    projects={projects}
                    updateTask={handleUpdate}
                    deleteTask={handleDelete}
                />
            ) : (
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between gap-4 overflow-x-auto pb-1 scrollbar-hide">
                         <div className="flex items-center gap-1 bg-white/5 p-1 w-fit rounded-xl border border-white/10 flex-shrink-0">
                            <button
                                onClick={() => setTableTab('active')}
                                className={`px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg text-[10px] lg:text-xs font-bold uppercase tracking-wider transition-all ${tableTab === 'active' ? 'bg-emerald-500 text-zinc-950 shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                Active
                            </button>
                        <button
                            onClick={() => setTableTab('done')}
                            className={`px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg text-[10px] lg:text-xs font-bold uppercase tracking-wider transition-all ${tableTab === 'done' ? 'bg-emerald-500 text-zinc-950 shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            Done
                        </button>
                    </div>
                </div>

                    <div className="glass rounded-2xl overflow-hidden flex flex-col">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <caption className="sr-only">Tasks table</caption>
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/5 text-left">
                                        <th scope="col" className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest whitespace-nowrap sticky left-0 z-20 bg-zinc-950/90 backdrop-blur-md border-r border-white/5">Name</th>
                                        <th scope="col" className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest whitespace-nowrap hidden lg:table-cell">Description</th>
                                        <th scope="col" className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest whitespace-nowrap">Due Date</th>
                                        <th scope="col" className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest whitespace-nowrap">QA/Review</th>
                                        <th scope="col" className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest whitespace-nowrap">Depends On</th>
                                        <th scope="col" className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest whitespace-nowrap hidden md:table-cell">Owner</th>
                                        <th scope="col" className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest whitespace-nowrap hidden sm:table-cell">Priority</th>
                                        <th scope="col" className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest whitespace-nowrap hidden lg:table-cell">Assignee</th>
                                        <th scope="col" className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest whitespace-nowrap hidden md:table-cell">Project</th>
                                        <th scope="col" className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest whitespace-nowrap">Status</th>
                                        <th scope="col" className="px-6 py-4 text-right text-[10px] font-bold text-zinc-500 uppercase tracking-widest whitespace-nowrap sticky right-0 z-20 bg-zinc-950/90 backdrop-blur-md border-l border-white/5">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    <AnimatePresence initial={false} mode="wait">
                                        {filteredTasks.map((task, index) => (
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
                                                ref={index === filteredTasks.length - 1 ? lastTaskElementRef : null}
                                            />
                                        ))}
                                        {isAddingTask && (
                                            <motion.tr 
                                                initial={{ opacity: 0, y: -20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                                className="bg-white/5"
                                            >
                                                <td className="px-4 py-2 sticky left-0 z-10 bg-zinc-950/90 backdrop-blur-md border-r border-white/5">
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
                                                        formData.append('qa_required', newQARequired.toString());
                                                        formData.append('review_required', newReviewRequired.toString());
                                                        if (newDependsOn) {
                                                            formData.append('depends_on_id', newDependsOn.toString());
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
                                                <td className="px-4 py-2 bg-white/5">
                                                    <input
                                                        type="text"
                                                        name="description"
                                                        placeholder="Description"
                                                        form="create-task-form"
                                                        className="w-full bg-white/10 border border-white/10 rounded-xl focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 px-3 py-2 text-white placeholder:text-zinc-600 text-xs transition-all"
                                                        onChange={() => setIsDirty(true)}
                                                    />
                                                </td>
                                                <td className="px-4 py-2 bg-white/5">
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
                                                <td className="px-4 py-2 bg-white/5">
                                                    <div className="flex items-center gap-4">
                                                        <label className="flex items-center gap-2 cursor-pointer group">
                                                            <div className="relative flex items-center">
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={newQARequired}
                                                                    onChange={(e) => { setNewQARequired(e.target.checked); setIsDirty(true); }}
                                                                    className="peer h-4 w-4 appearance-none rounded border border-white/20 bg-white/5 checked:bg-purple-500/40 checked:border-purple-400 transition-all"
                                                                />
                                                                <FiCheck className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-purple-400 opacity-0 peer-checked:opacity-100 transition-opacity" />
                                                            </div>
                                                            <span className="text-[10px] font-bold text-zinc-500 group-hover:text-purple-400 transition-colors uppercase tracking-widest">QA</span>
                                                        </label>
                                                        <label className="flex items-center gap-2 cursor-pointer group">
                                                            <div className="relative flex items-center">
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={newReviewRequired}
                                                                    onChange={(e) => { setNewReviewRequired(e.target.checked); setIsDirty(true); }}
                                                                    className="peer h-4 w-4 appearance-none rounded border border-white/20 bg-white/5 checked:bg-blue-500/40 checked:border-blue-400 transition-all"
                                                                />
                                                                <FiCheck className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-blue-400 opacity-0 peer-checked:opacity-100 transition-opacity" />
                                                            </div>
                                                            <span className="text-[10px] font-bold text-zinc-500 group-hover:text-blue-400 transition-colors uppercase tracking-widest">Review</span>
                                                        </label>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2 bg-white/5">
                                                    <Combobox
                                                        options={optimisticTasks.filter(t => t.id > 0).map(t => ({ value: t.id, label: t.name }))}
                                                        value={newDependsOn || ''}
                                                        onChange={(val) => { setNewDependsOn(val as number | null); setIsDirty(true); }}
                                                        placeholder="Depends on..."
                                                        className="w-full"
                                                    />
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
                                                <td className="px-4 py-2 text-right text-xs font-medium sticky right-0 z-10 bg-zinc-950/90 backdrop-blur-md border-l border-white/5">
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
                                            </motion.tr>
                                        )}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                        {isLoadingMore && (
                            <div className="p-4 flex items-center justify-center border-t border-white/5 bg-white/5">
                                <div className="h-5 w-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                <span className="ml-3 text-xs text-zinc-400 font-bold uppercase tracking-widest">Hydrating data stream...</span>
                            </div>
                        )}
                        {!isAddingTask && (
                            <div className="p-4 border-t border-white/5 bg-zinc-900/10">
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
                </div>
            )}
        </div>
    );
}
