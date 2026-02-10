'use server';

const BASE_URL = process.env.BASE_URL_LOCAL || "http://127.0.0.1:8000";
const API_BASE_URL = `${BASE_URL}/api/v1`;

import { auth } from '@/auth';
import { Task } from '@/types/task';
import { revalidatePath, revalidateTag } from 'next/cache';

// Interface for what the API returns (snake_case)
interface ApiTask {
    id: number;
    name: string;
    description: string | null;
    status: string;
    priority: string;
    due_date: string | null;
    created_at: string;
    updated_at: string;
    project_id: number | null;
    assignees?: Array<{
        id: string | number;
        full_name?: string;
        name?: string;
        email?: string;
        avatar_url?: string;
        image?: string;
        roles?: string[];
    }>;
    assignee_ids?: string[];
    task_assignees?: Array<{
        task_id: number;
        user_id: string | number;
    }>;
    user_id?: string; 
}

export async function getTasks(query?: string, priority?: string, status?: string, projectId?: number, limit?: number, skip?: number): Promise<Task[]> {

    const session = await auth();
    // @ts-expect-error accessToken is not in default session type
    if (!session?.user?.accessToken) {

        return [];
    }

    try {
        const queryParams = new URLSearchParams();
        if (query) queryParams.append('q', query);
        if (priority) queryParams.append('priority', priority);
        if (status) queryParams.append('status', status);
        if (projectId) queryParams.append('project_id', projectId.toString());
        if (limit) queryParams.append('limit', limit.toString());
        if (skip) queryParams.append('skip', skip.toString());

        const [response, users] = await Promise.all([
            fetch(`${API_BASE_URL}/tasks?${queryParams.toString()}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    // @ts-expect-error accessToken is not in default session type
                    'Authorization': `Bearer ${session.user.accessToken}`
                },
                next: { tags: ['tasks', 'projects'], revalidate: 60 }
            }),
            import('@/app/users/actions').then(mod => mod.getUsers())
        ]);


        if (!response.ok) {
            console.error("Failed to fetch tasks:", await response.text());
            return [];
        }

        const apiTasks: ApiTask[] = await response.json();
        
        // Map API snake_case to Frontend camelCase
        let tasks: Task[] = apiTasks.map(t => {
            const owner = users.find((u: any) => u.id === t.user_id);
            return {
                id: t.id,
                name: t.name,
                description: t.description,
                status: t.status as Task['status'],
                priority: t.priority as Task['priority'],
                dueDate: t.due_date,
                createdAt: t.created_at,
                updatedAt: t.updated_at,
                projectId: t.project_id,
                assignees: [], // Will be hydrated on client
                assigneeIds: (() => {
                    if (t.assignee_ids && t.assignee_ids.length > 0) return t.assignee_ids;
                    if (t.task_assignees && t.task_assignees.length > 0) return t.task_assignees.map(a => String(a.user_id));
                    if (t.assignees && t.assignees.length > 0) return t.assignees.map(a => String(a.id));
                    return [];
                })(),
                userId: t.user_id,
                owner: owner ? owner : undefined
            };
        });

        return tasks;
    } catch (error) {
        console.error("Error fetching tasks:", error);
        return [];
    }
}

export async function createTask(formData: FormData) {
    const session = await auth();
    // @ts-expect-error accessToken is not in default session type
    if (!session?.user?.accessToken) {
        return { error: "Unauthorized" };
    }

    const rawData: Record<string, unknown> = {
        name: formData.get('name'),
        description: formData.get('description'),
        status: formData.get('status'),
        priority: formData.get('priority'),
        due_date: formData.get('dueDate'),
        project_id: formData.get('projectId') ? Number(formData.get('projectId')) : null,
        user_id: session.user?.id,
    };
    
    // Handle assignees if passed as JSON string
    const assigneeIds = formData.get('assigneeIds');
    if (assigneeIds) {
        try {
            const parsedIds = JSON.parse(assigneeIds as string);
            // Based on docs and user feedback, we send array of IDs in 'assignees'
            rawData.assignees = parsedIds;
        } catch (e) {
            console.error("Error parsing assigneeIds", e);
        }
    }

    try {
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // @ts-expect-error accessToken is not in default session type
                'Authorization': `Bearer ${session.user.accessToken}`
            },
            body: JSON.stringify(rawData)
        });

        if (!response.ok) {
            const error = await response.text();
            console.error("Failed to create task:", error);
            return { success: false, error: "Failed to create task" };
        }

        revalidatePath('/tasks');
        revalidateTag('tasks', 'max');
        revalidateTag('projects', 'max');
        return { success: true };
    } catch (error) {
        console.error("Error creating task:", error);
        return { success: false, error: "Failed to create task" };
    }
}

export async function updateTask(formData: FormData) {
    const session = await auth();
    // @ts-expect-error accessToken is not in default session type
    if (!session?.user?.accessToken) {
        return { success: false, error: "Unauthorized" };
    }

    const id = formData.get('id');
    if (!id) return { success: false, error: "Missing task ID" };
    const taskId = Number(id);

    // Build payload dynamically based on what's in formData
    const rawData: Record<string, unknown> = {};
    const name = formData.get('name'); if (name) rawData.name = name;
    const description = formData.get('description'); if (description !== null) rawData.description = description;
    const status = formData.get('status'); if (status) rawData.status = status;
    const priority = formData.get('priority'); if (priority) rawData.priority = priority;
    const dueDate = formData.get('dueDate'); if (dueDate) rawData.due_date = dueDate;
    const projectId = formData.get('projectId'); 
    if (projectId !== null && projectId !== "") {
        rawData.project_id = Number(projectId);
    } else if (projectId === "") {
        rawData.project_id = null;
    }

    const assigneeIds = formData.get('assigneeIds');
    if (assigneeIds !== null) {
        try {
            const parsedIds = JSON.parse(assigneeIds as string);
            rawData.assignees = parsedIds;
        } catch (e) {
             console.error("Error parsing assigneeIds", e);
        }
    }

    try {

        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                // @ts-expect-error accessToken is not in default session type
                'Authorization': `Bearer ${session.user.accessToken}`
            },
            body: JSON.stringify(rawData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Failed to update task. Status:", response.status, "Error:", errorText);
            return { success: false, error: "Failed to update task" };
        }

        revalidatePath('/tasks');
        revalidateTag('tasks', 'max');
        revalidateTag('projects', 'max');
        return { success: true };
    } catch (error) {
        console.error("Error updating task:", error);
        return { success: false, error: "Failed to update task" };
    }
}

export async function deleteTask(formData: FormData) {
    const session = await auth();
    // @ts-expect-error accessToken is not in default session type
    if (!session?.user?.accessToken) {
        return { success: false, error: "Unauthorized" };
    }

    const id = formData.get('id');
    if (!id) return { success: false, error: "Missing task ID" };

    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                // @ts-expect-error accessToken is not in default session type
                'Authorization': `Bearer ${session.user.accessToken}`
            }
        });

        if (!response.ok) {
            console.error("Failed to delete task:", await response.text());
            return { success: false, error: "Failed to delete task" };
        }

        revalidatePath('/tasks');
        revalidateTag('tasks', 'max');
        revalidateTag('projects', 'max');
        return { success: true };
    } catch (error) {
        console.error("Error deleting task:", error);
        return { success: false, error: "Failed to delete task" };
    }
}

export async function updateTaskStatus(taskId: number, status: string) {
     const session = await auth();
    // @ts-expect-error accessToken is not in default session type
    if (!session?.user?.accessToken) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                // @ts-expect-error accessToken is not in default session type
                'Authorization': `Bearer ${session.user.accessToken}`
            },
            body: JSON.stringify({ status })
        });

        if (!response.ok) {
            console.error("Failed to update task status:", await response.text());
            return { success: false, error: "Failed to update task status" };
        }

        revalidatePath('/tasks');
        revalidateTag('tasks', 'max');
        revalidateTag('projects', 'max');
        return { success: true };
    } catch (error) {
        console.error("Error updating task status:", error);
        return { success: false, error: "Failed to update task status" };
    }
}
