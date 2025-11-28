import { db } from "@/db";
import { users, projects } from "@/db/schema";
import TasksPageClient from "@/components/ui/tasks/tasks-page-client";

export const dynamic = 'force-dynamic';

type TaskWithRelations = Awaited<ReturnType<typeof db.query.tasks.findMany>>[number];

export default async function TasksPage() {
    const allTasks = await db.query.tasks.findMany({
        with: {
            assignees: {
                with: {
                    user: true
                }
            },
            project: true
        }
    });
    const allUsers = await db.select().from(users);
    const allProjects = await db.select().from(projects);

    return <TasksPageClient allTasks={allTasks as TaskWithRelations[]} users={allUsers} projects={allProjects} />;
}