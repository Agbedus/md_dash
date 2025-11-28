'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { parseProjectFormData } from '@/types/project';

import { projectManagers } from '@/db/schema';

export async function createProject(formData: FormData) {
    const data = parseProjectFormData(formData);
    
    const [newProject] = await db.insert(projects).values({
        name: data.name!,
        key: data.key,
        description: data.description,
        status: data.status!,
        priority: data.priority!,
        tags: data.tags,
        ownerId: data.ownerId,
        // managerId: data.managerId, // Deprecated
        clientId: data.clientId,
        startDate: data.startDate,
        endDate: data.endDate,
        budget: data.budget,
        spent: data.spent,
        currency: data.currency,
        billingType: data.billingType,
        isArchived: data.isArchived,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }).returning({ id: projects.id });

    if (data.managerIds && data.managerIds.length > 0) {
        await db.insert(projectManagers).values(
            data.managerIds.map(userId => ({
                projectId: newProject.id,
                userId
            }))
        );
    }

    revalidatePath('/projects');
}

export async function updateProject(formData: FormData) {
    const id = parseInt(formData.get('id') as string);
    const data = parseProjectFormData(formData);

    await db.update(projects)
        .set({ 
            name: data.name,
            key: data.key,
            description: data.description,
            status: data.status,
            priority: data.priority,
            tags: data.tags,
            ownerId: data.ownerId,
            clientId: data.clientId,
            startDate: data.startDate,
            endDate: data.endDate,
            budget: data.budget,
            spent: data.spent,
            currency: data.currency,
            billingType: data.billingType,
            isArchived: data.isArchived,
            updatedAt: new Date().toISOString() 
        })
        .where(eq(projects.id, id));

    // Update managers
    await db.delete(projectManagers).where(eq(projectManagers.projectId, id));
    
    if (data.managerIds && data.managerIds.length > 0) {
        await db.insert(projectManagers).values(
            data.managerIds.map(userId => ({
                projectId: id,
                userId
            }))
        );
    }

    revalidatePath('/projects');
}

export async function deleteProject(formData: FormData) {
    const id = parseInt(formData.get('id') as string);
    await db.delete(projects).where(eq(projects.id, id));
    revalidatePath('/projects');
}
