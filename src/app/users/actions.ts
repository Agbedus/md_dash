'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { parseUserFormData } from '@/types/user';

import { auth } from '@/auth';

// createUser removed


export async function updateUser(formData: FormData) {
    const session = await auth();
    const userRoles = session?.user?.roles || [];
    if (!userRoles.some(role => ['super_admin', 'manager'].includes(role))) {
        throw new Error('Unauthorized');
    }

    const id = formData.get('id') as string;
    const data = parseUserFormData(formData);

    await db.update(users)
        .set({
            ...data,
            roles: data.roles,
        })
        .where(eq(users.id, id));

    revalidatePath('/users');
}

export async function deleteUser(formData: FormData) {
    const session = await auth();
    const userRoles = session?.user?.roles || [];
    if (!userRoles.includes('super_admin')) {
        throw new Error('Unauthorized');
    }

    const id = formData.get('id') as string;
    await db.delete(users).where(eq(users.id, id));
    revalidatePath('/users');
}
