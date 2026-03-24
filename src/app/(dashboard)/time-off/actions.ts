'use server';

import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import type { TimeOffRequest } from '@/types/time-off';

const BASE_URL = process.env.BASE_URL_LOCAL || "http://127.0.0.1:8000";
const API_BASE_URL = `${BASE_URL}/api/v1`;

export async function getTimeOffRequests(): Promise<TimeOffRequest[]> {
    const session = await auth();
    // @ts-expect-error accessToken is not in default session type
    if (!session?.user?.accessToken) return [];

    try {
        const response = await fetch(`${API_BASE_URL}/time-off`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // @ts-expect-error accessToken is not in default session type
                'Authorization': `Bearer ${session.user.accessToken}`
            },
            next: { tags: ['time-off'], revalidate: 60 }
        });

        if (!response.ok) {
            console.error("getTimeOffRequests: API error", response.status, await response.text());
            return [];
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching time-off requests:", error);
        return [];
    }
}

export async function createTimeOffRequest(formData: FormData) {
    const session = await auth();
    // @ts-expect-error accessToken is not in default session type
    if (!session?.user?.accessToken) return { success: false, error: "Unauthorized" };

    const payload: Record<string, unknown> = {
        type: formData.get('type') || 'leave',
        start_date: formData.get('start_date'),
        end_date: formData.get('end_date'),
        justification: formData.get('justification') || null,
    };

    try {
        const response = await fetch(`${API_BASE_URL}/time-off`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // @ts-expect-error accessToken is not in default session type
                'Authorization': `Bearer ${session.user.accessToken}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("createTimeOffRequest: API error", response.status, errorText);
            return { success: false, error: `API Error ${response.status}: ${errorText}` };
        }

        const data = await response.json();
        revalidatePath('/calendar');
        return { success: true, request: data };
    } catch (error) {
        console.error("Error creating time-off request:", error);
        return { success: false, error: "Network error creating time-off request" };
    }
}

export async function approveTimeOffRequest(requestId: number) {
    const session = await auth();
    // @ts-expect-error accessToken is not in default session type
    if (!session?.user?.accessToken) return { success: false, error: "Unauthorized" };

    try {
        const response = await fetch(`${API_BASE_URL}/time-off/${requestId}/approve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // @ts-expect-error accessToken is not in default session type
                'Authorization': `Bearer ${session.user.accessToken}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("approveTimeOffRequest: API error", response.status, errorText);
            return { success: false, error: `API Error ${response.status}: ${errorText}` };
        }

        revalidatePath('/calendar');
        return { success: true, request: await response.json() };
    } catch (error) {
        console.error("Error approving time-off request:", error);
        return { success: false, error: "Network error" };
    }
}

export async function rejectTimeOffRequest(requestId: number) {
    const session = await auth();
    // @ts-expect-error accessToken is not in default session type
    if (!session?.user?.accessToken) return { success: false, error: "Unauthorized" };

    try {
        const response = await fetch(`${API_BASE_URL}/time-off/${requestId}/reject`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // @ts-expect-error accessToken is not in default session type
                'Authorization': `Bearer ${session.user.accessToken}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("rejectTimeOffRequest: API error", response.status, errorText);
            return { success: false, error: `API Error ${response.status}: ${errorText}` };
        }

        revalidatePath('/calendar');
        return { success: true, request: await response.json() };
    } catch (error) {
        console.error("Error rejecting time-off request:", error);
        return { success: false, error: "Network error" };
    }
}

export async function deleteTimeOffRequest(requestId: number) {
    const session = await auth();
    // @ts-expect-error accessToken is not in default session type
    if (!session?.user?.accessToken) return { success: false, error: "Unauthorized" };

    try {
        const response = await fetch(`${API_BASE_URL}/time-off/${requestId}`, {
            method: 'DELETE',
            headers: {
                // @ts-expect-error accessToken is not in default session type
                'Authorization': `Bearer ${session.user.accessToken}`
            }
        });

        if (!response.ok) {
            console.error("deleteTimeOffRequest: API error", response.status, await response.text());
            return { success: false, error: `API Error ${response.status}` };
        }

        revalidatePath('/calendar');
        return { success: true };
    } catch (error) {
        console.error("Error deleting time-off request:", error);
        return { success: false, error: "Network error" };
    }
}
