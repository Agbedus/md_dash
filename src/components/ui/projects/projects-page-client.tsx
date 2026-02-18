'use client';

import React, { useState, useOptimistic, useMemo } from 'react';
import { Project } from '@/types/project';
import { User } from '@/types/user';
import { Client } from '@/types/client';
import { Note } from '@/types/note';
import { FiPlus, FiGrid, FiList, FiSearch, FiFilter, FiX, FiCheck } from 'react-icons/fi';
import { ProjectCard } from './project-card';
import { ProjectTable } from './project-table';
import { ProjectDetails } from './project-details';
import { ProjectFormFields } from './project-form-fields';
import { FiTrendingUp, FiCheckSquare, FiDollarSign, FiActivity, FiUsers, FiPieChart as FiPie, FiChevronRight as FiChevron, FiClock, FiAlertCircle } from 'react-icons/fi';
import { createProject, updateProject, deleteProject } from '@/app/projects/actions';
import { Sparkline } from "@/components/ui/sparkline";
import { format, subDays, isSameDay } from 'date-fns';

interface ProjectsPageClientProps {
  initialProjects: Project[];
  users: User[];
  clients: Client[];
  notes: Note[];
}

export default function ProjectsPageClient({ initialProjects, users, clients, notes }: ProjectsPageClientProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

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

  // Calculate trends for Portfolio Intelligence
  const trends = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));
    
    const getTrend = (items: Project[], status?: Project['status']) => {
      return last7Days.map(day => 
        items.filter(item => {
          // Fallback to createdAt or similar if startDate is missing
          const date = item.startDate ? new Date(item.startDate) : (item.id > 0 ? new Date() : null); 
          if (!date) return false;
          const matchesDate = isSameDay(date, day);
          const matchesStatus = status ? item.status === status : true;
          return matchesDate && matchesStatus;
        }).length
      );
    };

    return {
      active: getTrend(optimisticProjects, 'in_progress'),
      completed: getTrend(optimisticProjects, 'completed'),
      total: getTrend(optimisticProjects),
    };
  }, [optimisticProjects]);

  const filteredProjects = optimisticProjects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreate = async (formData: FormData) => {
    // ... handleCreate logic ...
    const newProject: Project = {
      id: -1, // Temporary ID
      name: formData.get('name') as string,
      key: formData.get('key') as string,
      status: (formData.get('status') as Project['status']) || 'planning',
      priority: (formData.get('priority') as Project['priority']) || 'medium',
      ownerId: formData.get('ownerId') as string,
      clientId: formData.get('clientId') as string,
      description: '',
      tags: [],
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: null,
      budget: null,
      spent: null,
      currency: 'USD',
      billingType: null,
      isArchived: 0,
      tasks: [],
    };
    addOptimisticProject({ type: 'add', project: newProject });
    
    setIsCreating(true);
    try {
      await createProject(formData);
      setIsCreateModalOpen(false);
    } finally {
      setIsCreating(false);
    }
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
      tags: formData.get('tags') ? (formData.get('tags') as string).split(',').map(t => t.trim()).filter(Boolean) : [],
    };
    addOptimisticProject({ type: 'update', project: updatedProject });
    
    setIsUpdating(true);
    try {
      await updateProject(formData);
      setEditingProject(null);
    } finally {
      setIsUpdating(false);
    }
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
    <div className="px-4 py-8 max-w-[1600px] mx-auto min-h-screen">
      {/* Header Section */}
      <div className="hidden lg:flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight uppercase">Strategic Portfolio</h1>
          <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Global project coordination & intelligence hub.</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 h-11 px-6 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-sm font-bold text-white transition-all duration-300 hover-scale"
          >
            <FiPlus className="w-4 h-4" />
            <span>Initialize Mission</span>
          </button>
        </div>
      </div>

      <div className="md:hidden flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-white uppercase tracking-tight">Projects</h1>
           <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 h-9 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition-all"
          >
            <FiPlus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
      </div>

      {/* Portfolio Intelligence Grid */}
      <div className="flex overflow-x-auto pb-2 scrollbar-hide lg:grid lg:grid-cols-4 gap-3 lg:gap-6 mb-6 lg:mb-12">
          <PortfolioStatCard 
            icon={FiActivity} 
            label="Active Maneuvers" 
            value={optimisticProjects.filter(p => p.status === 'in_progress').length.toString()} 
            subValue={`${optimisticProjects.length} Total`}
            color="indigo"
            trend={trends.active}
          />
          <PortfolioStatCard 
            icon={FiDollarSign} 
            label="Resource Purity" 
            value={`$${optimisticProjects.reduce((acc, p) => acc + (p.spent || 0), 0) > 1000000 
              ? (optimisticProjects.reduce((acc, p) => acc + (p.spent || 0), 0) / 1000000).toFixed(1) + 'M'
              : optimisticProjects.reduce((acc, p) => acc + (p.spent || 0), 0).toLocaleString()}`} 
            subValue={`of $${optimisticProjects.reduce((acc, p) => acc + (p.budget || 0), 0) > 1000000
              ? (optimisticProjects.reduce((acc, p) => acc + (p.budget || 0), 0) / 1000000).toFixed(1) + 'M'
              : optimisticProjects.reduce((acc, p) => acc + (p.budget || 0), 0).toLocaleString()} Cap`}
            color="emerald"
            trend={trends.total}
          />
          <PortfolioStatCard 
            icon={FiCheckSquare} 
            label="Mission Success" 
            value={optimisticProjects.filter(p => p.status === 'completed').length.toString()} 
            subValue="Completed"
            color="amber"
            trend={trends.completed}
          />
          <PortfolioStatCard 
            icon={FiTrendingUp} 
            label="Tactical Velocity" 
            value={`${(optimisticProjects.filter(p => p.status === 'completed').length / (optimisticProjects.length || 1) * 10).toFixed(1)}x`} 
            subValue="Output Index"
            color="rose"
            trend={trends.total}
          />
      </div>

      <div className="hidden lg:grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2 glass rounded-2xl p-6 border border-white/5 bg-zinc-900/10">
              <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                      <FiPie className="text-indigo-400" />
                      Status Intelligence
                  </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {['planning', 'in_progress', 'completed', 'on_hold'].map((status) => {
                      const count = optimisticProjects.filter(p => p.status === status).length;
                      const percentage = (count / (optimisticProjects.length || 1)) * 100;
                      const colors = {
                          planning: 'bg-zinc-500',
                          in_progress: 'bg-indigo-500',
                          completed: 'bg-emerald-500',
                          on_hold: 'bg-amber-500'
                      };
                      return (
                          <div key={status} className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2 group/status">
                              <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest group-hover/status:text-zinc-300 transition-colors">{status.replace('_', ' ')}</span>
                                  <span className="text-xs font-black text-white">{count}</span>
                              </div>
                              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                  <div className={`h-full ${colors[status as keyof typeof colors]} transition-all duration-1000 relative`} style={{ width: `${percentage}%` }}>
                                      <div className="absolute inset-0 bg-white/20 blur-[2px]" />
                                  </div>
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>

          <div className="glass rounded-2xl p-6 border border-white/5 bg-zinc-900/10">
              <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-3 mb-6">
                  <FiActivity className="text-rose-400" />
                  Tactical Priority
              </h3>
              <div className="space-y-4">
                  {optimisticProjects.filter(p => p.priority === 'high').slice(0, 3).map(p => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-rose-500/5 border border-rose-500/10">
                          <div className="flex flex-col">
                              <span className="text-[10px] font-black text-white uppercase tracking-tight truncate max-w-[120px]">{p.name}</span>
                              <span className="text-[8px] font-bold text-rose-400 uppercase tracking-widest">{p.key} critical</span>
                          </div>
                          <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded border border-white/5">{p.status.replace('_', ' ')}</span>
                      </div>
                  ))}
                  {optimisticProjects.filter(p => p.priority === 'high').length === 0 && (
                      <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest text-center py-4">No critical assets detected</p>
                  )}
              </div>
          </div>
      </div>

      {/* ... rest of the component ... */}
      <div className="flex items-center justify-between gap-4 mb-6 lg:mb-10 overflow-x-auto pb-2 scrollbar-hide">
        <div className="flex items-center gap-2 lg:gap-4 w-full lg:w-auto">
          <div className="relative flex-1 min-w-[140px] max-w-sm group">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[var(--pastel-indigo)] transition-colors w-3.5 h-3.5"/>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 lg:h-11 pl-8 pr-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:bg-white/10 focus:border-white/20 text-white placeholder:text-zinc-600 transition-all text-xs lg:text-sm"
            />
          </div>
          
          <div className="relative group flex-shrink-0">
             <div className="h-9 lg:h-11 w-9 lg:w-44 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center lg:justify-start lg:pl-3 relative overflow-hidden">
                <FiFilter className="text-zinc-500 group-hover:text-[var(--pastel-indigo)] transition-colors w-3.5 h-3.5 lg:absolute lg:left-3.5 lg:top-1/2 lg:-translate-y-1/2 lg:z-10" />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="absolute inset-0 opacity-0 lg:opacity-100 lg:static lg:bg-transparent lg:border-none lg:pl-10 lg:pr-4 lg:w-full lg:h-full text-zinc-400 cursor-pointer lg:text-[11px] lg:font-bold lg:uppercase lg:tracking-wider appearance-none"
                >
                    <option value="all" className="bg-zinc-900">All Status</option>
                    <option value="planning" className="bg-zinc-900">Planning</option>
                    <option value="in_progress" className="bg-zinc-900">In Progress</option>
                    <option value="completed" className="bg-zinc-900">Completed</option>
                    <option value="on_hold" className="bg-zinc-900">On Hold</option>
                </select>
             </div>
          </div>
        </div>

        <div className="flex items-center space-x-1 bg-white/5 p-1 rounded-xl border border-white/10 h-9 lg:h-11 flex-shrink-0 ml-auto">
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 lg:p-2 rounded-lg transition-all hover-scale ${viewMode === 'list' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            title="Table view"
          >
            <FiList className="w-4 h-4 lg:w-5 lg:h-5"/>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 lg:p-2 rounded-lg transition-all hover-scale ${viewMode === 'grid' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            title="Grid view"
          >
            <FiGrid className="w-4 h-4 lg:w-5 lg:h-5"/>
          </button>
        </div>
      </div>

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
          onSelectProject={setSelectedProject}
        />
      )}

      {selectedProject && (
        <div className="fixed inset-0 z-[90] flex justify-end">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-500"
            onClick={() => setSelectedProject(null)}
          />
          <ProjectDetails 
            project={selectedProject}
            users={users}
            clients={clients}
            notes={notes}
            projects={optimisticProjects}
            onClose={() => setSelectedProject(null)}
          />
        </div>
      )}

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
                  disabled={isCreating}
                  className="p-2.5 rounded-xl text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/30 transition-all shadow-lg shadow-emerald-500/10 backdrop-blur-md disabled:opacity-50"
                  title="Create Project"
                >
                  {isCreating ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-400"></div> : <FiCheck className="w-5 h-5" />}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  disabled={isUpdating}
                  className="p-2.5 rounded-xl text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/30 transition-all shadow-lg shadow-emerald-500/10 backdrop-blur-md disabled:opacity-50"
                  title="Save Changes"
                >
                  {isUpdating ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-400"></div> : <FiCheck className="w-5 h-5" />}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function PortfolioStatCard({ icon: Icon, color, label, value, subValue, trend }: { icon: any, color: 'indigo' | 'emerald' | 'amber' | 'rose', label: string, value: string, subValue: string, trend?: number[] }) {
    const colors = {
        indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20 shadow-indigo-500/10',
        emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/10',
        amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-amber-500/10',
        rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20 shadow-rose-500/10',
    };

    const sparkColors = {
        indigo: '#818cf8',
        emerald: '#34d399',
        amber: '#fbbf24',
        rose: '#fb7185',
    };

    return (
        <div className="glass rounded-xl lg:rounded-2xl p-3 lg:p-5 border border-white/5 bg-zinc-900/10 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500 flex-shrink-0 min-w-[140px] lg:min-w-0">
            <div className="flex flex-col gap-2 lg:gap-4 relative z-10 h-full justify-between">
                <div className="flex justify-between items-start">
                    <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl flex items-center justify-center border transition-all duration-500 relative group-hover:shadow-[0_0_15px_rgba(0,0,0,0.2)] ${colors[color]}`}>
                        <div className="absolute inset-0 rounded-lg lg:rounded-xl bg-current opacity-10 blur-sm group-hover:opacity-20 transition-opacity" />
                        <Icon className="w-3.5 h-3.5 lg:w-4 lg:h-4 relative z-10" />
                    </div>
                    {trend && (
                        <div className="h-6 w-12 lg:h-8 lg:w-16 opacity-40 group-hover:opacity-100 transition-all duration-300">
                            <Sparkline 
                                data={trend} 
                                color={sparkColors[color]}
                                width={64}
                                height={32}
                            />
                        </div>
                    )}
                </div>
                <div>
                    <p className="text-[9px] lg:text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-0.5 lg:mb-1 truncate">{label}</p>
                    <div className="flex flex-col lg:flex-row lg:items-baseline gap-0.5 lg:gap-2">
                        <span className="text-lg lg:text-xl font-black text-white uppercase tracking-tight">{value}</span>
                        <span className="text-[8px] lg:text-[9px] font-bold text-zinc-600 uppercase tracking-widest truncate">{subValue}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
