import React from 'react';
import ProjectsPageClient from '@/components/ui/projects/projects-page-client';
import { db } from '@/db';
import { projects, users, clients } from '@/db/schema';
import { desc } from 'drizzle-orm';


export default async function ProjectsPage() {
  const allProjects = await db.query.projects.findMany({
    orderBy: desc(projects.createdAt),
    with: {
        managers: {
            with: {
                user: true
            }
        },
        owner: true,
        client: true,
        tasks: {
            with: {
                assignees: {
                    with: {
                        user: true
                    }
                }
            }
        }
    }
  });
  const allUsers = await db.select().from(users);
  const allClients = await db.select().from(clients);
  
  return <ProjectsPageClient initialProjects={allProjects as unknown as import("@/types/project").Project[]} users={allUsers} clients={allClients} />;
}
