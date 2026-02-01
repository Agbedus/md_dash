import React from 'react';
import { notFound } from 'next/navigation';
import { getProject, getProjects } from '@/app/projects/actions';
import { getTasks } from '@/app/tasks/actions';
import { getNotes } from '@/app/notes/actions';
import { getClients } from '@/app/clients/actions';
import { getUsers } from '@/app/users/actions';
import ProjectDashboardClient from '@/components/ui/projects/project-dashboard-client';

interface ProjectDashboardPageProps {
    params: Promise<{ id: string }>;
}

export default async function ProjectDashboardPage({ params }: ProjectDashboardPageProps) {
    const { id } = await params;
    const projectId = parseInt(id);

    if (isNaN(projectId)) {
        return notFound();
    }

    const [project, allTasks, allNotes, allClients, allUsers, allProjects] = await Promise.all([
        getProject(projectId),
        getTasks(undefined, undefined, undefined, projectId),
        getNotes(), // Note: ideally filter by project on server, but current API might not support it directly
        getClients(),
        getUsers(),
        getProjects(),
    ]);

    if (!project) {
        return notFound();
    }

    // Filter project specific tasks and notes
    const projectTasks = allTasks.filter(t => t.projectId === projectId);
    const projectNotes = allNotes.filter(n => projectTasks.some(t => t.id === n.task_id));

    return (
        <ProjectDashboardClient 
            project={{...project, tasks: projectTasks}}
            tasks={projectTasks}
            notes={projectNotes}
            users={allUsers}
            clients={allClients}
            allProjects={allProjects}
        />
    );
}
