"use client";

import React from "react";
import type { Task } from "@/types/task";
import { statusMapping } from "@/types/task";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  FiCalendar,
  FiChevronRight,
  FiClock,
  FiPlay,
  FiCheckCircle,
  FiTrash2
} from "react-icons/fi";
import UserAvatarGroup from "@/components/ui/user-avatar-group";

interface KanbanCardProps {
  task: Task;
  columns: Array<keyof typeof statusMapping>;
  onMove: (task: Task, status: Task["status"]) => Promise<void>;
  onDelete: (task: Task) => Promise<void>;
}

export default function KanbanCard({ task, columns, onMove, onDelete }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: String(task.id) });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    willChange: "transform",
  } as React.CSSProperties;

  const statusBg =
    task.status === "completed"
      ? "bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/30"
      : task.status === "in_progress"
      ? "bg-indigo-500/5 border-indigo-500/20 hover:border-indigo-500/30"
      : "bg-white/5 border-white/10 hover:border-white/20";

  const statusPill =
    task.status === "completed"
      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
      : task.status === "in_progress"
      ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
      : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative overflow-hidden rounded-xl border p-4 cursor-grab active:cursor-grabbing transition-all duration-200 ${statusBg} ${
        isDragging ? 'opacity-90 ring-2 ring-indigo-500/50 shadow-2xl scale-[1.02] z-50' : 'hover:shadow-lg hover:-translate-y-1 hover:bg-white/[0.07]'
      }`}
      {...attributes}
      {...listeners}
    >
      {/* Header: title + status pill + action */}
      <div className="relative z-10 flex items-start gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="text-sm font-semibold text-white tracking-tight truncate leading-snug">{task.name}</div>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); void onDelete(task); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
          aria-label={`Delete ${task.name}`}
          title="Delete"
        >
          <FiTrash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Description */}
      {task.description && (
        <div className="relative z-10 mb-4 text-xs leading-relaxed text-zinc-400 line-clamp-2">
          {task.description}
        </div>
      )}

      {/* Footer: meta + move actions */}
      <div className="relative z-10 flex items-center justify-between mt-auto pt-3 border-t border-white/5">
        <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium ${statusPill}`}>
                {task.status === 'completed' ? <FiCheckCircle className="h-3 w-3" /> : task.status === 'in_progress' ? <FiPlay className="h-3 w-3" /> : <FiClock className="h-3 w-3" />}
                {statusMapping[task.status]}
            </span>
            {task.dueDate && (
            <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500">
                <FiCalendar className="h-3 w-3" />
                {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
            )}
        </div>
        
        {task.assignees && task.assignees.length > 0 && (
            <div className="ml-auto mr-2">
                <UserAvatarGroup users={task.assignees.map(a => a.user)} size="sm" limit={3} />
            </div>
        )}

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {columns.filter((c) => c !== task.status).map((target) => (
            <button
                key={target}
                onClick={(e) => { e.stopPropagation(); void onMove(task, target as Task["status"]); }}
                className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-white transition-colors"
                title={`Move to ${statusMapping[target]}`}
            >
                <FiChevronRight className="h-3.5 w-3.5" />
            </button>
            ))}
        </div>
      </div>
    </div>
  );
}