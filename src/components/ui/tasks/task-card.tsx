"use client";

import React, { useState } from "react";
import { Task } from "@/types/task";
import { FiCheck, FiX, FiEdit2, FiTrash2 } from "react-icons/fi";
import UserAvatarGroup from '@/components/ui/user-avatar-group';
import { format } from 'date-fns';
import { Combobox } from "@/components/ui/combobox";

import { User } from "@/types/user";
import { Project } from "@/types/project";

interface TaskCardProps {
    task: Task;
    users?: User[];
    projects?: Project[];
    updateTask?: (formData: FormData) => Promise<void>;
    deleteTask?: (formData: FormData) => Promise<void>;
}

export default function TaskCard({ task, users = [], projects = [], updateTask = async () => {}, deleteTask = async () => {} }: TaskCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [selectedAssignees, setSelectedAssignees] = useState<(string | number)[]>(
      task.assignees?.map(a => a.user.id) || []
    );
    const [selectedProject, setSelectedProject] = useState<string | number | null>(
      task.projectId || null
    );

    const handleUpdateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      
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
      
      await updateTask(formData);
      setIsEditing(false);
    };

    const handleStatusToggle = async () => {
      const formData = new FormData();
      formData.append("id", task.id.toString());
      formData.append("status", task.status === "completed" ? "in_progress" : "completed");
      await updateTask(formData);
    };

    const rowClasses = "border-b border-white/5";

    return isEditing ? (
      <>
        <form
          id={`update-${task.id}`}
          onSubmit={handleUpdateSubmit}
          method="post"
          style={{ display: "none" }}
        ></form>
        <tr className={rowClasses}>
          <td className="px-4 py-2 text-xs font-medium text-white whitespace-nowrap">
            <input className="text-white" form={`update-${task.id}`} type="hidden" name="id" value={task.id} />
            <input
              form={`update-${task.id}`}
              type="text"
              name="name"
              defaultValue={task.name}
              className="w-full bg-transparent border-b border-white/10 focus:border-emerald-500/50 focus:ring-0 p-1 text-white placeholder:text-zinc-600 text-xs transition-colors"
            />
          </td>
          <td className="px-4 py-2 text-xs text-zinc-400 whitespace-nowrap">
            <input
              form={`update-${task.id}`}
              type="text"
              name="description"
              defaultValue={task.description || ''}
              className="w-full bg-transparent border-b border-white/10 focus:border-emerald-500/50 focus:ring-0 p-1 text-white placeholder:text-zinc-600 text-xs transition-colors"
            />
          </td>
          <td className="px-4 py-2 text-[10px] text-zinc-400 whitespace-nowrap">
            <input
              form={`update-${task.id}`}
              type="date"
              name="dueDate"
              defaultValue={task.dueDate?.split('T')[0]}
              className="w-full bg-transparent border-b border-white/10 focus:border-emerald-500/50 focus:ring-0 p-1 text-white placeholder:text-zinc-600 text-xs [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:invert transition-colors"
            />
          </td>
          <td className="px-4 py-2 text-xs text-zinc-400 whitespace-nowrap">
            <select
              form={`update-${task.id}`}
              name="priority"
              defaultValue={task.priority}
              className="w-full bg-transparent border-b border-white/10 focus:border-emerald-500/50 focus:ring-0 p-1 text-white text-xs appearance-none cursor-pointer transition-colors"
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
          <td className="px-4 py-2 text-xs text-zinc-400 whitespace-nowrap">
            <select
              form={`update-${task.id}`}
              name="status"
              defaultValue={task.status}
              className="w-full bg-transparent border-b border-white/10 focus:border-emerald-500/50 focus:ring-0 p-1 text-white text-xs appearance-none cursor-pointer transition-colors"
            >
              <option value="task" className="bg-zinc-900">To Do</option>
              <option value="in_progress" className="bg-zinc-900">In Progress</option>
              <option value="completed" className="bg-zinc-900">Completed</option>
            </select>
          </td>
          <td className="px-4 py-2 text-xs font-medium text-right whitespace-nowrap">
            <div className="flex items-center justify-end space-x-2">
                <button form={`update-${task.id}`} type="submit" className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors">
                <FiCheck className="w-3 h-3" />
                </button>
                <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-1.5 bg-white/5 text-zinc-400 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
                >
                <FiX className="w-3 h-3" />
                </button>
            </div>
          </td>
        </tr>
      </>
    ) : (
      <tr className={`${rowClasses} hover:bg-white/5 transition-colors group items-center`}>
        <td className="px-4 py-2 text-xs font-medium text-white whitespace-nowrap flex items-center">
          <div className="relative flex items-center shrink-0">
            <input
              type="checkbox"
              checked={task.status === "completed"}
              onChange={() => { void handleStatusToggle(); }}
              className="peer h-3.5 w-3.5 cursor-pointer appearance-none rounded-md border border-white/20 bg-white/5 checked:border-emerald-500 checked:bg-emerald-500 transition-all hover:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <FiCheck className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 transition-opacity w-2.5 h-2.5" />
          </div>
          <span className={`ml-3 truncate max-w-[200px] ${task.status === "completed" ? "line-through text-zinc-500" : "text-zinc-200"}`}>
            {task.name}
          </span>
        </td>
        <td className="px-4 py-2 text-xs text-zinc-400 whitespace-nowrap max-w-[300px] truncate">
          {task.description || <span className="text-zinc-600 italic">No description</span>}
        </td>
        <td className="px-4 py-2 text-xs text-zinc-400 whitespace-nowrap">
          {task.dueDate ? format(new Date(task.dueDate), "MMM d, yyyy") : <span className="text-zinc-600">-</span>}
        </td>
        <td className="px-4 py-2 text-xs whitespace-nowrap">
          <span
            className={`px-2 py-0.5 inline-flex text-[10px] font-medium rounded-full border ${
              task.priority === 'high'
                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                : task.priority === 'medium'
                ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}
          >
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </span>
        </td>
        <td className="px-4 py-2 text-xs text-zinc-400 whitespace-nowrap">
            {task.assignees && task.assignees.length > 0 ? (
                <UserAvatarGroup users={task.assignees.map(a => a.user)} size="sm" limit={3} />
            ) : (
                <span className="text-zinc-600 italic">Unassigned</span>
            )}
        </td>
        <td className="px-4 py-2 text-xs text-zinc-400 whitespace-nowrap">
            {task.projectId ? (
                <span className="text-indigo-400">{projects.find(p => p.id === task.projectId)?.name}</span>
            ) : (
                <span className="text-zinc-600 italic">No Project</span>
            )}
        </td>
        <td className="px-4 py-2 text-xs whitespace-nowrap">
          <span
            className={`px-2 py-0.5 inline-flex text-[10px] font-medium rounded-full border ${
              task.status === 'completed'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : task.status === 'in_progress'
                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
            }`}
          >
            {task.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </span>
        </td>
        <td className="px-4 py-2 text-xs font-medium text-right whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center justify-end space-x-1">
            <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                title="Edit"
            >
                <FiEdit2 className="w-3.5 h-3.5" />
            </button>
            <form
                onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                await deleteTask(fd);
                }}
                style={{ display: 'inline' }}
            >
                <input type="hidden" name="id" value={task.id} />
                <button type="submit" className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all" title="Delete">
                <FiTrash2 className="w-3.5 h-3.5" />
                </button>
            </form>
          </div>
        </td>
      </tr>
    );
}
