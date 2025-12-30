'use server';

import { revalidatePath, revalidateTag } from 'next/cache';

const BASE_URL = process.env.BASE_URL_LOCAL || "http://127.0.0.1:8000";
const API_BASE_URL = `${BASE_URL}/api/v1`;

import { auth } from '@/auth';
import { Client } from '@/types/client';

// Interface for what the API returns (snake_case)
interface ApiClient {
    id: string;
    company_name: string;
    contact_person_name: string | null;
    contact_email: string | null;
    website_url: string | null;
    created_at: string;
}

export async function getClients(): Promise<Client[]> {
    console.log("getClients: Starting fetch...");
    const session = await auth();
    // @ts-expect-error accessToken is not in default session type
    if (!session?.user?.accessToken) {
        console.log("getClients: No access token found.");
        return [];
    }

    try {
        const response = await fetch(`${API_BASE_URL}/clients`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // @ts-expect-error accessToken is not in default session type
                'Authorization': `Bearer ${session.user.accessToken}`
            },
            next: { tags: ['clients'], revalidate: 60 }
        });

        if (!response.ok) {
            console.error("Failed to fetch clients:", await response.text());
            return [];
        }

        const clients: ApiClient[] = await response.json();
        
        // Map API snake_case to Frontend camelCase
        return clients.map(client => ({
            id: client.id,
            companyName: client.company_name,
            contactPersonName: client.contact_person_name,
            contactEmail: client.contact_email,
            websiteUrl: client.website_url,
            createdAt: client.created_at
        }));
    } catch (error) {
        console.error("Error fetching clients:", error);
        return [];
    }
}

export async function createClient(formData: FormData) {
    const session = await auth();
    // @ts-expect-error accessToken is not in default session type
    if (!session?.user?.accessToken) {
        return { error: "Unauthorized" };
    }

    const rawData = {
        company_name: formData.get('companyName'),
        contact_person_name: formData.get('contactPersonName'),
        contact_email: formData.get('contactEmail'),
        website_url: formData.get('websiteUrl'),
    };

    try {
        const response = await fetch(`${API_BASE_URL}/clients`, {
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
            console.error("Failed to create client:", error);
            // Return error or handle it for the UI
            return { error: "Failed to create client" };
        }

        revalidatePath('/clients');
        revalidateTag('clients', 'max');
        return { success: true };
    } catch (error) {
        console.error("Error creating client:", error);
        return { error: "Failed to create client" };
    }
}

export async function updateClient(formData: FormData) {
    const session = await auth();
    // @ts-expect-error accessToken is not in default session type
    if (!session?.user?.accessToken) {
        return;
    }

    const id = formData.get('id');
    if (!id) return;

    const rawData = {
        company_name: formData.get('companyName'),
        contact_person_name: formData.get('contactPersonName'),
        contact_email: formData.get('contactEmail'),
        website_url: formData.get('websiteUrl'),
    };

    // Filter out null/empty values if PATCH requires specific fields only, 
    // simply sending what's in the form is usually fine if the form has all data.
    // However, for PATCH, we usually only send changed fields. 
    // Assuming UI sends all fields for simplicity here.

    try {
        const response = await fetch(`${API_BASE_URL}/clients/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                // @ts-expect-error accessToken is not in default session type
                'Authorization': `Bearer ${session.user.accessToken}`
            },
            body: JSON.stringify(rawData)
        });

        if (!response.ok) {
            console.error("Failed to update client:", await response.text());
            return;
        }

        revalidatePath('/clients');
        revalidateTag('clients', 'max');
    } catch (error) {
        console.error("Error updating client:", error);
    }
}

export async function deleteClient(formData: FormData) {
    const session = await auth();
    // @ts-expect-error accessToken is not in default session type
    if (!session?.user?.accessToken) {
        return;
    }

    const id = formData.get('id');
    if (!id) return;

    try {
        const response = await fetch(`${API_BASE_URL}/clients/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                // @ts-expect-error accessToken is not in default session type
                'Authorization': `Bearer ${session.user.accessToken}`
            }
        });

        if (!response.ok) {
            console.error("Failed to delete client:", await response.text());
            return;
        }

        revalidatePath('/clients');
        revalidateTag('clients', 'max');
    } catch (error) {
        console.error("Error deleting client:", error);
    }
}
