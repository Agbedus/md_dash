'use server';

import { revalidatePath, revalidateTag } from 'next/cache';

// createUser removed

export async function updateUser(formData: FormData) {
    const session = await auth();
    // @ts-expect-error accessToken is not in default session type
    if (!session?.user?.accessToken) return;

    const id = formData.get('id');
    const payload = {
        full_name: formData.get('fullName'),
        email: formData.get('email'),
        avatar_url: formData.get('avatarUrl'),
        roles: JSON.parse(formData.get('roles') as string || '[]'),
    };

    try {
        const response = await fetch(`${API_BASE_URL}/users/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                // @ts-expect-error accessToken is not in default session type
                'Authorization': `Bearer ${session.user.accessToken}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.error("Failed to update user:", await response.text());
            return;
        }

        revalidatePath('/users');
        revalidateTag('users', 'max');
    } catch (error) {
        console.error("Error updating user:", error);
    }
}

export async function deleteUser(formData: FormData) {
    const session = await auth();
    // @ts-expect-error accessToken is not in default session type
    if (!session?.user?.accessToken) return;

    const id = formData.get('id');
    try {
        const response = await fetch(`${API_BASE_URL}/users/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                // @ts-expect-error accessToken is not in default session type
                'Authorization': `Bearer ${session.user.accessToken}`
            }
        });

        if (!response.ok) {
            console.error("Failed to delete user:", await response.text());
            return;
        }

        revalidatePath('/users');
        revalidateTag('users', 'max');
    } catch (error) {
        console.error("Error deleting user:", error);
    }
}

const BASE_URL = process.env.BASE_URL_LOCAL || "http://127.0.0.1:8000";
const API_BASE_URL = `${BASE_URL}/api/v1`;

import { auth } from '@/auth';

export async function getUsers() {
    console.log("getUsers: Starting fetch...");
    const session = await auth();
    console.log("getUsers: Session check:", { 
        hasSession: !!session, 
        hasUser: !!session?.user, 
        // @ts-expect-error accessToken is not in default session type
        hasToken: !!session?.user?.accessToken 
    });

    // @ts-expect-error accessToken is not in default session type
    if (!session?.user?.accessToken) {
        console.log("getUsers: No access token found.");
        return [];
    }

    try {
        console.log(`getUsers: Fetching from ${API_BASE_URL}/users`);
        const response = await fetch(`${API_BASE_URL}/users`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // @ts-expect-error accessToken is not in default session type
                'Authorization': `Bearer ${session.user.accessToken}`
            },
            next: { tags: ['users'], revalidate: 60 }
        });

        console.log("getUsers: Response status:", response.status);

        if (!response.ok) {
            console.error("Failed to fetch users:", await response.text());
            return [];
        }

        const users = await response.json();
        console.log("getUsers: Use payload received:", JSON.stringify(users, null, 2));
        
        // Define interface for API response
        interface ApiUser {
            id: string;
            full_name: string;
            email: string;
            avatar_url: string;
            roles: string[];
        }

        // Map payload to User type
        return users.map((u: ApiUser) => ({
            id: u.id,
            name: u.full_name, // Map full_name to name
            email: u.email,
            image: u.avatar_url, // Use avatar_url for image
            fullName: u.full_name,
            roles: u.roles || [],
            avatarUrl: u.avatar_url,
        }));
    } catch (error) {
        console.error("Error fetching users:", error);
        return [];
    }
}
