'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Project, statusMapping, priorityMapping } from '@/types/project';
import { User } from '@/types/user';
import { Client } from '@/types/client';
import { FiEdit2, FiTrash2, FiClock, FiCheck, FiX, FiDollarSign } from 'react-icons/fi';
import { format } from 'date-fns';
import { createProject, updateProject, deleteProject } from '@/app/projects/actions';
import { updateTask, deleteTask } from '@/app/tasks/actions';
import UserAvatarGroup from '@/components/ui/user-avatar-group';
import TaskCard from '@/components/ui/tasks/task-card';
import { FiChevronRight, FiChevronDown } from 'react-icons/fi';

interface ProjectTableProps {
  projects: Project[];
  users: User[];
  clients: Client[];
}

import { Combobox } from "@/components/ui/combobox";
import { FiPlus } from 'react-icons/fi';

export function ProjectTable({ projects, users, clients }: ProjectTableProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  
  // Combobox state
  const [editingManagers, setEditingManagers] = useState<(string | number)[]>([]);
  const [newManagers, setNewManagers] = useState<(string | number)[]>([]);

  const newNameRef = useRef<HTMLInputElement | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const startEditing = (project: Project) => {
    setEditingId(project.id);
    setEditingManagers(project.managers?.map(m => m.user.id) || []);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingManagers([]);
  };

  useEffect(() => {
    if (isAdding && newNameRef.current) {
      setTimeout(() => newNameRef.current?.focus(), 0);
    }
  }, [isAdding]);

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set('id', editingId!.toString());

    // Combobox handles managerIds via hidden input if name="managerIds" is used
    // But wait, the Combobox puts a JSON string if multiple=true.
    // The actions expect 'managerIds' as a JSON string.
    // So we don't need manual handling if we use the Combobox's hidden input.

    await updateProject(formData);
    setEditingId(null);
    setEditingManagers([]);
  };

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    // Combobox handles managerIds via hidden input

    await createProject(formData);
    setIsAdding(false);
    setNewManagers([]);
  };

  const handleDelete = async (project: Project) => {
    if (confirm('Are you sure you want to delete this project?')) {
      const formData = new FormData();
      formData.set('id', project.id.toString());
      await deleteProject(formData);
    }
  };

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
    <div className="w-full overflow-x-auto rounded-2xl border border-white/5 bg-zinc-900/30">
      <table className="w-full text-left text-sm min-w-[1400px]">
        <thead className="bg-white/5 text-zinc-400 font-medium">
          <tr>
            <th className="px-4 py-3 w-[200px]">Project</th>
            <th className="px-4 py-3 w-[100px]">Key</th>
            <th className="px-4 py-3 w-[120px]">Status</th>
            <th className="px-4 py-3 w-[100px]">Priority</th>
            <th className="px-4 py-3 w-[120px]">Owner</th>
            <th className="px-4 py-3 w-[200px]">Managers</th>
            <th className="px-4 py-3 w-[120px]">Client</th>
            <th className="px-4 py-3 w-[110px]">Start Date</th>
            <th className="px-4 py-3 w-[110px]">End Date</th>
            <th className="px-4 py-3 w-[140px]">Budget</th>
            <th className="px-4 py-3 w-[80px] text-right">Actions</th>
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
                  <td colSpan={11} className="p-0">
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
                            <td className="px-4 py-2 w-[200px]">
                              <Combobox
                                name="managerIds"
                                options={users.map(u => ({ value: u.id, label: u.fullName || u.email, subLabel: u.email }))}
                                value={editingManagers}
                                onChange={(val) => setEditingManagers(val as (string | number)[])}
                                multiple
                                placeholder="Select..."
                                searchPlaceholder="Search..."
                                className="w-full"
                              />
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
                                  className="p-1 rounded hover:bg-emerald-500/10 text-emerald-400 transition-colors"
                                  title="Save"
                                >
                                  <FiCheck className="w-4 h-4" />
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
              <tr className="group hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleExpand(project.id)}
                      className="p-1 rounded hover:bg-white/10 text-zinc-500 hover:text-white transition-colors"
                    >
                      {expandedIds.includes(project.id) ? (
                        <FiChevronDown className="w-4 h-4" />
                      ) : (
                        <FiChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    <div className="font-medium text-white truncate">{project.name}</div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {project.key && (
                    <span className="text-xs font-mono text-zinc-500">{project.key}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${statusColors[project.status]}`}>
                    {statusMapping[project.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className={`flex items-center gap-1 text-xs ${priorityColors[project.priority]}`}>
                    <FiClock className="w-3 h-3" />
                    <span>{priorityMapping[project.priority]}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-400 text-xs">
                  {owner ? <UserAvatarGroup users={[owner]} size="sm" /> : '-'}
                </td>
                <td className="px-4 py-3 text-zinc-400 text-xs">
                  {project.managers && project.managers.length > 0 ? (
                    <UserAvatarGroup users={project.managers.map(m => m.user)} size="sm" limit={3} />
                  ) : '-'}
                </td>
                <td className="px-4 py-3 text-zinc-400 text-xs">
                  {client ? client.companyName : '-'}
                </td>
                <td className="px-4 py-3 text-zinc-400 text-xs">
                  {project.startDate ? (() => {
                    try {
                      return format(new Date(project.startDate), "MMM d, yy");
                    } catch {
                      return project.startDate;
                    }
                  })() : '-'}
                </td>
                <td className="px-4 py-3 text-zinc-400 text-xs">
                  {project.endDate ? (() => {
                    try {
                      return format(new Date(project.endDate), "MMM d, yy");
                    } catch {
                      return project.endDate;
                    }
                  })() : '-'}
                </td>
                <td className="px-4 py-3 text-zinc-400 text-xs">
                  {project.budget ? (
                    <div className="flex items-center gap-1">
                      <FiDollarSign className="w-3 h-3" />
                      <span>{project.budget.toLocaleString()} {project.currency}</span>
                    </div>
                  ) : '-'}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEditing(project)}
                      className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                      title="Edit"
                    >
                      <FiEdit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(project)}
                      className="p-1 rounded hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 transition-colors"
                      title="Delete"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
              {expandedIds.includes(project.id) && (
                <tr className="bg-white/[0.02]">
                  <td colSpan={11} className="p-0">
                    <div className="p-4 pl-12 bg-zinc-900/30 border-y border-white/5">
                      <h4 className="mb-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Tasks ({project.tasks?.length || 0})</h4>
                      {project.tasks && project.tasks.length > 0 ? (
                        <div className="overflow-x-auto rounded-lg border border-white/5 bg-zinc-900/50">
                            <table className="w-full text-left text-sm">
                                <tbody className="divide-y divide-white/5">
                                    {project.tasks.map(task => (
                                        <TaskCard 
                                            key={task.id} 
                                            task={task} 
                                            users={users} 
                                            projects={projects} 
                                            updateTask={updateTask} 
                                            deleteTask={deleteTask} 
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                      ) : (
                        <div className="text-sm text-zinc-500 italic py-2">No tasks found for this project.</div>
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
              <td colSpan={11} className="p-0">
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
                        <td className="px-4 py-2 w-[200px]">
                          <Combobox
                            name="managerIds"
                            options={users.map(u => ({ value: u.id, label: u.fullName || u.email, subLabel: u.email }))}
                            value={newManagers}
                            onChange={(val) => setNewManagers(val as (string | number)[])}
                            multiple
                            placeholder="Select..."
                            searchPlaceholder="Search..."
                            className="w-full"
                          />
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
                              className="p-1 rounded hover:bg-emerald-500/10 text-emerald-400 transition-colors"
                              title="Save"
                            >
                              <FiCheck className="w-4 h-4" />
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
            <tr>
              <td colSpan={11} className="px-4 py-2">
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
              <td colSpan={11} className="px-6 py-12 text-center text-zinc-500">
                No projects found. Click &quot;Add project&quot; to create one.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
