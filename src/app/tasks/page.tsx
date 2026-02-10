/* eslint-disable @typescript-eslint/no-explicit-any */
import TasksPageClient from "@/components/ui/tasks/tasks-page-client";
import { getTasks } from './actions';
import { getUsers } from '@/app/users/actions';
import { getProjects } from '@/app/projects/actions';

import { auth } from '@/auth';

export default async function TasksPage() {
    const session = await auth();
    const [allTasks, allUsers, allProjects] = await Promise.all([
        getTasks(),
        getUsers(),
        getProjects(),
    ]);

    return <TasksPageClient 
        allTasks={allTasks as any[]} 
        users={allUsers as any[]} 
        projects={allProjects as any[]} 
        currentUserId={session?.user?.id}
    />;
}