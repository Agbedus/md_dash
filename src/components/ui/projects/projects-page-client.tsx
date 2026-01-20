'use client';

import React, { useState, useOptimistic } from 'react';
import { Project } from '@/types/project';
import { User } from '@/types/user';
import { Client } from '@/types/client';
import { FiPlus, FiGrid, FiList, FiSearch, FiFilter, FiX, FiCheck } from 'react-icons/fi';
import { ProjectCard } from './project-card';
import { ProjectTable } from './project-table';
import { ProjectFormFields } from './project-form-fields';
import { createProject, updateProject, deleteProject } from '@/app/projects/actions';

interface ProjectsPageClientProps {
  initialProjects: Project[];
  users: User[];
  clients: Client[];
}

export default function ProjectsPageClient({ initialProjects, users, clients }: ProjectsPageClientProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Optimistic UI
  const [optimisticProjects, addOptimisticProject] = useOptimistic(
    initialProjects,
    (state: Project[], action: { type: 'add' | 'update' | 'delete', project: Project }) => {
      switch (action.type) {
        case 'add':
          return [...state, action.project];
        case 'update':
          return state.map(p => p.id === action.project.id ? action.project : p);
        case 'delete':
          return state.filter(p => p.id !== action.project.id);
        default:
          return state;
      }
    }
  );

  const filteredProjects = optimisticProjects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreate = async (formData: FormData) => {
    // Optimistic Update
    const newProject: Project = {
      id: -1, // Temporary ID
      name: formData.get('name') as string,
      key: formData.get('key') as string,
      status: (formData.get('status') as Project['status']) || 'planning',
      priority: (formData.get('priority') as Project['priority']) || 'medium',
      ownerId: formData.get('ownerId') as string,
      clientId: formData.get('clientId') as string,
      description: '',
      tags: '',
      startDate: null,
      endDate: null,
      budget: null,
      spent: null,
      currency: 'USD',
      billingType: null,
      isArchived: 0,
      tasks: [],
    };
    addOptimisticProject({ type: 'add', project: newProject });
    
    setIsCreateModalOpen(false);
    await createProject(formData);
  };

  const handleUpdate = async (formData: FormData) => {
    const id = editingProject!.id;
    formData.set('id', id.toString());
    
    // Optimistic Update
    const updatedProject: Project = {
      ...editingProject!,
      name: formData.get('name') as string,
      key: formData.get('key') as string,
      status: formData.get('status') as Project['status'],
      priority: formData.get('priority') as Project['priority'],
      ownerId: formData.get('ownerId') as string,
      clientId: formData.get('clientId') as string,
    };
    addOptimisticProject({ type: 'update', project: updatedProject });
    
    setEditingProject(null);
    await updateProject(formData);
  };

  const handleDelete = async (project: Project) => {
    if (confirm('Are you sure you want to delete this project?')) {
      addOptimisticProject({ type: 'delete', project });
      
      const formData = new FormData();
      formData.set('id', project.id.toString());
      await deleteProject(formData);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
      {/* Sticky Header & Controls Container */}
      <div className="sticky top-0 z-30 -mx-4 md:-mx-8 px-4 md:px-8 py-4 mb-4 backdrop-blur-md">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 tracking-tight">Projects</h1>
            <p className="text-zinc-400 text-sm md:text-lg">Manage and track your ongoing projects.</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-xs md:text-sm text-zinc-400 hover:text-white transition-all duration-200 group self-start md:self-auto"
          >
            <div className="p-1 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
              <FiPlus className="w-3 h-3 md:w-4 md:h-4" />
            </div>
            <span className="pr-2">New Project</span>
          </button>
        </div>

        {/* Controls */}
        <div className="glass p-3 md:p-4 rounded-2xl flex flex-col md:flex-row gap-3 md:gap-4 items-stretch md:items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto flex-1 overflow-x-auto scrollbar-hide pb-1">
            <div className="relative flex-1 md:max-w-md hidden md:block">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              />
            </div>
            <div className="relative flex-shrink-0">
              <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-8 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer text-xs md:text-sm"
              >
                <option value="all">All Status</option>
                <option value="planning">Planning</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>
          </div>

          <div className="flex items-center bg-white/5 rounded-xl border border-white/10 p-1 self-end md:self-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 md:p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
            >
              <FiGrid className="w-3 h-3 md:w-4 md:h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 md:p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
            >
              <FiList className="w-3 h-3 md:w-4 md:h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              users={users}
              onEdit={setEditingProject}
              onDelete={handleDelete}
            />
          ))}
          {filteredProjects.length === 0 && (
            <div className="col-span-full text-center py-12 text-zinc-500">
              No projects found matching your criteria.
            </div>
          )}
        </div>
      ) : (
        <ProjectTable
          projects={filteredProjects}
          users={users}
          clients={clients}
        />
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Create New Project</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-zinc-400 hover:text-white">×</button>
            </div>
            <form action={handleCreate} className="p-6">
              <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <ProjectFormFields users={users} clients={clients} />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-2.5 rounded-xl text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all shadow-lg shadow-black/20 backdrop-blur-md"
                  title="Cancel"
                >
                  <FiX className="w-5 h-5" />
                </button>
                <button
                  type="submit"
                  className="p-2.5 rounded-xl text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/30 transition-all shadow-lg shadow-emerald-500/10 backdrop-blur-md"
                  title="Create Project"
                >
                  <FiCheck className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Edit Project</h2>
              <button onClick={() => setEditingProject(null)} className="text-zinc-400 hover:text-white">×</button>
            </div>
            <form action={handleUpdate} className="p-6">
              <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <ProjectFormFields defaultValues={editingProject} users={users} clients={clients} />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="p-2.5 rounded-xl text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all shadow-lg shadow-black/20 backdrop-blur-md"
                  title="Cancel"
                >
                  <FiX className="w-5 h-5" />
                </button>
                <button
                  type="submit"
                  className="p-2.5 rounded-xl text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/30 transition-all shadow-lg shadow-emerald-500/10 backdrop-blur-md"
                  title="Save Changes"
                >
                  <FiCheck className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
