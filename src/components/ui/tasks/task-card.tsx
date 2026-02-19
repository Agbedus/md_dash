"use client";

import { motion } from "framer-motion";

import React, { useState } from "react";
import { Task } from "@/types/task";
import { FiCheck, FiX, FiEdit2, FiTrash2, FiPlay, FiPause, FiSquare, FiClock } from "react-icons/fi";
import UserAvatarGroup from '@/components/ui/user-avatar-group';
import { format } from 'date-fns';
import { Combobox } from "@/components/ui/combobox";
import { CustomDatePicker } from "@/components/ui/inputs/custom-date-picker";

import { User } from "@/types/user";
import { Project } from "@/types/project";

import toast from "react-hot-toast";
import { startTaskTimer, pauseTaskTimer, stopTaskTimer } from "@/app/tasks/actions";
import { useTaskTimer } from "@/providers/task-timer-provider";
import { canUserWorkOnTask } from "@/lib/task-auth";

interface TaskCardProps {
    task: Task;
    user?: User;
    users?: User[];
    projects?: Project[];
    updateTask?: (formData: FormData) => Promise<{ success: boolean; error?: string } | undefined>;
    deleteTask?: (formData: FormData) => Promise<{ success: boolean; error?: string } | undefined>;
    hideProject?: boolean;
    isEditing?: boolean;
    onEdit?: () => void;
    onCancel?: () => void;
}

