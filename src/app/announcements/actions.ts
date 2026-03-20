'use server';

import { auth } from '@/auth';
import { revalidatePath, revalidateTag } from 'next/cache';
import { Announcement, AnnouncementCreate, AnnouncementUpdate } from '@/types/announcement';

const BASE_URL = process.env.BASE_URL_LOCAL || "http://127.0.0.1:8000";
const API_BASE_URL = `${BASE_URL}/api/v1`;

export async function getAnnouncements() {
    const session = await auth();
    // @ts-expect-error accessToken is not in default session type
    if (!session?.user?.accessToken) return [];

    try {
        const response = await fetch(`${API_BASE_URL}/announcements`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // @ts-expect-error accessToken is not in default session type
                'Authorization': `Bearer ${session.user.accessToken}`
            },
            next: { tags: ['announcements'], revalidate: 60 }
        });

        if (!response.ok) {
            console.error("Failed to fetch announcements:", await response.text());
            return [];
        }

        return await response.json() as Announcement[];
    } catch (error) {
        console.error("Error fetching announcements:", error);
        return [];
    }
}

export async function createAnnouncement(data: AnnouncementCreate) {
    const session = await auth();
    // @ts-expect-error accessToken is not in default session type
    if (!session?.user?.accessToken) return { error: "Unauthorized" };

    try {
        const response = await fetch(`${API_BASE_URL}/announcements`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // @ts-expect-error accessToken is not in default session type
                'Authorization': `Bearer ${session.user.accessToken}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.text();
            console.error("Failed to create announcement:", error);
            return { success: false, error: "Failed to create announcement" };
        }

        revalidatePath('/');
        revalidateTag('announcements', 'max');
        return { success: true, data: await response.json() as Announcement };
    } catch (error) {
        console.error("Error creating announcement:", error);
        return { success: false, error: "Failed to create announcement" };
    }
}

export async function updateAnnouncement(id: string, data: AnnouncementUpdate) {
    const session = await auth();
    // @ts-expect-error accessToken is not in default session type
    if (!session?.user?.accessToken) return { error: "Unauthorized" };

    try {
        const response = await fetch(`${API_BASE_URL}/announcements/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                // @ts-expect-error accessToken is not in default session type
                'Authorization': `Bearer ${session.user.accessToken}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.text();
            console.error("Failed to update announcement:", error);
            return { success: false, error: "Failed to update announcement" };
        }

        revalidatePath('/');
        revalidateTag('announcements', 'max');
        return { success: true, data: await response.json() as Announcement };
    } catch (error) {
        console.error("Error updating announcement:", error);
        return { success: false, error: "Failed to update announcement" };
    }
}

export async function deleteAnnouncement(id: string) {
    const session = await auth();
    // @ts-expect-error accessToken is not in default session type
    if (!session?.user?.accessToken) return { error: "Unauthorized" };

    try {
        const response = await fetch(`${API_BASE_URL}/announcements/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                // @ts-expect-error accessToken is not in default session type
                'Authorization': `Bearer ${session.user.accessToken}`
            }
        });

        if (!response.ok) {
            console.error("Failed to delete announcement:", await response.text());
            return { success: false, error: "Failed to delete announcement" };
        }

        revalidatePath('/');
        revalidateTag('announcements', 'max');
        return { success: true };
    } catch (error) {
        console.error("Error deleting announcement:", error);
        return { success: false, error: "Failed to delete announcement" };
    }
}
