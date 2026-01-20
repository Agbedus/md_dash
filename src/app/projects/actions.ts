'use server';

import { revalidatePath, revalidateTag } from 'next/cache';


const BASE_URL = process.env.BASE_URL_LOCAL || "http://127.0.0.1:8000";
const API_BASE_URL = `${BASE_URL}/api/v1`;

import { auth } from '@/auth';
import { Project } from '@/types/project';

// Interface for what the API returns (snake_case)
interface ApiProject {
    id: number;
    name: string;
    key: string;
    description: string;
    status: string;
    priority: string;
    tags: string;
    owner_id: string;
    client_id: string;
    start_date: string;
    end_date: string;
    budget: number;
    spent: number;
    currency: string;
    billing_type: string;
    is_archived: number;
    created_at: string;
    updated_at: string;
}

export async function getProjects(limit?: number, skip?: number): Promise<Project[]> {

    const session = await auth();
    // @ts-expect-error accessToken is not in default session type
    if (!session?.user?.accessToken) {

        return [];
    }

    try {
        const response = await fetch(`${API_BASE_URL}/projects?${limit ? `limit=${limit}` : ''}${skip ? `&skip=${skip}` : ''}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // @ts-expect-error accessToken is not in default session type
                'Authorization': `Bearer ${session.user.accessToken}`
            },
            next: { tags: ['projects'], revalidate: 60 }
        });

        if (!response.ok) {
            console.error(`Failed to fetch projects: ${response.status} ${response.statusText}`, await response.text());
            return [];
        }

        const projects: ApiProject[] = await response.json();
        
        // Map API snake_case to Frontend camelCase
        return projects.map(p => ({
            id: p.id,
            name: p.name,
            key: p.key,
            description: p.description,
            status: p.status as Project['status'],
            priority: p.priority as Project['priority'],
            tags: p.tags, // Mapped correctly now
            
            ownerId: p.owner_id,
            clientId: p.client_id,
           
            startDate: p.start_date,
            endDate: p.end_date,

            budget: p.budget,
            spent: p.spent,
            currency: p.currency,
            billingType: p.billing_type as Project['billingType'],

            isArchived: p.is_archived,
            createdAt: p.created_at,
            updatedAt: p.updated_at,
            
            // Populating display fields that API might not return directly or we need separate fetches
            // For listing, we might accept them as undefined or standard defaults if not eager loaded
            managers: [], 
            tasks: []
        }));
    } catch (error) {
        console.error("Error fetching projects:", error);
        return [];
    }
}

export async function getProject(id: number): Promise<Project | null> {
    const session = await auth();
    // @ts-expect-error accessToken is not in default session type
    if (!session?.user?.accessToken) return null;

    try {
        const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // @ts-expect-error accessToken is not in default session type
                'Authorization': `Bearer ${session.user.accessToken}`
            },
            next: { tags: ['projects'], revalidate: 60 }
        });

        if (!response.ok) {
            console.error(`Failed to fetch project ${id}: ${response.status} ${response.statusText}`);
            return null;
        }

        const p: ApiProject = await response.json();
        return {
            id: p.id,
            name: p.name,
            key: p.key,
            description: p.description,
            status: p.status as Project['status'],
            priority: p.priority as Project['priority'],
            tags: p.tags,
            ownerId: p.owner_id,
            clientId: p.client_id,
            startDate: p.start_date,
            endDate: p.end_date,
            budget: p.budget,
            spent: p.spent,
            currency: p.currency,
            billingType: p.billing_type as Project['billingType'],
            isArchived: p.is_archived,
            createdAt: p.created_at,
            updatedAt: p.updated_at,
            managers: [],
            tasks: []
        };
    } catch (error) {
        console.error(`Error fetching project ${id}:`, error);
        return null;
    }
}

export async function createProject(formData: FormData) {
    const session = await auth();
    // @ts-expect-error accessToken is not in default session type
    if (!session?.user?.accessToken) {
        return { error: "Unauthorized" };
    }

    const rawData: Record<string, unknown> = {
        name: formData.get('name'),
        key: formData.get('key') || null,
        description: formData.get('description') || null,
        status: formData.get('status') || 'planning',
        priority: formData.get('priority') || 'medium',
        client_id: formData.get('clientId') || null,
        owner_id: formData.get('ownerId') || null,
        start_date: formData.get('startDate') || null,
        end_date: formData.get('endDate') || null,
        budget: formData.get('budget') ? Number(formData.get('budget')) : null,
        spent: formData.get('spent') ? Number(formData.get('spent')) : 0,
        currency: formData.get('currency') || 'USD',
        billing_type: formData.get('billingType') || 'non_billable',
        is_archived: formData.get('isArchived') ? Number(formData.get('isArchived')) : 0,
    };

    // Tags as JSON string array
    const tags = formData.get('tags') as string;
    if (tags) {
        rawData.tags = JSON.stringify(tags.split(',').map(t => t.trim()).filter(t => t !== ''));
    } else {
        rawData.tags = JSON.stringify([]);
    }

    try {
        const response = await fetch(`${API_BASE_URL}/projects`, {
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
            console.error("Failed to create project:", error);
            return { error: "Failed to create project" };
        }

        revalidatePath('/projects');
        revalidateTag('projects', 'max');
        return { success: true };
    } catch (error) {
        console.error("Error creating project:", error);
        return { error: "Failed to create project" };
    }
}

export async function updateProject(formData: FormData) {
    const session = await auth();
    // @ts-expect-error accessToken is not in default session type
    if (!session?.user?.accessToken) {
        return { error: "Unauthorized" };
    }

    const id = formData.get('id');
    if (!id) return { error: "Missing Project ID" };

    // Build payload dynamically (PATCH)
    const rawData: Record<string, unknown> = {};
    
    const fields = [
        ['name', 'name'],
        ['key', 'key'],
        ['description', 'description'],
        ['status', 'status'],
        ['priority', 'priority'],
        ['clientId', 'client_id'],
        ['ownerId', 'owner_id'],
        ['startDate', 'start_date'],
        ['endDate', 'end_date'],
        ['currency', 'currency'],
        ['billingType', 'billing_type'],
        ['isArchived', 'is_archived'],
    ];

    fields.forEach(([formKey, apiKey]) => {
        const val = formData.get(formKey);
        if (val !== null) {
            if (formKey === 'isArchived') {
                rawData[apiKey] = Number(val);
            } else if (val === "") {
                rawData[apiKey] = null;
            } else {
                rawData[apiKey] = val;
            }
        }
    });

    // Numeric fields
    const budget = formData.get('budget');
    if (budget !== null) {
        rawData.budget = budget === "" ? null : Number(budget);
    }
    const spent = formData.get('spent');
    if (spent !== null) {
        rawData.spent = spent === "" ? 0 : Number(spent);
    }

    // Tags
    const tags = formData.get('tags');
    if (tags !== null) {
        rawData.tags = JSON.stringify((tags as string).split(',').map(t => t.trim()).filter(t => t !== ''));
    }

    try {
        const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
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
            console.error("Failed to update project:", errorText);
            return { error: `Failed to update project: ${errorText}` };
        }

        revalidatePath('/projects');
        revalidateTag('projects', 'max');
        return { success: true };
    } catch (error) {
        console.error("Error updating project:", error);
        return { error: "Failed to update project" };
    }
}

export async function deleteProject(formData: FormData) {
    const session = await auth();
    // @ts-expect-error accessToken is not in default session type
    if (!session?.user?.accessToken) {
        return;
    }

    const id = formData.get('id');
    if (!id) return;

    try {
        const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                // @ts-expect-error accessToken is not in default session type
                'Authorization': `Bearer ${session.user.accessToken}`
            }
        });

        if (!response.ok) {
            console.error("Failed to delete project:", await response.text());
            return;
        }

        revalidatePath('/projects');
        revalidateTag('projects', 'max');
        revalidateTag('tasks', 'max');
    } catch (error) {
        console.error("Error deleting project:", error);
    }
}
