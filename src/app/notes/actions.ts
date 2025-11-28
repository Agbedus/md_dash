'use server';

import { db } from '@/db';
import { auth } from '@/auth';
import { notes, noteShares, users } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { eq, and, inArray, ne } from 'drizzle-orm';
import type { Note } from '@/types/note';

export async function getNotes(): Promise<Note[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  // Get user's own notes with owner info
  const userNotes = await db.select({
      note: notes,
      owner: {
          name: users.name,
          image: users.image,
          email: users.email,
      }
  })
  .from(notes)
  .leftJoin(users, eq(notes.userId, users.id))
  .where(eq(notes.userId, session.user.id));
  
  // Get shared notes
  const sharedRecords = await db.select().from(noteShares).where(eq(noteShares.email, session.user.email!));
  const sharedNoteIds = sharedRecords.map(r => r.noteId);
  
  let sharedNotesData: { note: typeof notes.$inferSelect, owner: { name: string | null, image: string | null, email: string | null } | null }[] = [];
  
  if (sharedNoteIds.length > 0) {
    sharedNotesData = await db.select({
        note: notes,
        owner: {
            name: users.name,
            image: users.image,
            email: users.email,
        }
    })
    .from(notes)
    .leftJoin(users, eq(notes.userId, users.id))
    .where(inArray(notes.id, sharedNoteIds));
  }

  // Fetch all note shares for all notes we're returning
  const allNoteIds = [...userNotes.map(n => n.note.id), ...sharedNotesData.map(n => n.note.id)];
  const allShares = allNoteIds.length > 0 ? await db.select({
      noteId: noteShares.noteId,
      email: noteShares.email,
      userName: users.name,
      userImage: users.image,
  })
  .from(noteShares)
  .leftJoin(users, eq(noteShares.userId, users.id))
  .where(inArray(noteShares.noteId, allNoteIds)) : [];

  const mapToNote = (row: { note: typeof notes.$inferSelect, owner: { name: string | null, image: string | null, email: string | null } | null }): Note => {
      const noteSharesForThis = allShares.filter(s => s.noteId === row.note.id);
      return {
          ...row.note,
          owner: row.owner ? {
              name: row.owner.name,
              image: row.owner.image,
              email: row.owner.email,
          } : undefined,
          sharedWith: noteSharesForThis.map(s => ({
              name: s.userName,
              image: s.userImage,
              email: s.email,
          })),
      };
  };

  return [...userNotes.map(mapToNote), ...sharedNotesData.map(mapToNote)];
}

export async function getUsers() {
    const session = await auth();
    if (!session?.user?.id) return [];
    
    // Return all users except current user
    return await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
    })
    .from(users)
    .where(ne(users.id, session.user.id));
}

function toBoolInt(v: FormDataEntryValue | null): 0 | 1 {
  if (v === null) return 0;
  const s = String(v).toLowerCase();
  return s === '1' || s === 'true' || s === 'on' ? 1 : 0;
}

export async function createNote(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const data = Object.fromEntries(formData);
  const now = new Date().toISOString();

  await db.insert(notes).values({
    userId: session.user.id,
    title: String(data.title || ''),
    content: String(data.content || ''),
    type: (data.type as Note['type']) || 'note',
    tags: data.tags ? String(data.tags) : null,
    notebook: data.notebook ? String(data.notebook) : null,
    color: data.color ? String(data.color) : null,
    isPinned: toBoolInt(data.isPinned ?? null),
    isFavorite: toBoolInt(data.isFavorite ?? null),
    isArchived: 0,
    coverImage: data.coverImage ? String(data.coverImage) : null,
    links: data.links ? String(data.links) : null,
    attachments: data.attachments ? String(data.attachments) : null,
    reminderAt: data.reminderAt ? String(data.reminderAt) : null,
    dueDate: data.dueDate ? String(data.dueDate) : null,
    priority: (data.priority as Note['priority']) || null,
    createdAt: now,
    updatedAt: now,
  });
  revalidatePath('/notes');
}

export async function updateNote(formData: FormData) {
  const data = Object.fromEntries(formData);
  const id = data.id;
  if (!id) throw new Error('Note ID is required');

  await db
    .update(notes)
    .set({
      title: (data.title as string) || undefined,
      content: (data.content as string) || undefined,
      type: (data.type as Note['type']) || undefined,
      tags: (data.tags as string) ?? undefined,
      notebook: (data.notebook as string) ?? undefined,
      color: (data.color as string) ?? undefined,
      isPinned: data.isPinned !== undefined ? toBoolInt(data.isPinned) : undefined,
      isFavorite: data.isFavorite !== undefined ? toBoolInt(data.isFavorite) : undefined,
      isArchived: data.isArchived !== undefined ? toBoolInt(data.isArchived) : undefined,
      coverImage: (data.coverImage as string) ?? undefined,
      links: (data.links as string) ?? undefined,
      attachments: (data.attachments as string) ?? undefined,
      reminderAt: (data.reminderAt as string) ?? undefined,
      dueDate: (data.dueDate as string) ?? undefined,
      priority: (data.priority as Note['priority']) ?? undefined,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(notes.id, Number(id)));
  revalidatePath('/notes');
}

export async function deleteNote(formData: FormData) {
  const { id } = Object.fromEntries(formData) as { id: string };
  await db.delete(notes).where(eq(notes.id, parseInt(id, 10)));
  revalidatePath('/notes');
}
export async function toggleNoteFlag(noteId: number, field: 'isPinned' | 'isFavorite' | 'isArchived', value: boolean) {
  const updateObj: Partial<Record<string, number | string>> = {
    [field]: value ? 1 : 0,
    updatedAt: new Date().toISOString(),
  };

  await db
    .update(notes)
    .set(updateObj)
    .where(eq(notes.id, noteId));
  revalidatePath('/notes');
}

export async function shareNote(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const noteId = parseInt(formData.get('noteId') as string);
  const email = formData.get('email') as string;
  const permission = (formData.get('permission') as 'view' | 'edit') || 'view';

  if (!noteId || !email) return;

  // Check if already shared with this user
  const existing = await db.select()
    .from(noteShares)
    .where(and(eq(noteShares.noteId, noteId), eq(noteShares.email, email)))
    .get();

  if (existing) {
    // Already shared, skip
    revalidatePath('/notes');
    return;
  }

  // Check if user exists to link userId (optional)
  const targetUser = await db.select().from(users).where(eq(users.email, email)).get();

  await db.insert(noteShares).values({
    noteId,
    email,
    userId: targetUser?.id,
    permission,
    createdAt: new Date().toISOString(),
  });
  
  revalidatePath('/notes');
}
