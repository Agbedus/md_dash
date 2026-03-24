import React from 'react';
import ProjectsPageClient from '@/components/ui/projects/projects-page-client';
import { getProjects } from './actions';
import { getClients } from '@/app/(dashboard)/clients/actions';
import { getUsers } from '@/app/(dashboard)/users/actions';
import { getTasks } from '@/app/(dashboard)/tasks/actions';
import { getNotes } from '@/app/(dashboard)/notes/actions';
import { Project } from '@/types/project';
import { Task } from '@/types/task';

export default async function ProjectsPage() {
  const [allProjects, allClients, allUsers, allTasks, allNotes] = await Promise.all([
    getProjects(),
    getClients(),
    getUsers(),
    getTasks(),
    getNotes(),
  ]);
  
  // Link tasks to projects
  const projectsWithTasks: Project[] = allProjects.map((project: Project) => ({
    ...project,
    tasks: allTasks.filter((task: Task) => task.projectId === project.id)
  }));
  
  return <ProjectsPageClient initialProjects={projectsWithTasks} initialUsers={allUsers} initialClients={allClients} initialNotes={allNotes} />;
}
