import React from 'react';
import ProjectsPageClient from '@/components/ui/projects/projects-page-client';
import { getProjects } from './actions';
import { getClients } from '@/app/clients/actions';
import { getUsers } from '@/app/users/actions';
import { getTasks } from '@/app/tasks/actions';
import { Project } from '@/types/project';
import { Task } from '@/types/task';

export default async function ProjectsPage() {
  const [allProjects, allClients, allUsers, allTasks] = await Promise.all([
    getProjects(),
    getClients(),
    getUsers(),
    getTasks(),
  ]);
  
  // Link tasks to projects
  const projectsWithTasks: Project[] = allProjects.map((project: Project) => ({
    ...project,
    tasks: allTasks.filter((task: Task) => task.projectId === project.id)
  }));
  
  return <ProjectsPageClient initialProjects={projectsWithTasks} users={allUsers} clients={allClients} />;
}