const TaskCard = React.forwardRef<HTMLTableRowElement, TaskCardProps>(({ 
    task, 
    user: currentUser,
    users = [], 
    projects = [], 
    updateTask = async () => ({ success: true }), 
    deleteTask = async () => ({ success: true }),
    hideProject = false,
    isEditing = false,
    onEdit = () => {},
    onCancel = () => {}
}, ref) => {
    const { startTimer, activeTask } = useTaskTimer();
    const [selectedAssignees, setSelectedAssignees] = useState<(string | number)[]>(
      task.assignees?.map(a => a.user.id) || []
    );
    const [selectedProject, setSelectedProject] = useState<string | number | null>(
      task.projectId || null
    );
    const [dueDate, setDueDate] = useState<Date | null>(
        task.dueDate ? new Date(task.dueDate) : null
    );
    const [qaRequired, setQaRequired] = useState(task.qa_required);
    const [reviewRequired, setReviewRequired] = useState(task.review_required);
    const [dependsOn, setDependsOn] = useState<number | null>(task.depends_on_id);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const formRef = React.useRef<HTMLFormElement>(null);

    // Check if there's an active timer
    const hasActiveTimer = task.timeLogs?.some(log => log.is_active) || false;
    const totalHours = task.totalHours || 0;

    // Sync state when not editing (in case of background updates)
    React.useEffect(() => {
        if (!isEditing) {
            setSelectedAssignees(task.assignees?.map(a => a.user.id) || []);
            setSelectedProject(task.projectId || null);
            setDueDate(task.dueDate ? new Date(task.dueDate) : null);
            setQaRequired(task.qa_required);
            setReviewRequired(task.review_required);
            setDependsOn(task.depends_on_id);
        }
    }, [task, isEditing]);

    const displayAssignees = React.useMemo(() => {
        if (task.assignees && task.assignees.length > 0) return task.assignees.map(a => a.user);
        if (!task.assigneeIds || task.assigneeIds.length === 0) return [];
        return users.filter(u => task.assigneeIds?.includes(u.id));
    }, [task.assignees, task.assigneeIds, users]);

    const handleUpdateSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
      if (e) e.preventDefault();
      
      setIsUpdating(true);
      try {
        const formData = new FormData();
        formData.append("id", task.id.toString());
        
        // Gather from inputs that might be outside or inside
        const form = document.getElementById(`update-${task.id}`) as HTMLFormElement;
        if (form) {
            const nameInput = document.querySelector(`input[name="name"][form="update-${task.id}"]`) as HTMLInputElement;
            const descInput = document.querySelector(`input[name="description"][form="update-${task.id}"]`) as HTMLInputElement;
            const prioritySelect = document.querySelector(`select[name="priority"][form="update-${task.id}"]`) as HTMLSelectElement;
            const statusSelect = document.querySelector(`select[name="status"][form="update-${task.id}"]`) as HTMLSelectElement;

            if (nameInput) formData.append('name', nameInput.value);
            if (descInput) formData.append('description', descInput.value);
            if (prioritySelect) formData.append('priority', prioritySelect.value);
            if (statusSelect) formData.append('status', statusSelect.value);
        }
        
        // Gather from state
        formData.append('assigneeIds', JSON.stringify(selectedAssignees));
        formData.append('projectId', selectedProject ? selectedProject.toString() : '');
        formData.append('qa_required', qaRequired.toString());
        formData.append('review_required', reviewRequired.toString());
        formData.append('depends_on_id', dependsOn ? dependsOn.toString() : '');
        if (dueDate) {
            formData.append('dueDate', format(dueDate, 'yyyy-MM-dd'));
        } else {
            formData.append('dueDate', '');
        }
        
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
      formData.append("status", task.status === "DONE" ? "IN_PROGRESS" : "DONE");
      const result = await updateTask(formData);
      if (result?.success) {
        toast.success(`Task marked as ${task.status === "DONE" ? "in progress" : "completed"}`);
      } else {
        toast.error(result?.error || "Failed to update status");
      }
    };

    const rowClasses = "border-b border-white/5";

    const variants = {
       initial: { opacity: 0, y: 10 },
       animate: { opacity: 1, y: 0 },
       exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
       hover: { scale: 1.002, backgroundColor: "rgba(255, 255, 255, 0.03)" }
    };

    return isEditing ? (
      <motion.tr 
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={rowClasses} 
        ref={ref}
      >
        <td className="px-4 py-2 text-xs font-medium text-white whitespace-nowrap sticky left-0 z-10 bg-zinc-950/90 backdrop-blur-md border-r border-white/5">
          <form
            ref={formRef}
            id={`update-${task.id}`}
            onSubmit={handleUpdateSubmit}
            method="post"
            style={{ display: "none" }}
          ></form>
          <input className="text-white" form={`update-${task.id}`} type="hidden" name="id" value={task.id} />
          <input form={`update-${task.id}`} type="hidden" name="qa_required" value={task.qa_required ? 'true' : 'false'} />
          <input form={`update-${task.id}`} type="hidden" name="review_required" value={task.review_required ? 'true' : 'false'} />
          {task.depends_on_id && <input form={`update-${task.id}`} type="hidden" name="depends_on_id" value={task.depends_on_id} />}
          {dueDate && <input form={`update-${task.id}`} type="hidden" name="dueDate" value={format(dueDate, 'yyyy-MM-dd')} />}
          {selectedAssignees.length > 0 && <input form={`update-${task.id}`} type="hidden" name="assigneeIds" value={JSON.stringify(selectedAssignees)} />}
          {selectedProject && <input form={`update-${task.id}`} type="hidden" name="projectId" value={selectedProject.toString()} />}
            <input
              form={`update-${task.id}`}
              type="text"
              name="name"
              defaultValue={task.name}
              disabled={isUpdating}
              className="w-full bg-white/10 border border-white/20 rounded-xl focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 px-3 py-1.5 text-white placeholder:text-zinc-600 text-xs transition-all disabled:opacity-50"
            />
          </td>
          <td className="px-4 py-2 text-xs text-zinc-400 whitespace-nowrap bg-zinc-900/50">
            <input
              form={`update-${task.id}`}
              type="text"
              name="description"
              defaultValue={task.description || ''}
              disabled={isUpdating}
              className="w-full bg-white/10 border border-white/20 rounded-xl focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 px-3 py-1.5 text-white placeholder:text-zinc-600 text-xs transition-all disabled:opacity-50"
            />
          </td>
          <td className="px-4 py-2 text-[10px] text-zinc-400 whitespace-nowrap min-w-[120px] bg-zinc-900/50">
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
          <td className="px-4 py-2 text-xs text-zinc-400 whitespace-nowrap bg-zinc-900/50">
            <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex items-center">
                        <input 
                            type="checkbox" 
                            checked={qaRequired}
                            onChange={(e) => setQaRequired(e.target.checked)}
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
                            checked={reviewRequired}
                            onChange={(e) => setReviewRequired(e.target.checked)}
                            className="peer h-4 w-4 appearance-none rounded border border-white/20 bg-white/5 checked:bg-blue-500/40 checked:border-blue-400 transition-all"
                        />
                        <FiCheck className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-blue-400 opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-[10px] font-bold text-zinc-500 group-hover:text-blue-400 transition-colors uppercase tracking-widest">Review</span>
                </label>
            </div>
          </td>
          <td className="px-4 py-2 text-xs text-zinc-400 whitespace-nowrap min-w-[180px] bg-zinc-900/50">
            <Combobox
              options={projects.flatMap(p => p.tasks || []).filter(t => t.id !== task.id).map(t => ({ value: t.id, label: t.name }))}
              value={dependsOn || ''}
              onChange={(val) => setDependsOn(val as number | null)}
              placeholder="Depends on..."
              className="w-full"
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
          <td className="px-4 py-2 text-xs text-zinc-400 whitespace-nowrap bg-zinc-900/50">
            <select
              form={`update-${task.id}`}
              name="status"
              defaultValue={task.status}
              disabled={isUpdating}
              className="w-full bg-white/10 border border-white/20 rounded-xl focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 px-3 py-1.5 text-white text-xs appearance-none cursor-pointer transition-all disabled:opacity-50"
            >
              <option value="TODO" className="bg-zinc-900">To Do</option>
              <option value="IN_PROGRESS" className="bg-zinc-900">In Progress</option>
              <option value="QA" className="bg-zinc-900">QA</option>
              <option value="REVIEW" className="bg-zinc-900">Review</option>
              <option value="DONE" className="bg-zinc-900">Done</option>
            </select>
          </td>
          <td className="px-4 py-2 text-xs font-medium text-right whitespace-nowrap sticky right-0 z-10 bg-zinc-950/90 backdrop-blur-md border-l border-white/5">
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
        </motion.tr>
    ) : (
      <motion.tr 
        layout
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        whileHover="hover"
        className={`${rowClasses} transition-colors group items-center`} 
        ref={ref}
      >
        <td className="px-6 py-4 text-xs font-medium text-white whitespace-nowrap flex items-center sticky left-0 z-10 bg-zinc-950/90 backdrop-blur-md border-r border-white/5">
          <div className="relative flex items-center shrink-0">
            <input
              type="checkbox"
              checked={task.status === "DONE"}
              onChange={() => { void handleStatusToggle(); }}
              className="peer h-4 w-4 cursor-pointer appearance-none rounded-md border border-white/20 bg-white/5 checked:border-[var(--pastel-emerald)] checked:bg-[var(--pastel-emerald)]/20 transition-all hover:border-[var(--pastel-emerald)]/50 focus:outline-none ring-offset-zinc-950 focus:ring-2 focus:ring-[var(--pastel-emerald)]/20"
            />
            <FiCheck className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[var(--pastel-emerald)] opacity-0 peer-checked:opacity-100 transition-opacity w-3 h-3" />
          </div>
          <span className={`ml-4 truncate max-w-[250px] font-bold tracking-tight ${task.status === "DONE" ? "line-through text-zinc-500" : "text-zinc-100"}`}>
            {task.name}
          </span>
        </td>
        <td className="px-4 py-2 text-xs text-zinc-400 whitespace-nowrap max-w-[300px] truncate hidden lg:table-cell">
          {task.description || <span className="text-zinc-600 italic">No description</span>}
        </td>
        <td className="px-6 py-4 text-xs text-zinc-400 whitespace-nowrap">
          {task.dueDate ? format(new Date(task.dueDate as string), "MMM dd, yyyy") : <span className="text-zinc-600">-</span>}
        </td>
        <td className="px-6 py-4 text-xs text-zinc-400 whitespace-nowrap">
            <div className="flex items-center gap-2">
                {task.qa_required && (
                    <span className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase tracking-widest">QA</span>
                )}
                {task.review_required && (
                    <span className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-widest">Review</span>
                )}
                {!task.qa_required && !task.review_required && <span className="text-zinc-600">-</span>}
            </div>
        </td>
        <td className="px-6 py-4 text-xs text-zinc-400 whitespace-nowrap">
            {task.depends_on_id ? (
                <div className="flex items-center gap-2 text-[10px] font-bold text-amber-400 cursor-help" title={`Requires Task ID: ${task.depends_on_id}`}>
                    <FiClock className="w-3 h-3" />
                    <span>Req #{task.depends_on_id}</span>
                </div>
            ) : <span className="text-zinc-600">-</span>}
        </td>
        <td className="px-6 py-4 text-xs text-zinc-400 whitespace-nowrap hidden md:table-cell">
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
        <td className="px-6 py-4 text-xs whitespace-nowrap hidden sm:table-cell">
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
        <td className="px-4 py-2 text-xs text-zinc-400 whitespace-nowrap hidden lg:table-cell">
            {displayAssignees.length > 0 ? (
                <UserAvatarGroup users={displayAssignees} size="xs" limit={3} />
            ) : (
                <span className="text-zinc-600 italic">Unassigned</span>
            )}
        </td>
        <td className="px-6 py-4 text-xs text-zinc-400 whitespace-nowrap hidden md:table-cell">
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
              task.status === 'DONE'
                ? 'bg-[var(--pastel-emerald)]/10 text-[var(--pastel-emerald)] border-[var(--pastel-emerald)]/20'
                : task.status === 'IN_PROGRESS'
                ? 'bg-[var(--pastel-blue)]/10 text-[var(--pastel-blue)] border-[var(--pastel-blue)]/20'
                : task.status === 'QA'
                ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                : task.status === 'REVIEW'
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                : 'bg-white/5 text-zinc-400 border-white/10'
            }`}
          >
            {task.status.replace(/_/g, ' ')}
          </span>
        </td>
        <td className="px-4 py-2 text-xs font-medium text-right whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity sticky right-0 z-10 bg-zinc-950/90 backdrop-blur-md border-l border-white/5">
          <div className="flex items-center justify-end space-x-1">
            {canUserWorkOnTask(currentUser, task) && (
              <button
                type="button"
                onClick={() => startTimer(task)}
                className={`p-1.5 rounded-lg transition-all ${activeTask?.id === task.id ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-500 hover:text-white hover:bg-white/10'}`}
                title="Work on Mission"
              >
                <FiPlay className={`w-3.5 h-3.5 ${activeTask?.id === task.id ? 'fill-current' : ''}`} />
              </button>
            )}
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
      </motion.tr>
    );
});

export default TaskCard;
