'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Project, statusMapping, priorityMapping } from '@/types/project';
import { User } from '@/types/user';
import { Client } from '@/types/client';
import { FiEdit2, FiTrash2, FiClock, FiCheck, FiX, FiDollarSign } from 'react-icons/fi';
import { format } from 'date-fns';
import { createProject, updateProject, deleteProject } from '@/app/projects/actions';
import { updateTask, deleteTask, createTask } from '@/app/tasks/actions';
import UserAvatarGroup from '@/components/ui/user-avatar-group';
import TaskCard from '@/components/ui/tasks/task-card';
import { FiChevronRight, FiChevronDown, FiPlus, FiPieChart } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface ProjectTableProps {
  projects: Project[];
  users: User[];
  clients: Client[];
  onSelectProject?: (project: Project) => void;
}

export function ProjectTable({ projects, users, clients, onSelectProject }: ProjectTableProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  const [addingTaskId, setAddingTaskId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Combobox state

  
  const newNameRef = useRef<HTMLInputElement | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const startEditing = (project: Project) => {
    setEditingId(project.id);
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  useEffect(() => {
    if (isAdding && newNameRef.current) {
      setTimeout(() => newNameRef.current?.focus(), 0);
    }
  }, [isAdding]);

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    try {
      const formData = new FormData(event.currentTarget);
      const name = formData.get('name') as string;
      
      if (!name || name.trim().length === 0) {
        throw new Error('Project name is required');
      }

      formData.set('id', editingId!.toString());
      const result = await updateProject(formData);
      if (result?.error) {
        throw new Error(result.error);
      }
      toast.success('Project updated successfully');
      setEditingId(null);
    } catch (err: any) {
      const msg = err.message || 'Failed to update project';
      toast.error(msg);
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      const name = formData.get('name') as string;
      
      if (!name || name.trim().length === 0) {
        throw new Error('Project name is required');
      }

      const result = await createProject(formData);
      if (result?.error) {
        throw new Error(result.error);
      }
      toast.success('Project created successfully');
      setIsAdding(false);
    } catch (err: any) {
      const msg = err.message || 'Failed to create project';
      toast.error(msg);
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (project: Project) => {
    if (confirm('Are you sure you want to delete this project?')) {
      const formData = new FormData();
      formData.set('id', project.id.toString());
      await deleteProject(formData);
    }
  };

  const statusColors = {
    planning: "bg-white/5 text-zinc-400 border-white/10",
    in_progress: "bg-[var(--pastel-blue)]/10 text-[var(--pastel-blue)] border-[var(--pastel-blue)]/20",
    completed: "bg-[var(--pastel-emerald)]/10 text-[var(--pastel-emerald)] border-[var(--pastel-emerald)]/20",
    on_hold: "bg-[var(--pastel-amber)]/10 text-[var(--pastel-amber)] border-[var(--pastel-amber)]/20",
  };

  const priorityColors = {
    low: "text-zinc-400",
    medium: "text-amber-400",
    high: "text-rose-400",
  };

  const calculateCompletion = (project: Project) => {
    if (!project.tasks || project.tasks.length === 0) return 0;
    const completed = project.tasks.filter(t => t.status === 'completed').length;
    return (completed / project.tasks.length) * 100;
  };

  const CircularProgress = ({ percentage, size = 32, status }: { percentage: number; size?: number; status: Project['status'] }) => {
    const radius = (size / 2) - 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    
    const colorClass = 
      status === 'completed' ? 'text-[var(--pastel-emerald)]' : 
      status === 'in_progress' ? 'text-[var(--pastel-blue)]' : 
      'text-zinc-500';

    return (
      <div className="relative inline-flex items-center justify-center shrink-0">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="2.5"
            fill="transparent"
            className="text-white/5"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="2.5"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={`${colorClass} transition-all duration-700 ease-in-out`}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute text-[9px] font-black text-white/90">{Math.round(percentage)}%</span>
      </div>
    );
  };

  return (
    <div className="w-full space-y-4">
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
          {error}
        </div>
      )}
      <div className="glass rounded-2xl overflow-x-auto border border-white/5 bg-zinc-900/30">
      <table className="w-full text-left text-sm min-w-[1400px]">
        <thead className="bg-white/5 border-b border-white/5">
          <tr>
            <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Project</th>
            <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">Progress</th>
            <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Key</th>
            <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Status</th>
            <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Priority</th>
            <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Owner</th>
            <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Client</th>
            <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Timeline</th>
            <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Budget</th>
            <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {projects.map((project) => {
            const isEditing = editingId === project.id;
            const owner = users.find(u => u.id === project.ownerId);
            const client = clients.find(c => c.id === project.clientId);

            if (isEditing) {
              return (
                <React.Fragment key={project.id}>
                <tr className="bg-white/[0.02]">
                  <td colSpan={10} className="p-0">
                    <form onSubmit={handleUpdate} className="contents">
                      <table className="w-full">
                        <tbody>
                          <tr>
                            <td className="px-4 py-2 w-[200px]">
                              <input
                                type="text"
                                name="name"
                                defaultValue={project.name}
                                required
                                className="w-full bg-zinc-900/50 border border-white/10 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                              />
                            </td>
                            <td className="px-4 py-2 w-[100px]">
                              <input
                                type="text"
                                name="key"
                                defaultValue={project.key || ''}
                                className="w-full bg-zinc-900/50 border border-white/10 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                              />
                            </td>
                            <td className="px-4 py-2 w-[120px]">
                              <select
                                name="status"
                                defaultValue={project.status}
                                className="w-full bg-zinc-900/50 border border-white/10 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                              >
                                <option value="planning">Planning</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="on_hold">On Hold</option>
                              </select>
                            </td>
                            <td className="px-4 py-2 w-[100px]">
                              <select
                                name="priority"
                                defaultValue={project.priority}
                                className="w-full bg-zinc-900/50 border border-white/10 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                              >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                              </select>
                            </td>
                            <td className="px-4 py-2 w-[120px]">
                              <select
                                name="ownerId"
                                defaultValue={project.ownerId || ''}
                                className="w-full bg-zinc-900/50 border border-white/10 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                              >
                                <option value="">None</option>
                                {users.map(u => (
                                  <option key={u.id} value={u.id}>{u.fullName}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-2 w-[120px]">
                              <select
                                name="clientId"
                                defaultValue={project.clientId || ''}
                                className="w-full bg-zinc-900/50 border border-white/10 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                              >
                                <option value="">None</option>
                                {clients.map(c => (
                                  <option key={c.id} value={c.id}>{c.companyName}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-2 w-[110px]">
                              <input
                                type="date"
                                name="startDate"
                                defaultValue={project.startDate || ''}
                                className="w-full bg-zinc-900/50 border border-white/10 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                              />
                            </td>
                            <td className="px-4 py-2 w-[110px]">
                              <input
                                type="date"
                                name="endDate"
                                defaultValue={project.endDate || ''}
                                className="w-full bg-zinc-900/50 border border-white/10 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                              />
                            </td>
                            <td className="px-4 py-2 w-[140px]">
                              <input
                                type="number"
                                name="budget"
                                defaultValue={project.budget || ''}
                                className="w-full bg-zinc-900/50 border border-white/10 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                                placeholder="0"
                              />
                            </td>
                            <td className="px-4 py-2 w-[80px]">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="submit"
                                  disabled={isSubmitting}
                                  className="p-1 rounded hover:bg-emerald-500/10 text-emerald-400 transition-colors disabled:opacity-50"
                                  title="Save"
                                >
                                  {isSubmitting ? (
                                    <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <FiCheck className="w-4 h-4" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEditing}
                                  className="p-1 rounded hover:bg-rose-500/10 text-rose-400 transition-colors"
                                  title="Cancel"
                                >
                                  <FiX className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </form>
                  </td>
                </tr>
                </React.Fragment>
              );
            }

            return (
              <React.Fragment key={project.id}>
              <tr 
                className={`group hover:bg-white/5 transition-colors items-center cursor-pointer ${expandedIds.includes(project.id) ? 'bg-white/[0.03]' : ''}`}
                onClick={() => router.push(`/projects/${project.id}`)}
              >
                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full ${statusColors[project.status].split(' ')[1].replace('text-', 'bg-')}`} />
                    <div className="font-black text-white text-sm tracking-tight truncate group-hover:text-[var(--pastel-indigo)] transition-colors">{project.name}</div>
                  </div>
                </td>
                <td className="px-6 py-3 text-center">
                    <CircularProgress percentage={calculateCompletion(project)} size={32} status={project.status} />
                </td>
                <td className="px-6 py-3">
                  {project.key && (
                    <div className="px-2 py-0.5 rounded-md text-[9px] font-black font-mono text-zinc-500 bg-white/5 border border-white/10 uppercase tracking-widest inline-block">
                      {project.key}
                    </div>
                  )}
                </td>
                <td className="px-6 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${statusColors[project.status]}`}>
                    {statusMapping[project.status]}
                  </span>
                </td>
                <td className="px-6 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${
                    project.priority === 'high' ? 'bg-[var(--pastel-rose)]/10 text-[var(--pastel-rose)] border-[var(--pastel-rose)]/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]' :
                    project.priority === 'medium' ? 'bg-[var(--pastel-amber)]/10 text-[var(--pastel-amber)] border-[var(--pastel-amber)]/20' :
                    'bg-[var(--pastel-emerald)]/10 text-[var(--pastel-emerald)] border-[var(--pastel-emerald)]/20'
                  }`}>
                    {priorityMapping[project.priority]}
                  </span>
                </td>
                <td className="px-6 py-3">
                  {owner ? (
                    <div className="flex items-center gap-2">
                      <UserAvatarGroup users={[owner]} size="sm" limit={1} />
                      <span className="text-[10px] font-bold text-zinc-400 group-hover:text-zinc-200 transition-colors uppercase tracking-tight">{owner.fullName}</span>
                    </div>
                  ) : '-'}
                </td>
                <td className="px-6 py-3">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight group-hover:text-zinc-200 transition-colors">
                    {client ? client.companyName : <span className="text-zinc-600 italic">No Client</span>}
                  </span>
                </td>
                <td className="px-6 py-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-black text-white/80 uppercase tracking-tighter">
                      {project.startDate ? format(new Date(project.startDate), "MMM dd") : '-'}
                    </span>
                    <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
                      {project.endDate ? `UNTIL ${format(new Date(project.endDate), "MMM dd, yyyy")}` : '-'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-3">
                  {project.budget ? (
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-white tracking-tight uppercase">
                        ${project.budget.toLocaleString()}
                      </span>
                      <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">
                        {project.currency}
                      </span>
                    </div>
                  ) : <span className="text-zinc-600 italic text-[10px]">-</span>}
                </td>
                <td className="px-6 py-3 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <button
                      onClick={(e) => { e.stopPropagation(); startEditing(project); }}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/5 transition-all"
                      title="Edit"
                    >
                      <FiEdit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(project); }}
                      className="p-2 rounded-xl bg-red-500/5 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 border border-white/5 hover:border-red-500/20 transition-all"
                      title="Delete"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="p-2 rounded-xl bg-white/5 text-zinc-500">
                      <FiChevronRight className={`w-4 h-4 transition-transform duration-300 ${expandedIds.includes(project.id) ? 'rotate-90 text-[var(--pastel-indigo)]' : ''}`} />
                    </div>
                  </div>
                </td>
              </tr>
              {expandedIds.includes(project.id) && (
                <tr className="bg-white/[0.02]">
                  <td colSpan={10} className="p-0 border-none">
                    <div className="sticky left-0 p-6 pl-12 bg-zinc-900/30 border-y border-white/5 w-full">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Tasks ({project.tasks?.length || 0})</h4>
                        <button 
                          onClick={() => setAddingTaskId(addingTaskId === project.id ? null : project.id)}
                          className="flex items-center gap-1 text-[10px] font-medium text-zinc-400 hover:text-white transition-all px-2 py-1 rounded bg-white/5 hover:bg-white/10"
                        >
                          <FiPlus className="w-3 h-3" />
                          <span>Add Task</span>
                        </button>
                      </div>

                      {addingTaskId === project.id && (
                        <div className="mb-4 p-4 rounded-xl bg-white/5 border border-indigo-500/20 animate-in fade-in slide-in-from-top-2">
                           <form onSubmit={async (e) => {
                             e.preventDefault();
                             const formData = new FormData(e.currentTarget);
                             formData.set('projectId', project.id.toString());
                             
                             // Handle assignees if I add them below
                             const assignees = e.currentTarget.dataset.assignees;
                             if (assignees) formData.set('assigneeIds', assignees);
                             
                             if (!formData.get('status')) formData.set('status', 'task');
                             
                             setIsSubmitting(true);
                             try {
                               const result = await createTask(formData);
                               if (result?.success) {
                                 toast.success('Task created successfully');
                                 setAddingTaskId(null);
                               } else {
                                 toast.error(result?.error || 'Failed to create task');
                               }
                             } catch (err) {
                               toast.error('An unexpected error occurred');
                             } finally {
                               setIsSubmitting(false);
                             }
                           }}
                           className="space-y-4"
                           >
                             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                               <div className="md:col-span-2">
                                 <input 
                                   type="text" 
                                   name="name" 
                                   placeholder="Task Name *" 
                                   required 
                                   className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                                 />
                               </div>
                               <div>
                                 <select 
                                   name="priority" 
                                   defaultValue="medium"
                                   className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 appearance-none cursor-pointer"
                                 >
                                   <option value="low">Low Priority</option>
                                   <option value="medium">Medium Priority</option>
                                   <option value="high">High Priority</option>
                                 </select>
                               </div>
                               <div>
                                 <input 
                                   type="date" 
                                   name="dueDate" 
                                   className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:invert"
                                 />
                               </div>
                             </div>
                             <div className="flex items-center gap-4">
                               <div className="flex-1">
                                 <textarea 
                                   name="description" 
                                   placeholder="Add a description..." 
                                   rows={1}
                                   className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-none"
                                 />
                               </div>
                               <div className="flex gap-2">
                                 <button 
                                   type="submit" 
                                   disabled={isSubmitting}
                                   className="px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all font-medium text-sm flex items-center gap-2 border border-emerald-500/20 disabled:opacity-50"
                                 >
                                   {isSubmitting ? (
                                     <div className="h-3.5 w-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                                   ) : (
                                     <FiCheck className="w-4 h-4" />
                                   )}
                                   <span>{isSubmitting ? 'Creating...' : 'Create'}</span>
                                 </button>
                                 <button type="button" onClick={() => setAddingTaskId(null)} className="px-3 py-2 rounded-lg bg-white/5 text-zinc-400 hover:text-white transition-all text-sm border border-white/5">
                                   <FiX className="w-4 h-4" />
                                 </button>
                               </div>
                             </div>
                           </form>
                        </div>
                      )}

                      {project.tasks && project.tasks.length > 0 ? (
                        <div className="overflow-x-auto rounded-lg border border-white/5 bg-zinc-900/50">
                            <table className="w-full text-left text-sm min-w-[1000px]">
                                <thead className="bg-white/5 text-zinc-500 font-bold text-[10px] uppercase tracking-wider">
                                    <tr>
                                        <th className="px-4 py-2">Name</th>
                                        <th className="px-4 py-2">Description</th>
                                        <th className="px-4 py-2">Due Date</th>
                                        <th className="px-4 py-2">Priority</th>
                                        <th className="px-4 py-2">Assignee</th>
                                        {/* Project hidden */}
                                        <th className="px-4 py-2">Status</th>
                                        <th className="px-4 py-2 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {project.tasks?.map(task => (
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
                        !addingTaskId && <div className="text-sm text-zinc-500 italic py-2">No tasks found for this project.</div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
              </React.Fragment>
            );
          })}

          {/* Add New Row */}
          {isAdding && (
            <tr className="bg-white/[0.02]">
              <td colSpan={10} className="p-0">
                <form onSubmit={handleCreate} className="contents">
                  <table className="w-full">
                    <tbody>
                      <tr>
                        <td className="px-4 py-2 w-[200px]">
                          <input
                            ref={newNameRef}
                            type="text"
                            name="name"
                            required
                            placeholder="Project name"
                            className="w-full bg-zinc-900/50 border border-white/10 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 placeholder:text-zinc-600"
                          />
                        </td>
                        <td className="px-4 py-2 w-[100px]">
                          <input
                            type="text"
                            name="key"
                            placeholder="PROJ-123"
                            className="w-full bg-zinc-900/50 border border-white/10 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 placeholder:text-zinc-600"
                          />
                        </td>
                        <td className="px-4 py-2 w-[120px]">
                          <select
                            name="status"
                            defaultValue="planning"
                            className="w-full bg-zinc-900/50 border border-white/10 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                          >
                            <option value="planning">Planning</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="on_hold">On Hold</option>
                          </select>
                        </td>
                        <td className="px-4 py-2 w-[100px]">
                          <select
                            name="priority"
                            defaultValue="medium"
                            className="w-full bg-zinc-900/50 border border-white/10 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </td>
                        <td className="px-4 py-2 w-[120px]">
                          <select
                            name="ownerId"
                            className="w-full bg-zinc-900/50 border border-white/10 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                          >
                            <option value="">None</option>
                            {users.map(u => (
                              <option key={u.id} value={u.id}>{u.fullName}</option>
                            ))}
                          </select>
                        </td>

                        <td className="px-4 py-2 w-[120px]">
                          <select
                            name="clientId"
                            className="w-full bg-zinc-900/50 border border-white/10 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                          >
                            <option value="">None</option>
                            {clients.map(c => (
                              <option key={c.id} value={c.id}>{c.companyName}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-2 w-[110px]">
                          <input
                            type="date"
                            name="startDate"
                            className="w-full bg-zinc-900/50 border border-white/10 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                          />
                        </td>
                        <td className="px-4 py-2 w-[110px]">
                          <input
                            type="date"
                            name="endDate"
                            className="w-full bg-zinc-900/50 border border-white/10 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                          />
                        </td>
                        <td className="px-4 py-2 w-[140px]">
                          <input
                            type="number"
                            name="budget"
                            placeholder="0"
                            className="w-full bg-zinc-900/50 border border-white/10 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 placeholder:text-zinc-600"
                          />
                        </td>
                        <td className="px-4 py-2 w-[80px]">
                          <div className="flex items-center justify-end gap-1">
                            <button
                               type="submit"
                               disabled={isSubmitting}
                               className="p-1 rounded hover:bg-emerald-500/10 text-emerald-400 transition-colors disabled:opacity-50"
                               title="Save"
                             >
                               {isSubmitting ? (
                                 <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                               ) : (
                                 <FiCheck className="w-4 h-4" />
                               )}
                             </button>
                            <button
                              type="button"
                              onClick={() => setIsAdding(false)}
                              className="p-1 rounded hover:bg-rose-500/10 text-rose-400 transition-colors"
                              title="Cancel"
                            >
                              <FiX className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </form>
              </td>
            </tr>
          )}

          {/* Add Button Row */}
          {!isAdding && (
            <tr className="sticky bottom-0 z-10">
              <td colSpan={10} className="px-4 py-3 sticky left-0">
                <button
                  onClick={() => setIsAdding(true)}
                  className="flex items-center gap-2 p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-sm text-zinc-400 hover:text-white transition-all duration-200 group w-fit"
                >
                  <div className="p-1 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                    <FiPlus className="w-4 h-4" />
                  </div>
                  <span className="pr-2">Add project</span>
                </button>
              </td>
            </tr>
          )}

          {projects.length === 0 && !isAdding && (
            <tr>
              <td colSpan={10} className="px-6 py-12 text-center text-zinc-500">
                No projects found. Click &quot;Add project&quot; to create one.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
    </div>
  );
}
