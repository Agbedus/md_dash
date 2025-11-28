import { User } from './user';

export type Task = {
    id: number;
    name: string;
    description: string | null;
    dueDate: string | null;
    priority: "low" | "medium" | "high";
    status: "task" | "in_progress" | "completed";
    createdAt?: string | null;
    updatedAt?: string | null;
    // assigneeId?: string | null; // Deprecated
    assignees?: { user: User }[]; // For display
    assigneeIds?: string[]; // For form handling
    projectId?: number | null;
};

export type TaskFormData = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;

export function parseTaskFormData(formData: FormData): Partial<Task> {
    const data = Object.fromEntries(formData);
    return {
        name: data.name as string,
        description: data.description as string,
        dueDate: data.dueDate as string,
        priority: data.priority as Task['priority'],
        status: data.status as Task['status'],
        assigneeIds: data.assigneeIds ? JSON.parse(data.assigneeIds as string) : [],
        projectId: data.projectId ? Number(data.projectId) : null,
    };
}


export const statusMapping: { [key: string]: string } = {
    task: "To Do",
    in_progress: "In Progress",
    completed: "Completed",
};

export const priorityMapping: { [key: string]: string } = {
    low: "Low",
    medium: "Medium",
    high: "High",
};
