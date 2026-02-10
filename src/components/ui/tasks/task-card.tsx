"use client";

import React, { useState } from "react";
import { Task } from "@/types/task";
import { FiCheck, FiX, FiEdit2, FiTrash2 } from "react-icons/fi";
import UserAvatarGroup from '@/components/ui/user-avatar-group';
import { format } from 'date-fns';
import { Combobox } from "@/components/ui/combobox";
import { CustomDatePicker } from "@/components/ui/inputs/custom-date-picker";

import { User } from "@/types/user";
import { Project } from "@/types/project";

import toast from "react-hot-toast";

interface TaskCardProps {
    task: Task;
    users?: User[];
    projects?: Project[];
    updateTask?: (formData: FormData) => Promise<{ success: boolean; error?: string } | undefined>;
    deleteTask?: (formData: FormData) => Promise<{ success: boolean; error?: string } | undefined>;
    hideProject?: boolean;
    isEditing?: boolean;
    onEdit?: () => void;
    onCancel?: () => void;
}

export default function TaskCard({ 
    task, 
    users = [], 
    projects = [], 
    updateTask = async () => ({ success: true }), 
    deleteTask = async () => ({ success: true }),
    hideProject = false,
    isEditing = false,
    onEdit = () => {},
    onCancel = () => {}
}: TaskCardProps) {
    const [selectedAssignees, setSelectedAssignees] = useState<(string | number)[]>(
      task.assignees?.map(a => a.user.id) || []
    );
    const [selectedProject, setSelectedProject] = useState<string | number | null>(
      task.projectId || null
    );
    const [dueDate, setDueDate] = useState<Date | null>(
        task.dueDate ? new Date(task.dueDate) : null
    );
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const formRef = React.useRef<HTMLFormElement>(null);

    // Sync state when not editing (in case of background updates)
    React.useEffect(() => {
        if (!isEditing) {
            setSelectedAssignees(task.assignees?.map(a => a.user.id) || []);
            setSelectedProject(task.projectId || null);
            setDueDate(task.dueDate ? new Date(task.dueDate) : null);
        }
    }, [task, isEditing]);

    const displayAssignees = React.useMemo(() => {
        if (task.assignees && task.assignees.length > 0) return task.assignees.map(a => a.user);
        if (!task.assigneeIds || task.assigneeIds.length === 0) return [];
        return users.filter(u => task.assigneeIds?.includes(u.id));
    }, [task.assignees, task.assigneeIds, users]);

    const handleUpdateSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
      if (e) e.preventDefault();
      
      // Get form data from ref
      if (!formRef.current) return;
      const formData = new FormData(formRef.current);
      
      // Manually append state values to FormData
      if (selectedAssignees.length > 0) {
        formData.append('assigneeIds', JSON.stringify(selectedAssignees));
      } else {
        formData.append('assigneeIds', JSON.stringify([]));
      }

      if (selectedProject) {
        formData.append('projectId', selectedProject.toString());
      } else {
        formData.append('projectId', '');
      }
      
      setIsUpdating(true);
      try {
        const result = await updateTask(formData);
        if (result?.success) {
            toast.success("Task updated successfully");
            onCancel();
        } else {
            toast.error(result?.error || "Failed to update task");
        }
      } catch (error) {
        toast.error("An unexpected error occurred");
        console.error(error);
      } finally {
        setIsUpdating(false);
      }
    };

    const handleSubmitClick = async () => {
      await handleUpdateSubmit();
    };

    const handleStatusToggle = async () => {
      const formData = new FormData();
      formData.append("id", task.id.toString());
      formData.append("status", task.status === "completed" ? "in_progress" : "completed");
      const result = await updateTask(formData);
      if (result?.success) {
        toast.success(`Task marked as ${task.status === "completed" ? "in progress" : "completed"}`);
      } else {
        toast.error(result?.error || "Failed to update status");
      }
    };

    const rowClasses = "border-b border-white/5";

    return isEditing ? (
      <tr className={rowClasses}>
        <td className="px-4 py-2 text-xs font-medium text-white whitespace-nowrap">
          <form
            ref={formRef}
            id={`update-${task.id}`}
            onSubmit={handleUpdateSubmit}
            method="post"
            style={{ display: "none" }}
          ></form>
          <input className="text-white" form={`update-${task.id}`} type="hidden" name="id" value={task.id} />
            <input
              form={`update-${task.id}`}
              type="text"
              name="name"
              defaultValue={task.name}
              disabled={isUpdating}
              className="w-full bg-white/5 border border-white/10 rounded-xl focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 px-3 py-1.5 text-white placeholder:text-zinc-600 text-xs transition-all disabled:opacity-50"
            />
          </td>
          <td className="px-4 py-2 text-xs text-zinc-400 whitespace-nowrap">
            <input
              form={`update-${task.id}`}
              type="text"
              name="description"
              defaultValue={task.description || ''}
              disabled={isUpdating}
              className="w-full bg-white/5 border border-white/10 rounded-xl focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 px-3 py-1.5 text-white placeholder:text-zinc-600 text-xs transition-all disabled:opacity-50"
            />
          </td>
          <td className="px-4 py-2 text-[10px] text-zinc-400 whitespace-nowrap min-w-[120px]">
            <CustomDatePicker
                value={dueDate}
                onChange={setDueDate}
                name="dueDate"
                form={`update-${task.id}`}
                className="w-full"
                placeholder="Due date"
                disabled={isUpdating}
            />
          </td>
          <td className="px-4 py-2 text-xs text-zinc-400 whitespace-nowrap">
              {/* Owner cannot be changed during edit, just display it */}
             {task.owner ? (
                <div className="flex items-center gap-2">
                     {task.owner.avatarUrl ? (
                        <img src={task.owner.avatarUrl} alt={task.owner.fullName || ''} className="w-5 h-5 rounded-full" />
                    ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-white">
                            {(task.owner.fullName || task.owner.email || '?')[0].toUpperCase()}
                        </div>
                    )}
                    <span className="text-xs">{task.owner.fullName || task.owner.email}</span>
                </div>
            ) : <span className="text-xs text-zinc-600">-</span>}
          </td>
          <td className="px-4 py-2 text-xs text-zinc-400 whitespace-nowrap">
            <select
              form={`update-${task.id}`}
              name="priority"
              defaultValue={task.priority}
              disabled={isUpdating}
              className="w-full bg-white/5 border border-white/10 rounded-xl focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 px-3 py-1.5 text-white text-xs appearance-none cursor-pointer transition-all disabled:opacity-50"
            >
              <option value="low" className="bg-zinc-900">Low</option>
              <option value="medium" className="bg-zinc-900">Medium</option>
              <option value="high" className="bg-zinc-900">High</option>
            </select>
          </td>
          <td className="px-4 py-2 text-xs text-zinc-400 whitespace-nowrap min-w-[200px]">
            <Combobox
              options={users.map(u => ({ value: u.id, label: u.fullName || u.email, subLabel: u.email }))}
              value={selectedAssignees}
              onChange={(val) => setSelectedAssignees(val as (string | number)[])}
              multiple
              placeholder="Assign..."
              searchPlaceholder="Search users..."
              className="w-full"
            />
          </td>
          {!hideProject && (
            <td className="px-4 py-2 text-xs text-zinc-400 whitespace-nowrap min-w-[150px]">
              <Combobox
                options={projects.map(p => ({ value: p.id, label: p.name, subLabel: p.key || undefined }))}
                value={selectedProject || ''}
                onChange={(val) => setSelectedProject(val as string | number | null)}
                placeholder="Project..."
                searchPlaceholder="Search projects..."
                className="w-full"
              />
            </td>
          )}
          <td className="px-4 py-2 text-xs text-zinc-400 whitespace-nowrap">
            <select
              form={`update-${task.id}`}
              name="status"
              defaultValue={task.status}
              disabled={isUpdating}
              className="w-full bg-white/5 border border-white/10 rounded-xl focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 px-3 py-1.5 text-white text-xs appearance-none cursor-pointer transition-all disabled:opacity-50"
            >
              <option value="task" className="bg-zinc-900">To Do</option>
              <option value="in_progress" className="bg-zinc-900">In Progress</option>
              <option value="completed" className="bg-zinc-900">Completed</option>
            </select>
          </td>
          <td className="px-4 py-2 text-xs font-medium text-right whitespace-nowrap">
            <div className="flex items-center justify-end space-x-2">
                <button
                    type="button"
                    onClick={handleSubmitClick}
                    disabled={isUpdating}
                    className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors disabled:opacity-50 min-w-[30px] flex items-center justify-center"
                >
                    {isUpdating ? (
                      <div className="h-3.5 w-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <FiCheck className="w-4 h-4" />
                    )}
                </button>
                <button
                type="button"
                onClick={onCancel}
                className="p-1.5 bg-white/5 text-zinc-400 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
                >
                <FiX className="w-3 h-3" />
                </button>
            </div>
          </td>
        </tr>
    ) : (
      <tr className={`${rowClasses} hover:bg-white/5 transition-colors group items-center`}>
        <td className="px-6 py-4 text-xs font-medium text-white whitespace-nowrap flex items-center">
          <div className="relative flex items-center shrink-0">
            <input
              type="checkbox"
              checked={task.status === "completed"}
              onChange={() => { void handleStatusToggle(); }}
              className="peer h-4 w-4 cursor-pointer appearance-none rounded-md border border-white/20 bg-white/5 checked:border-[var(--pastel-emerald)] checked:bg-[var(--pastel-emerald)]/20 transition-all hover:border-[var(--pastel-emerald)]/50 focus:outline-none ring-offset-zinc-950 focus:ring-2 focus:ring-[var(--pastel-emerald)]/20"
            />
            <FiCheck className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[var(--pastel-emerald)] opacity-0 peer-checked:opacity-100 transition-opacity w-3 h-3" />
          </div>
          <span className={`ml-4 truncate max-w-[250px] font-bold tracking-tight ${task.status === "completed" ? "line-through text-zinc-500" : "text-zinc-100"}`}>
            {task.name}
          </span>
        </td>
        <td className="px-4 py-2 text-xs text-zinc-400 whitespace-nowrap max-w-[300px] truncate">
          {task.description || <span className="text-zinc-600 italic">No description</span>}
        </td>
        <td className="px-6 py-4 text-xs text-zinc-400 whitespace-nowrap">
          {task.dueDate ? format(new Date(task.dueDate as string), "MMM dd, yyyy") : <span className="text-zinc-600">-</span>}
        </td>
        <td className="px-6 py-4 text-xs text-zinc-400 whitespace-nowrap">
            {task.owner ? (
                <div className="flex items-center gap-2">
                     {task.owner.avatarUrl ? (
                        <img src={task.owner.avatarUrl} alt={task.owner.fullName || ''} className="w-5 h-5 rounded-full" />
                    ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-white">
                            {(task.owner.fullName || task.owner.email || '?')[0].toUpperCase()}
                        </div>
                    )}
                    <span className="text-xs">{task.owner.fullName || task.owner.email}</span>
                </div>
            ) : <span className="text-xs text-zinc-600">-</span>}
        </td>
        <td className="px-6 py-4 text-xs whitespace-nowrap">
          <span
            className={`px-3 py-1 inline-flex text-[10px] font-bold rounded-lg border uppercase tracking-wider ${
              task.priority === 'high'
                ? 'bg-[var(--pastel-rose)]/10 text-[var(--pastel-rose)] border-[var(--pastel-rose)]/20 pulse-soft'
                : task.priority === 'medium'
                ? 'bg-[var(--pastel-amber)]/10 text-[var(--pastel-amber)] border-[var(--pastel-amber)]/20'
                : 'bg-[var(--pastel-emerald)]/10 text-[var(--pastel-emerald)] border-[var(--pastel-emerald)]/20'
            }`}
          >
            {task.priority}
          </span>
        </td>
        <td className="px-4 py-2 text-xs text-zinc-400 whitespace-nowrap">
            {displayAssignees.length > 0 ? (
                <UserAvatarGroup users={displayAssignees} size="xs" limit={3} />
            ) : (
                <span className="text-zinc-600 italic">Unassigned</span>
            )}
        </td>
        <td className="px-6 py-4 text-xs text-zinc-400 whitespace-nowrap">
            {task.projectId ? (
                <span className="text-[var(--pastel-indigo)] font-bold uppercase tracking-tight text-[10px] bg-[var(--pastel-indigo)]/5 px-2 py-0.5 rounded-md border border-[var(--pastel-indigo)]/10">
                    {projects.find(p => p.id === task.projectId)?.name}
                </span>
            ) : (
                <span className="text-zinc-600 italic">No Project</span>
            )}
        </td>
        <td className="px-6 py-4 text-xs whitespace-nowrap">
          <span
            className={`px-3 py-1 inline-flex text-[10px] font-bold rounded-lg border uppercase tracking-wider ${
              task.status === 'completed'
                ? 'bg-[var(--pastel-emerald)]/10 text-[var(--pastel-emerald)] border-[var(--pastel-emerald)]/20'
                : task.status === 'in_progress'
                ? 'bg-[var(--pastel-blue)]/10 text-[var(--pastel-blue)] border-[var(--pastel-blue)]/20'
                : 'bg-white/5 text-zinc-400 border-white/10'
            }`}
          >
            {task.status.replace(/_/g, ' ')}
          </span>
        </td>
        <td className="px-4 py-2 text-xs font-medium text-right whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center justify-end space-x-1">
            <button
                type="button"
                onClick={onEdit}
                disabled={task.id < 0}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                title={task.id < 0 ? "Saving..." : "Edit"}
            >
                <FiEdit2 className="w-3.5 h-3.5" />
            </button>
            <form
                onSubmit={async (e) => {
                e.preventDefault();
                if (!confirm('Are you sure you want to delete this task?')) return;
                
                try {
                    const fd = new FormData(e.currentTarget);
                    const result = await deleteTask(fd);
                    if (result?.success) {
                        toast.success("Task deleted successfully");
                    } else {
                        toast.error(result?.error || "Failed to delete task");
                    }
                } catch (error) {
                    toast.error("An unexpected error occurred");
                } finally {
                    setIsDeleting(false);
                }
                }}
                style={{ display: 'inline' }}
            >
                <input type="hidden" name="id" value={task.id} />
                <button 
                  type="submit" 
                  disabled={task.id < 0 || isDeleting}
                  className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed" 
                  title={task.id < 0 ? "Saving..." : "Delete"}
                >
                    {isDeleting ? <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-red-400"></div> : <FiTrash2 className="w-3.5 h-3.5" />}
                </button>
            </form>
          </div>
        </td>
      </tr>
    );
}
