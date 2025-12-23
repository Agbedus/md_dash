import React from 'react';
import { Project, priorityMapping, statusMapping } from '@/types/project';
import { FiCalendar, FiClock, FiEdit2, FiTrash2, FiDollarSign, FiTag } from 'react-icons/fi';
import { format } from 'date-fns';
import UserAvatarGroup from '@/components/ui/user-avatar-group';
import Link from 'next/link';
import { FiCheckSquare } from 'react-icons/fi';

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const statusColors = {
    planning: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    in_progress: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    on_hold: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  };

  const priorityColors = {
    low: "text-zinc-400",
    medium: "text-amber-400",
    high: "text-rose-400",
  };

  return (
    <div className="group relative bg-zinc-900/30 hover:bg-zinc-900/50 border border-white/5 hover:border-white/10 rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-1">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <div className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${statusColors[project.status]}`}>
            {statusMapping[project.status]}
          </div>
          {project.key && (
            <div className="px-2 py-1 rounded-lg text-xs font-mono text-zinc-500 bg-white/5 border border-white/5">
              {project.key}
            </div>
          )}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(project)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            title="Edit project"
          >
            <FiEdit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(project)}
            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 transition-colors"
            title="Delete project"
          >
            <FiTrash2 className="w-3.5 h-3.5" />
          </button>
          <Link
            href={`/projects/${project.id}/tasks`}
            className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-zinc-400 hover:text-emerald-400 transition-colors"
            title="View project tasks"
          >
            <FiCheckSquare className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-white mb-2 line-clamp-1">{project.name}</h3>
      
      <p className="text-zinc-400 text-sm mb-3 line-clamp-2 min-h-[2.5rem]">
        {project.description || "No description provided."}
      </p>

      {/* Tags */}
      {project.tags && (
        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          <FiTag className="w-3 h-3 text-zinc-500" />
          {project.tags.split(',').slice(0, 3).map((tag, idx) => (
            <span key={idx} className="px-2 py-0.5 rounded-md text-[10px] bg-white/5 text-zinc-400 border border-white/5">
              {tag.trim()}
            </span>
          ))}
        </div>
      )}

      {/* Budget Info */}
      {(project.budget || project.spent) && (
        <div className="mb-3 p-2 rounded-lg bg-white/5 border border-white/5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <FiDollarSign className="w-3 h-3" />
              <span>Budget</span>
            </div>
            <div className="text-zinc-300 font-medium">
              {project.spent || 0} / {project.budget || 0} {project.currency || 'USD'}
            </div>
          </div>
          {project.budget && project.budget > 0 && (
            <div className="mt-1.5 h-1 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all"
                style={{ width: `${Math.min(((project.spent || 0) / project.budget) * 100, 100)}%` }}
              />
            </div>
          )}
        </div>
      )}




      <div className="flex items-center justify-between text-xs text-zinc-500 pt-3 border-t border-white/5">
        <div className="flex items-center gap-3">
          {/* Managers */}
          {project.managers && project.managers.length > 0 && (
             <div className="flex items-center gap-2 mr-2">
                <UserAvatarGroup users={project.managers.map(m => m.user)} size="sm" limit={3} />
             </div>
          )}

          {project.endDate && (
            <div className="flex items-center gap-1.5">
              <FiCalendar className="w-3.5 h-3.5" />
              <span>{format(new Date(project.endDate), "MMM d")}</span>
            </div>
          )}
          <div className={`flex items-center gap-1.5 ${priorityColors[project.priority]}`}>
            <FiClock className="w-3.5 h-3.5" />
            <span className="capitalize">{priorityMapping[project.priority]}</span>
          </div>
        </div>
        
        <div className="text-zinc-600">
            {project.updatedAt && `Updated ${format(new Date(project.updatedAt), "MMM d")}`}
        </div>
      </div>
    </div>
  );
}
