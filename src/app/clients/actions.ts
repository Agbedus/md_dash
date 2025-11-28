'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { clients } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { parseClientFormData } from '@/types/client';

export async function createClient(formData: FormData) {
    const data = parseClientFormData(formData);
    const id = crypto.randomUUID();
    
    await db.insert(clients).values({
        id,
        companyName: data.companyName!,
        contactPersonName: data.contactPersonName,
        contactEmail: data.contactEmail,
        websiteUrl: data.websiteUrl,
        createdAt: new Date().toISOString(),
    });

    revalidatePath('/clients');
}

export async function updateClient(formData: FormData) {
    const id = formData.get('id') as string;
    const data = parseClientFormData(formData);

    await db.update(clients)
        .set(data)
        .where(eq(clients.id, id));

    revalidatePath('/clients');
}

export async function deleteClient(formData: FormData) {
    const id = formData.get('id') as string;
    await db.delete(clients).where(eq(clients.id, id));
    revalidatePath('/clients');
}
