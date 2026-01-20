import { User } from './user';
import { Task } from './task';

export type Project = {
    id: number;
    name: string;
    key: string | null;
    description: string | null;
    status: "planning" | "in_progress" | "completed" | "on_hold";
    priority: "low" | "medium" | "high";
    tags: string | null; // JSON string array

    ownerId: string | null;
    // managerId: string | null; // Deprecated
    managers?: { user: User }[]; // For display
    tasks?: Task[];
    clientId: string | null;

    startDate: string | null;
    endDate: string | null;

    budget: number | null;
    spent: number | null;
    currency: string | null;
    billingType: "time_and_materials" | "fixed_price" | "non_billable" | null;

    isArchived: number | null; // 0 or 1
    createdAt?: string | null;
    updatedAt?: string | null;
};

export type ProjectFormData = Omit<Project, 'id' | 'createdAt' | 'updatedAt'>;

export function parseProjectFormData(formData: FormData): Partial<Project> {
    const data = Object.fromEntries(formData);
    return {
        name: data.name as string,
        key: data.key as string,
        description: data.description as string,
        status: data.status as Project['status'],
        priority: data.priority as Project['priority'],
        tags: data.tags as string,
        
        ownerId: data.ownerId as string,
        clientId: data.clientId as string,

        startDate: data.startDate as string,
        endDate: data.endDate as string,

        budget: data.budget ? Number(data.budget) : null,
        spent: data.spent ? Number(data.spent) : 0,
        currency: data.currency as string,
        billingType: data.billingType as Project['billingType'],

        isArchived: data.isArchived ? Number(data.isArchived) : 0,
    };
}

export const statusMapping: { [key: string]: string } = {
    planning: "Planning",
    in_progress: "In Progress",
    completed: "Completed",
    on_hold: "On Hold",
};

export const priorityMapping: { [key: string]: string } = {
    low: "Low",
    medium: "Medium",
    high: "High",
};

export const billingTypeMapping: { [key: string]: string } = {
    time_and_materials: "Time & Materials",
    fixed_price: "Fixed Price",
    non_billable: "Non-Billable",
};
