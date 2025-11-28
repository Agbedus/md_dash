'use server';

import { db } from '@/db';
import { tasks } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { eq, InferInsertModel } from 'drizzle-orm';
import { parseTaskFormData, Task } from '@/types/task';

const ALLOWED_STATUSES = ['task', 'in_progress', 'completed'] as const;
type Status = typeof ALLOWED_STATUSES[number];

const ALLOWED_PRIORITIES = ['low', 'medium', 'high'] as const;
type Priority = typeof ALLOWED_PRIORITIES[number];

const isStatus = (val: unknown): val is Status =>
  typeof val === 'string' && (ALLOWED_STATUSES as readonly string[]).includes(val);

const isPriority = (val: unknown): val is Priority =>
  typeof val === 'string' && (ALLOWED_PRIORITIES as readonly string[]).includes(val);

export async function getTasks(): Promise<Task[]> {
    return await db.query.tasks.findMany({
        with: {
            assignees: {
                with: {
                    user: true
                }
            }
        },
        orderBy: (tasks, { desc }) => [desc(tasks.createdAt)]
    });
}

import { taskAssignees } from '@/db/schema';

export async function createTask(formData: FormData) {
    const taskData = parseTaskFormData(formData);

    const status: Status = isStatus(taskData.status) ? taskData.status : 'task';

    const priority: Priority = isPriority(taskData.priority) ? taskData.priority : 'medium';

    const [newTask] = await db.insert(tasks).values({
        name: taskData.name || '',
        description: taskData.description || '',
        dueDate: taskData.dueDate || new Date().toISOString(),
        priority,
        status,
        // assigneeId: taskData.assigneeId || null, // Deprecated
        projectId: taskData.projectId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }).returning({ id: tasks.id });

    if (taskData.assigneeIds && taskData.assigneeIds.length > 0) {
        await db.insert(taskAssignees).values(
            taskData.assigneeIds.map(userId => ({
                taskId: newTask.id,
                userId
            }))
        );
    }

    revalidatePath('/tasks');
}

export async function updateTask(formData: FormData) {
    const id = formData.get('id');

    if (!id) {
        throw new Error('Task ID is required for update');
    }

    const updates: Partial<InferInsertModel<typeof tasks>> = {
        updatedAt: new Date().toISOString(),
    };

    if (formData.has('name')) {
        updates.name = formData.get('name') as string;
    }
    if (formData.has('description')) {
        updates.description = formData.get('description') as string;
    }
    if (formData.has('dueDate')) {
        updates.dueDate = formData.get('dueDate') as string;
    }
    if (formData.has('priority')) {
        const priority = formData.get('priority');
        if (isPriority(priority)) {
            updates.priority = priority;
        }
    }
    if (formData.has('status')) {
        const status = formData.get('status');
        if (isStatus(status)) {
            updates.status = status;
        }
    }
    if (formData.has('projectId')) {
        const projectId = formData.get('projectId');
        updates.projectId = projectId ? Number(projectId) : null;
    }

    await db
        .update(tasks)
        .set(updates)
        .where(eq(tasks.id, Number(id)));

    // Only update assignees if the field is present in formData
    if (formData.has('assigneeIds')) {
        const assigneeIdsStr = formData.get('assigneeIds') as string;
        let assigneeIds: string[] = [];
        try {
            assigneeIds = assigneeIdsStr ? JSON.parse(assigneeIdsStr) : [];
        } catch (e) {
            console.error("Failed to parse assigneeIds", e);
        }

        await db.delete(taskAssignees).where(eq(taskAssignees.taskId, Number(id)));

        if (assigneeIds.length > 0) {
            await db.insert(taskAssignees).values(
                assigneeIds.map(userId => ({
                    taskId: Number(id),
                    userId
                }))
            );
        }
    }

    revalidatePath('/tasks');
}

export async function deleteTask(formData: FormData) {
    const { id } = Object.fromEntries(formData) as { id: string };
    await db.delete(tasks).where(eq(tasks.id, parseInt(id, 10)));
    revalidatePath('/tasks');
}

export async function updateTaskStatus(taskId: number, status: Status) {
    await db
        .update(tasks)
        .set({
            status,
            updatedAt: new Date().toISOString(),
        })
        .where(eq(tasks.id, taskId));
    revalidatePath('/tasks');
}
