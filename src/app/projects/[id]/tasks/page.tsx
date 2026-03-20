/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import TasksPageClient from "@/components/ui/tasks/tasks-page-client";
import { getTasks } from '@/app/tasks/actions';
import { getUsers } from '@/app/users/actions';
import { getProjects, getProject } from '@/app/projects/actions';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface ProjectTasksPageProps {
    params: Promise<{ id: string }>;
}

export default async function ProjectTasksPage({ params }: ProjectTasksPageProps) {
    const { id } = await params;
    const projectId = parseInt(id);

    if (isNaN(projectId)) {
        return notFound();
    }

    const project = await getProject(projectId);
    if (!project) {
        return notFound();
    }

    const allTasks = await getTasks(undefined, undefined, undefined, projectId);
    const allUsers = await getUsers();
    const allProjects = await getProjects();

    return (
        <div className="flex flex-col gap-4">
            <div className="px-8 pt-8">
                <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
                    <a href="/projects" className="hover:text-white transition-colors">Projects</a>
                    <span>/</span>
                    <span className="text-white">{project.name}</span>
                </div>
                <h1 className="text-2xl font-bold text-white">Tasks for {project.name}</h1>
            </div>
            <TasksPageClient 
                allTasks={allTasks as any[]} 
                users={allUsers as any[]} 
                projects={allProjects as any[]} 
                projectId={projectId}
            />
        </div>
    );
}
