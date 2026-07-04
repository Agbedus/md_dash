'use server';

import { auth } from '@/auth';
import { revalidateTag } from 'next/cache';
import { Notification } from '@/components/ui/notifications/notification-provider';

const BASE_URL = process.env.BASE_URL_LOCAL || process.env.BASE_URL_PRODUCTION || "http://127.0.0.1:8000";
const API_BASE_URL = `${BASE_URL}/api/v1`;

export async function getNotifications() {
    const session = await auth();
    // @ts-expect-error accessToken is not in default session type
    if (!session?.user?.accessToken) return [];

    try {
        const response = await fetch(`${API_BASE_URL}/notifications`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // @ts-expect-error accessToken is not in default session type
                'Authorization': `Bearer ${session.user.accessToken}`
            },
            next: { tags: ['notifications'], revalidate: 30 }
        });

        if (!response.ok) {
            console.error("Failed to fetch notifications:", await response.text());
            return [];
        }

        return await response.json() as Notification[];
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return [];
    }
}

export async function markNotificationAsRead(id: string) {
    const session = await auth();
    // @ts-expect-error accessToken is not in default session type
    if (!session?.user?.accessToken) return { error: "Unauthorized" };

    try {
        const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
            method: 'PUT',
            headers: {
                // @ts-expect-error accessToken is not in default session type
                'Authorization': `Bearer ${session.user.accessToken}`
            }
        });

        if (!response.ok) {
            console.error("Failed to mark notification as read:", await response.text());
            return { success: false };
        }

        revalidateTag('notifications', 'max');
        return { success: true };
    } catch (error) {
        console.error("Error marking notification as read:", error);
        return { success: false };
    }
}

export async function markAllNotificationsAsRead() {
    const session = await auth();
    // @ts-expect-error accessToken is not in default session type
    if (!session?.user?.accessToken) return { error: "Unauthorized" };

    try {
        // Fetch unread notifications first
        const notifications = await getNotifications();
        const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);

        await Promise.all(unreadIds.map(id => 
            fetch(`${API_BASE_URL}/notifications/${id}/read`, {
                method: 'PUT',
                headers: {
                    // @ts-expect-error accessToken is not in default session type
                    'Authorization': `Bearer ${session.user.accessToken}`
                }
            })
        ));

        revalidateTag('notifications', 'max');
        return { success: true };
    } catch (error) {
        console.error("Error marking all notifications as read:", error);
        return { success: false };
    }
}
